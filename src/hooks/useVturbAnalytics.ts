import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { format } from "date-fns";

// New interface for sessions/stats response (matches VTurb dashboard)
interface VturbSessionStats {
  total_viewed: number;
  total_viewed_device_uniq: number;
  total_viewed_session_uniq: number;
  total_started: number;
  total_started_session_uniq: number;
  total_started_device_uniq: number;
  total_finished: number;
  total_finished_session_uniq: number;
  total_finished_device_uniq: number;
  engagement_rate: number;
  total_clicked: number;
  total_clicked_device_uniq: number;
  total_clicked_session_uniq: number;
  total_over_pitch: number;
  total_under_pitch: number;
  over_pitch_rate: number;
  total_conversions: number;
  overall_conversion_rate: number;
  total_amount_usd: number;
  total_amount_brl: number;
  total_amount_eur: number;
  play_rate: number;
}

// Legacy interface for events/total_by_company response
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
// Handles both sessions/stats format and legacy events/total_by_company format
export const parseVturbData = (data: VturbSessionStats | VturbEventData[] | undefined) => {
  if (!data) {
    return {
      totalViews: 0,
      uniqueViews: 0,
      totalPlays: 0,
      uniquePlays: 0,
      totalFinished: 0,
      uniqueFinished: 0,
      engagementRate: 0,
      playRate: 0,
      totalClicks: 0,
      uniqueClicks: 0,
      overPitchRate: 0,
      conversionRate: 0,
    };
  }

  // Check if it's the new sessions/stats format (object with total_viewed)
  if ('total_viewed' in data) {
    const sessionData = data as VturbSessionStats;
    return {
      totalViews: sessionData.total_viewed || 0,
      uniqueViews: sessionData.total_viewed_device_uniq || 0,
      totalPlays: sessionData.total_started || 0,
      uniquePlays: sessionData.total_started_device_uniq || 0,
      totalFinished: sessionData.total_finished || 0,
      uniqueFinished: sessionData.total_finished_device_uniq || 0,
      engagementRate: parseFloat(String(sessionData.engagement_rate)) || 0,
      playRate: parseFloat(String(sessionData.play_rate)) || 0,
      totalClicks: sessionData.total_clicked || 0,
      uniqueClicks: sessionData.total_clicked_device_uniq || 0,
      overPitchRate: parseFloat(String(sessionData.over_pitch_rate)) || 0,
      conversionRate: parseFloat(String(sessionData.overall_conversion_rate)) || 0,
    };
  }

  // Legacy format: array of events (used when no player_id is specified)
  if (Array.isArray(data)) {
    const started = data.find(e => e.event === 'started') || { total: 0, total_uniq_sessions: 0, total_uniq_device: 0 };
    const viewed = data.find(e => e.event === 'viewed') || { total: 0, total_uniq_sessions: 0, total_uniq_device: 0 };
    const finished = data.find(e => e.event === 'finished') || { total: 0, total_uniq_sessions: 0, total_uniq_device: 0 };

    // Calculate retention rate (finished / started * 100)
    const engagementRate = started.total > 0 ? (finished.total / started.total) * 100 : 0;

    return {
      totalViews: viewed.total,
      uniqueViews: viewed.total_uniq_device,
      totalPlays: started.total,
      uniquePlays: started.total_uniq_device,
      totalFinished: finished.total,
      uniqueFinished: finished.total_uniq_device,
      engagementRate,
      playRate: 0,
      totalClicks: 0,
      uniqueClicks: 0,
      overPitchRate: 0,
      conversionRate: 0,
    };
  }

  return {
    totalViews: 0,
    uniqueViews: 0,
    totalPlays: 0,
    uniquePlays: 0,
    totalFinished: 0,
    uniqueFinished: 0,
    engagementRate: 0,
    playRate: 0,
    totalClicks: 0,
    uniqueClicks: 0,
    overPitchRate: 0,
    conversionRate: 0,
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
