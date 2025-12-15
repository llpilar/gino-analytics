import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useDashboardSettings } from "@/contexts/DashboardSettingsContext";

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

const fetchShopifyData = async (endpoint: string, customDates?: { from: Date; to: Date }) => {
  const { data, error } = await supabase.functions.invoke('shopify-data', {
    body: { 
      endpoint,
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
  
  return useQuery({
    queryKey: ['shopify-orders', dateRange.from, dateRange.to],
    queryFn: () => fetchShopifyData('orders', dateRange),
    refetchInterval: refreshInterval,
    retry: 3,
    staleTime: Math.min(refreshInterval / 3, 10000),
  });
};

export const useShopifySummary = () => {
  const { dateRange } = useDateFilter();
  const { refreshInterval } = useDashboardSettings();
  
  return useQuery({
    queryKey: ['shopify-summary', dateRange.from, dateRange.to],
    queryFn: () => fetchShopifyData('summary', dateRange),
    refetchInterval: refreshInterval,
    retry: 3,
    staleTime: Math.min(refreshInterval / 3, 10000),
  });
};

export const useShopifyAnalytics = () => {
  const { dateRange } = useDateFilter();
  const { refreshInterval } = useDashboardSettings();
  
  return useQuery({
    queryKey: ['shopify-analytics', dateRange.from, dateRange.to],
    queryFn: () => fetchShopifyData('analytics', dateRange),
    refetchInterval: refreshInterval * 2,
    retry: 3,
    staleTime: refreshInterval,
  });
};

export const useShopifyProducts = () => {
  return useQuery({
    queryKey: ['shopify-products'],
    queryFn: () => fetchShopifyData('products'),
    refetchInterval: 300000, // 5 minutos
    retry: 3,
    staleTime: 60000,
  });
};

export const useShopifyOrdersToday = () => {
  const { dateRange } = useDateFilter();
  const { refreshInterval } = useDashboardSettings();
  
  return useQuery({
    queryKey: ['shopify-orders-today', dateRange.from, dateRange.to],
    queryFn: () => fetchShopifyData('orders-today', dateRange),
    refetchInterval: refreshInterval,
    retry: 3,
    staleTime: Math.min(refreshInterval / 3, 10000),
  });
};

export const useShopifyRevenueToday = () => {
  const { dateRange } = useDateFilter();
  const { refreshInterval } = useDashboardSettings();
  
  return useQuery({
    queryKey: ['shopify-revenue-today', dateRange.from, dateRange.to],
    queryFn: () => fetchShopifyData('revenue-today', dateRange),
    refetchInterval: refreshInterval,
    retry: 3,
    staleTime: Math.min(refreshInterval / 3, 10000),
  });
};

export const useShopifyLowStock = () => {
  return useQuery({
    queryKey: ['shopify-low-stock'],
    queryFn: () => fetchShopifyData('low-stock'),
    refetchInterval: 300000, // 5 minutos
    retry: 3,
    staleTime: 60000,
  });
};

export const useShopifyCustomersToday = () => {
  const { dateRange } = useDateFilter();
  const { refreshInterval } = useDashboardSettings();
  
  return useQuery({
    queryKey: ['shopify-customers-today', dateRange.from, dateRange.to],
    queryFn: () => fetchShopifyData('customers-today', dateRange),
    refetchInterval: refreshInterval,
    retry: 3,
    staleTime: Math.min(refreshInterval / 3, 10000),
  });
};
