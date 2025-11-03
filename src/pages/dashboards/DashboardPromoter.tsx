import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, TrendingUp, Award, Target, AlertCircle } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { syncOfflineSales } from '@/lib/sync-utils';

interface PromoterStats {
  today: { sales: number; quantity: number; bonus: number };
  week: { sales: number; quantity: number; bonus: number };
  month: { sales: number; quantity: number; bonus: number };
  activeMotivations: number;
  plan: { target_qty: number; target_amount: number; period_end: string } | null;
  projection: { projected_qty: number; projected_amount: number; achievement: number };
  needsStockUpdate: boolean;
}

export default function DashboardPromoter() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [stats, setStats] = useState<PromoterStats>({
    today: { sales: 0, quantity: 0, bonus: 0 },
    week: { sales: 0, quantity: 0, bonus: 0 },
    month: { sales: 0, quantity: 0, bonus: 0 },
    activeMotivations: 0,
    plan: null,
    projection: { projected_qty: 0, projected_amount: 0, achievement: 0 },
    needsStockUpdate: false,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const calcTotals = (sales: any[] | null) => {
    if (!sales) return { sales: 0, quantity: 0, bonus: 0 };
    return {
      sales: sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
      quantity: sales.reduce((sum, s) => sum + Number(s.quantity || 0), 0),
      bonus: sales.reduce((sum, s) => sum + Number(s.bonus_amount || 0) + Number(s.bonus_extra || 0), 0),
    };
  };

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayData = await supabase
        .from('sales')
        .select('total_amount, quantity, bonus_amount, bonus_extra')
        .eq('promoter_id', user.id)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', now.toISOString());

      const weekData = await supabase
        .from('sales')
        .select('total_amount, quantity, bonus_amount, bonus_extra')
        .eq('promoter_id', user.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', now.toISOString());

      const monthData = await supabase
        .from('sales')
        .select('total_amount, quantity, bonus_amount, bonus_extra')
        .eq('promoter_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', now.toISOString());

      const { count: motivCount } = await supabase
        .from('motivations')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
        .lte('start_date', now.toISOString())
        .or(`end_date.is.null,end_date.gte.${now.toISOString()}`);

      const { data: planData } = await supabase
        .from('sales_plans')
        .select('target_qty, target_amount, period_end')
        .eq('promoter_id', user.id)
        .gte('period_end', now.toISOString())
        .order('period_end', { ascending: true })
        .limit(1)
        .single();

      const monthTotals = calcTotals(monthData.data);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysPassed = now.getDate();
      const daysRemaining = daysInMonth - daysPassed;
      
      const avgDailySales = daysPassed > 0 ? monthTotals.sales / daysPassed : 0;
      const avgDailyQty = daysPassed > 0 ? monthTotals.quantity / daysPassed : 0;
      
      const projectedAmount = monthTotals.sales + (avgDailySales * daysRemaining);
      const projectedQty = monthTotals.quantity + (avgDailyQty * daysRemaining);
      const achievement = planData?.target_amount ? (projectedAmount / planData.target_amount) * 100 : 0;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single();

      const { data: reminderData } = await supabase
        .from('stock_reminders')
        .select('status')
        .eq('store_id', profileData?.store_id || '')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setStats({
        today: calcTotals(todayData.data),
        week: calcTotals(weekData.data),
        month: monthTotals,
        activeMotivations: motivCount || 0,
        plan: planData,
        projection: { projected_qty: projectedQty, projected_amount: projectedAmount, achievement },
        needsStockUpdate: !!reminderData,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({ title: t('error.title'), description: t('dashboard.loadError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncOfflineSales();
      await loadStats();
      toast({ title: t('dashboard.syncComplete'), description: t('dashboard.dataUpdated') });
    } catch (error) {
      toast({ title: t('dashboard.syncError'), description: t('dashboard.syncFailed'), variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {stats.needsStockUpdate && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <div>
                <p className="font-semibold text-warning-foreground">{t('dashboard.stockUpdateNeeded')}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.pleaseUpdateStock')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="col-span-2 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('dashboard.today')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-3xl font-bold text-primary">{formatCurrency(stats.today.bonus)}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.bonus')}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('dashboard.quantity')}: <strong>{formatNumber(stats.today.quantity)}</strong></span>
                <span>{t('dashboard.sales')}: <strong>{formatCurrency(stats.today.sales)}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('dashboard.week')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.week.bonus)}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatNumber(stats.week.quantity)} {t('dashboard.units')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('dashboard.month')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.month.bonus)}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatNumber(stats.month.quantity)} {t('dashboard.units')}</p>
          </CardContent>
        </Card>
      </div>

      {stats.plan && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              {t('dashboard.plan')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">{t('dashboard.target')}</span>
              <span className="font-semibold">{formatNumber(stats.plan.target_qty)} {t('dashboard.units')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">{t('dashboard.current')}</span>
              <span className="font-semibold">{formatNumber(stats.month.quantity)} {t('dashboard.units')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">{t('dashboard.projection')}</span>
              <div className="text-right">
                <p className="font-semibold">{formatNumber(stats.projection.projected_qty)} {t('dashboard.units')}</p>
                <Badge variant={stats.projection.achievement >= 100 ? 'default' : stats.projection.achievement >= 80 ? 'secondary' : 'destructive'}>
                  {formatPercent(stats.projection.achievement / 100, 0)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4" />
            {t('dashboard.activeMotivations')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.activeMotivations}</p>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSync} 
        disabled={syncing}
        className="w-full"
        variant="outline"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? t('dashboard.syncing') : t('dashboard.sync')}
      </Button>
    </div>
  );
}
