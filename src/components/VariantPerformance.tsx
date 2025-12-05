import { useVariantPerformance } from "@/hooks/useVariantPerformance";
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
      <SectionCard title="Top Variantes" icon={TrendingUp} color="cyan">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full bg-primary/10 rounded-lg" />
          ))}
        </div>
      </SectionCard>
    );
  }

  const topVariants = variants?.slice(0, 10) || [];
  const totalQuantity = variants?.reduce((sum, v) => sum + v.totalQuantity, 0) || 1;

  return (
    <SectionCard title="Top Variantes" icon={TrendingUp} color="cyan">
      <p className="text-xs text-muted-foreground mb-4">{periodLabel}</p>

      {topVariants.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>Nenhuma variante vendida</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topVariants.map((variant, index) => {
            const percentage = ((variant.totalQuantity / totalQuantity) * 100).toFixed(1);
            
            return (
              <div
                key={variant.variantId}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-accent transition-colors"
              >
                <span className="w-6 text-center text-sm font-bold text-primary">
                  {index + 1}
                </span>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {variant.productTitle}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {variant.variantTitle}
                  </p>
                </div>
                
                <div className="text-right flex items-center gap-4">
                  <div>
                    <span className="text-sm font-bold text-primary">{variant.totalQuantity}</span>
                    <span className="text-xs text-muted-foreground ml-1">({percentage}%)</span>
                  </div>
                  {variant.totalRevenue > 0 && (
                    <span className="text-sm font-medium text-primary hidden sm:block">
                      {formatCurrency(variant.totalRevenue)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};
