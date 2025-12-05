import { useVariantPerformance } from "@/hooks/useVariantPerformance";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Package, Trophy, Medal, Award, DollarSign } from "lucide-react";
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full bg-purple-500/10 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-purple-500/10 rounded-xl" />
          ))}
        </div>
      </SectionCard>
    );
  }

  const topVariants = variants?.slice(0, 10) || [];
  const totalQuantity = variants?.reduce((sum, v) => sum + v.totalQuantity, 0) || 1;
  const totalRevenue = variants?.reduce((sum, v) => sum + v.totalRevenue, 0) || 0;
  
  const top3 = topVariants.slice(0, 3);
  const rest = topVariants.slice(3);

  const podiumConfig = [
    { 
      position: 0, 
      icon: Trophy, 
      gradient: "from-yellow-400 via-amber-500 to-orange-500",
      border: "border-yellow-500/50",
      bg: "bg-gradient-to-br from-yellow-500/20 to-amber-500/10",
      glow: "shadow-yellow-500/20",
      text: "text-yellow-400",
      label: "1º"
    },
    { 
      position: 1, 
      icon: Medal, 
      gradient: "from-gray-300 via-gray-400 to-gray-500",
      border: "border-gray-400/50",
      bg: "bg-gradient-to-br from-gray-400/20 to-gray-500/10",
      glow: "shadow-gray-400/20",
      text: "text-gray-300",
      label: "2º"
    },
    { 
      position: 2, 
      icon: Award, 
      gradient: "from-amber-600 via-orange-700 to-amber-800",
      border: "border-amber-700/50",
      bg: "bg-gradient-to-br from-amber-700/20 to-orange-700/10",
      glow: "shadow-amber-700/20",
      text: "text-amber-600",
      label: "3º"
    },
  ];

  return (
    <SectionCard title="Variantes com Melhor Performance" icon={TrendingUp} color="purple">
      {/* Summary Stats */}
      <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-400">Período:</span>
          <span className="text-sm font-semibold text-white">{periodLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-sm text-gray-400">Total vendido:</span>
          <span className="text-sm font-bold text-green-400">{totalQuantity} un</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-gray-400">Receita:</span>
          <span className="text-sm font-bold text-cyan-400">{formatCurrency(totalRevenue)}</span>
        </div>
      </div>

      {topVariants.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Nenhuma variante vendida no período</p>
        </div>
      ) : (
        <>
          {/* Podium - Top 3 */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {top3.map((variant, index) => {
                const config = podiumConfig[index];
                const percentage = ((variant.totalQuantity / totalQuantity) * 100).toFixed(1);
                const Icon = config.icon;
                
                return (
                  <div
                    key={variant.variantId}
                    className={`relative p-5 rounded-2xl ${config.bg} border-2 ${config.border} shadow-lg ${config.glow} hover:scale-[1.02] transition-all duration-300`}
                  >
                    {/* Position Badge */}
                    <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 text-black" />
                    </div>
                    
                    {/* Position Number */}
                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-black/80 border ${config.border} flex items-center justify-center`}>
                      <span className={`text-sm font-black ${config.text}`}>{config.label}</span>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-bold text-white text-sm leading-tight mb-1 line-clamp-2">
                        {variant.productTitle}
                      </h4>
                      <p className="text-xs text-gray-400 mb-3 truncate">
                        {variant.variantTitle}
                      </p>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-black/40">
                          <div className={`text-xl font-black ${config.text}`}>
                            {variant.totalQuantity}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">Vendas</div>
                        </div>
                        <div className="p-2 rounded-lg bg-black/40">
                          <div className="text-xl font-black text-white">
                            {percentage}%
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">do Total</div>
                        </div>
                      </div>
                      
                      {variant.totalRevenue > 0 && (
                        <div className="mt-2 p-2 rounded-lg bg-black/40 text-center">
                          <div className="text-sm font-bold text-cyan-400">
                            {formatCurrency(variant.totalRevenue)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of the list - 4th to 10th */}
          {rest.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Posições 4-10</h5>
              {rest.map((variant, index) => {
                const percentage = ((variant.totalQuantity / totalQuantity) * 100).toFixed(1);
                const position = index + 4;
                
                return (
                  <div
                    key={variant.variantId}
                    className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-purple-500/10 hover:bg-purple-500/5 transition-colors group"
                  >
                    {/* Position */}
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-400">{position}º</span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {variant.productTitle}
                        </span>
                        {variant.sku && (
                          <Badge variant="outline" className="text-[10px] border-purple-500/20 text-purple-400 hidden sm:inline-flex">
                            {variant.sku}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 truncate block">
                        {variant.variantTitle}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="hidden lg:block w-32">
                      <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
                          style={{ width: `${Math.min(parseFloat(percentage) * 2, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-sm font-bold text-purple-400">{variant.totalQuantity}</div>
                        <div className="text-[10px] text-gray-500">{percentage}%</div>
                      </div>
                      {variant.totalRevenue > 0 && (
                        <div className="hidden sm:block">
                          <div className="text-sm font-medium text-cyan-400">
                            {formatCurrency(variant.totalRevenue)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
};
