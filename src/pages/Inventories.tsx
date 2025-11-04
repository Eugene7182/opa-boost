import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BackButton } from '@/components/BackButton';
import { MobileNav } from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { formatNumber } from '@/lib/formatters';

interface Product {
  id: string;
  name: string;
}

interface ProductVariant {
  id: string;
  memory_gb: number;
  storage_gb: number;
}

interface Store {
  id: string;
  name: string;
  city: string;
}

interface Inventory {
  id: string;
  product_id: string;
  product_variant_id: string | null;
  store_id: string;
  quantity: number;
  last_updated: string;
  products: Product;
  product_variants: ProductVariant | null;
  stores: Store;
}

export default function Inventories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState({ product_id: '', product_variant_id: '', store_id: '', quantity: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.product_id) {
      loadVariants(formData.product_id);
    }
  }, [formData.product_id]);

  const loadData = async () => {
    const { data: invData } = await supabase
      .from('inventories')
      .select(`*, products(id, name), product_variants(id, memory_gb, storage_gb), stores(id, name, city)`)
      .order('last_updated', { ascending: false });

    const { data: prodData } = await supabase.from('products').select('id, name').eq('active', true).order('name');
    const { data: storeData } = await supabase.from('stores').select('id, name, city').eq('active', true).order('name');

    if (invData) setInventories(invData as unknown as Inventory[]);
    if (prodData) setProducts(prodData);
    if (storeData) setStores(storeData);
  };

  const loadVariants = async (productId: string) => {
    const { data } = await supabase.from('product_variants').select('id, memory_gb, storage_gb').eq('product_id', productId).eq('active', true).order('memory_gb, storage_gb');
    if (data) setVariants(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invData = { product_id: formData.product_id, product_variant_id: formData.product_variant_id || null, store_id: formData.store_id, quantity: parseInt(formData.quantity), updated_by: user?.id, last_updated: new Date().toISOString() };

    if (editingInventory) {
      const { error } = await supabase.from('inventories').update(invData).eq('id', editingInventory.id);
      if (error) { toast({ title: 'Ошибка', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Остатки обновлены' });
    } else {
      const { error } = await supabase.from('inventories').insert([invData]);
      if (error) { toast({ title: 'Ошибка', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Остатки добавлены' });
    }
    setDialogOpen(false);
    setEditingInventory(null);
    setFormData({ product_id: '', product_variant_id: '', store_id: '', quantity: '' });
    loadData();
  };

  const handleEdit = (inv: Inventory) => {
    setEditingInventory(inv);
    setFormData({ product_id: inv.product_id, product_variant_id: inv.product_variant_id || '', store_id: inv.store_id, quantity: inv.quantity.toString() });
    setDialogOpen(true);
  };

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: 'Нет в наличии', variant: 'destructive' as const, icon: AlertCircle };
    if (qty < 5) return { label: 'Мало', variant: 'secondary' as const, icon: AlertCircle };
    return { label: 'В наличии', variant: 'default' as const, icon: CheckCircle };
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton to="/dashboard" />
            <h1 className="text-xl font-bold">Остатки</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" onClick={() => { setEditingInventory(null); setFormData({ product_id: '', product_variant_id: '', store_id: '', quantity: '' }); }}>
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingInventory ? 'Редактировать' : 'Добавить остатки'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Продукт</Label>
                  <Select value={formData.product_id} onValueChange={(v) => setFormData({ ...formData, product_id: v, product_variant_id: '' })}>
                    <SelectTrigger><SelectValue placeholder="Выберите продукт" /></SelectTrigger>
                    <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {formData.product_id && variants.length > 0 && (
                  <div className="space-y-2"><Label>Память / Хранилище</Label>
                    <Select value={formData.product_variant_id} onValueChange={(v) => setFormData({ ...formData, product_variant_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Выберите вариант" /></SelectTrigger>
                      <SelectContent>{variants.map((v) => <SelectItem key={v.id} value={v.id}>{v.memory_gb}GB / {v.storage_gb}GB</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2"><Label>Магазин</Label>
                  <Select value={formData.store_id} onValueChange={(v) => setFormData({ ...formData, store_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Выберите магазин" /></SelectTrigger>
                    <SelectContent>{stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} - {s.city}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Количество</Label><Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required min="0" /></div>
                <Button type="submit" className="w-full">{editingInventory ? 'Обновить' : 'Добавить'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <main className="p-4 space-y-3">
        {inventories.map((inv) => {
          const status = getStockStatus(inv.quantity);
          const StatusIcon = status.icon;
          return (
            <Card key={inv.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><Package className="w-4 h-4 text-primary" /><h3 className="font-semibold">{inv.products.name}</h3></div>
                  {inv.product_variants && <p className="text-sm text-muted-foreground">{inv.product_variants.memory_gb}GB / {inv.product_variants.storage_gb}GB</p>}
                  <p className="text-sm text-muted-foreground">{inv.stores.name}, {inv.stores.city}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-lg font-bold">{formatNumber(inv.quantity)} шт</p>
                    <Badge variant={status.variant} className="flex items-center gap-1"><StatusIcon className="w-3 h-3" />{status.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Обновлено: {new Date(inv.last_updated).toLocaleString('ru-RU')}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(inv)}><Edit className="w-4 h-4" /></Button>
              </div>
            </Card>
          );
        })}
      </main>
      <MobileNav />
    </div>
  );
}
