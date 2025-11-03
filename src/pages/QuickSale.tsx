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
import { Plus, Minus } from 'lucide-react';
import { saveOfflineSale, isOnline } from '@/lib/offline';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const saleSchema = z.object({
  product_id: z.string().uuid({ message: 'Неверный ID продукта' }),
  quantity: z.number().int({ message: 'Количество должно быть целым числом' }).positive({ message: 'Количество должно быть положительным' }).max(1000, { message: 'Максимум 1000 штук за раз' }),
});

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  storage_capacity?: string | null;
}

export default function QuickSale() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedMemory, setSelectedMemory] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userStoreId, setUserStoreId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
    loadUserStore();
  }, []);

  const loadUserStore = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('store_id')
      .eq('id', user.id)
      .single();
    
    if (data) setUserStoreId(data.store_id);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (data) setProducts(data);
  };

  const calculateBonus = async (productId: string, qty: number, totalAmount: number) => {
    const { data: schemes } = await supabase
      .from('bonus_schemes')
      .select('*')
      .eq('product_id', productId)
      .eq('active', true)
      .lte('min_quantity', qty)
      .order('bonus_percent', { ascending: false })
      .limit(1);

    let bonusAmount = 0;
    let bonusExtra = 0;

    if (schemes && schemes.length > 0) {
      bonusAmount = (totalAmount * Number(schemes[0].bonus_percent)) / 100;
    }

    const { data: motivations } = await supabase
      .from('motivations')
      .select('*')
      .eq('active', true)
      .lte('start_date', new Date().toISOString());

    if (motivations && motivations.length > 0) {
      bonusExtra = Number(motivations[0].bonus_extra);
    }

    return { bonusAmount, bonusExtra };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProduct) return;

    setLoading(true);

    try {
      // Validate input
      const validation = saleSchema.safeParse({
        product_id: selectedProduct,
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
      const { bonusAmount, bonusExtra } = await calculateBonus(selectedProduct, quantity, totalAmount);

      if (!userStoreId) {
        toast({
          title: 'Ошибка',
          description: 'Вы не закреплены за магазином',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const saleData = {
        promoter_id: user.id,
        product_id: selectedProduct,
        quantity,
        total_amount: totalAmount,
        bonus_amount: bonusAmount,
        bonus_extra: bonusExtra,
        uuid_client: uuidv4(),
        store_id: userStoreId,
      };

      if (isOnline()) {
        const { error } = await supabase.from('sales').insert([{
          ...saleData,
          synced: true,
        }]);

        if (error) throw error;

        toast({
          title: 'Продажа оформлена!',
          description: `Бонус: ${(bonusAmount + bonusExtra).toFixed(2)} ₸`,
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
      setSelectedMemory('');
      setQuantity(1);
      // Успешно сохранено - можно вернуться к истории продаж при необходимости
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
              <Select value={selectedProduct} onValueChange={(value) => { setSelectedProduct(value); setSelectedMemory(''); }} required>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Выберите продукт" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.price} ₸
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProductData?.storage_capacity && (
              <div className="space-y-2">
                <Label>Память (ГБ)</Label>
                <Select value={selectedMemory} onValueChange={setSelectedMemory} required>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Выберите память" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProductData.storage_capacity.split(',').map((memory: string) => {
                      const memoryTrim = memory.trim();
                      return (
                        <SelectItem key={memoryTrim} value={memoryTrim}>
                          {memoryTrim} ГБ
                        </SelectItem>
                      );
                    })}
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

            {selectedProductData && (
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Сумма:</span>
                  <span className="font-bold">{totalAmount.toFixed(2)} ₸</span>
                </div>
              </div>
            )}
          </Card>

          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold"
            disabled={loading || !selectedProduct || (selectedProductData?.storage_capacity && !selectedMemory)}
          >
            {loading ? 'Обработка...' : 'Оформить продажу'}
          </Button>
        </form>
      </main>

      <MobileNav />
    </div>
  );
}
