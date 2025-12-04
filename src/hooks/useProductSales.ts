import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDateFilter } from "@/contexts/DateFilterContext";

interface ProductSale {
  productId: string;
  productTitle: string;
  totalQuantity: number;
}

const fetchProductSales = async (customDates?: { from: Date; to: Date }): Promise<ProductSale[]> => {
  const { data, error } = await supabase.functions.invoke('shopify-data', {
    body: { 
      endpoint: 'products-sales',
      customDates: customDates ? {
        from: customDates.from.toISOString(),
        to: customDates.to.toISOString()
      } : undefined
    },
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
  const { dateRange } = useDateFilter();
  
  return useQuery({
    queryKey: ['product-sales', dateRange.from, dateRange.to],
    queryFn: () => fetchProductSales(dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined),
    refetchInterval: 300000, // 5 minutos
    retry: 3,
    staleTime: 60000,
  });
};