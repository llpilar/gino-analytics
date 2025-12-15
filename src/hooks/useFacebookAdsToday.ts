import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFacebookAdAccounts } from "./useFacebookAds";
import { useDashboardSettings } from "@/contexts/DashboardSettingsContext";

export interface FacebookTodayMetrics {
  spend: number;
  purchases: number;
  cpa: number;
  impressions: number;
  clicks: number;
  needsConnection?: boolean;
}

const defaultMetrics: FacebookTodayMetrics = { 
  spend: 0, 
  purchases: 0, 
  cpa: 0, 
  impressions: 0, 
  clicks: 0,
  needsConnection: false
};

export function useFacebookAdsToday() {
  const { data: accountsData, error: accountsError, isLoading: accountsLoading } = useFacebookAdAccounts();
  const { refreshInterval } = useDashboardSettings();
  
  // Check if user needs to connect
  const needsConnection = accountsData?.needsConnection || false;
  const firstAccountId = accountsData?.accounts?.[0]?.id || null;

  const query = useQuery({
    queryKey: ['facebook-ads-today', firstAccountId],
    queryFn: async (): Promise<FacebookTodayMetrics> => {
      if (!firstAccountId) {
        return { ...defaultMetrics, needsConnection };
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('facebook-user-ads', {
        body: { 
          endpoint: 'insights',
          accountId: firstAccountId,
          startDate: today,
          endDate: today
        }
      });

      if (error) {
        console.warn('Facebook Ads error:', error);
        return { ...defaultMetrics, needsConnection: true };
      }

      // Check if needs connection
      if (data.needsConnection || data.needsReconnection) {
        return { ...defaultMetrics, needsConnection: true };
      }

      const insights = data?.data?.[0];
      
      if (!insights) {
        return defaultMetrics;
      }

      const spend = parseFloat(insights.spend || '0');
      const impressions = parseInt(insights.impressions || '0');
      const clicks = parseInt(insights.clicks || '0');
      
      const purchaseAction = insights.actions?.find(
        (action: { action_type: string; value: string }) => 
          action.action_type === 'purchase' || 
          action.action_type === 'omni_purchase'
      );
      const purchases = parseInt(purchaseAction?.value || '0');
      const cpa = purchases > 0 ? spend / purchases : 0;

      return { spend, purchases, cpa, impressions, clicks };
    },
    enabled: !needsConnection && !!firstAccountId && !accountsError && !accountsLoading,
    refetchInterval: refreshInterval * 2,
    retry: false,
    staleTime: refreshInterval,
  });

  // If still loading accounts or needs connection, return appropriate state
  if (accountsLoading) {
    return {
      ...query,
      data: defaultMetrics,
      isLoading: true,
    };
  }

  if (needsConnection) {
    return {
      ...query,
      data: { ...defaultMetrics, needsConnection: true },
      isLoading: false,
    };
  }

  return {
    ...query,
    data: query.data ?? defaultMetrics
  };
}
