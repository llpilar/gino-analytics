import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  return useQuery({
    queryKey: ['shopify-orders'],
    queryFn: () => fetchShopifyData('orders'),
    refetchInterval: 30000,
    retry: 3,
    staleTime: 10000,
  });
};

export const useShopifySummary = () => {
  return useQuery({
    queryKey: ['shopify-summary'],
    queryFn: () => fetchShopifyData('summary'),
    refetchInterval: 30000,
    retry: 3,
    staleTime: 10000,
  });
};

export const useShopifyAnalytics = () => {
  return useQuery({
    queryKey: ['shopify-analytics'],
    queryFn: () => fetchShopifyData('analytics'),
    refetchInterval: 60000,
    retry: 3,
    staleTime: 30000,
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
  return useQuery({
    queryKey: ['shopify-orders-today'],
    queryFn: () => fetchShopifyData('orders-today'),
    refetchInterval: 30000,
    retry: 3,
    staleTime: 10000,
  });
};

export const useShopifyRevenueToday = () => {
  return useQuery({
    queryKey: ['shopify-revenue-today'],
    queryFn: () => fetchShopifyData('revenue-today'),
    refetchInterval: 30000,
    retry: 3,
    staleTime: 10000,
  });
};

export const useShopifyRevenueYesterday = () => {
  return useQuery({
    queryKey: ['shopify-revenue-yesterday'],
    queryFn: () => fetchShopifyData('revenue-yesterday'),
    refetchInterval: 60000,
    retry: 3,
    staleTime: 30000,
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
  return useQuery({
    queryKey: ['shopify-customers-today'],
    queryFn: () => fetchShopifyData('customers-today'),
    refetchInterval: 30000,
    retry: 3,
    staleTime: 10000,
  });
};

export const useShopifyRevenuePeriod = (
  period: 'today' | '3days' | '7days' | '15days' | '30days',
  customDates?: { from: Date; to: Date }
) => {
  return useQuery({
    queryKey: ['shopify-revenue-period', period, customDates?.from, customDates?.to],
    queryFn: () => fetchShopifyData(`revenue-${period}`, customDates),
    refetchInterval: 30000,
    retry: 3,
    staleTime: 10000,
    enabled: !customDates || (customDates.from !== undefined && customDates.to !== undefined),
  });
};
