import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MobileNav } from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Motivation {
  id: string;
  title: string;
  description: string | null;
  bonus_extra: number;
  target_sales_count: number | null;
  target_sales_amount: number | null;
  active: boolean;
}

export default function Motivations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [motivations, setMotivations] = useState<Motivation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bonus_extra: '',
    target_sales_count: '',
    target_sales_amount: '',
    start_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadMotivations();
  }, []);

  const loadMotivations = async () => {
    const { data } = await supabase
      .from('motivations')
      .select('*')
      .eq('active', true)
      .order('start_date', { ascending: false });

    if (data) setMotivations(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('motivations').insert([{
      title: formData.title,
      description: formData.description || null,
      bonus_extra: parseFloat(formData.bonus_extra),
      target_sales_count: formData.target_sales_count ? parseInt(formData.target_sales_count) : null,
      target_sales_amount: formData.target_sales_amount ? parseFloat(formData.target_sales_amount) : null,
      start_date: formData.start_date,
      active: true,
    }]);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Мотивация создана' });
    setDialogOpen(false);
    setFormData({
      title: '',
      description: '',
      bonus_extra: '',
      target_sales_count: '',
      target_sales_amount: '',
      start_date: new Date().toISOString().split('T')[0],
    });
    loadMotivations();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Мотивации</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новая мотивация</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
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
                <div className="space-y-2">
                  <Label>Дополнительный бонус (₸)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.bonus_extra}
                    onChange={(e) => setFormData({ ...formData, bonus_extra: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Цель: количество продаж</Label>
                  <Input
                    type="number"
                    value={formData.target_sales_count}
                    onChange={(e) => setFormData({ ...formData, target_sales_count: e.target.value })}
                    placeholder="Не указано"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Цель: сумма продаж (₸)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.target_sales_amount}
                    onChange={(e) => setFormData({ ...formData, target_sales_amount: e.target.value })}
                    placeholder="Не указано"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дата начала</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Создать</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {motivations.map((motivation) => (
          <Card key={motivation.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-warning/10 p-2 rounded-lg">
                <Target className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{motivation.title}</h3>
                {motivation.description && (
                  <p className="text-sm text-muted-foreground mt-1">{motivation.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-success font-bold">+{motivation.bonus_extra} ₸</span>
                  {motivation.target_sales_count && (
                    <span className="text-muted-foreground">Цель: {motivation.target_sales_count} продаж</span>
                  )}
                  {motivation.target_sales_amount && (
                    <span className="text-muted-foreground">Цель: {motivation.target_sales_amount} ₸</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </main>

      <MobileNav />
    </div>
  );
}
