import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MobileNav } from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BackButton } from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
}

interface KefScheme {
  id: string;
  name: string;
  description: string | null;
  coefficient: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
  products: { name: string } | null;
  regions: { name: string } | null;
}

export default function KefSchemes() {
  const { toast } = useToast();
  const [schemes, setSchemes] = useState<KefScheme[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coefficient: '',
    product_id: '',
    region_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: schemesData } = await supabase
      .from('kef_schemes')
      .select('*, products(name), regions(name)')
      .eq('active', true)
      .order('start_date', { ascending: false });

    const { data: productsData } = await supabase
      .from('products')
      .select('id, name')
      .eq('active', true)
      .order('name');

    const { data: regionsData } = await supabase
      .from('regions')
      .select('id, name')
      .eq('active', true)
      .order('name');

    if (schemesData) setSchemes(schemesData);
    if (productsData) setProducts(productsData);
    if (regionsData) setRegions(regionsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('kef_schemes').insert([{
      name: formData.name,
      description: formData.description || null,
      coefficient: parseFloat(formData.coefficient),
      product_id: formData.product_id || null,
      region_id: formData.region_id || null,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      active: true,
    }]);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'КЭФ создан' });
    setDialogOpen(false);
    setFormData({ 
      name: '', 
      description: '', 
      coefficient: '', 
      product_id: '', 
      region_id: '',
      start_date: new Date().toISOString().split('T')[0], 
      end_date: '' 
    });
    loadData();
  };

  const handleEnd = async (id: string) => {
    const endDate = new Date().toISOString();

    // Create kef_ending record
    const scheme = schemes.find(s => s.id === id);
    if (scheme) {
      await supabase.from('kef_endings').insert([{
        kef_scheme_id: id,
        end_date: endDate,
        reason: 'Завершено вручную',
      }]);
    }

    // Update scheme
    const { error } = await supabase
      .from('kef_schemes')
      .update({ active: false, end_date: endDate })
      .eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'КЭФ завершён' });
    loadData();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton to="/dashboard" />
            <h1 className="text-xl font-bold">КЭФ</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Новый коэффициент</DialogTitle>
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
                  <Label>Описание</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Коэффициент (множитель)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.coefficient}
                    onChange={(e) => setFormData({ ...formData, coefficient: e.target.value })}
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
                  <Label>Регион (опционально)</Label>
                  <Select value={formData.region_id} onValueChange={(value) => setFormData({ ...formData, region_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все регионы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все регионы</SelectItem>
                      {regions.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button type="submit" className="w-full">Создать КЭФ</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {schemes.map((scheme) => (
          <Card key={scheme.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-accent/10 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{scheme.name}</h3>
                {scheme.description && (
                  <p className="text-sm text-muted-foreground mt-1">{scheme.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-accent">×{scheme.coefficient}</span>
                  {!scheme.end_date && <Badge variant="secondary">Активный</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                  <span>Продукт: {scheme.products?.name || 'Все'}</span>
                  <span>Регион: {scheme.regions?.name || 'Все'}</span>
                  <span>С {new Date(scheme.start_date).toLocaleDateString('ru')}</span>
                  {scheme.end_date && (
                    <span>до {new Date(scheme.end_date).toLocaleDateString('ru')}</span>
                  )}
                </div>
              </div>
              {!scheme.end_date && (
                <Button variant="ghost" size="sm" onClick={() => handleEnd(scheme.id)}>
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
