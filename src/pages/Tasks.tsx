import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/BackButton';
import { MobileNav } from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
}

export default function Tasks() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
  });

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        profiles!tasks_assigned_to_fkey(full_name)
      `)
      .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) setTasks(data as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('tasks').insert([{
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority,
      due_date: formData.due_date || null,
      assigned_to: user.id,
      created_by: user.id,
      status: 'pending',
    }]);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Задача создана' });
    setDialogOpen(false);
    setFormData({ title: '', description: '', priority: 'medium', due_date: '' });
    loadTasks();
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', taskId);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Статус обновлён' });
    loadTasks();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Срочно';
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'cancelled': return XCircle;
      default: return AlertCircle;
    }
  };

  const filterTasks = (status: string) => {
    return tasks.filter(t => t.status === status);
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const StatusIcon = getStatusIcon(task.status);
    
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            task.status === 'completed' ? 'bg-success/10' :
            task.status === 'in_progress' ? 'bg-warning/10' : 'bg-muted'
          }`}>
            <StatusIcon className={`w-5 h-5 ${
              task.status === 'completed' ? 'text-success' :
              task.status === 'in_progress' ? 'text-warning' : 'text-muted-foreground'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
            )}
            <div className="flex gap-2 mt-2">
              <Badge variant={getPriorityColor(task.priority)}>
                {getPriorityLabel(task.priority)}
              </Badge>
              {task.due_date && (
                <Badge variant="outline">
                  {new Date(task.due_date).toLocaleDateString('ru')}
                </Badge>
              )}
            </div>
            {task.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => updateStatus(task.id, 'in_progress')}>
                  Начать
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(task.id, 'completed')}>
                  Завершить
                </Button>
              </div>
            )}
            {task.status === 'in_progress' && (
              <Button size="sm" className="mt-3" onClick={() => updateStatus(task.id, 'completed')}>
                Завершить
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton to="/dashboard" />
            <h1 className="text-xl font-bold">Задачи</h1>
          </div>
          
          {(userRole === 'admin' || userRole === 'office' || userRole === 'supervisor' || userRole === 'trainer') && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon">
                  <Plus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новая задача</DialogTitle>
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
                  <Label>Приоритет</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="urgent">Срочно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Срок выполнения</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Создать</Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </header>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="pending">Ожидают</TabsTrigger>
          <TabsTrigger value="in_progress">В работе</TabsTrigger>
          <TabsTrigger value="completed">Готово</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="p-4 space-y-3">
          {filterTasks('pending').map(task => <TaskCard key={task.id} task={task} />)}
        </TabsContent>

        <TabsContent value="in_progress" className="p-4 space-y-3">
          {filterTasks('in_progress').map(task => <TaskCard key={task.id} task={task} />)}
        </TabsContent>

        <TabsContent value="completed" className="p-4 space-y-3">
          {filterTasks('completed').map(task => <TaskCard key={task.id} task={task} />)}
        </TabsContent>
      </Tabs>

      <MobileNav />
    </div>
  );
}
