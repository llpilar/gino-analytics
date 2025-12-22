import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useUserIntegrations } from "@/hooks/useUserIntegrations";

interface VariantPerformance {
  variantId: string;
  variantTitle: string;
  productTitle: string;
  productId: string;
  totalQuantity: number;
  totalRevenue: number;
  sku?: string;
}

const fetchVariantPerformance = async (
  dateRange: { from: Date; to: Date },
  userId?: string,
  isImpersonating?: boolean
): Promise<VariantPerformance[]> => {
  const { data, error } = await supabase.functions.invoke('shopify-data', {
    body: { 
      endpoint: 'products-sales',
      customDates: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      },
      userId,
      isImpersonating
    },
  });

  if (error) throw error;

  // Processar dados para agrupar por variante
  const salesByVariant = new Map<string, VariantPerformance>();

  data?.data?.orders?.edges?.forEach((orderEdge: any) => {
    orderEdge.node.lineItems?.edges?.forEach((itemEdge: any) => {
      const variant = itemEdge.node.variant;
      const product = variant?.product;
      
      if (variant && product) {
        const variantId = variant.id || `${product.id}-default`;
        const existing = salesByVariant.get(variantId);
        
        // Calcular receita (assumindo que cada item tem um preço)
        const itemRevenue = itemEdge.node.quantity * parseFloat(itemEdge.node.variant?.price || '0');
        
        if (existing) {
          existing.totalQuantity += itemEdge.node.quantity;
          existing.totalRevenue += itemRevenue;
        } else {
          salesByVariant.set(variantId, {
            variantId: variant.id,
            variantTitle: variant.title || 'Padrão',
            productTitle: product.title,
            productId: product.id,
            totalQuantity: itemEdge.node.quantity,
            totalRevenue: itemRevenue,
            sku: variant.sku,
          });
        }
      }
    });
  });

  // Converter para array e ordenar por quantidade vendida
  return Array.from(salesByVariant.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity);
};

export const useVariantPerformance = () => {
  const { dateRange } = useDateFilter();
  const { effectiveUserId, isImpersonating } = useUserIntegrations();
  
  // Garantir que as datas existem antes de fazer a query
  const from = dateRange.from || new Date();
  const to = dateRange.to || new Date();
  
  return useQuery({
    queryKey: ['variant-performance', from.toISOString(), to.toISOString(), effectiveUserId],
    queryFn: () => fetchVariantPerformance({ from, to }, effectiveUserId, isImpersonating),
    refetchInterval: 300000, // 5 minutos
    retry: 3,
    staleTime: 60000,
    enabled: !!dateRange.from && !!dateRange.to && !!effectiveUserId,
  });
};
