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
  };
}

const fetchShopifyData = async (endpoint: string) => {
  const { data, error } = await supabase.functions.invoke('shopify-data', {
    body: { endpoint },
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
