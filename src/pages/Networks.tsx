import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/BackButton';
import { MobileNav } from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Network } from 'lucide-react';
import { z } from 'zod';

const networkSchema = z.object({
  code: z.string().min(1, 'Код обязателен').max(50, 'Максимум 50 символов'),
  name: z.string().min(1, 'Название обязательно').max(100, 'Максимум 100 символов'),
});

interface NetworkType {
  id: string;
  code: string;
  name: string;
  active: boolean;
  created_at: string;
}

export default function Networks() {
  const { toast } = useToast();
  const [networks, setNetworks] = useState<NetworkType[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<NetworkType | null>(null);
  const [deletingNetwork, setDeletingNetwork] = useState<NetworkType | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '' });

  useEffect(() => {
    loadNetworks();
  }, []);

  const loadNetworks = async () => {
    const { data } = await supabase
      .from('networks')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (data) setNetworks(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = networkSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: 'Ошибка валидации',
        description: validation.error.errors.map(e => e.message).join(', '),
        variant: 'destructive',
      });
      return;
    }

    if (editingNetwork) {
      const { error } = await supabase
        .from('networks')
        .update(formData)
        .eq('id', editingNetwork.id);

      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Сеть обновлена' });
    } else {
      const { error } = await supabase
        .from('networks')
        .insert([formData]);

      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Сеть создана' });
    }

    setDialogOpen(false);
    setEditingNetwork(null);
    setFormData({ code: '', name: '' });
    loadNetworks();
  };

  const handleEdit = (network: NetworkType) => {
    setEditingNetwork(network);
    setFormData({ code: network.code, name: network.name });
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingNetwork) return;

    const { error } = await supabase
      .from('networks')
      .update({ active: false })
      .eq('id', deletingNetwork.id);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Сеть деактивирована' });
    setDeleteDialogOpen(false);
    setDeletingNetwork(null);
    loadNetworks();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton to="/dashboard" />
            <h1 className="text-xl font-bold">Сети</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" onClick={() => { setEditingNetwork(null); setFormData({ code: '', name: '' }); }}>
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingNetwork ? 'Редактировать сеть' : 'Создать сеть'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Код</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="MECHTA"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Mechta"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingNetwork ? 'Обновить' : 'Создать'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {networks.map((network) => (
          <Card key={network.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3 flex-1">
                <Network className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold">{network.name}</h3>
                  <p className="text-sm text-muted-foreground">Код: {network.code}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(network)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setDeletingNetwork(network); setDeleteDialogOpen(true); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {networks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Network className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Нет созданных сетей</p>
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Деактивировать сеть?</AlertDialogTitle>
            <AlertDialogDescription>
              Сеть &quot;{deletingNetwork?.name}&quot; будет деактивирована.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Деактивировать</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileNav />
    </div>
  );
}
