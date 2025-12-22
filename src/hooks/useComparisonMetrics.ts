import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, startOfWeek, subWeeks, startOfMonth, subMonths } from 'date-fns';
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonate } from "@/contexts/ImpersonateContext";

interface ComparisonData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

const fetchOrdersForPeriod = async (
  startDate: Date, 
  endDate: Date,
  userId?: string,
  isImpersonating?: boolean
) => {
  const { data } = await supabase.functions.invoke('shopify-data', {
    body: {
      endpoint: 'revenue-today',
      customDates: {
        from: startDate.toISOString(),
        to: endDate.toISOString()
      },
      userId,
      isImpersonating
    }
  });

  const orders = data?.data?.orders?.edges || [];
  const totalRevenue = orders.reduce((acc: number, edge: any) => {
    const amount = parseFloat(edge.node.currentTotalPriceSet?.shopMoney?.amount || '0');
    return acc + amount;
  }, 0);

  return {
    revenue: totalRevenue,
    orderCount: orders.length
  };
};

const calculateComparison = (current: number, previous: number): ComparisonData => {
  const change = current - previous;
  const changePercent = previous > 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0);
  
  return {
    current,
    previous,
    change,
    changePercent,
    isPositive: change >= 0
  };
};

export const useDailyComparison = () => {
  const { user } = useAuth();
  const { getEffectiveUserId, isImpersonating } = useImpersonate();
  const effectiveUserId = getEffectiveUserId(user?.id);

  return useQuery({
    queryKey: ['daily-comparison', effectiveUserId],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const yesterday = startOfDay(subDays(new Date(), 1));

      const [todayData, yesterdayData] = await Promise.all([
        fetchOrdersForPeriod(today, new Date(), effectiveUserId, isImpersonating),
        fetchOrdersForPeriod(yesterday, today, effectiveUserId, isImpersonating)
      ]);

      return {
        revenue: calculateComparison(todayData.revenue, yesterdayData.revenue),
        orders: calculateComparison(todayData.orderCount, yesterdayData.orderCount)
      };
    },
    refetchInterval: 60000 // Refetch every minute
  });
};

export const useWeeklyComparison = () => {
  const { user } = useAuth();
  const { getEffectiveUserId, isImpersonating } = useImpersonate();
  const effectiveUserId = getEffectiveUserId(user?.id);

  return useQuery({
    queryKey: ['weekly-comparison', effectiveUserId],
    queryFn: async () => {
      const thisWeekStart = startOfWeek(new Date());
      const lastWeekStart = startOfWeek(subWeeks(new Date(), 1));
      const lastWeekEnd = startOfWeek(new Date());

      const [thisWeekData, lastWeekData] = await Promise.all([
        fetchOrdersForPeriod(thisWeekStart, new Date(), effectiveUserId, isImpersonating),
        fetchOrdersForPeriod(lastWeekStart, lastWeekEnd, effectiveUserId, isImpersonating)
      ]);

      return {
        revenue: calculateComparison(thisWeekData.revenue, lastWeekData.revenue),
        orders: calculateComparison(thisWeekData.orderCount, lastWeekData.orderCount)
      };
    },
    refetchInterval: 300000 // Refetch every 5 minutes
  });
};

export const useMonthlyComparison = () => {
  const { user } = useAuth();
  const { getEffectiveUserId, isImpersonating } = useImpersonate();
  const effectiveUserId = getEffectiveUserId(user?.id);

  return useQuery({
    queryKey: ['monthly-comparison', effectiveUserId],
    queryFn: async () => {
      const thisMonthStart = startOfMonth(new Date());
      const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
      const lastMonthEnd = startOfMonth(new Date());

      const [thisMonthData, lastMonthData] = await Promise.all([
        fetchOrdersForPeriod(thisMonthStart, new Date(), effectiveUserId, isImpersonating),
        fetchOrdersForPeriod(lastMonthStart, lastMonthEnd, effectiveUserId, isImpersonating)
      ]);

      return {
        revenue: calculateComparison(thisMonthData.revenue, lastMonthData.revenue),
        orders: calculateComparison(thisMonthData.orderCount, lastMonthData.orderCount)
      };
    },
    refetchInterval: 600000 // Refetch every 10 minutes
  });
};
