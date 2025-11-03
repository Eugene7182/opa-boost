import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Users, Store, Target } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface SupervisorStats {
  totalSales: number;
  totalBonus: number;
  totalPromoters: number;
  totalStores: number;
  topPromoters: Array<{ name: string; sales: number; bonus: number }>;
  storePerformance: Array<{ store: string; sales: number; promoters: number }>;
}

export default function DashboardSupervisor() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [stats, setStats] = useState<SupervisorStats>({
    totalSales: 0,
    totalBonus: 0,
    totalPromoters: 0,
    totalStores: 0,
    topPromoters: [],
    storePerformance: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get supervisor's region
      const { data: profile } = await supabase
        .from('profiles')
        .select('region_id')
        .eq('id', user.id)
        .single();

      if (!profile?.region_id) return;

      // Get stores in region
      const { data: stores } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          offices!inner(region_id)
        `)
        .eq('offices.region_id', profile.region_id);

      const storeIds = stores?.map(s => s.id) || [];

      // Get promoters in region
      const { data: promoters } = await supabase
        .from('profiles')
        .select('id, full_name, store_id')
        .eq('region_id', profile.region_id)
        .in('id', 
          (await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'promoter')
          ).data?.map(r => r.user_id) || []
        );

      // Get sales data
      const { data: sales } = await supabase
        .from('sales')
        .select('promoter_id, total_amount, bonus_amount, bonus_extra, store_id')
        .in('store_id', storeIds)
        .gte('created_at', monthStart.toISOString());

      const totalSales = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalBonus = sales?.reduce((sum, s) => 
        sum + Number(s.bonus_amount) + Number(s.bonus_extra), 0) || 0;

      // Top promoters
      const promoterSales = new Map<string, { name: string; sales: number; bonus: number }>();
      sales?.forEach(sale => {
        const promoter = promoters?.find(p => p.id === sale.promoter_id);
        if (promoter) {
          const existing = promoterSales.get(sale.promoter_id) || 
            { name: promoter.full_name, sales: 0, bonus: 0 };
          existing.sales += Number(sale.total_amount);
          existing.bonus += Number(sale.bonus_amount) + Number(sale.bonus_extra);
          promoterSales.set(sale.promoter_id, existing);
        }
      });

      const topPromoters = Array.from(promoterSales.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      // Store performance
      const storeSales = new Map<string, { store: string; sales: number; promoters: number }>();
      stores?.forEach(store => {
        const storeTotal = sales
          ?.filter(s => s.store_id === store.id)
          .reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
        const storePromoters = promoters?.filter(p => p.store_id === store.id).length || 0;
        storeSales.set(store.id, {
          store: store.name,
          sales: storeTotal,
          promoters: storePromoters,
        });
      });

      const storePerformance = Array.from(storeSales.values())
        .sort((a, b) => b.sales - a.sales);

      setStats({
        totalSales,
        totalBonus,
        totalPromoters: promoters?.length || 0,
        totalStores: stores?.length || 0,
        topPromoters,
        storePerformance,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({ 
        title: t('error.title'), 
        description: t('dashboard.loadError'), 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('dashboard.totalSales')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.bonus')}: {formatCurrency(stats.totalBonus)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('dashboard.promoters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(stats.totalPromoters)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Store className="w-4 h-4" />
              {t('dashboard.stores')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(stats.totalStores)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4" />
              {t('dashboard.avgPerStore')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(stats.totalStores > 0 ? stats.totalSales / stats.totalStores : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.topPromoters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topPromoters.map((promoter, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{promoter.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(promoter.sales)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(promoter.bonus)}
                  </p>
                </div>
              </div>
            ))}
            {stats.topPromoters.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('dashboard.noData')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.storePerformance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.storePerformance.map((store, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{store.store}</p>
                  <p className="text-sm text-muted-foreground">
                    {store.promoters} {t('dashboard.promoters')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(store.sales)}</p>
                </div>
              </div>
            ))}
            {stats.storePerformance.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('dashboard.noData')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
