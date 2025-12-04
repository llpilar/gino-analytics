import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFacebookAdAccounts } from "./useFacebookAds";

export interface FacebookTodayMetrics {
  spend: number;
  purchases: number;
  cpa: number;
  impressions: number;
  clicks: number;
}

const defaultMetrics: FacebookTodayMetrics = { 
  spend: 0, 
  purchases: 0, 
  cpa: 0, 
  impressions: 0, 
  clicks: 0 
};

export function useFacebookAdsToday() {
  const { data: accounts, error: accountsError } = useFacebookAdAccounts();
  const firstAccountId = accounts?.[0]?.id || null;

  const query = useQuery({
    queryKey: ['facebook-ads-today', firstAccountId],
    queryFn: async (): Promise<FacebookTodayMetrics> => {
      if (!firstAccountId) {
        return defaultMetrics;
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('facebook-ads', {
        body: { 
          endpoint: 'insights',
          accountId: firstAccountId,
          startDate: today,
          endDate: today
        }
      });

      if (error) {
        console.warn('Facebook Ads não configurado ou sem permissões:', error);
        return defaultMetrics;
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
    enabled: !!firstAccountId && !accountsError,
    refetchInterval: 60000,
    retry: false,
    staleTime: 30000,
  });

  // Always return data, even on error
  return {
    ...query,
    data: query.data ?? defaultMetrics
  };
}
