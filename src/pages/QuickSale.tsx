import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileNav } from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveOfflineSale, isOnline } from '@/lib/offline';
import { v4 as uuidv4 } from 'uuid';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
}

export default function QuickSale() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

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
      const product = products.find(p => p.id === selectedProduct);
      if (!product) return;

      const totalAmount = product.price * quantity;
      const { bonusAmount, bonusExtra } = await calculateBonus(selectedProduct, quantity, totalAmount);

      const saleData = {
        promoter_id: user.id,
        product_id: selectedProduct,
        quantity,
        total_amount: totalAmount,
        bonus_amount: bonusAmount,
        bonus_extra: bonusExtra,
        uuid_client: uuidv4(),
      };

      if (isOnline()) {
        const { error } = await supabase.from('sales').insert([{
          ...saleData,
          synced: true,
        }]);

        if (error) throw error;

        toast({
          title: 'Продажа оформлена!',
          description: `Бонус: ${(bonusAmount + bonusExtra).toFixed(2)} ₽`,
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
      setQuantity(1);
      navigate('/sales/history');
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
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
                      {product.name} - {product.price} ₽
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  <span className="font-bold">{totalAmount.toFixed(2)} ₽</span>
                </div>
              </div>
            )}
          </Card>

          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold"
            disabled={loading || !selectedProduct}
          >
            {loading ? 'Обработка...' : 'Оформить продажу'}
          </Button>
        </form>
      </main>

      <MobileNav />
    </div>
  );
}
