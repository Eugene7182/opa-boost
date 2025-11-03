import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MobileNav } from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BackButton } from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
  city: string;
}

interface Inventory {
  id: string;
  quantity: number;
  last_updated: string;
  products: { name: string } | null;
  stores: { name: string; city: string } | null;
}

export default function Inventories() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState({
    product_id: '',
    store_id: '',
    quantity: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: inventoriesData } = await supabase
      .from('inventories')
      .select('*, products(name), stores(name, city)')
      .order('last_updated', { ascending: false });

    const { data: productsData } = await supabase
      .from('products')
      .select('id, name')
      .eq('active', true)
      .order('name');

    const { data: storesData } = await supabase
      .from('stores')
      .select('id, name, city')
      .eq('active', true)
      .order('name');

    if (inventoriesData) setInventories(inventoriesData);
    if (productsData) setProducts(productsData);
    if (storesData) setStores(storesData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const inventoryData = {
      product_id: formData.product_id,
      store_id: formData.store_id,
      quantity: parseInt(formData.quantity),
      last_updated: new Date().toISOString(),
    };

    if (editingInventory) {
      const { error } = await supabase
        .from('inventories')
        .update({ quantity: inventoryData.quantity, last_updated: inventoryData.last_updated })
        .eq('id', editingInventory.id);

      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Остаток обновлён' });
    } else {
      const { error } = await supabase.from('inventories').insert([inventoryData]);

      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Остаток добавлен' });
    }

    setDialogOpen(false);
    setEditingInventory(null);
    setFormData({ product_id: '', store_id: '', quantity: '' });
    loadData();
  };

  const handleEdit = (inventory: Inventory) => {
    setEditingInventory(inventory);
    setFormData({
      product_id: '',
      store_id: '',
      quantity: inventory.quantity.toString(),
    });
    setDialogOpen(true);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Нет в наличии', variant: 'destructive' as const, icon: AlertTriangle };
    if (quantity < 10) return { label: 'Мало', variant: 'outline' as const, icon: AlertTriangle };
    return { label: 'В наличии', variant: 'secondary' as const, icon: Package };
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/analytics')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Остатки</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" onClick={() => { setEditingInventory(null); setFormData({ product_id: '', store_id: '', quantity: '' }); }}>
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingInventory ? 'Обновить остаток' : 'Добавить остаток'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingInventory && (
                  <>
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
                      <Label>Магазин</Label>
                      <Select value={formData.store_id} onValueChange={(value) => setFormData({ ...formData, store_id: value })} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите магазин" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.city})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Количество (шт)</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingInventory ? 'Обновить' : 'Добавить'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {inventories.map((inventory) => {
          const status = getStockStatus(inventory.quantity);
          const StatusIcon = status.icon;
          
          return (
            <Card key={inventory.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <StatusIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{inventory.products?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {inventory.stores?.name} • {inventory.stores?.city}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-2xl font-bold">{inventory.quantity} шт</span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Обновлено: {new Date(inventory.last_updated).toLocaleString('ru')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(inventory)}>
                  Изменить
                </Button>
              </div>
            </Card>
          );
        })}
      </main>

      <MobileNav />
    </div>
  );
}
