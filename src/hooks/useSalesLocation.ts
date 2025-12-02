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
  'CO': { lat: 4.570868, lng: -74.297333 }, // Colombia - Bogotá
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

// Coordenadas de cidades colombianas principais
const COLOMBIA_CITIES: Record<string, { lat: number; lng: number }> = {
  'BOGOTA': { lat: 4.710989, lng: -74.072092 },
  'BOGOTÁ': { lat: 4.710989, lng: -74.072092 },
  'MEDELLIN': { lat: 6.244203, lng: -75.581212 },
  'MEDELLÍN': { lat: 6.244203, lng: -75.581212 },
  'CALI': { lat: 3.451647, lng: -76.531985 },
  'BARRANQUILLA': { lat: 10.963889, lng: -74.796387 },
  'CARTAGENA': { lat: 10.391049, lng: -75.479426 },
  'CUCUTA': { lat: 7.889391, lng: -72.503906 },
  'CÚCUTA': { lat: 7.889391, lng: -72.503906 },
  'BUCARAMANGA': { lat: 7.119349, lng: -73.122742 },
  'PEREIRA': { lat: 4.813433, lng: -75.696178 },
  'MANIZALES': { lat: 5.070275, lng: -75.513817 },
  'IBAGUE': { lat: 4.438889, lng: -75.232222 },
  'IBAGUÉ': { lat: 4.438889, lng: -75.232222 },
  'SANTA MARTA': { lat: 11.240694, lng: -74.199441 },
  'VILLAVICENCIO': { lat: 4.142002, lng: -73.626613 },
  'PASTO': { lat: 1.213611, lng: -77.281111 },
  'MONTERIA': { lat: 8.757489, lng: -75.881927 },
  'MONTERÍA': { lat: 8.757489, lng: -75.881927 },
  'VALLEDUPAR': { lat: 10.463056, lng: -73.253889 },
  'NEIVA': { lat: 2.929300, lng: -75.280640 },
  'ARMENIA': { lat: 4.533889, lng: -75.681111 },
  'POPAYAN': { lat: 2.441282, lng: -76.613057 },
  'POPAYÁN': { lat: 2.441282, lng: -76.613057 },
  'SINCELEJO': { lat: 9.304722, lng: -75.397778 },
  'TUNJA': { lat: 5.535278, lng: -73.367778 },
};

// Função para obter coordenadas baseadas em cidade e país
const getCoordinates = (city?: string, country?: string, countryCode?: string): { lat: number; lng: number } | undefined => {
  // Se tiver cidade colombiana, tentar encontrar coordenadas específicas
  if (countryCode === 'CO' && city) {
    const cityKey = city.toUpperCase().trim();
    if (COLOMBIA_CITIES[cityKey]) {
      return COLOMBIA_CITIES[cityKey];
    }
  }
  
  // Fallback para coordenadas do país
  if (countryCode && COUNTRY_COORDINATES[countryCode]) {
    return COUNTRY_COORDINATES[countryCode];
  }
  
  return undefined;
};

const fetchSalesLocation = async (): Promise<{
  sales: SaleLocation[];
  metrics: LocationMetrics[];
  topCities?: any[];
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
    
    // Obter coordenadas específicas baseadas em cidade e país
    const coordinates = getCoordinates(city, country, countryCode);
    
    return {
      orderId: order.id,
      orderName: order.name || order.id,
      amount,
      country,
      countryCode,
      city,
      province,
      coordinates,
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

  // Também criar métricas por cidade para localizações mais detalhadas
  const cityMetrics = sales.filter(s => s.city).reduce((acc, sale) => {
    const key = `${sale.city}-${sale.countryCode}`;
    if (!acc[key]) {
      acc[key] = {
        city: sale.city!,
        country: sale.country,
        countryCode: sale.countryCode,
        totalRevenue: sale.amount,
        orderCount: 1,
        avgOrderValue: sale.amount,
        coordinates: sale.coordinates
      };
    } else {
      acc[key].totalRevenue += sale.amount;
      acc[key].orderCount += 1;
      acc[key].avgOrderValue = acc[key].totalRevenue / acc[key].orderCount;
    }
    return acc;
  }, {} as Record<string, any>);

  const topCities = Object.values(cityMetrics)
    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    .slice(0, 3);

  console.log('Vendas por cidade:', Object.values(cityMetrics).length);
  console.log('Top 3 cidades:', topCities);
  console.log('Vendas por país:', metricsByCountry.size);

  return {
    sales,
    metrics: Array.from(metricsByCountry.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue),
    topCities
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
