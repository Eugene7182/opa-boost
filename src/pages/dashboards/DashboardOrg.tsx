import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { calcPeriodRange, compareWoW, compareMoM, formatKZT, formatPercent, PeriodPreset } from '@/lib/analytics-utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from '@/hooks/use-toast';

export default function DashboardOrg() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodPreset>('this_month');
  const [regions, setRegions] = useState<any[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  
  const [kpis, setKpis] = useState({ revenue: 0, quantity: 0, avgCheck: 0, bonuses: 0 });
  const [wowComparison, setWowComparison] = useState<any>(null);
  const [momComparison, setMomComparison] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [networkData, setNetworkData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadFiltersData();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [period, selectedRegion, selectedNetwork]);

  const loadFiltersData = async () => {
    const { data: regionsData } = await supabase
      .from('regions')
      .select('*')
      .eq('active', true);
    setRegions(regionsData || []);

    const { data: networksData } = await supabase
      .from('networks')
      .select('*')
      .eq('active', true);
    setNetworks(networksData || []);
  };

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const { from, to } = calcPeriodRange(period);

      let query = supabase
        .from('sales')
        .select('*, stores!inner(*, offices!inner(region_id, regions(name), network_id, networks:network_id(name)))')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString());

      if (selectedRegion !== 'all') {
        query = query.eq('stores.offices.region_id', selectedRegion);
      }

      const { data: sales, error } = await query;

      if (error) throw error;

      // Расчет KPI
      const revenue = sales?.reduce((sum, s) => sum + Number(s.total_amount || 0), 0) || 0;
      const quantity = sales?.reduce((sum, s) => sum + Number(s.quantity || 0), 0) || 0;
      const bonuses = sales?.reduce((sum, s) => sum + Number(s.bonus_amount || 0) + Number(s.bonus_extra || 0), 0) || 0;
      const avgCheck = sales && sales.length > 0 ? revenue / sales.length : 0;

      setKpis({ revenue, quantity, avgCheck, bonuses });

      // WoW
      const lastWeekRange = calcPeriodRange('last_week');
      const { data: lastWeekSales } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', lastWeekRange.from.toISOString())
        .lte('created_at', lastWeekRange.to.toISOString());

      const thisWeekRange = calcPeriodRange('this_week');
      const { data: thisWeekSales } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', thisWeekRange.from.toISOString())
        .lte('created_at', thisWeekRange.to.toISOString());

      setWowComparison(compareWoW(thisWeekSales || [], lastWeekSales || []));

      // MoM
      const lastMonthRange = calcPeriodRange('last_month');
      const { data: lastMonthSales } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', lastMonthRange.from.toISOString())
        .lte('created_at', lastMonthRange.to.toISOString());

      const thisMonthRange = calcPeriodRange('this_month');
      const { data: thisMonthSales } = await supabase
        .from('sales')
        .select('*')
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

      // По регионам
      const regionMap = new Map<string, { name: string; revenue: number }>();
      sales?.forEach(s => {
        const regionName = (s as any).stores?.offices?.regions?.name || 'Unknown';
        const regionId = (s as any).stores?.offices?.region_id;
        const existing = regionMap.get(regionId) || { name: regionName, revenue: 0 };
        existing.revenue += Number(s.total_amount || 0);
        regionMap.set(regionId, existing);
      });
      setRegionData(Array.from(regionMap.values()).sort((a, b) => b.revenue - a.revenue));

      // По сетям
      const networkMap = new Map<string, { name: string; revenue: number }>();
      sales?.forEach(s => {
        const networkName = (s as any).stores?.offices?.networks?.name || 'Unknown';
        const networkId = (s as any).stores?.offices?.network_id;
        const existing = networkMap.get(networkId) || { name: networkName, revenue: 0 };
        existing.revenue += Number(s.total_amount || 0);
        networkMap.set(networkId, existing);
      });
      setNetworkData(Array.from(networkMap.values()).sort((a, b) => b.revenue - a.revenue));

      // Алерты (падения WoW/MoM > 10%)
      const alertList: any[] = [];
      if (wowComparison && wowComparison.percentChange.revenue < -10) {
        alertList.push({
          type: 'wow_drop',
          message: `Падение выручки WoW на ${formatPercent(wowComparison.percentChange.revenue)}`,
        });
      }
      if (momComparison && momComparison.percentChange.revenue < -10) {
        alertList.push({
          type: 'mom_drop',
          message: `Падение выручки MoM на ${formatPercent(momComparison.percentChange.revenue)}`,
        });
      }

      // Низкие остатки
      const { data: inventories } = await supabase
        .from('inventories')
        .select('*, products(name), stores(name)')
        .lt('quantity', 5);
      
      inventories?.forEach(inv => {
        alertList.push({
          type: 'low_inventory',
          message: `Низкий остаток: ${(inv as any).products?.name} в ${(inv as any).stores?.name} (${inv.quantity} шт)`,
        });
      });

      setAlerts(alertList);

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

          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger>
              <SelectValue placeholder="Регион" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все регионы</SelectItem>
              {regions.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
            <SelectTrigger>
              <SelectValue placeholder="Сеть" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все сети</SelectItem>
              {networks.map(n => (
                <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
              ))}
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

      {/* По регионам */}
      {regionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">По регионам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatKZT(value)} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* По сетям */}
      {networkData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">По сетям</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={networkData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatKZT(value)} />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Сигналы */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              Сигналы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 10).map((alert, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-warning/10 rounded">
                  <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
