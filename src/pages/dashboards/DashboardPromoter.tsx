import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Target, Gift, RefreshCw } from 'lucide-react';
import { formatKZT } from '@/lib/analytics-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface PromoterStats {
  today: { sales: number; quantity: number; bonuses: number };
  week: { sales: number; quantity: number; bonuses: number };
  month: { sales: number; quantity: number; bonuses: number };
  activeMotivations: number;
}

export default function DashboardPromoter() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<PromoterStats>({
    today: { sales: 0, quantity: 0, bonuses: 0 },
    week: { sales: 0, quantity: 0, bonuses: 0 },
    month: { sales: 0, quantity: 0, bonuses: 0 },
    activeMotivations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Загрузка продаж за сегодня
      const { data: todaySales } = await supabase
        .from('sales')
        .select('total_amount, quantity, bonus_amount, bonus_extra')
        .eq('promoter_id', user.id)
        .gte('created_at', startOfToday.toISOString());

      // Загрузка продаж за неделю
      const { data: weekSales } = await supabase
        .from('sales')
        .select('total_amount, quantity, bonus_amount, bonus_extra')
        .eq('promoter_id', user.id)
        .gte('created_at', startOfWeek.toISOString());

      // Загрузка продаж за месяц
      const { data: monthSales } = await supabase
        .from('sales')
        .select('total_amount, quantity, bonus_amount, bonus_extra')
        .eq('promoter_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      // Активные мотивации
      const { data: motivations } = await supabase
        .from('motivations')
        .select('id')
        .eq('active', true);

      const calcTotals = (sales: any[] | null) => {
        if (!sales) return { sales: 0, quantity: 0, bonuses: 0 };
        return {
          sales: sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
          quantity: sales.reduce((sum, s) => sum + Number(s.quantity || 0), 0),
          bonuses: sales.reduce((sum, s) => sum + Number(s.bonus_amount || 0) + Number(s.bonus_extra || 0), 0),
        };
      };

      setStats({
        today: calcTotals(todaySales),
        week: calcTotals(weekSales),
        month: calcTotals(monthSales),
        activeMotivations: motivations?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: t('error.title'),
        description: t('dashboard.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Здесь логика синхронизации офлайн-данных из IndexedDB
      // Предполагается, что у вас уже есть OfflineSync компонент
      await loadStats();
      toast({
        title: t('dashboard.syncComplete'),
        description: t('dashboard.dataUpdated'),
      });
    } catch (error) {
      toast({
        title: t('dashboard.syncError'),
        description: t('dashboard.syncFailed'),
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t('dashboard.mySales')}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {t('dashboard.sync')}
        </Button>
      </div>

      {/* Сегодня */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{t('dashboard.today')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.revenue')}</p>
                  <p className="text-xl font-bold mt-1">{formatKZT(stats.today.sales)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.today.quantity} {t('dashboard.pcs')}</p>
                </div>
                <div className="bg-primary/10 p-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.bonuses')}</p>
                  <p className="text-xl font-bold mt-1">{formatKZT(stats.today.bonuses)}</p>
                </div>
                <div className="bg-success/10 p-2 rounded-lg">
                  <DollarSign className="w-4 h-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* За неделю */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{t('dashboard.week')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.revenue')}</p>
                  <p className="text-xl font-bold mt-1">{formatKZT(stats.week.sales)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.week.quantity} {t('dashboard.pcs')}</p>
                </div>
                <div className="bg-accent/10 p-2 rounded-lg">
                  <Target className="w-4 h-4 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.bonuses')}</p>
                  <p className="text-xl font-bold mt-1">{formatKZT(stats.week.bonuses)}</p>
                </div>
                <div className="bg-success/10 p-2 rounded-lg">
                  <DollarSign className="w-4 h-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* За месяц */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{t('dashboard.month')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.revenue')}</p>
                  <p className="text-xl font-bold mt-1">{formatKZT(stats.month.sales)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.month.quantity} {t('dashboard.pcs')}</p>
                </div>
                <div className="bg-primary/10 p-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.bonuses')}</p>
                  <p className="text-xl font-bold mt-1">{formatKZT(stats.month.bonuses)}</p>
                </div>
                <div className="bg-success/10 p-2 rounded-lg">
                  <DollarSign className="w-4 h-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Активные мотивации */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.activeMotivations')}</p>
              <p className="text-2xl font-bold mt-1">{stats.activeMotivations}</p>
            </div>
            <div className="bg-warning/10 p-2 rounded-lg">
              <Gift className="w-5 h-5 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
