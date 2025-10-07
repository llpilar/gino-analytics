import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useLiveShopify = () => {
  return useQuery({
    queryKey: ["live-shopify"],
    queryFn: async () => {
      // Buscar pedidos de hoje
      const { data: ordersResponse, error: ordersError } = await supabase.functions.invoke('shopify-data', {
        body: { endpoint: 'orders' }
      });

      if (ordersError) {
        console.error('Erro ao buscar pedidos:', ordersError);
        throw ordersError;
      }

      console.log('Resposta da API:', ordersResponse);

      // Processar pedidos
      const ordersData = ordersResponse?.data?.orders?.edges || [];
      const orders = ordersData.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        createdAt: edge.node.createdAt,
        totalPrice: parseFloat(edge.node.totalPriceSet?.shopMoney?.amount || 0),
        customer: edge.node.customer?.displayName,
      }));

      // Calcular totais
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.totalPrice, 0);
      const orderCount = orders.length;

      // Buscar produtos
      const { data: productsResponse } = await supabase.functions.invoke('shopify-data', {
        body: { endpoint: 'products' }
      });

      const products = productsResponse?.data?.products?.edges || [];

      return {
        orders,
        products,
        totalRevenue,
        orderCount,
      };
    },
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });
};
