import { useShopifyRevenuePeriod } from "@/hooks/useShopifyData";
import { useMemo, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { TrendingUp, DollarSign, ShoppingCart, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type PeriodType = 'today' | '3days' | '7days' | '15days' | '30days';

export const DashboardMetrics = () => {
  const [period, setPeriod] = useState<PeriodType>('today');
  const { data: periodData, isLoading } = useShopifyRevenuePeriod(period);

  const periodLabels: Record<PeriodType, string> = {
    today: 'Hoje',
    '3days': 'Últimos 3 Dias',
    '7days': 'Últimos 7 Dias',
    '15days': 'Últimos 15 Dias',
    '30days': 'Últimos 30 Dias'
  };

  const ordersCount = useMemo(() => {
    return periodData?.data?.orders?.edges?.length || 0;
  }, [periodData]);

  const totalRevenueCOP = useMemo(() => {
    if (!periodData?.data?.orders?.edges) return 0;
    
    return periodData.data.orders.edges.reduce((acc: number, edge: any) => {
      // Try both possible field names
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-48 bg-zinc-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-zinc-400" />
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <SelectTrigger className="w-[200px] bg-zinc-900/50 border-zinc-800 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="3days">Últimos 3 Dias</SelectItem>
            <SelectItem value="7days">Últimos 7 Dias</SelectItem>
            <SelectItem value="15days">Últimos 15 Dias</SelectItem>
            <SelectItem value="30days">Últimos 30 Dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Faturamento */}
        <div className="metric-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Faturamento - {periodLabels[period]}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Total em vendas</p>
                </div>
              </div>
            </div>

            {/* COP Value */}
            <div className="mb-4">
              <div className="text-4xl md:text-5xl font-black mb-1 text-white">
                {formatCurrencyCOP(totalRevenueCOP)}
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Peso Colombiano (COP)
              </p>
            </div>

            {/* BRL Conversion Box */}
            <div className="glass-card p-4 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 mb-1 font-semibold">Conversão BRL</p>
                  <div className="text-xl md:text-2xl font-bold text-primary">
                    {formatCurrencyBRL(totalRevenueBRL)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500">Taxa: 0.0014</div>
                  <div className="flex items-center gap-1 text-green-500 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-semibold">Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pedidos */}
        <div className="metric-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Pedidos - {periodLabels[period]}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Total de pedidos</p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
            </div>

            <div className="text-5xl md:text-6xl font-black mb-3 text-white">
              {ordersCount}
            </div>

            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {ordersCount} pedido{ordersCount !== 1 ? 's' : ''} no período
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
