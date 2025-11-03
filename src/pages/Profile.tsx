import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User, TrendingUp, Award, Clock, LogOut, Edit, Save } from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { format } from 'date-fns';

export default function Profile() {
  const { user, userRole, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: '',
  });

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, stores(name, city), regions(name)')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        city: data.city || '',
      });
      return data;
    },
    enabled: !!user,
  });

  // Fetch user sales statistics
  const { data: salesStats } = useQuery({
    queryKey: ['sales-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('quantity, total_amount, bonus_amount, bonus_extra, created_at')
        .eq('promoter_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const total = data?.reduce((acc, sale) => acc + Number(sale.total_amount), 0) || 0;
      const bonuses = data?.reduce((acc, sale) => acc + Number(sale.bonus_amount) + Number(sale.bonus_extra), 0) || 0;
      const count = data?.length || 0;
      
      return { total, bonuses, count, recent: data?.slice(0, 5) || [] };
    },
    enabled: !!user && userRole === 'promoter',
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Профиль обновлен');
      setIsEditing(false);
    },
    onError: () => toast.error('Ошибка обновления профиля'),
  });

  const handleSave = () => {
    if (!formData.full_name.trim()) {
      toast.error('Имя обязательно');
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500',
    office: 'bg-blue-500',
    supervisor: 'bg-purple-500',
    trainer: 'bg-green-500',
    promoter: 'bg-yellow-500',
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Профиль</h1>
            <p className="text-muted-foreground">Личная информация и статистика</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Информация</TabsTrigger>
            {userRole === 'promoter' && <TabsTrigger value="stats">Статистика</TabsTrigger>}
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Личные данные
                  </CardTitle>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Редактировать
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Сохранить
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Роль:</span>
                  <Badge className={roleColors[userRole || 'promoter']}>
                    {userRole}
                  </Badge>
                </div>

                <div>
                  <Label>Имя</Label>
                  {isEditing ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-lg font-medium">{profile?.full_name}</p>
                  )}
                </div>

                <div>
                  <Label>Телефон</Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-lg font-medium">{profile?.phone || 'Не указан'}</p>
                  )}
                </div>

                <div>
                  <Label>Город</Label>
                  {isEditing ? (
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  ) : (
                    <p className="text-lg font-medium">{profile?.city || 'Не указан'}</p>
                  )}
                </div>

                {profile?.stores && (
                  <div>
                    <Label>Магазин</Label>
                    <p className="text-lg font-medium">
                      {profile.stores.name}, {profile.stores.city}
                    </p>
                  </div>
                )}

                {profile?.regions && (
                  <div>
                    <Label>Регион</Label>
                    <p className="text-lg font-medium">{profile.regions.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {userRole === 'promoter' && (
            <TabsContent value="stats" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5" />
                      Всего продаж
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {salesStats?.count || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-5 w-5" />
                      Сумма продаж
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {salesStats?.total.toFixed(0) || 0} ₽
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-5 w-5" />
                      Бонусы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-500">
                      {salesStats?.bonuses.toFixed(0) || 0} ₽
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Последние продажи
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesStats?.recent.map((sale: any) => (
                      <div key={sale.created_at} className="flex justify-between items-center p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">{sale.quantity} шт</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(sale.created_at), 'dd.MM.yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{Number(sale.total_amount).toFixed(0)} ₸</p>
                          <p className="text-sm text-green-500">
                            +{(Number(sale.bonus_amount) + Number(sale.bonus_extra)).toFixed(0)} ₸
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
      <MobileNav />
    </div>
  );
}
