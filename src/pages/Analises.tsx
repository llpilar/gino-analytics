import { DashboardWrapper } from "@/components/DashboardWrapper";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Activity, MapPin } from "lucide-react";
import { SalesChart } from "@/components/SalesChart";
import { useShopifyAnalytics, useShopifyRevenueToday } from "@/hooks/useShopifyData";
import { useMemo } from "react";
import { SalesMap } from "@/components/SalesMap";
import { useDailyComparison, useWeeklyComparison, useMonthlyComparison } from "@/hooks/useComparisonMetrics";
import { ComparisonBadge } from "@/components/ComparisonBadge";
import { VariantPerformance } from "@/components/VariantPerformance";
import { PageHeader } from "@/components/PageHeader";
import { useCurrency } from "@/contexts/CurrencyContext";
import { StatsCard, SectionCard, CardColorVariant } from "@/components/ui/stats-card";
import { LucideIcon } from "lucide-react";

export default function Analises() {
  const { data: analyticsData, isLoading: analyticsLoading } = useShopifyAnalytics();
  const { data: revenueData } = useShopifyRevenueToday();
  const { data: dailyComparison } = useDailyComparison();
  const { data: weeklyComparison } = useWeeklyComparison();
  const { data: monthlyComparison } = useMonthlyComparison();
  const { formatCurrency } = useCurrency();

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = revenueData?.data?.orders?.edges?.reduce((acc: number, edge: any) => {
      const amount = parseFloat(
        edge.node.currentTotalPriceSet?.shopMoney?.amount || 
        edge.node.totalPriceSet?.shopMoney?.amount || 
        '0'
      );
      return acc + amount;
    }, 0) || 0;

    const ordersCount = revenueData?.data?.orders?.edges?.length || 0;
    const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;
    const conversionRate = 12.5;
    const activeUsers = Math.floor(ordersCount * 0.85);

    return {
      totalRevenue,
      ordersCount,
      avgOrderValue,
      conversionRate,
      activeUsers,
      growth: 23.5
    };
  }, [revenueData]);

  const statCards: { title: string; value: string; change: string; isPositive: boolean; icon: LucideIcon; color: CardColorVariant }[] = [
    {
      title: "Receita Total",
      value: formatCurrency(metrics.totalRevenue),
      change: `+${metrics.growth}%`,
      isPositive: true,
      icon: DollarSign,
      color: "cyan",
    },
    {
      title: "Total de Pedidos",
      value: metrics.ordersCount.toString(),
      change: "+18.2%",
      isPositive: true,
      icon: ShoppingCart,
      color: "purple",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(metrics.avgOrderValue),
      change: "+5.4%",
      isPositive: true,
      icon: TrendingUp,
      color: "green",
    },
    {
      title: "Taxa de Conversão",
      value: `${metrics.conversionRate}%`,
      change: "-2.1%",
      isPositive: false,
      icon: Activity,
      color: "orange",
    }
  ];

  return (
    <DashboardWrapper>
      <div className="container mx-auto p-6 md:p-8 lg:p-12 min-h-screen">
        {/* Header */}
        <PageHeader 
          title="Central de Análises"
          subtitle="Monitoramento de desempenho em tempo real"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              subtitle={stat.change}
              subtitleColor={stat.isPositive ? 'text-green-400' : 'text-red-400'}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="mb-8">
          <SectionCard color="cyan">
            <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
          </SectionCard>
        </div>

        {/* Bottom Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Taxa de Rejeição", value: "32.4%", color: "text-orange-400" },
            { label: "Duração da Sessão", value: "4:32", color: "text-cyan-400" },
            { label: "Páginas/Sessão", value: "5.2", color: "text-purple-400" },
            { label: "Taxa de Retorno", value: "68%", color: "text-green-400" }
          ].map((item, index) => (
            <div key={index} className="p-4 rounded-2xl bg-black/80 border-2 border-cyan-500/30 backdrop-blur-xl">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{item.label}</div>
              <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Sales Map Section */}
        <div className="mb-8">
          <SectionCard title="Mapa de Vendas" icon={MapPin} color="cyan">
            <SalesMap />
          </SectionCard>
        </div>

        {/* Variant Performance Section */}
        <div className="mb-8">
          <VariantPerformance />
        </div>

        {/* Temporal Comparisons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Comparison */}
          <SectionCard color="green">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Hoje vs Ontem</h3>
            {dailyComparison && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Receita</span>
                    <ComparisonBadge 
                      changePercent={dailyComparison.revenue.changePercent}
                      isPositive={dailyComparison.revenue.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black gradient-text-green">
                    {formatCurrency(dailyComparison.revenue.current)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Pedidos</span>
                    <ComparisonBadge 
                      changePercent={dailyComparison.orders.changePercent}
                      isPositive={dailyComparison.orders.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black text-green-400">
                    {dailyComparison.orders.current}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Weekly Comparison */}
          <SectionCard color="purple">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Semana Atual vs Anterior</h3>
            {weeklyComparison && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Receita</span>
                    <ComparisonBadge 
                      changePercent={weeklyComparison.revenue.changePercent}
                      isPositive={weeklyComparison.revenue.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black gradient-text-purple">
                    {formatCurrency(weeklyComparison.revenue.current)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Pedidos</span>
                    <ComparisonBadge 
                      changePercent={weeklyComparison.orders.changePercent}
                      isPositive={weeklyComparison.orders.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black text-purple-400">
                    {weeklyComparison.orders.current}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Monthly Comparison */}
          <SectionCard color="cyan">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Mês Atual vs Anterior</h3>
            {monthlyComparison && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Receita</span>
                    <ComparisonBadge 
                      changePercent={monthlyComparison.revenue.changePercent}
                      isPositive={monthlyComparison.revenue.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black gradient-text-cyan">
                    {formatCurrency(monthlyComparison.revenue.current)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Pedidos</span>
                    <ComparisonBadge 
                      changePercent={monthlyComparison.orders.changePercent}
                      isPositive={monthlyComparison.orders.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black text-cyan-400">
                    {monthlyComparison.orders.current}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </DashboardWrapper>
  );
}