import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, differenceInDays } from 'date-fns';

export type PeriodPreset = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface SalesFilters {
  from?: Date;
  to?: Date;
  networkIds?: string[];
  regionIds?: string[];
  storeIds?: string[];
  productIds?: string[];
}

export interface SalesAggregates {
  revenue: number;
  quantity: number;
  avgCheck: number;
  bonuses: number;
}

export interface ComparisonResult {
  current: SalesAggregates;
  previous: SalesAggregates;
  delta: {
    revenue: number;
    quantity: number;
    avgCheck: number;
  };
  percentChange: {
    revenue: number;
    quantity: number;
    avgCheck: number;
  };
}

export function calcPeriodRange(preset: PeriodPreset, customFrom?: Date, customTo?: Date): DateRange {
  const now = new Date();
  
  switch (preset) {
    case 'this_week':
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 })
      };
    case 'last_week': {
      const lastWeek = subWeeks(now, 1);
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 })
      };
    }
    case 'this_month':
      return {
        from: startOfMonth(now),
        to: endOfMonth(now)
      };
    case 'last_month': {
      const lastMonth = subMonths(now, 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth)
      };
    }
    case 'custom':
      return {
        from: customFrom || startOfMonth(now),
        to: customTo || endOfMonth(now)
      };
    default:
      return {
        from: startOfMonth(now),
        to: endOfMonth(now)
      };
  }
}

export function calculateAggregates(sales: any[]): SalesAggregates {
  if (!sales || sales.length === 0) {
    return { revenue: 0, quantity: 0, avgCheck: 0, bonuses: 0 };
  }

  const revenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const quantity = sales.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
  const bonuses = sales.reduce((sum, s) => sum + Number(s.bonus_amount || 0) + Number(s.bonus_extra || 0), 0);
  const avgCheck = sales.length > 0 ? revenue / sales.length : 0;

  return { revenue, quantity, avgCheck, bonuses };
}

export function compareWoW(currentWeekSales: any[], lastWeekSales: any[]): ComparisonResult {
  const current = calculateAggregates(currentWeekSales);
  const previous = calculateAggregates(lastWeekSales);

  return {
    current,
    previous,
    delta: {
      revenue: current.revenue - previous.revenue,
      quantity: current.quantity - previous.quantity,
      avgCheck: current.avgCheck - previous.avgCheck,
    },
    percentChange: {
      revenue: previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0,
      quantity: previous.quantity > 0 ? ((current.quantity - previous.quantity) / previous.quantity) * 100 : 0,
      avgCheck: previous.avgCheck > 0 ? ((current.avgCheck - previous.avgCheck) / previous.avgCheck) * 100 : 0,
    }
  };
}

export function compareMoM(currentMonthSales: any[], lastMonthSales: any[]): ComparisonResult {
  const current = calculateAggregates(currentMonthSales);
  const previous = calculateAggregates(lastMonthSales);

  return {
    current,
    previous,
    delta: {
      revenue: current.revenue - previous.revenue,
      quantity: current.quantity - previous.quantity,
      avgCheck: current.avgCheck - previous.avgCheck,
    },
    percentChange: {
      revenue: previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0,
      quantity: previous.quantity > 0 ? ((current.quantity - previous.quantity) / previous.quantity) * 100 : 0,
      avgCheck: previous.avgCheck > 0 ? ((current.avgCheck - previous.avgCheck) / previous.avgCheck) * 100 : 0,
    }
  };
}

export function projectEOM(currentSales: any[], periodStart: Date, periodEnd: Date): number {
  if (!currentSales || currentSales.length === 0) return 0;
  
  const now = new Date();
  const daysElapsed = differenceInDays(now, periodStart) + 1;
  const totalDays = differenceInDays(periodEnd, periodStart) + 1;
  
  if (daysElapsed === 0) return 0;
  
  const currentRevenue = calculateAggregates(currentSales).revenue;
  const avgDailyRevenue = currentRevenue / daysElapsed;
  
  return avgDailyRevenue * totalDays;
}

export function formatKZT(amount: number): string {
  return new Intl.NumberFormat('ru-KZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ₸';
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
