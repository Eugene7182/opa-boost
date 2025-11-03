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
import { ArrowLeft, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

interface Product {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
}

interface MarketShare {
  id: string;
  our_sales: number;
  competitor_sales: number;
  market_share_percent: number;
  period_start: string;
  period_end: string;
  products: { name: string } | null;
  regions: { name: string } | null;
  stores: { name: string } | null;
}

export default function MarketShares() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shares, setShares] = useState<MarketShare[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    region_id: '',
    store_id: '',
    our_sales: '',
    competitor_sales: '',
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: sharesData } = await supabase
      .from('market_shares')
      .select('*, products(name), regions(name), stores(name)')
      .order('period_start', { ascending: false })
      .limit(50);

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

    const { data: storesData } = await supabase
      .from('stores')
      .select('id, name')
      .eq('active', true)
      .order('name');

    if (sharesData) setShares(sharesData);
    if (productsData) setProducts(productsData);
    if (regionsData) setRegions(regionsData);
    if (storesData) setStores(storesData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('market_shares').insert([{
      product_id: formData.product_id,
      region_id: formData.region_id || null,
      store_id: formData.store_id || null,
      our_sales: parseFloat(formData.our_sales),
      competitor_sales: parseFloat(formData.competitor_sales),
      period_start: formData.period_start,
      period_end: formData.period_end,
    }]);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Доля рынка добавлена' });
    setDialogOpen(false);
    setFormData({
      product_id: '',
      region_id: '',
      store_id: '',
      our_sales: '',
      competitor_sales: '',
      period_start: new Date().toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
    });
    loadData();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/analytics')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Доли рынка</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Добавить данные о доле</DialogTitle>
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
                  <Label>Магазин (опционально)</Label>
                  <Select value={formData.store_id} onValueChange={(value) => setFormData({ ...formData, store_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все магазины" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все магазины</SelectItem>
                      {stores.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Наши продажи (₽)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.our_sales}
                    onChange={(e) => setFormData({ ...formData, our_sales: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Продажи конкурентов (₽)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.competitor_sales}
                    onChange={(e) => setFormData({ ...formData, competitor_sales: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Период с</Label>
                    <Input
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Период по</Label>
                    <Input
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Добавить</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {shares.map((share) => (
          <Card key={share.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{share.products?.name}</h3>
                <div className="flex items-center gap-1">
                  {share.market_share_percent >= 50 ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-destructive" />
                  )}
                  <span className="text-2xl font-bold">{share.market_share_percent.toFixed(1)}%</span>
                </div>
              </div>
              
              <Progress value={share.market_share_percent} className="h-3" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Наши продажи</p>
                  <p className="font-semibold text-success">{share.our_sales.toLocaleString('ru')} ₽</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Конкуренты</p>
                  <p className="font-semibold text-destructive">{share.competitor_sales.toLocaleString('ru')} ₽</p>
                </div>
              </div>
              
              <div className="flex gap-2 text-xs text-muted-foreground">
                {share.regions?.name && <span>Регион: {share.regions.name}</span>}
                {share.stores?.name && <span>Магазин: {share.stores.name}</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                Период: {new Date(share.period_start).toLocaleDateString('ru')} - {new Date(share.period_end).toLocaleDateString('ru')}
              </p>
            </div>
          </Card>
        ))}
      </main>

      <MobileNav />
    </div>
  );
}
