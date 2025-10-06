import { useShopifyOrdersToday, useShopifyRevenueToday } from "@/hooks/useShopifyData";
import { useMemo } from "react";
import { Skeleton } from "./ui/skeleton";
import { TrendingUp } from "lucide-react";

export const DashboardMetrics = () => {
  const { data: ordersData, isLoading: ordersLoading } = useShopifyOrdersToday();
  const { data: revenueData, isLoading: revenueLoading } = useShopifyRevenueToday();

  const ordersCount = useMemo(() => {
    return ordersData?.data?.orders?.edges?.length || 0;
  }, [ordersData]);

  const totalRevenueCOP = useMemo(() => {
    if (!revenueData?.data?.orders?.edges) return 0;
    
    return revenueData.data.orders.edges.reduce((acc: number, edge: any) => {
      const amount = parseFloat(edge.node.currentTotalPriceSet?.shopMoney?.amount || '0');
      return acc + amount;
    }, 0);
  }, [revenueData]);

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

  if (ordersLoading || revenueLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Pedidos de Hoje */}
      <div className="glass-card group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
              Pedidos de Hoje
            </h3>
          </div>
        </div>

        <div className="text-6xl font-black mb-4 text-white neon-glow">
          {ordersCount}
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {ordersCount} pedido{ordersCount !== 1 ? 's' : ''} criado{ordersCount !== 1 ? 's' : ''} hoje
        </p>

        <div className="flex items-center gap-2 text-primary">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm font-bold">Tempo real</span>
        </div>
      </div>

      {/* Faturamento de Hoje */}
      <div className="glass-card group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
              Faturamento de Hoje
            </h3>
          </div>
        </div>

        {/* COP Value */}
        <div className="mb-6">
          <div className="text-5xl font-black mb-2 text-white">
            {formatCurrencyCOP(totalRevenueCOP)}
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Peso Colombiano (COP)
          </p>
        </div>

        {/* BRL Conversion Box */}
        <div className="liquid-glass rounded-xl p-4 border border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Conversão BRL</p>
              <div className="text-2xl font-bold text-primary neon-glow">
                {formatCurrencyBRL(totalRevenueBRL)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              <div>Taxa: 0.0014</div>
              <div className="flex items-center gap-1 text-green-500 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
