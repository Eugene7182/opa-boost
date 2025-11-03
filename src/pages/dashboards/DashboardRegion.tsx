import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertCircle } from 'lucide-react';
import { calcPeriodRange, compareWoW, compareMoM, formatKZT, formatPercent, PeriodPreset } from '@/lib/analytics-utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from '@/hooks/use-toast';

export default function DashboardRegion() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodPreset>('this_month');
  const [regionId, setRegionId] = useState<string>('');
  const [networks, setNetworks] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const [kpis, setKpis] = useState({ revenue: 0, quantity: 0, avgCheck: 0, bonuses: 0 });
  const [wowComparison, setWowComparison] = useState<any>(null);
  const [momComparison, setMomComparison] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [topModels, setTopModels] = useState<any[]>([]);
  const [storeStats, setStoreStats] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadUserRegion();
  }, [user]);

  useEffect(() => {
    if (regionId) {
      loadFiltersData();
      loadDashboardData();
    }
  }, [regionId, period, selectedNetworks, selectedStores, selectedProducts]);

  const loadUserRegion = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('region_id')
      .eq('id', user.id)
      .single();
    
    if (profile?.region_id) {
      setRegionId(profile.region_id);
    }
  };

  const loadFiltersData = async () => {
    if (!regionId) return;

    // Загрузка сетей
    const { data: networksData } = await supabase
      .from('networks')
      .select('*')
      .eq('active', true);
    setNetworks(networksData || []);

    // Загрузка магазинов региона
    const { data: storesData } = await supabase
      .from('stores')
      .select('*, offices!inner(region_id)')
      .eq('offices.region_id', regionId)
      .eq('active', true);
    setStores(storesData || []);

    // Загрузка продуктов
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('active', true);
    setProducts(productsData || []);
  };

  const loadDashboardData = async () => {
    if (!regionId) return;
    setLoading(true);

    try {
      const { from, to } = calcPeriodRange(period);

      // Построение запроса с фильтрами
      let query = supabase
        .from('sales')
        .select('*, stores!inner(*, offices!inner(region_id))')
        .eq('stores.offices.region_id', regionId)
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString());

      if (selectedStores.length > 0) {
        query = query.in('store_id', selectedStores);
      }
      if (selectedProducts.length > 0) {
        query = query.in('product_id', selectedProducts);
      }

      const { data: sales, error } = await query;

      if (error) throw error;

      // Расчет KPI
      const revenue = sales?.reduce((sum, s) => sum + Number(s.total_amount || 0), 0) || 0;
      const quantity = sales?.reduce((sum, s) => sum + Number(s.quantity || 0), 0) || 0;
      const bonuses = sales?.reduce((sum, s) => sum + Number(s.bonus_amount || 0) + Number(s.bonus_extra || 0), 0) || 0;
      const avgCheck = sales && sales.length > 0 ? revenue / sales.length : 0;

      setKpis({ revenue, quantity, avgCheck, bonuses });

      // WoW сравнение
      const lastWeekRange = calcPeriodRange('last_week');
      const { data: lastWeekSales } = await supabase
        .from('sales')
        .select('*, stores!inner(offices!inner(region_id))')
        .eq('stores.offices.region_id', regionId)
        .gte('created_at', lastWeekRange.from.toISOString())
        .lte('created_at', lastWeekRange.to.toISOString());

      const thisWeekRange = calcPeriodRange('this_week');
      const { data: thisWeekSales } = await supabase
        .from('sales')
        .select('*, stores!inner(offices!inner(region_id))')
        .eq('stores.offices.region_id', regionId)
        .gte('created_at', thisWeekRange.from.toISOString())
        .lte('created_at', thisWeekRange.to.toISOString());

      setWowComparison(compareWoW(thisWeekSales || [], lastWeekSales || []));

      // MoM сравнение
      const lastMonthRange = calcPeriodRange('last_month');
      const { data: lastMonthSales } = await supabase
        .from('sales')
        .select('*, stores!inner(offices!inner(region_id))')
        .eq('stores.offices.region_id', regionId)
        .gte('created_at', lastMonthRange.from.toISOString())
        .lte('created_at', lastMonthRange.to.toISOString());

      const thisMonthRange = calcPeriodRange('this_month');
      const { data: thisMonthSales } = await supabase
        .from('sales')
        .select('*, stores!inner(offices!inner(region_id))')
        .eq('stores.offices.region_id', regionId)
        .gte('created_at', thisMonthRange.from.toISOString())
        .lte('created_at', thisMonthRange.to.toISOString());

      setMomComparison(compareMoM(thisMonthSales || [], lastMonthSales || []));

      // Данные по дням
      const dailyMap = new Map<string, number>();
      sales?.forEach(s => {
        const date = new Date(s.created_at).toISOString().split('T')[0];
        dailyMap.set(date, (dailyMap.get(date) || 0) + Number(s.total_amount || 0));
      });
      const dailyArray = Array.from(dailyMap.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setDailyData(dailyArray);

      // Топ-модели
      const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
      for (const s of sales || []) {
        const { data: product } = await supabase
          .from('products')
          .select('name')
          .eq('id', s.product_id)
          .single();
        
        const name = product?.name || 'Unknown';
        const existing = productMap.get(s.product_id) || { name, quantity: 0, revenue: 0 };
        existing.quantity += Number(s.quantity || 0);
        existing.revenue += Number(s.total_amount || 0);
        productMap.set(s.product_id, existing);
      }
      const topArray = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopModels(topArray);

      // Статистика по магазинам
      const storeMap = new Map<string, { name: string; revenue: number; quantity: number; bonuses: number }>();
      for (const s of sales || []) {
        const existing = storeMap.get(s.store_id) || { 
          name: (s as any).stores?.name || 'Unknown', 
          revenue: 0, 
          quantity: 0, 
          bonuses: 0 
        };
        existing.revenue += Number(s.total_amount || 0);
        existing.quantity += Number(s.quantity || 0);
        existing.bonuses += Number(s.bonus_amount || 0) + Number(s.bonus_extra || 0);
        storeMap.set(s.store_id, existing);
      }
      setStoreStats(Array.from(storeMap.values()));

      // Проверка остатков
      const { data: inventories } = await supabase
        .from('inventories')
        .select('*, stores!inner(offices!inner(region_id)), products(name)')
        .eq('stores.offices.region_id', regionId)
        .lt('quantity', 5);
      
      setInventoryAlerts(inventories || []);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
    <div className="p-4 space-y-6 pb-20">
      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Фильтры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodPreset)}>
            <SelectTrigger>
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">Эта неделя</SelectItem>
              <SelectItem value="last_week">Прошлая неделя</SelectItem>
              <SelectItem value="this_month">Этот месяц</SelectItem>
              <SelectItem value="last_month">Прошлый месяц</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Выручка</p>
            <p className="text-2xl font-bold mt-1">{formatKZT(kpis.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Количество</p>
            <p className="text-2xl font-bold mt-1">{kpis.quantity} шт</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Средний чек</p>
            <p className="text-2xl font-bold mt-1">{formatKZT(kpis.avgCheck)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Бонусы</p>
            <p className="text-2xl font-bold mt-1">{formatKZT(kpis.bonuses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* WoW/MoM */}
      {wowComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Неделя к неделе (WoW)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Выручка</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatKZT(wowComparison.current.revenue)}</span>
                <span className={`text-sm flex items-center ${wowComparison.percentChange.revenue >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {wowComparison.percentChange.revenue >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {formatPercent(wowComparison.percentChange.revenue)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Количество</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{wowComparison.current.quantity} шт</span>
                <span className={`text-sm flex items-center ${wowComparison.percentChange.quantity >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {wowComparison.percentChange.quantity >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {formatPercent(wowComparison.percentChange.quantity)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {momComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Месяц к месяцу (MoM)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Выручка</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatKZT(momComparison.current.revenue)}</span>
                <span className={`text-sm flex items-center ${momComparison.percentChange.revenue >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {momComparison.percentChange.revenue >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {formatPercent(momComparison.percentChange.revenue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* График по дням */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Выручка по дням</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatKZT(value)} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Топ-модели */}
      {topModels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Топ-5 моделей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topModels.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm font-medium">{m.name}</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatKZT(m.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{m.quantity} шт</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Алерты по остаткам */}
      {inventoryAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              Низкие остатки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inventoryAlerts.map((inv, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-warning/10 rounded">
                  <div>
                    <p className="text-sm font-medium">{(inv as any).products?.name}</p>
                    <p className="text-xs text-muted-foreground">{(inv as any).stores?.name}</p>
                  </div>
                  <span className="text-sm font-semibold">{inv.quantity} шт</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
