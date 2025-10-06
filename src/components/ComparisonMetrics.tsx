import { useShopifyRevenueToday, useShopifyRevenueYesterday } from "@/hooks/useShopifyData";
import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export const ComparisonMetrics = () => {
  const { data: todayData } = useShopifyRevenueToday();
  const { data: yesterdayData } = useShopifyRevenueYesterday();

  const { todayRevenue, yesterdayRevenue, difference, isIncrease } = useMemo(() => {
    const today = todayData?.data?.orders?.edges?.reduce((acc: number, edge: any) => {
      return acc + parseFloat(edge.node.currentTotalPriceSet?.shopMoney?.amount || '0');
    }, 0) || 0;

    const yesterday = yesterdayData?.data?.orders?.edges?.reduce((acc: number, edge: any) => {
      return acc + parseFloat(edge.node.currentTotalPriceSet?.shopMoney?.amount || '0');
    }, 0) || 0;

    console.log('Comparativo Diário - Hoje (COP):', today, 'Ontem (COP):', yesterday);
    console.log('Total de pedidos hoje:', todayData?.data?.orders?.edges?.length);
    console.log('Total de pedidos ontem:', yesterdayData?.data?.orders?.edges?.length);

    // Calcular a diferença: Hoje - Ontem
    const diff = today - yesterday;
    
    console.log('Diferença (Hoje - Ontem):', diff);
    
    return {
      todayRevenue: today,
      yesterdayRevenue: yesterday,
      difference: Math.abs(diff),
      isIncrease: diff >= 0
    };
  }, [todayData, yesterdayData]);

  if (yesterdayRevenue === 0 && todayRevenue === 0) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="glass-card p-4 border-zinc-800">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isIncrease ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
        }`}>
          {isIncrease ? (
            <TrendingUp className="w-5 h-5 text-green-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-zinc-400 mb-1">Comparativo Diário</p>
          <p className={`text-base font-bold ${isIncrease ? 'text-green-500' : 'text-red-500'}`}>
            {isIncrease ? '+' : '-'}{formatCurrency(difference)} vs ontem
          </p>
        </div>
      </div>
    </div>
  );
};
