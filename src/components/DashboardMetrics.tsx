import { useShopifyRevenueToday } from "@/hooks/useShopifyData";
import { useMemo } from "react";
import { Skeleton } from "./ui/skeleton";
import { TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { format } from "date-fns";
import { StatsCard, SectionCard } from "@/components/ui/stats-card";

export const DashboardMetrics = () => {
  const { dateRange } = useDateFilter();
  const { data: periodData, isLoading } = useShopifyRevenueToday();

  const ordersCount = useMemo(() => {
    return periodData?.data?.orders?.edges?.length || 0;
  }, [periodData]);

  const totalRevenueCOP = useMemo(() => {
    if (!periodData?.data?.orders?.edges) return 0;
    
    return periodData.data.orders.edges.reduce((acc: number, edge: any) => {
      const amount = parseFloat(
        edge.node.currentTotalPriceSet?.shopMoney?.amount || 
        edge.node.totalPriceSet?.shopMoney?.amount || 
        '0'
      );
      return acc + amount;
    }, 0);
  }, [periodData]);

  const totalRevenueBRL = useMemo(() => {
    return totalRevenueCOP * 0.0014;
  }, [totalRevenueCOP]);

  const formatCurrencyCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('COP', '$');
  };

  const formatCurrencyBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  if (isLoading) {
    return (
      <>
        <Skeleton className="h-full bg-muted/50" />
        <Skeleton className="h-full bg-muted/50" />
      </>
    );
  }

  const periodLabel = dateRange.from && dateRange.to
    ? `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`
    : 'Hoje';

  return (
    <>
      {/* Faturamento */}
      <SectionCard color="green" className="h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Faturamento - {periodLabel}
              </h3>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Total em vendas</p>
            </div>
          </div>
        </div>

        {/* COP Value */}
        <div className="mb-4">
          <div className="text-4xl md:text-5xl font-black mb-1 text-foreground">
            {formatCurrencyCOP(totalRevenueCOP)}
          </div>
          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">
            Peso Colombiano (COP)
          </p>
        </div>

        {/* BRL Conversion Box */}
        <div className="p-4 rounded-xl bg-card/40 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-semibold">Conversão BRL</p>
              <div className="text-xl md:text-2xl font-bold text-green-400">
                {formatCurrencyBRL(totalRevenueBRL)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground/70">Taxa: 0.0014</div>
              <div className="flex items-center gap-1 text-green-500 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-semibold">Live</span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Pedidos */}
      <SectionCard color="cyan" className="h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <ShoppingCart className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pedidos - {periodLabel}
              </h3>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Total de pedidos</p>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-lg shadow-cyan-500/50" />
        </div>

        <div className="text-5xl md:text-6xl font-black mb-3 text-foreground">
          {ordersCount}
        </div>

        <div className="flex items-center gap-2 text-cyan-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-semibold">
            {ordersCount} pedido{ordersCount !== 1 ? 's' : ''} no período
          </span>
        </div>
      </SectionCard>
    </>
  );
};
