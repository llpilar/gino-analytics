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
import { useGoogleAnalyticsOverview, useGoogleAnalyticsRealtime, parseGAOverviewData, parseGARealtimeData } from "@/hooks/useGoogleAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { useVturbOverview, useVturbPlayers, parseVturbData, parseVturbPlayers } from "@/hooks/useVturbAnalytics";
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

  // Google Analytics data
  const { data: gaOverviewData, isLoading: gaLoading, error: gaError } = useGoogleAnalyticsOverview();
  const { data: gaRealtimeData } = useGoogleAnalyticsRealtime();

  // VTurb data
  const { data: vturbPlayersData, isLoading: vturbPlayersLoading } = useVturbPlayers();
  const { data: vturbData, isLoading: vturbLoading, error: vturbError } = useVturbOverview(selectedPlayerId);
  const vturbMetrics = useMemo(() => parseVturbData(vturbData), [vturbData]);

  // Parse players list from VTurb response
  const vturbPlayers = useMemo(() => parseVturbPlayers(vturbPlayersData), [vturbPlayersData]);

  const gaMetrics = useMemo(() => parseGAOverviewData(gaOverviewData), [gaOverviewData]);
  const gaRealtime = useMemo(() => parseGARealtimeData(gaRealtimeData), [gaRealtimeData]);

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
    const conversionRate = gaMetrics.totalUsers > 0 
      ? ((ordersCount / gaMetrics.totalUsers) * 100).toFixed(2) 
      : "0.00";

    return {
      totalRevenue,
      ordersCount,
      avgOrderValue,
      conversionRate,
      growth: 23.5
    };
  }, [revenueData, gaMetrics]);

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
      value: gaRealtime.activeUsers.toString(),
      change: "últimos 30 min",
      isPositive: true,
      icon: Activity,
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

        {/* Google Analytics Section */}
        <SectionCard title="Métricas da VSL (Google Analytics)" icon={BarChart3} color="purple" className="mb-8">
          {gaLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : gaError ? (
            <div className="text-center py-8 text-red-400">
              <p>Erro ao carregar dados do Google Analytics</p>
              <p className="text-xs text-gray-500 mt-2">Verifique se a conta de serviço tem acesso à propriedade GA4</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-xl bg-black/60 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-500 uppercase">Usuários Ativos (30 min)</span>
                </div>
                <div className="text-2xl font-black text-purple-400">
                  {gaRealtime.activeUsers > 0 ? gaRealtime.activeUsers : gaMetrics.totalUsers}
                </div>
                {gaRealtime.activeUsers > 0 && (
                  <div className="text-xs text-green-400 mt-1">● Tempo real</div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-gray-500 uppercase">Sessões</span>
                </div>
                <div className="text-2xl font-black text-cyan-400">
                  {gaMetrics.totalSessions.toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-500 uppercase">Visualizações</span>
                </div>
                <div className="text-2xl font-black text-green-400">
                  {gaMetrics.totalPageViews.toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-gray-500 uppercase">Duração Média</span>
                </div>
                <div className="text-2xl font-black text-orange-400">
                  {formatDuration(gaMetrics.avgSessionDuration)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-red-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-gray-500 uppercase">Taxa Rejeição</span>
                </div>
                <div className="text-2xl font-black text-red-400">
                  {(gaMetrics.bounceRate * 100).toFixed(1)}%
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-500 uppercase">Novos Usuários</span>
                </div>
                <div className="text-2xl font-black text-yellow-400">
                  {gaMetrics.newUsers.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* VTurb Analytics Section */}
        <SectionCard title="Métricas do Vídeo (VTurb)" icon={Video} color="orange" className="mb-8">
          {/* Video Selector */}
          <div className="mb-4">
            <Select value={selectedPlayerId || "all"} onValueChange={(value) => setSelectedPlayerId(value === "all" ? undefined : value)}>
              <SelectTrigger className="w-full md:w-[300px] bg-black/60 border-orange-500/30">
                <SelectValue placeholder="Selecione um vídeo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vídeos</SelectItem>
                {vturbPlayers.map((player) => (
                  <SelectItem key={player.player_id} value={player.player_id}>
                    {player.player_name || player.player_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {vturbPlayersLoading && (
              <span className="text-xs text-gray-500 ml-2">Carregando vídeos...</span>
            )}
          </div>

          {vturbLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : vturbError ? (
            <div className="text-center py-8 text-yellow-400">
              <p>Conectando ao VTurb...</p>
              <p className="text-xs text-gray-500 mt-2">Verifique se a API Key está configurada corretamente</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-black/60 border border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-gray-500 uppercase">Total de Plays</span>
                </div>
                <div className="text-2xl font-black text-orange-400">
                  {vturbMetrics.totalPlays.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {vturbMetrics.uniquePlays.toLocaleString()} únicos
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-gray-500 uppercase">Total de Views</span>
                </div>
                <div className="text-2xl font-black text-cyan-400">
                  {vturbMetrics.totalViews.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {vturbMetrics.uniqueViews.toLocaleString()} únicos
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-500 uppercase">Finalizados</span>
                </div>
                <div className="text-2xl font-black text-green-400">
                  {vturbMetrics.totalFinished.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {vturbMetrics.uniqueFinished.toLocaleString()} únicos
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-500 uppercase">Taxa de Retenção</span>
                </div>
                <div className="text-2xl font-black text-purple-400">
                  {vturbMetrics.retentionRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  finalizaram o vídeo
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-500 uppercase">Taxa de Play</span>
                </div>
                <div className="text-2xl font-black text-yellow-400">
                  {vturbMetrics.totalViews > 0 
                    ? ((vturbMetrics.totalPlays / vturbMetrics.totalViews) * 100).toFixed(1)
                    : '0.0'}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  clicaram em play
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
