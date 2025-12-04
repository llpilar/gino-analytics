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
  status: string;
  data?: T;
  message?: string;
  code?: string;
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
}

const fetchHokoData = async <T>(endpoint: string, params?: Record<string, any>): Promise<HokoResponse<T>> => {
  const { data, error } = await supabase.functions.invoke('hoko-api', {
    body: { endpoint, params },
  });

  if (error) throw error;
  return data as HokoResponse<T>;
};

export const useHokoStore = () => {
  return useQuery({
    queryKey: ['hoko-store'],
    queryFn: () => fetchHokoData<HokoStore>('store'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useHokoOrders = (page: number = 1) => {
  return useQuery({
    queryKey: ['hoko-orders', page],
    queryFn: () => fetchHokoData<HokoOrder[]>('orders', { page }),
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

export const useHokoProducts = (page: number = 1) => {
  return useQuery({
    queryKey: ['hoko-products', page],
    queryFn: () => fetchHokoData<HokoProduct[]>('products', { page }),
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

export const useHokoStock = () => {
  return useQuery({
    queryKey: ['hoko-stock'],
    queryFn: () => fetchHokoData<HokoProduct[]>('stock'),
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
};

export const useHokoShipments = (page: number = 1) => {
  return useQuery({
    queryKey: ['hoko-shipments', page],
    queryFn: () => fetchHokoData<HokoShipment[]>('shipments', { page }),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
};

export const useHokoTracking = (trackingNumber: string | null) => {
  return useQuery({
    queryKey: ['hoko-tracking', trackingNumber],
    queryFn: () => fetchHokoData<any>('tracking', { trackingNumber }),
    enabled: !!trackingNumber,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
};
