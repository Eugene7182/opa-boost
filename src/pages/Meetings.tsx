import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { ArrowLeft, Plus, Calendar, MapPin, Video, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_type: string;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  online_link: string | null;
  status: string;
  profiles: { full_name: string } | null;
}

export default function Meetings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meeting_type: 'team',
    scheduled_at: '',
    duration_minutes: '60',
    location: '',
    online_link: '',
  });

  useEffect(() => {
    loadMeetings();
  }, [user]);

  const loadMeetings = async () => {
    if (!user) return;

    const { data: participantData } = await supabase
      .from('meeting_participants')
      .select('meeting_id')
      .eq('user_id', user.id);

    const meetingIds = participantData?.map(p => p.meeting_id) || [];

    const { data } = await supabase
      .from('meetings')
      .select(`
        *,
        profiles!meetings_organizer_id_fkey(full_name)
      `)
      .or(`organizer_id.eq.${user.id},id.in.(${meetingIds.join(',')})`)
      .order('scheduled_at', { ascending: true });

    if (data) setMeetings(data as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('meetings').insert([{
      title: formData.title,
      description: formData.description || null,
      meeting_type: formData.meeting_type,
      scheduled_at: formData.scheduled_at,
      duration_minutes: parseInt(formData.duration_minutes),
      location: formData.location || null,
      online_link: formData.online_link || null,
      organizer_id: user.id,
      status: 'scheduled',
    }]);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Собрание создано' });
    setDialogOpen(false);
    setFormData({
      title: '',
      description: '',
      meeting_type: 'team',
      scheduled_at: '',
      duration_minutes: '60',
      location: '',
      online_link: '',
    });
    loadMeetings();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'team': return 'Команда';
      case 'training': return 'Обучение';
      case 'review': return 'Ревью';
      case 'planning': return 'Планирование';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Запланировано';
      case 'in_progress': return 'Идёт';
      case 'completed': return 'Завершено';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Собрания</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Новое собрание</DialogTitle>
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
                  <Label>Тип собрания</Label>
                  <Select value={formData.meeting_type} onValueChange={(value) => setFormData({ ...formData, meeting_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team">Команда</SelectItem>
                      <SelectItem value="training">Обучение</SelectItem>
                      <SelectItem value="review">Ревью</SelectItem>
                      <SelectItem value="planning">Планирование</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Дата и время</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Длительность (минут)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    required
                    min="15"
                    step="15"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Место проведения</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Офис, адрес..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ссылка на онлайн-встречу</Label>
                  <Input
                    type="url"
                    value={formData.online_link}
                    onChange={(e) => setFormData({ ...formData, online_link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <Button type="submit" className="w-full">Создать</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {meetings.map((meeting) => (
          <Card key={meeting.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{meeting.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Организатор: {meeting.profiles?.full_name}
                  </p>
                </div>
                <Badge variant={getStatusColor(meeting.status)}>
                  {getStatusLabel(meeting.status)}
                </Badge>
              </div>

              {meeting.description && (
                <p className="text-sm">{meeting.description}</p>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date(meeting.scheduled_at).toLocaleString('ru')}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{meeting.duration_minutes} минут</span>
              </div>

              {meeting.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{meeting.location}</span>
                </div>
              )}

              {meeting.online_link && (
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-primary" />
                  <a href={meeting.online_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Присоединиться онлайн
                  </a>
                </div>
              )}

              <Badge variant="outline">{getTypeLabel(meeting.meeting_type)}</Badge>
            </div>
          </Card>
        ))}

        {meetings.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <p>Нет запланированных собраний</p>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
