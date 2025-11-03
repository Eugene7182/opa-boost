import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/BackButton';
import { MobileNav } from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().trim().min(1, { message: 'Название не может быть пустым' }).max(200, { message: 'Название слишком длинное (макс. 200 символов)' }),
  category: z.string().trim().min(1, { message: 'Категория не может быть пустой' }).max(100, { message: 'Категория слишком длинная (макс. 100 символов)' }),
  price: z.number().positive({ message: 'Цена должна быть положительной' }).max(1000000, { message: 'Цена слишком велика' }),
  storage_capacity: z.string().optional(),
});

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  storage_capacity?: string | null;
  active: boolean;
}

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', price: '', storage_capacity: '' });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (data) setProducts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = productSchema.safeParse({
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      storage_capacity: formData.storage_capacity || undefined,
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

    const productData = {
      name: validation.data.name,
      category: validation.data.category,
      price: validation.data.price,
      storage_capacity: validation.data.storage_capacity || null,
      active: true,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Продукт обновлён' });
    } else {
      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Продукт создан' });
    }

    setDialogOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', category: '', price: '', storage_capacity: '' });
    loadProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      storage_capacity: product.storage_capacity || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Продукт деактивирован' });
    loadProducts();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton to="/dashboard" />
            <h1 className="text-xl font-bold">Продукты</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" onClick={() => { setEditingProduct(null); setFormData({ name: '', category: '', price: '', storage_capacity: '' }); }}>
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Редактировать' : 'Новый продукт'}</DialogTitle>
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
                  <Label>Категория</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Цена (₸)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Память (ГБ)</Label>
                  <Input
                    value={formData.storage_capacity}
                    onChange={(e) => setFormData({ ...formData, storage_capacity: e.target.value })}
                    placeholder="64, 128, 256, 512"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingProduct ? 'Обновить' : 'Создать'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {products.filter(p => p.active).map((product) => (
          <Card key={product.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.category}</p>
                {product.storage_capacity && (
                  <p className="text-sm text-muted-foreground">Память: {product.storage_capacity} ГБ</p>
                )}
                <p className="text-xl font-bold mt-1">{product.price} ₸</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </main>

      <MobileNav />
    </div>
  );
}
