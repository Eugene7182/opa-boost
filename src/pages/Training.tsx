import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BookOpen, GraduationCap, Calendar, Video, FileText, Trophy, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function Training() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);

  const isTrainer = userRole === 'trainer' || userRole === 'admin' || userRole === 'office';

  // Fetch training materials
  const { data: materials } = useQuery({
    queryKey: ['training-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_materials')
        .select('*, profiles!training_materials_created_by_fkey(full_name)')
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch training sessions
  const { data: sessions } = useQuery({
    queryKey: ['training-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select(`
          *,
          profiles!training_sessions_trainer_id_fkey(full_name),
          training_materials(title),
          regions(name)
        `)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch user progress
  const { data: progress } = useQuery({
    queryKey: ['training-progress', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_progress')
        .select('*, training_materials(title, content_type)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Add material mutation
  const addMaterial = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from('training_materials').insert({
        ...values,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-materials'] });
      toast.success('Материал добавлен');
      setIsAddMaterialOpen(false);
    },
    onError: () => toast.error('Ошибка при добавлении материала'),
  });

  // Add session mutation
  const addSession = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from('training_sessions').insert({
        ...values,
        trainer_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      toast.success('Сессия создана');
      setIsAddSessionOpen(false);
    },
    onError: () => toast.error('Ошибка при создании сессии'),
  });

  // Register for session
  const registerForSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('training_participants').insert({
        session_id: sessionId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Вы зарегистрированы на обучение');
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
    },
    onError: () => toast.error('Ошибка регистрации'),
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Обучение
          </h1>
          <p className="text-muted-foreground">Материалы, сессии и прогресс обучения</p>
        </div>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials">Материалы</TabsTrigger>
          <TabsTrigger value="sessions">Сессии</TabsTrigger>
          <TabsTrigger value="progress">Мой прогресс</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Учебные материалы</h2>
            {isTrainer && (
              <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Добавить материал
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новый учебный материал</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      addMaterial.mutate(Object.fromEntries(formData));
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="title">Название</Label>
                      <Input id="title" name="title" required />
                    </div>
                    <div>
                      <Label htmlFor="description">Описание</Label>
                      <Textarea id="description" name="description" />
                    </div>
                    <div>
                      <Label htmlFor="content_type">Тип материала</Label>
                      <Select name="content_type" required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Видео</SelectItem>
                          <SelectItem value="document">Документ</SelectItem>
                          <SelectItem value="presentation">Презентация</SelectItem>
                          <SelectItem value="quiz">Тест</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category">Категория</Label>
                      <Input id="category" name="category" />
                    </div>
                    <div>
                      <Label htmlFor="file_url">Ссылка на файл</Label>
                      <Input id="file_url" name="file_url" type="url" />
                    </div>
                    <div>
                      <Label htmlFor="duration_minutes">Длительность (мин)</Label>
                      <Input id="duration_minutes" name="duration_minutes" type="number" />
                    </div>
                    <Button type="submit" className="w-full">Добавить</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials?.map((material) => (
              <Card key={material.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {material.content_type === 'video' && <Video className="h-5 w-5" />}
                      {material.content_type === 'document' && <FileText className="h-5 w-5" />}
                      {material.content_type === 'presentation' && <BookOpen className="h-5 w-5" />}
                      {material.content_type === 'quiz' && <Trophy className="h-5 w-5" />}
                      <CardTitle className="text-lg">{material.title}</CardTitle>
                    </div>
                  </div>
                  {material.category && (
                    <Badge variant="secondary">{material.category}</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-3">{material.description}</CardDescription>
                  {material.duration_minutes && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Clock className="h-4 w-4" />
                      {material.duration_minutes} минут
                    </div>
                  )}
                  {material.file_url && (
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                        Открыть материал
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Учебные сессии</h2>
            {isTrainer && (
              <Dialog open={isAddSessionOpen} onOpenChange={setIsAddSessionOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Calendar className="mr-2 h-4 w-4" />
                    Создать сессию
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новая учебная сессия</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      addSession.mutate(Object.fromEntries(formData));
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="session-title">Название</Label>
                      <Input id="session-title" name="title" required />
                    </div>
                    <div>
                      <Label htmlFor="session-description">Описание</Label>
                      <Textarea id="session-description" name="description" />
                    </div>
                    <div>
                      <Label htmlFor="scheduled_at">Дата и время</Label>
                      <Input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
                    </div>
                    <div>
                      <Label htmlFor="session-duration">Длительность (мин)</Label>
                      <Input id="session-duration" name="duration_minutes" type="number" defaultValue="60" />
                    </div>
                    <div>
                      <Label htmlFor="location">Место</Label>
                      <Input id="location" name="location" />
                    </div>
                    <div>
                      <Label htmlFor="online_link">Онлайн ссылка</Label>
                      <Input id="online_link" name="online_link" type="url" />
                    </div>
                    <Button type="submit" className="w-full">Создать</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4">
            {sessions?.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{session.title}</CardTitle>
                      <CardDescription className="mt-1">{session.description}</CardDescription>
                    </div>
                    <Badge>{session.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(session.scheduled_at), 'dd.MM.yyyy HH:mm')}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      {session.duration_minutes} минут
                    </div>
                    {session.profiles && (
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4" />
                        Тренер: {session.profiles.full_name}
                      </div>
                    )}
                    {session.location && (
                      <p className="text-sm text-muted-foreground">Место: {session.location}</p>
                    )}
                    {session.online_link && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={session.online_link} target="_blank" rel="noopener noreferrer">
                          Присоединиться онлайн
                        </a>
                      </Button>
                    )}
                    {!isTrainer && session.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => registerForSession.mutate(session.id)}
                        className="w-full"
                      >
                        Зарегистрироваться
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <h2 className="text-xl font-semibold">Мой прогресс обучения</h2>
          <div className="grid gap-4">
            {progress?.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.training_materials?.title}</CardTitle>
                  <Badge variant="secondary">{item.training_materials?.content_type}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Прогресс:</span>
                      <span className="font-medium">{item.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${item.progress_percentage}%` }}
                      />
                    </div>
                    {item.time_spent_minutes > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Потрачено времени: {item.time_spent_minutes} минут
                      </div>
                    )}
                    {item.completed && (
                      <Badge variant="default" className="mt-2">
                        <Trophy className="mr-1 h-3 w-3" />
                        Завершено
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {!progress?.length && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Начните изучать материалы, чтобы отслеживать свой прогресс
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
