import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

const fetchHokoData = async <T>(endpoint: string, params?: Record<string, any>): Promise<any> => {
  const { data, error } = await supabase.functions.invoke('hoko-api', {
    body: { endpoint, params },
  });

  if (error) throw error;
  return data;
};

export const useHokoStore = () => {
  return useQuery({
    queryKey: ['hoko-store'],
    queryFn: () => fetchHokoData<HokoStore>('store'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useHokoOrders = (page: number = 1, dateFilter?: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['hoko-orders', page, dateFilter?.from, dateFilter?.to],
    queryFn: async () => {
      const params: Record<string, any> = { page };
      if (dateFilter?.from) {
        params.start_date = dateFilter.from.toISOString().split('T')[0];
      }
      if (dateFilter?.to) {
        params.end_date = dateFilter.to.toISOString().split('T')[0];
      }
      
      const response = await fetchHokoData<any>('orders', params);
      // Hoko returns paginated data with 'data' array
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
  });
};

export const useHokoOrderDetail = (orderId: number | null) => {
  return useQuery({
    queryKey: ['hoko-order', orderId],
    queryFn: () => fetchHokoData<HokoOrder>('order-detail', { orderId }),
    enabled: !!orderId,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
};

export const useHokoProducts = () => {
  return useQuery({
    queryKey: ['hoko-products'],
    queryFn: () => fetchHokoData<HokoProduct[]>('products'),
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
};

export const useHokoProductsWithStock = () => {
  return useQuery({
    queryKey: ['hoko-products-with-stock'],
    queryFn: () => fetchHokoData<any>('products-with-stock'),
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
};

export const useHokoProductDetail = (productId: number | null) => {
  return useQuery({
    queryKey: ['hoko-product', productId],
    queryFn: () => fetchHokoData<HokoProduct>('product-detail', { productId }),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useHokoGuides = (page: number = 1) => {
  return useQuery({
    queryKey: ['hoko-guides', page],
    queryFn: async () => {
      const response = await fetchHokoData<any>('guides', { page });
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
  });
};

export const useHokoSharedStock = (params?: { search?: string; category?: number; sortBy?: number }) => {
  return useQuery({
    queryKey: ['hoko-shared-stock', params],
    queryFn: () => fetchHokoData<any>('shared-stock', params),
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
};
