import { useVariantPerformance } from "@/hooks/useVariantPerformance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Package } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const VariantPerformance = () => {
  const { data: variants, isLoading } = useVariantPerformance();
  const { formatCurrency } = useCurrency();
  const { dateRange } = useDateFilter();

  const periodLabel = `${format(dateRange.from, "dd/MM", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Variantes com Melhor Performance</CardTitle>
          <CardDescription>Análise de tamanhos, cores e versões mais vendidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const topVariants = variants?.slice(0, 10) || [];
  const totalQuantity = variants?.reduce((sum, v) => sum + v.totalQuantity, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Variantes com Melhor Performance
        </CardTitle>
        <CardDescription>Top 10 variantes mais vendidas no período selecionado ({periodLabel})</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topVariants.map((variant, index) => {
            const percentage = ((variant.totalQuantity / totalQuantity) * 100).toFixed(1);
            
            return (
              <div
                key={variant.variantId}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate">
                      {variant.productTitle}
                    </h4>
                    {variant.sku && (
                      <Badge variant="outline" className="text-xs">
                        {variant.sku}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span>{variant.variantTitle}</span>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="mt-2 w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {variant.totalQuantity}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {percentage}% do total
                  </div>
                  {variant.totalRevenue > 0 && (
                    <div className="text-xs font-medium mt-1">
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
      </CardContent>
    </Card>
  );
};
