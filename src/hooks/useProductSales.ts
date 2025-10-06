import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductSale {
  productId: string;
  productTitle: string;
  totalQuantity: number;
}

const fetchProductSales = async (): Promise<ProductSale[]> => {
  const { data, error } = await supabase.functions.invoke('shopify-data', {
    body: { endpoint: 'products-sales' },
  });

  if (error) throw error;

  // Processar dados para agrupar por produto
  const salesByProduct = new Map<string, ProductSale>();

  data?.data?.orders?.edges?.forEach((orderEdge: any) => {
    orderEdge.node.lineItems?.edges?.forEach((itemEdge: any) => {
      const product = itemEdge.node.variant?.product;
      if (product) {
        const existing = salesByProduct.get(product.id);
        if (existing) {
          existing.totalQuantity += itemEdge.node.quantity;
        } else {
          salesByProduct.set(product.id, {
            productId: product.id,
            productTitle: product.title,
            totalQuantity: itemEdge.node.quantity,
          });
        }
      }
    });
  });

  // Converter para array e ordenar por quantidade vendida
  return Array.from(salesByProduct.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity);
};

export const useProductSales = () => {
  return useQuery({
    queryKey: ['product-sales'],
    queryFn: fetchProductSales,
    refetchInterval: 300000, // 5 minutos
    retry: 3,
    staleTime: 60000,
  });
};