import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { format } from "date-fns";

interface VturbEventData {
  event: string;
  total: number;
  total_uniq_sessions: number;
  total_uniq_device: number;
  player_id?: string;
}

interface VturbPlayerEvent {
  player_id: string;
  event: string;
  total: number;
  total_uniq_sessions: number;
  total_uniq_device: number;
}

const fetchVturbData = async (endpoint: string, startDate?: string, endDate?: string, playerId?: string) => {
  const { data, error } = await supabase.functions.invoke('vturb-analytics', {
    body: { endpoint, startDate, endDate, playerId },
  });

  if (error) throw error;
  return data;
};

export const useVturbOverview = (playerId?: string) => {
  const { dateRange } = useDateFilter();
  
  const startDate = format(dateRange.from, 'yyyy-MM-dd');
  const endDate = format(dateRange.to, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['vturb-overview', startDate, endDate, playerId],
    queryFn: () => fetchVturbData('overview', startDate, endDate, playerId),
    refetchInterval: 60000, // 1 minute
    retry: 2,
    staleTime: 30000,
  });
};

export const useVturbPlayers = () => {
  const { dateRange } = useDateFilter();
  
  const startDate = format(dateRange.from, 'yyyy-MM-dd');
  const endDate = format(dateRange.to, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['vturb-players', startDate, endDate],
    queryFn: () => fetchVturbData('players', startDate, endDate),
    refetchInterval: 60000,
    retry: 2,
    staleTime: 30000,
  });
};

export const useVturbListPlayers = () => {
  return useQuery({
    queryKey: ['vturb-list-players'],
    queryFn: () => fetchVturbData('list_players'),
    staleTime: 300000, // 5 minutes
  });
};

export const useVturbRetention = (playerId?: string) => {
  const { dateRange } = useDateFilter();
  
  const startDate = format(dateRange.from, 'yyyy-MM-dd');
  const endDate = format(dateRange.to, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['vturb-retention', startDate, endDate, playerId],
    queryFn: () => fetchVturbData('retention', startDate, endDate, playerId),
    refetchInterval: 60000,
    retry: 2,
    staleTime: 30000,
    enabled: !!playerId, // Only fetch if playerId is provided
  });
};

// Parse VTurb response data into usable format
export const parseVturbData = (data: VturbEventData[] | undefined) => {
  if (!data || !Array.isArray(data)) {
    return {
      totalPlays: 0,
      uniquePlays: 0,
      totalViews: 0,
      uniqueViews: 0,
      totalFinished: 0,
      uniqueFinished: 0,
      retentionRate: 0,
    };
  }

  const started = data.find(e => e.event === 'started') || { total: 0, total_uniq_sessions: 0, total_uniq_device: 0 };
  const viewed = data.find(e => e.event === 'viewed') || { total: 0, total_uniq_sessions: 0, total_uniq_device: 0 };
  const finished = data.find(e => e.event === 'finished') || { total: 0, total_uniq_sessions: 0, total_uniq_device: 0 };

  // Calculate retention rate (finished / started * 100)
  const retentionRate = started.total > 0 ? (finished.total / started.total) * 100 : 0;

  return {
    totalPlays: started.total,
    uniquePlays: started.total_uniq_device,
    totalViews: viewed.total,
    uniqueViews: viewed.total_uniq_device,
    totalFinished: finished.total,
    uniqueFinished: finished.total_uniq_device,
    retentionRate,
  };
};

// Parse VTurb players list to extract unique players
export const parseVturbPlayers = (data: VturbPlayerEvent[] | undefined): { player_id: string; player_name: string }[] => {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  // Extract unique player IDs
  const playerIds = [...new Set(data.map(item => item.player_id).filter(Boolean))];
  
  return playerIds.map(id => ({
    player_id: id,
    player_name: id, // API doesn't return names, so we use the ID
  }));
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
