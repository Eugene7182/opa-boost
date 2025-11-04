import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { UserCog } from 'lucide-react';

export const RoleSwitcher = () => {
  const { user, userRole, refreshUser } = useAuth();
  const { toast } = useToast();
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  useEffect(() => {
    const loadRoles = async () => {
      if (user?.email === 'SENZOVE@mail.ru') {
        setAvailableRoles(['admin', 'office', 'supervisor', 'trainer', 'promoter']);
      } else {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user?.id);
        
        if (data) {
          setAvailableRoles(data.map(r => r.role));
        }
      }
    };

    if (user) {
      loadRoles();
    }
  }, [user]);

  const handleRoleChange = async (newRole: 'admin' | 'office' | 'supervisor' | 'trainer' | 'promoter') => {
    if (!user) return;

    try {
      // Для тестового email разрешаем любую роль
      if (user.email === 'SENZOVE@mail.ru') {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: newRole
          });

        toast({ title: `Роль изменена на ${newRole}` });
        refreshUser();
      } else {
        toast({ 
          title: 'Ошибка', 
          description: 'Недостаточно прав для смены роли',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({ 
        title: 'Ошибка', 
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (!user || !userRole || user.email !== 'SENZOVE@mail.ru') return null;

  return (
    <Card className="mx-4 mt-4 p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-primary/10 p-2 rounded-md">
          <UserCog className="w-5 h-5 text-primary" />
          <span className="font-medium">Тестовый режим</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Текущая роль:</span>
          <Select value={userRole} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Выберите роль" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role === 'admin' && '👑 Администратор'}
                  {role === 'office' && '🏢 Офис менеджер'}
                  {role === 'supervisor' && '👥 Супервайзер'}
                  {role === 'trainer' && '📚 Тренер'}
                  {role === 'promoter' && '💼 Промоутер'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};