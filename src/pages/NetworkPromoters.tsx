import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/BackButton';
import { MobileNav } from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, UserCheck, X } from 'lucide-react';

interface NetworkPromoter {
  id: string;
  network_id: string;
  promoter_id: string;
  active: boolean;
  start_date: string;
  end_date?: string;
  networks: { name: string };
  profiles: { full_name: string };
}

interface Network {
  id: string;
  name: string;
}

interface Promoter {
  id: string;
  full_name: string;
}

export default function NetworkPromoters() {
  const { toast } = useToast();
  const [promoters, setPromoters] = useState<NetworkPromoter[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [availablePromoters, setAvailablePromoters] = useState<Promoter[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ network_id: '', promoter_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Загрузка активных связок промоутер-сеть
    const { data: promoterData } = await supabase
      .from('network_promoters')
      .select('*, networks(name), profiles(full_name)')
      .eq('active', true)
      .order('networks(name)');

    // Загрузка активных сетей
    const { data: networkData } = await supabase
      .from('networks')
      .select('id, name')
      .eq('active', true)
      .order('name');

    // Загрузка всех промоутеров
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name');

    if (promoterData) setPromoters(promoterData as NetworkPromoter[]);
    if (networkData) setNetworks(networkData as Network[]);
    if (userData) setAvailablePromoters(userData as Promoter[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.network_id || !form.promoter_id) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    // Проверяем, нет ли уже активной связки
    const exists = promoters.some(
      p => p.network_id === form.network_id && 
           p.promoter_id === form.promoter_id && 
           p.active
    );

    if (exists) {
      toast({
        title: 'Ошибка',
        description: 'Этот промоутер уже подключен к данной сети',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('network_promoters')
      .insert([{
        network_id: form.network_id,
        promoter_id: form.promoter_id,
        active: true,
        start_date: new Date().toISOString(),
      }]);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Промоутер подключен к сети' });
    setDialogOpen(false);
    setForm({ network_id: '', promoter_id: '' });
    loadData();
  };

  const handleDisconnect = async (promoterId: string, networkId: string) => {
    const { error } = await supabase
      .from('network_promoters')
      .update({ 
        active: false,
        end_date: new Date().toISOString()
      })
      .eq('promoter_id', promoterId)
      .eq('network_id', networkId)
      .eq('active', true);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Промоутер отключен от сети' });
    loadData();
  };

  const getFilteredPromoters = (networkId: string) => {
    const connected = promoters
      .filter(p => p.network_id === networkId)
      .map(p => p.promoter_id);
    return availablePromoters.filter(p => !connected.includes(p.id));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <BackButton to="/dashboard" />
          <h1 className="text-xl font-bold">Промоутеры в сетях</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Подключить промоутера
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подключить промоутера к сети</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Сеть</Label>
                <Select 
                  value={form.network_id} 
                  onValueChange={(v) => setForm({ ...form, network_id: v, promoter_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите сеть" />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map(n => (
                      <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.network_id && (
                <div className="space-y-2">
                  <Label>Промоутер</Label>
                  <Select 
                    value={form.promoter_id} 
                    onValueChange={(v) => setForm({ ...form, promoter_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите промоутера" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredPromoters(form.network_id).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" className="w-full">Подключить</Button>
            </form>
          </DialogContent>
        </Dialog>

        {networks.map(network => (
          <div key={network.id} className="space-y-3">
            <h2 className="font-semibold text-lg">{network.name}</h2>
            {promoters
              .filter(p => p.network_id === network.id)
              .map(promoter => (
                <Card key={promoter.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{promoter.profiles.full_name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Подключен: {new Date(promoter.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDisconnect(promoter.promoter_id, network.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            {promoters.filter(p => p.network_id === network.id).length === 0 && (
              <p className="text-sm text-muted-foreground">Нет подключенных промоутеров</p>
            )}
          </div>
        ))}
      </main>

      <MobileNav />
    </div>
  );
}