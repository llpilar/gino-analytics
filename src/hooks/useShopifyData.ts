import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useDashboardSettings } from "@/contexts/DashboardSettingsContext";
import { useUserIntegrations } from "@/hooks/useUserIntegrations";

interface OrderNode {
  id: string;
  name: string;
  createdAt: string;
  totalPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  customer?: {
    displayName: string;
  };
  fulfillmentStatus?: string;
}

interface ShopifyResponse {
  data: {
    orders?: {
      edges: Array<{
        node: OrderNode;
      }>;
    };
    products?: {
      edges: Array<{
        node: any;
      }>;
    };
    customers?: {
      edges: Array<{
        node: any;
      }>;
    };
  };
}

const fetchShopifyData = async (
  endpoint: string, 
  userId?: string,
  customDates?: { from: Date; to: Date }
) => {
  const { data, error } = await supabase.functions.invoke('shopify-data', {
    body: { 
      endpoint,
      userId, // Pass userId to edge function
      customDates: customDates ? {
        from: customDates.from.toISOString(),
        to: customDates.to.toISOString()
      } : undefined
    },
  });

  if (error) throw error;
  return data as ShopifyResponse;
};

export const useShopifyOrders = () => {
  const { dateRange } = useDateFilter();
  const { refreshInterval } = useDashboardSettings();
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['shopify-orders', dateRange.from, dateRange.to, effectiveUserId],
    queryFn: () => fetchShopifyData('orders', effectiveUserId, dateRange),
    refetchInterval: refreshInterval,
    retry: 3,
    staleTime: Math.min(refreshInterval / 3, 10000),
    enabled: !!effectiveUserId,
  });
};

export const useShopifySummary = () => {
  const { dateRange } = useDateFilter();
  const { refreshInterval } = useDashboardSettings();
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['shopify-summary', dateRange.from, dateRange.to, effectiveUserId],
    queryFn: () => fetchShopifyData('summary', effectiveUserId, dateRange),
    refetchInterval: refreshInterval,
    retry: 3,
    staleTime: Math.min(refreshInterval / 3, 10000),
    enabled: !!effectiveUserId,
  });
};

export const useShopifyAnalytics = () => {
  const { dateRange } = useDateFilter();
  const { refreshInterval } = useDashboardSettings();
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['shopify-analytics', dateRange.from, dateRange.to, effectiveUserId],
    queryFn: () => fetchShopifyData('analytics', effectiveUserId, dateRange),
    refetchInterval: refreshInterval * 2,
    retry: 3,
    staleTime: refreshInterval,
    enabled: !!effectiveUserId,
  });
};

export const useShopifyProducts = () => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['shopify-products', effectiveUserId],
    queryFn: () => fetchShopifyData('products', effectiveUserId),
    refetchInterval: 300000, // 5 minutos
    retry: 3,
    staleTime: 60000,
    enabled: !!effectiveUserId,
  });
};

export const useShopifyOrdersToday = () => {
  const { dateRange } = useDateFilter();
  const { refreshInterval } = useDashboardSettings();
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['shopify-orders-today', dateRange.from, dateRange.to, effectiveUserId],
    queryFn: () => fetchShopifyData('orders-today', effectiveUserId, dateRange),
    refetchInterval: refreshInterval,
    retry: 3,
    staleTime: Math.min(refreshInterval / 3, 10000),
    enabled: !!effectiveUserId,
  });
};

export const useShopifyRevenueToday = () => {
  const { dateRange } = useDateFilter();
  const { refreshInterval } = useDashboardSettings();
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['shopify-revenue-today', dateRange.from, dateRange.to, effectiveUserId],
    queryFn: () => fetchShopifyData('revenue-today', effectiveUserId, dateRange),
    refetchInterval: refreshInterval,
    retry: 3,
    staleTime: Math.min(refreshInterval / 3, 10000),
    enabled: !!effectiveUserId,
  });
};

export const useShopifyLowStock = () => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['shopify-low-stock', effectiveUserId],
    queryFn: () => fetchShopifyData('low-stock', effectiveUserId),
    refetchInterval: 300000, // 5 minutos
    retry: 3,
    staleTime: 60000,
    enabled: !!effectiveUserId,
  });
};

export const useShopifyCustomersToday = () => {
  const { dateRange } = useDateFilter();
  const { refreshInterval } = useDashboardSettings();
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['shopify-customers-today', dateRange.from, dateRange.to, effectiveUserId],
    queryFn: () => fetchShopifyData('customers-today', effectiveUserId, dateRange),
    refetchInterval: refreshInterval,
    retry: 3,
    staleTime: Math.min(refreshInterval / 3, 10000),
    enabled: !!effectiveUserId,
  });
};