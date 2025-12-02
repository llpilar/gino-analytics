import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SaleLocation {
  orderId: string;
  orderName: string;
  amount: number;
  country: string;
  countryCode: string;
  province?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

interface LocationMetrics {
  country: string;
  countryCode: string;
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Coordenadas aproximadas de países comuns
const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'CO': { lat: 4.570868, lng: -74.297333 }, // Colombia
  'BR': { lat: -15.793889, lng: -47.882778 }, // Brasil
  'US': { lat: 37.09024, lng: -95.712891 }, // USA
  'MX': { lat: 23.634501, lng: -102.552784 }, // México
  'AR': { lat: -38.416097, lng: -63.616672 }, // Argentina
  'PE': { lat: -9.189967, lng: -75.015152 }, // Peru
  'CL': { lat: -35.675147, lng: -71.542969 }, // Chile
  'EC': { lat: -1.831239, lng: -78.183406 }, // Ecuador
  'VE': { lat: 6.42375, lng: -66.58973 }, // Venezuela
  'ES': { lat: 40.463667, lng: -3.74922 }, // Espanha
};

const fetchSalesLocation = async (): Promise<{
  sales: SaleLocation[];
  metrics: LocationMetrics[];
}> => {
      // Buscar dados de vendas para análise
      const { data: salesData, error } = await supabase.functions.invoke('shopify-data', {
        body: { endpoint: 'revenue-30days' }
      });

  if (error) throw error;

  const orders = salesData?.data?.orders?.edges || [];
  
  // Processar vendas individuais
  const sales: SaleLocation[] = orders.map((edge: any) => {
    const order = edge.node;
    const amount = parseFloat(order.currentTotalPriceSet?.shopMoney?.amount || '0');
    
    // Pegar localização real ou assumir Colômbia como padrão
    const shippingAddress = order.shippingAddress;
    const countryCode = shippingAddress?.countryCode || 'CO';
    const country = shippingAddress?.country || 'Colombia';
    const city = shippingAddress?.city;
    const province = shippingAddress?.provinceCode;
    
    return {
      orderId: order.id,
      orderName: order.name || order.id,
      amount,
      country,
      countryCode,
      city,
      province,
      coordinates: COUNTRY_COORDINATES[countryCode],
      createdAt: order.createdAt
    };
  });

  // Calcular métricas por país
  const metricsByCountry = new Map<string, LocationMetrics>();
  
  sales.forEach(sale => {
    const existing = metricsByCountry.get(sale.countryCode);
    if (existing) {
      existing.totalRevenue += sale.amount;
      existing.orderCount += 1;
      existing.avgOrderValue = existing.totalRevenue / existing.orderCount;
    } else {
      metricsByCountry.set(sale.countryCode, {
        country: sale.country,
        countryCode: sale.countryCode,
        totalRevenue: sale.amount,
        orderCount: 1,
        avgOrderValue: sale.amount,
        coordinates: sale.coordinates
      });
    }
  });

  return {
    sales,
    metrics: Array.from(metricsByCountry.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
  };
};

export const useSalesLocation = () => {
  return useQuery({
    queryKey: ['sales-location'],
    queryFn: fetchSalesLocation,
    refetchInterval: 300000, // 5 minutos
    retry: 3,
    staleTime: 60000,
  });
};
