import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileNav } from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, TrendingUp } from 'lucide-react';
import { saveOfflineSale, isOnline } from '@/lib/offline';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const saleSchema = z.object({
  product_id: z.string().uuid({ message: 'Неверный ID продукта' }),
  product_variant_id: z.string().uuid({ message: 'Необходимо выбрать вариант памяти' }),
  quantity: z.number().int({ message: 'Количество должно быть целым числом' }).positive({ message: 'Количество должно быть положительным' }).max(1000, { message: 'Максимум 1000 штук за раз' }),
});

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface ProductVariant {
  id: string;
  product_id: string;
  memory_gb: number;
  storage_gb: number;
  active: boolean;
}

interface Store {
  id: string;
  name: string;
  offices: {
    region_id: string;
    regions: {
      network_id: string;
    };
  };
}

export default function QuickSale() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userStore, setUserStore] = useState<Store | null>(null);
  const [calculatedBonus, setCalculatedBonus] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
    loadUserStore();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadVariants(selectedProduct);
      setSelectedVariantId('');
      setCalculatedBonus(null);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedVariantId && quantity > 0) {
      calculateBonusPreview();
    } else {
      setCalculatedBonus(null);
    }
  }, [selectedVariantId, quantity]);

  const loadUserStore = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        offices!inner(
          region_id,
          regions!inner(network_id)
        )
      `)
      .eq('id', (await supabase.from('profiles').select('store_id').eq('id', user.id).single()).data?.store_id || '')
      .single();
    
    if (data) setUserStore(data as any);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (data) setProducts(data);
  };

  const loadVariants = async (productId: string) => {
    const { data } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('active', true)
      .order('memory_gb, storage_gb');
    
    if (data) setVariants(data);
  };

  const calculateBonusPreview = async () => {
    if (!userStore || !selectedVariantId || !user) return;

    try {
      // Get network ID from user's store
      const networkId = (userStore.offices as any).regions.network_id;

      // Get base bonus from network_product_bonuses
      const { data: bonusData } = await supabase
        .from('network_product_bonuses')
        .select('base_bonus')
        .eq('network_id', networkId)
        .eq('product_variant_id', selectedVariantId)
        .eq('active', true)
        .single();

      let baseBonus = bonusData?.base_bonus || 0;

      // Get month-to-date sales for this promoter and network
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: mtdSales } = await supabase
        .from('sales')
        .select('quantity')
        .eq('promoter_id', user.id)
        .eq('store_id', userStore.id)
        .gte('created_at', monthStart.toISOString());

      const mtdQty = (mtdSales || []).reduce((sum, s) => sum + s.quantity, 0);

      // Get promoter's plan for this month and network
      const { data: planData } = await supabase
        .from('promoter_plans')
        .select('target_qty')
        .eq('promoter_id', user.id)
        .eq('network_id', networkId)
        .eq('month_start', monthStart.toISOString().split('T')[0])
        .single();

      let upliftPlan = 0;
      if (planData && planData.target_qty > 0) {
        const progressPct = Math.floor(((mtdQty + quantity) / planData.target_qty) * 100);

        // Find matching plan_bonus_tier
        const { data: tierData } = await supabase
          .from('plan_bonus_tiers')
          .select('bonus_amount')
          .eq('network_id', networkId)
          .lte('min_percent', progressPct)
          .or(`max_percent.is.null,max_percent.gte.${progressPct}`)
          .order('bonus_amount', { ascending: false })
          .limit(1);

        if (tierData && tierData.length > 0) {
          upliftPlan = tierData[0].bonus_amount / (planData.target_qty || 1);
        }
      }

      // Get active campaign bonuses
      const { data: campaignRules } = await supabase
        .from('campaign_bonus_rules')
        .select(`
          extra_per_sale,
          threshold_qty,
          campaigns!inner(
            active,
            start_at,
            end_at,
            network_id
          )
        `)
        .eq('product_variant_id', selectedVariantId)
        .eq('campaigns.active', true)
        .eq('campaigns.network_id', networkId)
        .lte('campaigns.start_at', now.toISOString())
        .gte('campaigns.end_at', now.toISOString());

      let upliftCampaign = 0;
      if (campaignRules) {
        for (const rule of campaignRules) {
          if (mtdQty + quantity >= rule.threshold_qty) {
            upliftCampaign += rule.extra_per_sale;
          }
        }
      }

      const totalBonus = (baseBonus + upliftPlan + upliftCampaign) * quantity;
      setCalculatedBonus(totalBonus);
    } catch (error) {
      console.error('Error calculating bonus:', error);
      setCalculatedBonus(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProduct || !userStore) return;

    setLoading(true);

    try {
      // Validate input
      const validation = saleSchema.safeParse({
        product_id: selectedProduct,
        product_variant_id: selectedVariantId,
        quantity,
      });

      if (!validation.success) {
        const errorMessage = validation.error.errors.map(e => e.message).join(', ');
        toast({
          title: 'Ошибка валидации',
          description: errorMessage,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const product = products.find(p => p.id === selectedProduct);
      if (!product) return;

      const totalAmount = product.price * quantity;
      const bonusAmount = calculatedBonus || 0;

      const saleData = {
        promoter_id: user.id,
        product_id: selectedProduct,
        product_variant_id: selectedVariantId,
        quantity,
        total_amount: totalAmount,
        bonus_amount: bonusAmount,
        bonus_extra: 0,
        uuid_client: uuidv4(),
        store_id: userStore.id,
      };

      if (isOnline()) {
        const { error } = await supabase.from('sales').insert([{
          ...saleData,
          synced: true,
        }]);

        if (error) throw error;

        toast({
          title: 'Продажа оформлена!',
          description: `Бонус: ${bonusAmount.toFixed(2)} ₸`,
        });
      } else {
        await saveOfflineSale({
          id: uuidv4(),
          ...saleData,
          created_at: new Date().toISOString(),
        });

        toast({
          title: 'Продажа сохранена офлайн',
          description: 'Будет синхронизирована при появлении сети',
        });
      }

      setSelectedProduct('');
      setSelectedVariantId('');
      setVariants([]);
      setQuantity(1);
      setCalculatedBonus(null);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);
  const totalAmount = selectedProductData ? selectedProductData.price * quantity : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <BackButton to="/dashboard" />
          <h1 className="text-xl font-bold">Быстрая продажа</h1>
        </div>
      </header>

      <main className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Продукт</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Выберите продукт" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {variants.length > 0 && (
              <div className="space-y-2">
                <Label>Память / Хранилище</Label>
                <Select value={selectedVariantId} onValueChange={setSelectedVariantId} required>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Выберите вариант" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map(variant => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.memory_gb}GB / {variant.storage_gb}GB
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Количество</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="h-12 text-center text-xl font-bold"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {selectedProductData && calculatedBonus !== null && (
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Сумма:</span>
                  <span className="font-bold">{totalAmount.toFixed(2)} ₸</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">Ваш бонус:</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{calculatedBonus.toFixed(2)} ₸</span>
                </div>
              </div>
            )}
          </Card>

          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold"
            disabled={loading || !selectedProduct || !selectedVariantId}
          >
            {loading ? 'Обработка...' : 'Оформить продажу'}
          </Button>
        </form>
      </main>

      <MobileNav />
    </div>
  );
}
