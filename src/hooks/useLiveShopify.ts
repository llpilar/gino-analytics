import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardSettings } from "@/contexts/DashboardSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonate } from "@/contexts/ImpersonateContext";

export const useLiveShopify = () => {
  const { refreshInterval } = useDashboardSettings();
  const { user } = useAuth();
  const { getEffectiveUserId, isImpersonating } = useImpersonate();
  
  const effectiveUserId = getEffectiveUserId(user?.id);
  
  return useQuery({
    queryKey: ["live-shopify", effectiveUserId],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Buscar pedidos
      const { data: ordersResponse, error: ordersError } = await supabase.functions.invoke('shopify-data', {
        body: { 
          endpoint: 'orders',
          userId: effectiveUserId,
          isImpersonating
        }
      });

      if (ordersError) {
        console.error('Erro ao buscar pedidos:', ordersError);
        throw ordersError;
      }

      // Processar pedidos e filtrar apenas de hoje
      const ordersData = ordersResponse?.data?.orders?.edges || [];
      const allOrders = ordersData.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        createdAt: edge.node.createdAt,
        totalPrice: parseFloat(edge.node.totalPriceSet?.shopMoney?.amount || 0),
        customer: edge.node.customer?.displayName,
      }));

      // Filtrar apenas pedidos de hoje
      const ordersToday = allOrders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startOfDay;
      });

      // Calcular totais apenas dos pedidos de hoje
      const totalRevenue = ordersToday.reduce((sum: number, order: any) => sum + order.totalPrice, 0);
      const orderCount = ordersToday.length;

      // Buscar produtos
      const { data: productsResponse } = await supabase.functions.invoke('shopify-data', {
        body: { 
          endpoint: 'products',
          userId: effectiveUserId,
          isImpersonating
        }
      });

      const productsData = productsResponse?.data?.products?.edges || [];
      const products = productsData.map((edge: any) => edge.node);

      return {
        orders: ordersToday,
        products,
        totalRevenue,
        orderCount,
      };
    },
    refetchInterval: refreshInterval,
  });
};
