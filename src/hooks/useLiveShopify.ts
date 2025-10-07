import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useLiveShopify = () => {
  return useQuery({
    queryKey: ["live-shopify"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar pedidos de hoje
      const { data: ordersData } = await supabase.functions.invoke('shopify-data', {
        body: { 
          endpoint: 'revenue-today',
          customDates: {
            from: new Date(today),
            to: new Date()
          }
        }
      });

      // Buscar produtos
      const { data: productsData } = await supabase.functions.invoke('shopify-data', {
        body: { endpoint: 'products' }
      });

      return {
        orders: ordersData?.orders || [],
        products: productsData?.products || [],
        totalRevenue: ordersData?.totalRevenue || 0,
        orderCount: ordersData?.orderCount || 0,
      };
    },
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });
};
