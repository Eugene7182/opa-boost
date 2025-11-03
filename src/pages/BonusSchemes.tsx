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
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const bonusSchemeSchema = z.object({
  name: z.string().trim().min(1, { message: 'Название не может быть пустым' }).max(200, { message: 'Название слишком длинное' }),
  bonus_percent: z.number().min(0, { message: 'Процент бонуса не может быть отрицательным' }).max(100, { message: 'Процент бонуса не может превышать 100%' }),
  min_quantity: z.number().int({ message: 'Количество должно быть целым числом' }).positive({ message: 'Количество должно быть положительным' }).max(10000, { message: 'Максимум 10000 штук' }),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Неверный формат даты' }),
});

interface Product {
  id: string;
  name: string;
}

interface BonusScheme {
  id: string;
  name: string;
  bonus_percent: number;
  min_quantity: number;
  products: { name: string } | null;
}

export default function BonusSchemes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schemes, setSchemes] = useState<BonusScheme[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    product_id: '',
    bonus_percent: '',
    min_quantity: '1',
    start_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: schemesData } = await supabase
      .from('bonus_schemes')
      .select('*, products(name)')
      .eq('active', true)
      .order('name');

    const { data: productsData } = await supabase
      .from('products')
      .select('id, name')
      .eq('active', true)
      .order('name');

    if (schemesData) setSchemes(schemesData);
    if (productsData) setProducts(productsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = bonusSchemeSchema.safeParse({
      name: formData.name,
      bonus_percent: parseFloat(formData.bonus_percent),
      min_quantity: parseInt(formData.min_quantity),
      start_date: formData.start_date,
    });

    if (!validation.success) {
      const errorMessage = validation.error.errors.map(e => e.message).join(', ');
      toast({ 
        title: 'Ошибка валидации', 
        description: errorMessage, 
        variant: 'destructive' 
      });
      return;
    }

    const { error } = await supabase.from('bonus_schemes').insert([{
      name: validation.data.name,
      bonus_percent: validation.data.bonus_percent,
      min_quantity: validation.data.min_quantity,
      start_date: validation.data.start_date,
      product_id: formData.product_id || null,
      active: true,
    }]);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Схема бонусов создана' });
    setDialogOpen(false);
    setFormData({ name: '', product_id: '', bonus_percent: '', min_quantity: '1', start_date: new Date().toISOString().split('T')[0] });
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
            <h1 className="text-xl font-bold">Схемы бонусов</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новая схема</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Продукт (опционально)</Label>
                  <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все продукты" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все продукты</SelectItem>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Процент бонуса</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.bonus_percent}
                    onChange={(e) => setFormData({ ...formData, bonus_percent: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Мин. количество</Label>
                  <Input
                    type="number"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дата начала</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Создать</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {schemes.map((scheme) => (
          <Card key={scheme.id} className="p-4">
            <h3 className="font-semibold text-lg">{scheme.name}</h3>
            <p className="text-sm text-muted-foreground">
              {scheme.products ? scheme.products.name : 'Все продукты'}
            </p>
            <div className="flex gap-4 mt-2">
              <span className="text-success font-bold">{scheme.bonus_percent}%</span>
              <span className="text-muted-foreground">Мин: {scheme.min_quantity} шт</span>
            </div>
          </Card>
        ))}
      </main>

      <MobileNav />
    </div>
  );
}
