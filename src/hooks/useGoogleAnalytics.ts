import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { format } from "date-fns";

interface GAMetric {
  name: string;
  value: string;
}

interface GARow {
  dimensionValues: Array<{ value: string }>;
  metricValues: Array<{ value: string }>;
}

interface GAResponse {
  rows?: GARow[];
  totals?: Array<{ metricValues: Array<{ value: string }> }>;
  error?: string;
}

interface GARealtimeResponse {
  rows?: Array<{
    dimensionValues: Array<{ value: string }>;
    metricValues: Array<{ value: string }>;
  }>;
  error?: string;
}

const fetchGAData = async (endpoint: string, startDate?: string, endDate?: string) => {
  const { data, error } = await supabase.functions.invoke('google-analytics', {
    body: { endpoint, startDate, endDate },
  });

  if (error) throw error;
  return data;
};

export const useGoogleAnalyticsOverview = () => {
  const { dateRange } = useDateFilter();
  
  const startDate = format(dateRange.from, 'yyyy-MM-dd');
  const endDate = format(dateRange.to, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['ga-overview', startDate, endDate],
    queryFn: () => fetchGAData('overview', startDate, endDate),
    refetchInterval: 60000, // 1 minuto
    retry: 2,
    staleTime: 30000,
  });
};

export const useGoogleAnalyticsRealtime = () => {
  return useQuery({
    queryKey: ['ga-realtime'],
    queryFn: () => fetchGAData('realtime'),
    refetchInterval: 30000, // 30 segundos
    retry: 2,
    staleTime: 15000,
  });
};

// Parse GA response data into usable format
export const parseGAOverviewData = (data: GAResponse | undefined) => {
  if (!data || !data.rows || data.rows.length === 0) {
    return {
      totalUsers: 0,
      totalSessions: 0,
      totalPageViews: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      newUsers: 0,
      dailyData: [],
    };
  }

  let totalUsers = 0;
  let totalSessions = 0;
  let totalPageViews = 0;
  let totalDuration = 0;
  let totalBounceRate = 0;
  let totalNewUsers = 0;

  const dailyData = data.rows.map((row) => {
    const date = row.dimensionValues[0].value;
    const users = parseInt(row.metricValues[0].value) || 0;
    const sessions = parseInt(row.metricValues[1].value) || 0;
    const pageViews = parseInt(row.metricValues[2].value) || 0;
    const duration = parseFloat(row.metricValues[3].value) || 0;
    const bounce = parseFloat(row.metricValues[4].value) || 0;
    const newU = parseInt(row.metricValues[5].value) || 0;

    totalUsers += users;
    totalSessions += sessions;
    totalPageViews += pageViews;
    totalDuration += duration;
    totalBounceRate += bounce;
    totalNewUsers += newU;

    return {
      date,
      users,
      sessions,
      pageViews,
      duration,
      bounceRate: bounce,
      newUsers: newU,
    };
  });

  const rowCount = data.rows.length;

  return {
    totalUsers,
    totalSessions,
    totalPageViews,
    avgSessionDuration: rowCount > 0 ? totalDuration / rowCount : 0,
    bounceRate: rowCount > 0 ? totalBounceRate / rowCount : 0,
    newUsers: totalNewUsers,
    dailyData,
  };
};

export const parseGARealtimeData = (data: GARealtimeResponse | undefined) => {
  if (!data || !data.rows) {
    return {
      activeUsers: 0,
      pageViews: [],
    };
  }

  const activeUsers = data.rows.reduce((sum, row) => {
    return sum + (parseInt(row.metricValues[0].value) || 0);
  }, 0);

  const pageViews = data.rows.map((row) => ({
    page: row.dimensionValues[0].value,
    users: parseInt(row.metricValues[0].value) || 0,
  }));

  return {
    activeUsers,
    pageViews,
  };
};
