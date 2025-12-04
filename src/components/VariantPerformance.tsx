import { useVariantPerformance } from "@/hooks/useVariantPerformance";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Package } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SectionCard } from "@/components/ui/stats-card";

export const VariantPerformance = () => {
  const { data: variants, isLoading } = useVariantPerformance();
  const { formatCurrency } = useCurrency();
  const { dateRange } = useDateFilter();

  const periodLabel = `${format(dateRange.from, "dd/MM", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;

  if (isLoading) {
    return (
      <SectionCard title="Variantes com Melhor Performance" icon={TrendingUp} color="purple">
        <p className="text-sm text-muted-foreground mb-4">Análise de tamanhos, cores e versões mais vendidas</p>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-purple-500/10" />
          ))}
        </div>
      </SectionCard>
    );
  }

  const topVariants = variants?.slice(0, 10) || [];
  const totalQuantity = variants?.reduce((sum, v) => sum + v.totalQuantity, 0) || 1;

  return (
    <SectionCard title="Variantes com Melhor Performance" icon={TrendingUp} color="purple">
      <p className="text-sm text-muted-foreground mb-4">
        Top 10 variantes mais vendidas no período selecionado ({periodLabel})
      </p>
      
      <div className="space-y-4">
        {topVariants.map((variant, index) => {
          const percentage = ((variant.totalQuantity / totalQuantity) * 100).toFixed(1);
          
          return (
            <div
              key={variant.variantId}
              className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-purple-500/20 hover:bg-purple-500/10 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm truncate text-white">
                    {variant.productTitle}
                  </h4>
                  {variant.sku && (
                    <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                      {variant.sku}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="h-3 w-3" />
                  <span>{variant.variantTitle}</span>
                </div>
                
                {/* Barra de progresso */}
                <div className="mt-2 w-full bg-black/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-purple-400">
                  {variant.totalQuantity}
                </div>
                <div className="text-xs text-muted-foreground">
                  {percentage}% do total
                </div>
                {variant.totalRevenue > 0 && (
                  <div className="text-xs font-medium mt-1 text-white">
                    {formatCurrency(variant.totalRevenue)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {topVariants.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma variante vendida nos últimos 30 dias</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
};
