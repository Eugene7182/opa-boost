import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MobileNav } from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Users2, Package, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Competitor {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  active: boolean;
}

interface CompetitorProduct {
  id: string;
  product_name: string;
  category: string | null;
  estimated_price: number | null;
  competitors: { name: string } | null;
}

export default function Competitors() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [products, setProducts] = useState<CompetitorProduct[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
  });
  const [productFormData, setProductFormData] = useState({
    competitor_id: '',
    product_name: '',
    category: '',
    estimated_price: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: competitorsData } = await supabase
      .from('competitors')
      .select('*')
      .eq('active', true)
      .order('name');

    const { data: productsData } = await supabase
      .from('competitor_products')
      .select('*, competitors(name)')
      .eq('active', true)
      .order('product_name');

    if (competitorsData) setCompetitors(competitorsData);
    if (productsData) setProducts(productsData);
  };

  const handleSubmitCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('competitors').insert([{
      name: formData.name,
      brand: formData.brand || null,
      description: formData.description || null,
      active: true,
    }]);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Конкурент добавлен' });
    setDialogOpen(false);
    setFormData({ name: '', brand: '', description: '' });
    loadData();
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('competitor_products').insert([{
      competitor_id: productFormData.competitor_id,
      product_name: productFormData.product_name,
      category: productFormData.category || null,
      estimated_price: productFormData.estimated_price ? parseFloat(productFormData.estimated_price) : null,
      active: true,
    }]);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Продукт конкурента добавлен' });
    setProductDialogOpen(false);
    setProductFormData({ competitor_id: '', product_name: '', category: '', estimated_price: '' });
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
            <h1 className="text-xl font-bold">Конкуренты</h1>
          </div>
          
          <Button size="icon" onClick={() => navigate('/map')}>
            <MapPin className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <Tabs defaultValue="competitors" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="competitors">Компании</TabsTrigger>
          <TabsTrigger value="products">Продукты</TabsTrigger>
        </TabsList>

        <TabsContent value="competitors" className="p-4 space-y-3">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Добавить конкурента
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новый конкурент</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitCompetitor} className="space-y-4">
                <div className="space-y-2">
                  <Label>Название компании</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Бренд</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">Добавить</Button>
              </form>
            </DialogContent>
          </Dialog>

          {competitors.map((competitor) => (
            <Card key={competitor.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-destructive/10 p-2 rounded-lg">
                  <Users2 className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{competitor.name}</h3>
                  {competitor.brand && (
                    <Badge variant="secondary" className="mt-1">{competitor.brand}</Badge>
                  )}
                  {competitor.description && (
                    <p className="text-sm text-muted-foreground mt-2">{competitor.description}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="products" className="p-4 space-y-3">
          <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Добавить продукт
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Продукт конкурента</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label>Конкурент</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={productFormData.competitor_id}
                    onChange={(e) => setProductFormData({ ...productFormData, competitor_id: e.target.value })}
                    required
                  >
                    <option value="">Выберите конкурента</option>
                    {competitors.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Название продукта</Label>
                  <Input
                    value={productFormData.product_name}
                    onChange={(e) => setProductFormData({ ...productFormData, product_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Input
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Примерная цена (₸)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={productFormData.estimated_price}
                    onChange={(e) => setProductFormData({ ...productFormData, estimated_price: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Добавить</Button>
              </form>
            </DialogContent>
          </Dialog>

          {products.map((product) => (
            <Card key={product.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{product.product_name}</h3>
                  <p className="text-sm text-muted-foreground">{product.competitors?.name}</p>
                  <div className="flex gap-3 mt-2 text-sm">
                    {product.category && <Badge variant="outline">{product.category}</Badge>}
                    {product.estimated_price && (
                      <span className="font-semibold">{product.estimated_price} ₸</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <MobileNav />
    </div>
  );
}
