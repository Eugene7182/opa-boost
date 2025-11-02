import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileNav } from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, TrendingUp, DollarSign, Target, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, userRole, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalBonus: 0,
    monthlySales: 0,
    activeMotivations: 0,
  });

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: sales } = await supabase
      .from('sales')
      .select('total_amount, bonus_amount, bonus_extra')
      .eq('promoter_id', user.id);

    const { data: monthlySales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('promoter_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    const { data: motivations } = await supabase
      .from('motivations')
      .select('id')
      .eq('active', true);

    const totalAmount = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
    const totalBonus = sales?.reduce((sum, s) => sum + Number(s.bonus_amount) + Number(s.bonus_extra), 0) || 0;
    const monthlyAmount = monthlySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

    setStats({
      totalSales: totalAmount,
      totalBonus: totalBonus,
      monthlySales: monthlyAmount,
      activeMotivations: motivations?.length || 0,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground p-6 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">OPA Dashboard</h1>
            <p className="text-sm opacity-90">{userRole || 'Пользователь'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-hover">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего продаж</p>
                <p className="text-2xl font-bold mt-1">{stats.totalSales.toFixed(0)} ₽</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Бонусы</p>
                <p className="text-2xl font-bold mt-1">{stats.totalBonus.toFixed(0)} ₽</p>
              </div>
              <div className="bg-success/10 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">За месяц</p>
                <p className="text-2xl font-bold mt-1">{stats.monthlySales.toFixed(0)} ₽</p>
              </div>
              <div className="bg-accent/10 p-2 rounded-lg">
                <Target className="w-5 h-5 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Мотивации</p>
                <p className="text-2xl font-bold mt-1">{stats.activeMotivations}</p>
              </div>
              <div className="bg-warning/10 p-2 rounded-lg">
                <Gift className="w-5 h-5 text-warning" />
              </div>
            </div>
          </Card>
        </div>

        {(userRole === 'admin' || userRole === 'office') && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold px-2">Управление</h2>
            <div className="grid gap-2">
              <Link to="/products">
                <Button variant="outline" className="w-full h-14 text-base justify-start">
                  Продукты
                </Button>
              </Link>
              <Link to="/bonus">
                <Button variant="outline" className="w-full h-14 text-base justify-start">
                  Схемы бонусов
                </Button>
              </Link>
              <Link to="/motivations">
                <Button variant="outline" className="w-full h-14 text-base justify-start">
                  Мотивации
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
