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
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Competitor {
  id: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
  city: string;
}

interface Tracking {
  id: string;
  presence_type: string;
  promoter_count: number;
  notes: string | null;
  last_seen: string | null;
  competitors: { name: string } | null;
  stores: { name: string; city: string } | null;
}

export default function CompetitorTracking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tracking, setTracking] = useState<Tracking[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    competitor_id: '',
    store_id: '',
    presence_type: 'active',
    promoter_count: '0',
    notes: '',
    last_seen: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: trackingData } = await supabase
      .from('competitor_tracking')
      .select('*, competitors(name), stores(name, city)')
      .order('last_seen', { ascending: false });

    const { data: competitorsData } = await supabase
      .from('competitors')
      .select('id, name')
      .eq('active', true)
      .order('name');

    const { data: storesData } = await supabase
      .from('stores')
      .select('id, name, city')
      .eq('active', true)
      .order('name');

    if (trackingData) setTracking(trackingData);
    if (competitorsData) setCompetitors(competitorsData);
    if (storesData) setStores(storesData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('competitor_tracking').insert([{
      competitor_id: formData.competitor_id,
      store_id: formData.store_id,
      presence_type: formData.presence_type,
      promoter_count: parseInt(formData.promoter_count),
      notes: formData.notes || null,
      last_seen: formData.last_seen,
    }]);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Наблюдение добавлено' });
    setDialogOpen(false);
    setFormData({
      competitor_id: '',
      store_id: '',
      presence_type: 'active',
      promoter_count: '0',
      notes: '',
      last_seen: new Date().toISOString().split('T')[0],
    });
    loadData();
  };

  const getPresenceIcon = (type: string) => {
    switch (type) {
      case 'active': return TrendingUp;
      case 'occasional': return Minus;
      case 'inactive': return TrendingDown;
      default: return Minus;
    }
  };

  const getPresenceColor = (type: string) => {
    switch (type) {
      case 'active': return 'text-destructive';
      case 'occasional': return 'text-warning';
      case 'inactive': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getPresenceLabel = (type: string) => {
    switch (type) {
      case 'active': return 'Активный';
      case 'occasional': return 'Периодически';
      case 'inactive': return 'Неактивный';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/competitors')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Отслеживание</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Новое наблюдение</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Конкурент</Label>
                  <Select value={formData.competitor_id} onValueChange={(value) => setFormData({ ...formData, competitor_id: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите конкурента" />
                    </SelectTrigger>
                    <SelectContent>
                      {competitors.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                <div className="space-y-2">
                  <Label>Тип присутствия</Label>
                  <Select value={formData.presence_type} onValueChange={(value) => setFormData({ ...formData, presence_type: value })} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Активный</SelectItem>
                      <SelectItem value="occasional">Периодически</SelectItem>
                      <SelectItem value="inactive">Неактивный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Количество промоутеров</Label>
                  <Input
                    type="number"
                    value={formData.promoter_count}
                    onChange={(e) => setFormData({ ...formData, promoter_count: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дата наблюдения</Label>
                  <Input
                    type="date"
                    value={formData.last_seen}
                    onChange={(e) => setFormData({ ...formData, last_seen: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Заметки</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Дополнительная информация..."
                  />
                </div>
                <Button type="submit" className="w-full">Добавить</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {tracking.map((track) => {
          const PresenceIcon = getPresenceIcon(track.presence_type);
          
          return (
            <Card key={track.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  track.presence_type === 'active' ? 'bg-destructive/10' :
                  track.presence_type === 'occasional' ? 'bg-warning/10' : 'bg-muted'
                }`}>
                  <PresenceIcon className={`w-5 h-5 ${getPresenceColor(track.presence_type)}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{track.competitors?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {track.stores?.name} • {track.stores?.city}
                      </p>
                    </div>
                    <Badge variant={track.presence_type === 'active' ? 'destructive' : 'secondary'}>
                      {getPresenceLabel(track.presence_type)}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">
                      Промоутеров: {track.promoter_count}
                    </span>
                    {track.last_seen && (
                      <span className="text-muted-foreground">
                        {new Date(track.last_seen).toLocaleDateString('ru')}
                      </span>
                    )}
                  </div>
                  
                  {track.notes && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded">{track.notes}</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </main>

      <MobileNav />
    </div>
  );
}
