import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Building2, MapPin, Network } from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { z } from 'zod';

const networkSchema = z.object({
  name: z.string().min(1, { message: 'Название обязательно' }).max(100),
  code: z.string().min(1, { message: 'Код обязателен' }).max(20),
});

const storeSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20),
  city: z.string().min(1).max(100),
  address: z.string().max(500),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export default function OrgStructure() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('networks');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Fetch networks
  const { data: networks = [] } = useQuery({
    queryKey: ['networks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('networks')
        .select('*')
        .eq('active', true)
        .order('name');
      return data || [];
    },
  });

  // Fetch regions
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('regions')
        .select('*, networks(name)')
        .eq('active', true)
        .order('name');
      return data || [];
    },
  });

  // Fetch offices
  const { data: offices = [] } = useQuery({
    queryKey: ['offices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('offices')
        .select('*, regions(name)')
        .eq('active', true)
        .order('name');
      return data || [];
    },
  });

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data } = await supabase
        .from('stores')
        .select('*, offices(name)')
        .eq('active', true)
        .order('name');
      return data || [];
    },
  });

  // Generic mutation for creating/updating
  const saveMutation = useMutation({
    mutationFn: async ({ table, data, id }: any) => {
      if (id) {
        const { error } = await supabase.from(table).update(data).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert([{ ...data, active: true }]);
        if (error) throw error;
      }
    },
    onSuccess: (_, { table }) => {
      queryClient.invalidateQueries({ queryKey: [table] });
      toast.success(editingItem ? 'Обновлено' : 'Создано');
      setDialogOpen(false);
      setEditingItem(null);
    },
    onError: () => toast.error('Ошибка сохранения'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ table, id }: any) => {
      const { error } = await supabase.from(table).update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { table }) => {
      queryClient.invalidateQueries({ queryKey: [table] });
      toast.success('Удалено');
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const handleSave = (table: string, data: any) => {
    saveMutation.mutate({
      table,
      data,
      id: editingItem?.id,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Организационная структура</h1>
            <p className="text-muted-foreground">Управление сетями, регионами, офисами и магазинами</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="networks">Сети</TabsTrigger>
            <TabsTrigger value="regions">Регионы</TabsTrigger>
            <TabsTrigger value="offices">Офисы</TabsTrigger>
            <TabsTrigger value="stores">Магазины</TabsTrigger>
          </TabsList>

          {/* Networks Tab */}
          <TabsContent value="networks" className="space-y-4">
            <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить сеть
            </Button>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {networks.map((network: any) => (
                <Card key={network.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Network className="h-5 w-5" />
                          {network.name}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-2">{network.code}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingItem(network); setDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ table: 'networks', id: network.id })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Regions Tab */}
          <TabsContent value="regions" className="space-y-4">
            <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить регион
            </Button>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {regions.map((region: any) => (
                <Card key={region.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{region.name}</CardTitle>
                        <div className="mt-2 space-y-1 text-sm">
                          <Badge variant="secondary">{region.code}</Badge>
                          {region.networks && (
                            <p className="text-muted-foreground">Сеть: {region.networks.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingItem(region); setDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ table: 'regions', id: region.id })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Offices Tab */}
          <TabsContent value="offices" className="space-y-4">
            <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить офис
            </Button>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offices.map((office: any) => (
                <Card key={office.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {office.name}
                        </CardTitle>
                        <div className="mt-2 space-y-1 text-sm">
                          <Badge variant="secondary">{office.code}</Badge>
                          {office.regions && (
                            <p className="text-muted-foreground">Регион: {office.regions.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingItem(office); setDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ table: 'offices', id: office.id })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Stores Tab */}
          <TabsContent value="stores" className="space-y-4">
            <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить магазин
            </Button>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stores.map((store: any) => (
                <Card key={store.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          {store.name}
                        </CardTitle>
                        <div className="mt-2 space-y-1 text-sm">
                          <Badge variant="secondary">{store.code}</Badge>
                          <p className="text-muted-foreground">{store.city}</p>
                          {store.address && <p className="text-xs text-muted-foreground">{store.address}</p>}
                          {store.offices && (
                            <p className="text-muted-foreground">Офис: {store.offices.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingItem(store); setDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ table: 'stores', id: store.id })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Generic Dialog for Add/Edit */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Редактировать' : 'Добавить'} {
                  activeTab === 'networks' ? 'сеть' :
                  activeTab === 'regions' ? 'регион' :
                  activeTab === 'offices' ? 'офис' : 'магазин'
                }
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData);
                handleSave(activeTab, data);
              }}
              className="space-y-4"
            >
              <div>
                <Label>Название</Label>
                <Input name="name" defaultValue={editingItem?.name} required />
              </div>
              <div>
                <Label>Код</Label>
                <Input name="code" defaultValue={editingItem?.code} required />
              </div>
              
              {activeTab === 'regions' && (
                <div>
                  <Label>Сеть</Label>
                  <Select name="network_id" defaultValue={editingItem?.network_id} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.map((n: any) => (
                        <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeTab === 'offices' && (
                <div>
                  <Label>Регион</Label>
                  <Select name="region_id" defaultValue={editingItem?.region_id} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeTab === 'stores' && (
                <>
                  <div>
                    <Label>Офис</Label>
                    <Select name="office_id" defaultValue={editingItem?.office_id} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map((o: any) => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Город</Label>
                    <Input name="city" defaultValue={editingItem?.city} required />
                  </div>
                  <div>
                    <Label>Адрес</Label>
                    <Input name="address" defaultValue={editingItem?.address} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Широта</Label>
                      <Input name="latitude" type="number" step="any" defaultValue={editingItem?.latitude} />
                    </div>
                    <div>
                      <Label>Долгота</Label>
                      <Input name="longitude" type="number" step="any" defaultValue={editingItem?.longitude} />
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full">
                {editingItem ? 'Обновить' : 'Создать'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <MobileNav />
    </div>
  );
}
