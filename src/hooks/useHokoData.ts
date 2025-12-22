import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserIntegrations } from "@/hooks/useUserIntegrations";

interface HokoStore {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  status?: string;
}

interface HokoOrder {
  id: number;
  order_number?: string;
  status: string;
  total: number;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  city?: string;
  tracking_number?: string;
  carrier?: string;
  created_at: string;
  updated_at?: string;
  items?: HokoOrderItem[];
}

interface HokoOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  sku?: string;
}

interface HokoProduct {
  id: number;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  status?: string;
  image_url?: string;
  description?: string;
  created_at?: string;
}

interface HokoShipment {
  id: number;
  order_id: number;
  tracking_number: string;
  carrier: string;
  status: string;
  shipped_at?: string;
  delivered_at?: string;
  estimated_delivery?: string;
}

interface HokoResponse<T> {
  status?: string;
  data?: T;
  message?: string;
  code?: string;
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
  // Pagination fields from Hoko API directly
  current_page?: number;
  last_page?: number;
  total?: number;
}

const fetchHokoData = async <T>(endpoint: string, userId?: string, params?: Record<string, any>): Promise<any> => {
  const { data, error } = await supabase.functions.invoke('hoko-api', {
    body: { endpoint, userId, params },
  });

  if (error) throw error;
  return data;
};

export const useHokoStore = () => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['hoko-store', effectiveUserId],
    queryFn: () => fetchHokoData<HokoStore>('store', effectiveUserId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!effectiveUserId,
  });
};

export const useHokoOrders = (page: number = 1, dateFilter?: { from: Date; to: Date }) => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['hoko-orders', page, dateFilter?.from, dateFilter?.to, effectiveUserId],
    queryFn: async () => {
      console.log('useHokoOrders: fetching for user', effectiveUserId);
      const params: Record<string, any> = { page };
      if (dateFilter?.from) {
        params.start_date = dateFilter.from.toISOString().split('T')[0];
      }
      if (dateFilter?.to) {
        params.end_date = dateFilter.to.toISOString().split('T')[0];
      }
      
      const response = await fetchHokoData<any>('orders', effectiveUserId, params);
      console.log('useHokoOrders: raw response', response);
      
      const result = {
        status: 'success',
        data: response.data || response,
        pagination: {
          current_page: response.current_page || 1,
          total_pages: response.last_page || 1,
          total_items: response.total || 0,
        }
      };
      console.log('useHokoOrders: processed result with', result.data?.length || 0, 'orders');
      return result;
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    enabled: !!effectiveUserId,
  });
};

export const useHokoOrderDetail = (orderId: number | null) => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['hoko-order', orderId, effectiveUserId],
    queryFn: () => fetchHokoData<HokoOrder>('order-detail', effectiveUserId, { orderId }),
    enabled: !!orderId && !!effectiveUserId,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
};

export const useHokoProducts = () => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['hoko-products', effectiveUserId],
    queryFn: () => fetchHokoData<HokoProduct[]>('products', effectiveUserId),
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
    enabled: !!effectiveUserId,
  });
};

export const useHokoProductsWithStock = () => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['hoko-products-with-stock', effectiveUserId],
    queryFn: () => fetchHokoData<any>('products-with-stock', effectiveUserId),
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
    enabled: !!effectiveUserId,
  });
};

export const useHokoProductDetail = (productId: number | null) => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['hoko-product', productId, effectiveUserId],
    queryFn: () => fetchHokoData<HokoProduct>('product-detail', effectiveUserId, { productId }),
    enabled: !!productId && !!effectiveUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useHokoGuides = (page: number = 1) => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['hoko-guides', page, effectiveUserId],
    queryFn: async () => {
      const response = await fetchHokoData<any>('guides', effectiveUserId, { page });
      return {
        status: 'success',
        data: response.data || response,
        pagination: {
          current_page: response.current_page || 1,
          total_pages: response.last_page || 1,
          total_items: response.total || 0,
        }
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    enabled: !!effectiveUserId,
  });
};

export const useHokoSharedStock = (params?: { search?: string; category?: number; sortBy?: number }) => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['hoko-shared-stock', params, effectiveUserId],
    queryFn: () => fetchHokoData<any>('shared-stock', effectiveUserId, params),
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
    enabled: !!effectiveUserId,
  });
};

export interface HokoLiquidacion {
  id: number;
  order_id?: number;
  order_number?: string;
  status?: string;
  amount?: number;
  commission?: number;
  net_amount?: number;
  created_at?: string;
  paid_at?: string;
  customer_name?: string;
  city?: string;
}

export const useHokoLiquidaciones = (page: number = 1, dateFilter?: { from: Date; to: Date }) => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['hoko-liquidaciones', page, dateFilter?.from, dateFilter?.to, effectiveUserId],
    queryFn: async () => {
      const params: Record<string, any> = { page };
      if (dateFilter?.from) {
        params.start_date = dateFilter.from.toISOString().split('T')[0];
      }
      if (dateFilter?.to) {
        params.end_date = dateFilter.to.toISOString().split('T')[0];
      }
      
      const response = await fetchHokoData<any>('liquidaciones', effectiveUserId, params);
      return {
        status: 'success',
        data: response.data || response,
        pagination: {
          current_page: response.current_page || 1,
          total_pages: response.last_page || 1,
          total_items: response.total || 0,
        }
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    enabled: !!effectiveUserId,
  });
};