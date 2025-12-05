import { DashboardWrapper } from "@/components/DashboardWrapper";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Activity, MapPin, Users, Eye, Clock, BarChart3, Play, Video } from "lucide-react";
import { SalesChart } from "@/components/SalesChart";
import { useShopifyAnalytics, useShopifyRevenueToday } from "@/hooks/useShopifyData";
import { useMemo, useState } from "react";
import { SalesMap } from "@/components/SalesMap";
import { useDailyComparison, useWeeklyComparison, useMonthlyComparison } from "@/hooks/useComparisonMetrics";
import { ComparisonBadge } from "@/components/ComparisonBadge";
import { VariantPerformance } from "@/components/VariantPerformance";
import { PageHeader } from "@/components/PageHeader";
import { useCurrency } from "@/contexts/CurrencyContext";
import { StatsCard, SectionCard, CardColorVariant } from "@/components/ui/stats-card";
import { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useVturbOverview, useVturbPlayers, parseVturbData, parseVturbPlayers } from "@/hooks/useVturbAnalytics";
import { useVslbioboostVisitors } from "@/hooks/useVslbioboostVisitors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Analises() {
  // Default to the VSL ESPANHOL Colômbia.mp4 video
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>("685ac2f3f4d418e9eca55125");
  
  const { data: analyticsData, isLoading: analyticsLoading } = useShopifyAnalytics();
  const { data: revenueData } = useShopifyRevenueToday();
  const { data: dailyComparison } = useDailyComparison();
  const { data: weeklyComparison } = useWeeklyComparison();
  const { data: monthlyComparison } = useMonthlyComparison();
  const { formatCurrency } = useCurrency();

  // VTurb data
  const { data: vturbPlayersData, isLoading: vturbPlayersLoading } = useVturbPlayers();
  const { data: vturbData, isLoading: vturbLoading, error: vturbError } = useVturbOverview(selectedPlayerId);
  const vturbMetrics = useMemo(() => parseVturbData(vturbData), [vturbData]);
  const { visitorCount } = useVslbioboostVisitors();

  // Parse players list from VTurb response
  const vturbPlayers = useMemo(() => parseVturbPlayers(vturbPlayersData), [vturbPlayersData]);


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
    const conversionRate = vturbMetrics.uniquePlays > 0 
      ? ((ordersCount / vturbMetrics.uniquePlays) * 100).toFixed(2) 
      : "0.00";

    return {
      totalRevenue,
      ordersCount,
      avgOrderValue,
      conversionRate,
      growth: 23.5
    };
  }, [revenueData, vturbMetrics]);

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
      title: "VSL Online",
      value: visitorCount.toLocaleString('pt-BR'),
      change: "ao vivo",
      isPositive: true,
      icon: Eye,
      color: "orange",
    }
  ];

  // Format session duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

        {/* VTurb Analytics Section */}
        <SectionCard title="Métricas do Vídeo (VTurb)" icon={Video} color="red" className="mb-8">
          {vturbLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : vturbError ? (
            <div className="text-center py-8 text-red-400">
              <p>Conectando ao VTurb...</p>
              <p className="text-xs text-gray-500 mt-2">Verifique se a API Key está configurada corretamente</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Visualizações */}
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {vturbMetrics.totalViews.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Visualizações
                </div>
              </div>

              {/* Visualizações Únicas */}
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {vturbMetrics.uniqueViews.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Visualizações Únicas
                </div>
              </div>

              {/* Plays */}
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {vturbMetrics.totalPlays.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Plays
                </div>
              </div>

              {/* Plays Únicos */}
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {vturbMetrics.uniquePlays.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Plays Únicos
                </div>
              </div>

              {/* Play Rate */}
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {vturbMetrics.playRate.toFixed(2).replace('.', ',')}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Play Rate
                </div>
              </div>

              {/* Retenção ao Pitch */}
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {vturbMetrics.overPitchRate.toFixed(2).replace('.', ',')}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Retenção ao Pitch
                </div>
              </div>

              {/* Engajamento */}
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {vturbMetrics.engagementRate.toFixed(2).replace('.', ',')}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Engajamento
                </div>
              </div>

              {/* Cliques no Botão */}
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {vturbMetrics.uniqueClicks.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Cliques no Botão
                </div>
              </div>

              {/* Conversões */}
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {metrics.ordersCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Conversões
                </div>
              </div>

              {/* Taxa de Conversão */}
              <div className="p-4 rounded-lg bg-card/50 border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {vturbMetrics.uniquePlays > 0 
                    ? ((metrics.ordersCount / vturbMetrics.uniquePlays) * 100).toFixed(2).replace('.', ',')
                    : '0,00'}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Taxa de Conversão
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Charts Section */}
        <div className="mb-8">
          <SectionCard color="cyan">
            <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
          </SectionCard>
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
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-wider mb-4">Hoje vs Ontem</h3>
            {dailyComparison && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Receita</span>
                    <ComparisonBadge 
                      changePercent={dailyComparison.revenue.changePercent}
                      isPositive={dailyComparison.revenue.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black text-green-400">
                    {formatCurrency(dailyComparison.revenue.current)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Pedidos</span>
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
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-wider mb-4">Semana Atual vs Anterior</h3>
            {weeklyComparison && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Receita</span>
                    <ComparisonBadge 
                      changePercent={weeklyComparison.revenue.changePercent}
                      isPositive={weeklyComparison.revenue.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black text-purple-400">
                    {formatCurrency(weeklyComparison.revenue.current)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Pedidos</span>
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
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-wider mb-4">Mês Atual vs Anterior</h3>
            {monthlyComparison && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Receita</span>
                    <ComparisonBadge 
                      changePercent={monthlyComparison.revenue.changePercent}
                      isPositive={monthlyComparison.revenue.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black text-primary">
                    {formatCurrency(monthlyComparison.revenue.current)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Pedidos</span>
                    <ComparisonBadge 
                      changePercent={monthlyComparison.orders.changePercent}
                      isPositive={monthlyComparison.orders.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-2xl font-black text-primary">
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
