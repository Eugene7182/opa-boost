import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MobileNav } from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
}

interface RetailPrice {
  id: string;
  product_id: string;
  price: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
  products: { name: string } | null;
}

export default function RetailPrices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prices, setPrices] = useState<RetailPrice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    price: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: pricesData } = await supabase
      .from('retail_prices')
      .select('*, products(name)')
      .eq('active', true)
      .order('start_date', { ascending: false });

    const { data: productsData } = await supabase
      .from('products')
      .select('id, name')
      .eq('active', true)
      .order('name');

    if (pricesData) setPrices(pricesData);
    if (productsData) setProducts(productsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('retail_prices').insert([{
      product_id: formData.product_id,
      price: parseFloat(formData.price),
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      active: true,
    }]);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Цена добавлена в прайс-лист' });
    setDialogOpen(false);
    setFormData({ 
      product_id: '', 
      price: '', 
      start_date: new Date().toISOString().split('T')[0], 
      end_date: '' 
    });
    loadData();
  };

  const handleDeactivate = async (id: string) => {
    const { error } = await supabase
      .from('retail_prices')
      .update({ active: false, end_date: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Цена деактивирована' });
    loadData();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Прайс-книга</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новая розничная цена</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Продукт</Label>
                  <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите продукт" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Розничная цена (₸)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дата начала действия</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дата окончания (опционально)</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Добавить цену</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {prices.map((price) => (
          <Card key={price.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{price.products?.name}</h3>
                <p className="text-2xl font-bold text-primary mt-1">{price.price} ₸</p>
                <div className="flex gap-2 mt-2 text-sm text-muted-foreground">
                  <span>С {new Date(price.start_date).toLocaleDateString('ru')}</span>
                  {price.end_date && (
                    <span>до {new Date(price.end_date).toLocaleDateString('ru')}</span>
                  )}
                </div>
                {!price.end_date && (
                  <Badge variant="secondary" className="mt-2">Активна</Badge>
                )}
              </div>
              {!price.end_date && (
                <Button variant="ghost" size="sm" onClick={() => handleDeactivate(price.id)}>
                  Завершить
                </Button>
              )}
            </div>
          </Card>
        ))}
      </main>

      <MobileNav />
    </div>
  );
}
