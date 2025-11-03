import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileNav } from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, DollarSign, PieChart, Package, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Analytics() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayBonus: 0,
    weekSales: 0,
    weekBonus: 0,
    monthSales: 0,
    monthBonus: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthStart = new Date(today);
    monthStart.setDate(1);

    const query = userRole === 'promoter'
      ? supabase.from('sales').select('*').eq('promoter_id', user.id)
      : supabase.from('sales').select('*');

    const { data: todayData } = await query.gte('created_at', today.toISOString());
    const { data: weekData } = await query.gte('created_at', weekAgo.toISOString());
    const { data: monthData } = await query.gte('created_at', monthStart.toISOString());

    const calcStats = (data: any[]) => ({
      sales: data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
      bonus: data?.reduce((sum, s) => sum + Number(s.bonus_amount) + Number(s.bonus_extra), 0) || 0,
    });

    const todayStats = calcStats(todayData || []);
    const weekStats = calcStats(weekData || []);
    const monthStats = calcStats(monthData || []);

    setStats({
      todaySales: todayStats.sales,
      todayBonus: todayStats.bonus,
      weekSales: weekStats.sales,
      weekBonus: weekStats.bonus,
      monthSales: monthStats.sales,
      monthBonus: monthStats.bonus,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Аналитика</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Quick Links to Advanced Analytics */}
        <section className="grid grid-cols-2 gap-3">
          <Card className="p-4 cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => navigate('/market-shares')}>
            <div className="flex items-center justify-between">
              <div>
                <PieChart className="w-5 h-5 text-primary mb-2" />
                <p className="font-semibold">Доли рынка</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-4 cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => navigate('/inventories')}>
            <div className="flex items-center justify-between">
              <div>
                <Package className="w-5 h-5 text-primary mb-2" />
                <p className="font-semibold">Остатки</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold px-2">Сегодня</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Продажи</span>
              </div>
              <p className="text-2xl font-bold">{stats.todaySales.toFixed(0)} ₽</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Бонусы</span>
              </div>
              <p className="text-2xl font-bold">{stats.todayBonus.toFixed(0)} ₽</p>
            </Card>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold px-2">За неделю</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Продажи</span>
              </div>
              <p className="text-2xl font-bold">{stats.weekSales.toFixed(0)} ₽</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Бонусы</span>
              </div>
              <p className="text-2xl font-bold">{stats.weekBonus.toFixed(0)} ₽</p>
            </Card>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold px-2">За месяц</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Продажи</span>
              </div>
              <p className="text-2xl font-bold">{stats.monthSales.toFixed(0)} ₽</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Бонусы</span>
              </div>
              <p className="text-2xl font-bold">{stats.monthBonus.toFixed(0)} ₽</p>
            </Card>
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
}
