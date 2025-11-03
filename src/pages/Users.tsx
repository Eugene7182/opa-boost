import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Edit, Shield, MapPin, Mail, Phone } from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { z } from 'zod';

const roleColors = {
  admin: 'bg-red-500',
  office: 'bg-blue-500',
  supervisor: 'bg-purple-500',
  trainer: 'bg-green-500',
  promoter: 'bg-yellow-500',
};

const userSchema = z.object({
  email: z.string().email({ message: 'Неверный email' }),
  password: z.string().min(6, { message: 'Минимум 6 символов' }),
  full_name: z.string().min(1, { message: 'Имя обязательно' }),
});

export default function Users() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    city: '',
    role: 'promoter',
    store_id: '',
    region_id: '',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Fetch users with profiles and roles
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(role),
          stores(name, city),
          regions(name)
        `);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch stores for assignment
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data } = await supabase
        .from('stores')
        .select('id, name, city')
        .eq('active', true)
        .order('name');
      return data || [];
    },
  });

  // Fetch regions for assignment
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('regions')
        .select('id, name')
        .eq('active', true)
        .order('name');
      return data || [];
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: any }) => {
      // Delete existing role
      await supabase.from('user_roles').delete().eq('user_id', userId);
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: role as any }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Роль обновлена');
    },
    onError: () => toast.error('Ошибка обновления роли'),
  });

  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          city: data.city,
          store_id: data.store_id || null,
          region_id: data.region_id || null,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Профиль обновлен');
      setEditingUser(null);
    },
    onError: () => toast.error('Ошибка обновления профиля'),
  });

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: '',
      password: '',
      full_name: user.full_name || '',
      phone: user.phone || '',
      city: user.city || '',
      role: user.user_roles?.[0]?.role || 'promoter',
      store_id: user.store_id || '',
      region_id: user.region_id || '',
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    // Validate non-auth fields
    if (!formData.full_name.trim()) {
      toast.error('Имя обязательно');
      return;
    }

    // Update profile
    await updateProfileMutation.mutateAsync({
      id: editingUser.id,
      ...formData,
    });

    // Update role if changed
    const currentRole = editingUser.user_roles?.[0]?.role;
    if (formData.role !== currentRole) {
      await updateRoleMutation.mutateAsync({
        userId: editingUser.id,
        role: formData.role,
      });
    }
  };

  const getUserRole = (user: any) => {
    return user.user_roles?.[0]?.role || 'promoter';
  };

  const handleCreateUser = async () => {
    setCreatingUser(true);
    
    try {
      // Validate
      const validation = userSchema.safeParse({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });

      if (!validation.success) {
        const errorMessage = validation.error.errors.map(e => e.message).join(', ');
        toast.error(errorMessage);
        setCreatingUser(false);
        return;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Не удалось создать пользователя');

      // Update profile with additional data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone || null,
          city: formData.city || null,
          store_id: formData.store_id || null,
          region_id: formData.region_id || null,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: authData.user.id, role: formData.role as any }]);

      if (roleError) throw roleError;

      toast.success('Пользователь создан');
      setIsAddOpen(false);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        city: '',
        role: 'promoter',
        store_id: '',
        region_id: '',
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания пользователя');
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Управление пользователями</h1>
            <p className="text-muted-foreground">Пользователи, роли и назначения</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Пригласить
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Пригласить пользователя</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Пароль *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <Label>Полное имя *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Телефон</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Город</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Роль *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Администратор</SelectItem>
                      <SelectItem value="office">Офис</SelectItem>
                      <SelectItem value="supervisor">Супервайзер</SelectItem>
                      <SelectItem value="trainer">Тренер</SelectItem>
                      <SelectItem value="promoter">Промоутер</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Магазин</Label>
                  <Select value={formData.store_id} onValueChange={(value) => setFormData({ ...formData, store_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите магазин" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Не назначен</SelectItem>
                      {stores.map((store: any) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name} ({store.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Регион</Label>
                  <Select value={formData.region_id} onValueChange={(value) => setFormData({ ...formData, region_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите регион" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Не назначен</SelectItem>
                      {regions.map((region: any) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateUser} disabled={creatingUser} className="w-full">
                  {creatingUser ? 'Создание...' : 'Создать пользователя'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {users.map((user: any) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      {user.full_name}
                      <Badge className={roleColors[getUserRole(user) as keyof typeof roleColors]}>
                        {getUserRole(user)}
                      </Badge>
                    </CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.id}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {user.phone}
                        </div>
                      )}
                      {user.stores && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {user.stores.name}, {user.stores.city}
                        </div>
                      )}
                      {user.regions && (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Регион: {user.regions.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Редактировать пользователя</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>Имя</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Телефон</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Город</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label>Роль</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Администратор</SelectItem>
                    <SelectItem value="office">Офис</SelectItem>
                    <SelectItem value="supervisor">Супервайзер</SelectItem>
                    <SelectItem value="trainer">Тренер</SelectItem>
                    <SelectItem value="promoter">Промоутер</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Магазин</Label>
                <Select value={formData.store_id} onValueChange={(value) => setFormData({ ...formData, store_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите магазин" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Не назначен</SelectItem>
                    {stores.map((store: any) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name} ({store.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Регион</Label>
                <Select value={formData.region_id} onValueChange={(value) => setFormData({ ...formData, region_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите регион" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Не назначен</SelectItem>
                    {regions.map((region: any) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveUser} className="w-full">
                Сохранить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <MobileNav />
    </div>
  );
}
