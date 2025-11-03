import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Users, TrendingUp, Package } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface OfficeStats {
  totalSales: number;
  totalBonus: number;
  totalPromoters: number;
  totalProducts: number;
  regionStats: Array<{ region: string; sales: number; promoters: number }>;
  productStats: Array<{ product: string; quantity: number; sales: number }>;
}

export default function DashboardOffice() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [stats, setStats] = useState<OfficeStats>({
    totalSales: 0,
    totalBonus: 0,
    totalPromoters: 0,
    totalProducts: 0,
    regionStats: [],
    productStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    if (user) loadStats();
  }, [user, period]);

  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    
    switch (period) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay() + 1);
        break;
      case 'month':
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    
    return { start, end: now };
  };

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { start, end } = getDateRange();

      // Get all sales for period
      const { data: sales } = await supabase
        .from('sales')
        .select(`
          total_amount,
          bonus_amount,
          bonus_extra,
          quantity,
          promoter_id,
          product_id,
          products(name),
          profiles!sales_promoter_id_fkey(region_id)
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Get regions
      const { data: regions } = await supabase
        .from('regions')
        .select('id, name');

      // Get promoters count
      const { data: promoterRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'promoter');

      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .eq('active', true);

      const totalSales = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalBonus = sales?.reduce((sum, s) => 
        sum + Number(s.bonus_amount) + Number(s.bonus_extra), 0) || 0;

      // Region stats
      const regionMap = new Map<string, { region: string; sales: number; promoters: Set<string> }>();
      sales?.forEach(sale => {
        const regionId = (sale.profiles as any)?.region_id;
        if (regionId) {
          const region = regions?.find(r => r.id === regionId);
          if (region) {
            const existing = regionMap.get(regionId) || 
              { region: region.name, sales: 0, promoters: new Set<string>() };
            existing.sales += Number(sale.total_amount);
            existing.promoters.add(sale.promoter_id);
            regionMap.set(regionId, existing);
          }
        }
      });

      const regionStats = Array.from(regionMap.values()).map(r => ({
        region: r.region,
        sales: r.sales,
        promoters: r.promoters.size,
      })).sort((a, b) => b.sales - a.sales);

      // Product stats
      const productMap = new Map<string, { product: string; quantity: number; sales: number }>();
      sales?.forEach(sale => {
        const productName = (sale.products as any)?.name;
        if (productName) {
          const existing = productMap.get(sale.product_id) || 
            { product: productName, quantity: 0, sales: 0 };
          existing.quantity += sale.quantity;
          existing.sales += Number(sale.total_amount);
          productMap.set(sale.product_id, existing);
        }
      });

      const productStats = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setStats({
        totalSales,
        totalBonus,
        totalPromoters: promoterRoles?.length || 0,
        totalProducts: products?.length || 0,
        regionStats,
        productStats,
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
      <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">{t('dashboard.today')}</SelectItem>
          <SelectItem value="week">{t('dashboard.week')}</SelectItem>
          <SelectItem value="month">{t('dashboard.month')}</SelectItem>
        </SelectContent>
      </Select>

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
              <Package className="w-4 h-4" />
              {t('dashboard.products')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(stats.totalProducts)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              {t('dashboard.regions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(stats.regionStats.length)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.regionPerformance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.regionStats.map((region, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{region.region}</p>
                  <p className="text-sm text-muted-foreground">
                    {region.promoters} {t('dashboard.promoters')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(region.sales)}</p>
                </div>
              </div>
            ))}
            {stats.regionStats.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('dashboard.noData')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.topProducts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.productStats.map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{product.product}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(product.quantity)} {t('dashboard.units')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(product.sales)}</p>
                </div>
              </div>
            ))}
            {stats.productStats.length === 0 && (
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
