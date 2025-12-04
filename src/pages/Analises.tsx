import { DashboardWrapper } from "@/components/DashboardWrapper";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Activity, MapPin } from "lucide-react";
import { SalesChart } from "@/components/SalesChart";
import { useShopifyAnalytics, useShopifyRevenueToday } from "@/hooks/useShopifyData";
import { useMemo } from "react";
import { SalesMap } from "@/components/SalesMap";
import { useDailyComparison, useWeeklyComparison, useMonthlyComparison } from "@/hooks/useComparisonMetrics";
import { ComparisonBadge } from "@/components/ComparisonBadge";
import { VariantPerformance } from "@/components/VariantPerformance";
import { PageHeader } from "@/components/PageHeader";
import { useCurrency } from "@/contexts/CurrencyContext";
import { GlowingCard } from "@/components/ui/glowing-card";

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
    const conversionRate = 12.5; // Mock data
    const activeUsers = Math.floor(ordersCount * 0.85);

    return {
      totalRevenue,
      ordersCount,
      avgOrderValue,
      conversionRate,
      activeUsers,
      growth: 23.5 // Mock growth percentage
    };
  }, [revenueData]);

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      change: `+${metrics.growth}%`,
      isPositive: true,
      icon: DollarSign,
      color: "from-cyan-500 to-blue-500",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30"
    },
    {
      title: "Total Orders",
      value: metrics.ordersCount.toString(),
      change: "+18.2%",
      isPositive: true,
      icon: ShoppingCart,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30"
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(metrics.avgOrderValue),
      change: "+5.4%",
      isPositive: true,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30"
    },
    {
      title: "Conversion Rate",
      value: `${metrics.conversionRate}%`,
      change: "-2.1%",
      isPositive: false,
      icon: Activity,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30"
    }
  ];

  return (
    <DashboardWrapper>
      <div className="container mx-auto p-6 md:p-8 lg:p-12 min-h-screen">
        {/* Header */}
        <PageHeader 
          title="Analytics Command"
          subtitle="Monitoramento de desempenho em tempo real"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <GlowingCard key={index}>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${stat.bgColor} border ${stat.borderColor}`}>
                    <Icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold ${stat.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.change}
                  </div>
                </div>
                
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </div>
                <div className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
                  {stat.value}
                </div>
              </GlowingCard>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Sales Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="p-6 rounded-2xl bg-black/80 border-2 border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
              <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
            </div>
          </div>

          {/* Side Stats */}
          <div className="space-y-6">
            {/* Performance Score */}
            <div className="p-6 rounded-2xl bg-black/80 border-2 border-purple-500/30 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-black text-purple-400 uppercase tracking-wider">Performance Score</h3>
              </div>
              
              <div className="relative">
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  94
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Excellent</div>
                
                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '94%' }} />
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="p-6 rounded-2xl bg-black/80 border-2 border-green-500/30 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-green-400" />
                <h3 className="text-sm font-black text-green-400 uppercase tracking-wider">Active Now</h3>
              </div>
              
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                {metrics.activeUsers}
              </div>
              <div className="text-xs text-gray-400">Users shopping right now</div>
              
              {/* Pulse indicator */}
              <div className="flex items-center gap-2 mt-4">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <span className="text-xs text-green-400 font-bold">LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Bounce Rate", value: "32.4%", color: "text-orange-400" },
            { label: "Session Duration", value: "4:32", color: "text-cyan-400" },
            { label: "Pages/Session", value: "5.2", color: "text-purple-400" },
            { label: "Return Rate", value: "68%", color: "text-green-400" }
          ].map((item, index) => (
            <div key={index} className="p-4 rounded-xl bg-black/60 border border-cyan-500/20 backdrop-blur-xl">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{item.label}</div>
              <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Sales Map Section */}
        <div className="mb-8">
          <div className="p-6 rounded-2xl bg-black/80 border-2 border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-6 w-6 text-cyan-400" />
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Mapa de Vendas
              </h2>
            </div>
            <SalesMap />
          </div>
        </div>

        {/* Variant Performance Section */}
        <div className="mb-8">
          <VariantPerformance />
        </div>

        {/* Temporal Comparisons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Comparison */}
          <div className="p-6 rounded-2xl bg-black/80 border-2 border-green-500/30 backdrop-blur-xl">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Hoje vs Ontem</h3>
            {dailyComparison && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Revenue</span>
                    <ComparisonBadge 
                      changePercent={dailyComparison.revenue.changePercent}
                      isPositive={dailyComparison.revenue.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
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
          </div>

          {/* Weekly Comparison */}
          <div className="p-6 rounded-2xl bg-black/80 border-2 border-purple-500/30 backdrop-blur-xl">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Semana Atual vs Anterior</h3>
            {weeklyComparison && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Revenue</span>
                    <ComparisonBadge 
                      changePercent={weeklyComparison.revenue.changePercent}
                      isPositive={weeklyComparison.revenue.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
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
          </div>

          {/* Monthly Comparison */}
          <div className="p-6 rounded-2xl bg-black/80 border-2 border-cyan-500/30 backdrop-blur-xl">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Mês Atual vs Anterior</h3>
            {monthlyComparison && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Revenue</span>
                    <ComparisonBadge 
                      changePercent={monthlyComparison.revenue.changePercent}
                      isPositive={monthlyComparison.revenue.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
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
          </div>
        </div>
      </div>
    </DashboardWrapper>
  );
}