import { useShopifyRevenueToday, useShopifyRevenueYesterday } from "@/hooks/useShopifyData";
import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export const ComparisonMetrics = () => {
  const { data: todayData } = useShopifyRevenueToday();
  const { data: yesterdayData } = useShopifyRevenueYesterday();

  const { todayRevenue, yesterdayRevenue, percentageChange, isIncrease } = useMemo(() => {
    const today = todayData?.data?.orders?.edges?.reduce((acc: number, edge: any) => {
      return acc + parseFloat(edge.node.currentTotalPriceSet?.shopMoney?.amount || '0');
    }, 0) || 0;

    const yesterday = yesterdayData?.data?.orders?.edges?.reduce((acc: number, edge: any) => {
      return acc + parseFloat(edge.node.currentTotalPriceSet?.shopMoney?.amount || '0');
    }, 0) || 0;

    const change = yesterday > 0 ? ((today - yesterday) / yesterday) * 100 : 0;
    
    return {
      todayRevenue: today,
      yesterdayRevenue: yesterday,
      percentageChange: Math.abs(change),
      isIncrease: change >= 0
    };
  }, [todayData, yesterdayData]);

  if (yesterdayRevenue === 0) return null;

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
            {isIncrease ? '+' : '-'}{percentageChange.toFixed(1)}% vs ontem
          </p>
        </div>
      </div>
    </div>
  );
};
