import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { format } from "date-fns";

interface VturbStats {
  total_plays?: number;
  unique_views?: number;
  total_watch_time?: number;
  average_watch_time?: number;
  retention_rate?: number;
  plays?: number;
  views?: number;
}

interface VturbVideo {
  id: string;
  name: string;
  created_at: string;
}

const fetchVturbData = async (endpoint: string, startDate?: string, endDate?: string, videoId?: string) => {
  const { data, error } = await supabase.functions.invoke('vturb-analytics', {
    body: { endpoint, startDate, endDate, videoId },
  });

  if (error) throw error;
  return data;
};

export const useVturbOverview = (videoId?: string) => {
  const { dateRange } = useDateFilter();
  
  const startDate = format(dateRange.from, 'yyyy-MM-dd');
  const endDate = format(dateRange.to, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['vturb-overview', startDate, endDate, videoId],
    queryFn: () => fetchVturbData('overview', startDate, endDate, videoId),
    refetchInterval: 60000, // 1 minute
    retry: 2,
    staleTime: 30000,
  });
};

export const useVturbPlays = (videoId?: string) => {
  const { dateRange } = useDateFilter();
  
  const startDate = format(dateRange.from, 'yyyy-MM-dd');
  const endDate = format(dateRange.to, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['vturb-plays', startDate, endDate, videoId],
    queryFn: () => fetchVturbData('plays', startDate, endDate, videoId),
    refetchInterval: 60000,
    retry: 2,
    staleTime: 30000,
  });
};

export const useVturbRetention = (videoId?: string) => {
  const { dateRange } = useDateFilter();
  
  const startDate = format(dateRange.from, 'yyyy-MM-dd');
  const endDate = format(dateRange.to, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['vturb-retention', startDate, endDate, videoId],
    queryFn: () => fetchVturbData('retention', startDate, endDate, videoId),
    refetchInterval: 60000,
    retry: 2,
    staleTime: 30000,
  });
};

export const useVturbVideos = () => {
  return useQuery({
    queryKey: ['vturb-videos'],
    queryFn: () => fetchVturbData('videos'),
    staleTime: 300000, // 5 minutes
  });
};

// Parse VTurb response data into usable format
export const parseVturbData = (data: VturbStats | undefined) => {
  if (!data) {
    return {
      totalPlays: 0,
      uniqueViews: 0,
      totalWatchTime: 0,
      averageWatchTime: 0,
      retentionRate: 0,
    };
  }

  return {
    totalPlays: data.total_plays || data.plays || 0,
    uniqueViews: data.unique_views || data.views || 0,
    totalWatchTime: data.total_watch_time || 0,
    averageWatchTime: data.average_watch_time || 0,
    retentionRate: data.retention_rate || 0,
  };
};

// Format watch time in minutes and seconds
export const formatWatchTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
