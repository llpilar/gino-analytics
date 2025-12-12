import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdAccount {
  id: string;
  name: string;
  currency: string;
  account_status: number;
  business_name?: string;
}

export interface BusinessManager {
  id: string;
  name: string;
  created_time?: string;
}

export interface AdInsights {
  spend: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  reach: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

export function useFacebookAdAccounts() {
  return useQuery({
    queryKey: ['facebook-ad-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('facebook-user-ads', {
        body: { endpoint: 'accounts' }
      });

      if (error) throw error;
      
      // Check if user needs to connect
      if (data.needsConnection || data.needsReconnection) {
        return { needsConnection: true, accounts: [] };
      }

      return { needsConnection: false, accounts: data.data as AdAccount[] };
    },
    retry: false,
  });
}

export function useFacebookBusinessManagers() {
  return useQuery({
    queryKey: ['facebook-business-managers'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('facebook-user-ads', {
        body: { endpoint: 'business_managers' }
      });

      if (error) throw error;
      
      if (data.needsConnection || data.needsReconnection) {
        return { needsConnection: true, businessManagers: [] };
      }

      return { needsConnection: false, businessManagers: data.data as BusinessManager[] };
    },
    retry: false,
  });
}

export function useFacebookAdInsights(accountId: string | null, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['facebook-ad-insights', accountId, startDate, endDate],
    queryFn: async () => {
      if (!accountId) return null;

      const { data, error } = await supabase.functions.invoke('facebook-user-ads', {
        body: { 
          endpoint: 'insights',
          accountId,
          startDate,
          endDate
        }
      });

      if (error) throw error;
      
      if (data.needsConnection || data.needsReconnection) {
        return { needsConnection: true, insights: null };
      }

      return { needsConnection: false, insights: data.data?.[0] as AdInsights | null };
    },
    enabled: !!accountId,
    retry: false,
  });
}

export function useFacebookCampaigns(accountId: string | null) {
  return useQuery({
    queryKey: ['facebook-campaigns', accountId],
    queryFn: async () => {
      if (!accountId) return null;

      const { data, error } = await supabase.functions.invoke('facebook-user-ads', {
        body: { 
          endpoint: 'campaigns',
          accountId
        }
      });

      if (error) throw error;
      
      if (data.needsConnection || data.needsReconnection) {
        return { needsConnection: true, campaigns: [] };
      }

      return { needsConnection: false, campaigns: data.data as Campaign[] };
    },
    enabled: !!accountId,
    retry: false,
  });
}
