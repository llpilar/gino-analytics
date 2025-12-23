import { DashboardWrapper } from "@/components/DashboardWrapper";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Activity, MapPin, Users, Eye, Clock, BarChart3, Play, Video } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { useVturbOverview, useVturbListPlayers, parseVturbData } from "@/hooks/useVturbAnalytics";
import { useGA4Visitors } from "@/hooks/useGA4Visitors";
import { VslPlayerSelector } from "@/components/VslPlayerSelector";
import { ConversionFunnel } from "@/components/ConversionFunnel";
import { RealTimeAnalytics } from "@/components/ui/real-time-analytics";

export default function Analises() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>(undefined);
  
  const { data: analyticsData, isLoading: analyticsLoading } = useShopifyAnalytics();
  const { data: revenueData } = useShopifyRevenueToday();
  const { data: dailyComparison } = useDailyComparison();
  const { data: weeklyComparison } = useWeeklyComparison();
  const { data: monthlyComparison } = useMonthlyComparison();
  const { formatCurrency } = useCurrency();

  // VTurb data - fetch list of players
  const { data: vturbPlayersList, isLoading: vturbPlayersLoading } = useVturbListPlayers();
  const { data: vturbData, isLoading: vturbLoading, error: vturbError } = useVturbOverview(selectedPlayerId);
  const vturbMetrics = useMemo(() => parseVturbData(vturbData), [vturbData]);
  const { visitorCount } = useGA4Visitors();


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

  const statCards: { title: string; value: string; change: string; isPositive: boolean; icon: LucideIcon; color: CardColorVariant; description: string }[] = [
    {
      title: "Receita Total",
      value: formatCurrency(metrics.totalRevenue),
      change: `+${metrics.growth}%`,
      isPositive: true,
      icon: DollarSign,
      color: "cyan",
      description: "Faturamento total do dia",
    },
    {
      title: "Total de Pedidos",
      value: metrics.ordersCount.toString(),
      change: "+18.2%",
      isPositive: true,
      icon: ShoppingCart,
      color: "purple",
      description: "Pedidos realizados hoje",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(metrics.avgOrderValue),
      change: "+5.4%",
      isPositive: true,
      icon: TrendingUp,
      color: "green",
      description: "Valor médio por pedido",
    },
    {
      title: "VSL Online",
      value: visitorCount.toLocaleString('pt-BR'),
      change: "ao vivo",
      isPositive: true,
      icon: Eye,
      color: "orange",
      description: "Visitantes ativos no GA4 (5 min)",
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
      <div className="w-full max-w-[2400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 md:py-6 lg:py-8 min-h-screen pb-24 md:pb-12">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <PageHeader 
            title="Central de Análises"
            subtitle="Monitoramento de desempenho em tempo real"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {statCards.map((stat, index) => (
            <Tooltip key={index} delayDuration={1000}>
              <TooltipTrigger asChild>
                <div>
                  <StatsCard
                    title={stat.title}
                    value={stat.value}
                    subtitle={stat.change}
                    subtitleColor={stat.isPositive ? 'text-chart-4' : 'text-destructive'}
                    icon={stat.icon}
                    color={stat.color}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{stat.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* VTurb Analytics Section */}
        <SectionCard 
          title="Métricas do Vídeo (VTurb)" 
          icon={Video} 
          color="red" 
          className="mb-6 md:mb-8"
          headerAction={
            <VslPlayerSelector
              players={vturbPlayersList || []}
              selectedPlayerId={selectedPlayerId}
              onPlayerChange={setSelectedPlayerId}
              isLoading={vturbPlayersLoading}
            />
          }
        >
          {vturbLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 md:h-20 rounded-lg" />
              ))}
            </div>
          ) : vturbError ? (
            <div className="text-center py-6 md:py-8 text-destructive">
              <p className="text-sm md:text-base">Conectando ao VTurb...</p>
              <p className="text-xs text-muted-foreground mt-2">Verifique se a API Key está configurada corretamente</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <div className="p-3 md:p-4 rounded-lg bg-card/50 border border-border cursor-default">
                    <div className="text-lg md:text-2xl font-bold text-foreground">{vturbMetrics.totalViews.toLocaleString('pt-BR')}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Visualizações</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Total de carregamentos da página</p></TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <div className="p-3 md:p-4 rounded-lg bg-card/50 border border-border cursor-default">
                    <div className="text-lg md:text-2xl font-bold text-foreground">{vturbMetrics.uniqueViews.toLocaleString('pt-BR')}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Views Únicos</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Visitantes únicos na página</p></TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <div className="p-3 md:p-4 rounded-lg bg-card/50 border border-border cursor-default">
                    <div className="text-lg md:text-2xl font-bold text-foreground">{vturbMetrics.totalPlays.toLocaleString('pt-BR')}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Plays</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Vezes que o vídeo foi iniciado</p></TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <div className="p-3 md:p-4 rounded-lg bg-card/50 border border-border cursor-default">
                    <div className="text-lg md:text-2xl font-bold text-foreground">{vturbMetrics.uniquePlays.toLocaleString('pt-BR')}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Plays Únicos</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Pessoas únicas que deram play</p></TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <div className="p-3 md:p-4 rounded-lg bg-card/50 border border-border cursor-default">
                    <div className="text-lg md:text-2xl font-bold text-foreground">{vturbMetrics.playRate.toFixed(2).replace('.', ',')}%</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Play Rate</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>% que deu play ao visitar</p></TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <div className="p-3 md:p-4 rounded-lg bg-card/50 border border-border cursor-default">
                    <div className="text-lg md:text-2xl font-bold text-foreground">{vturbMetrics.overPitchRate.toFixed(2).replace('.', ',')}%</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Ret. Pitch</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>% que assistiu até o pitch</p></TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <div className="p-3 md:p-4 rounded-lg bg-card/50 border border-border cursor-default">
                    <div className="text-lg md:text-2xl font-bold text-foreground">{vturbMetrics.engagementRate.toFixed(2).replace('.', ',')}%</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Engajamento</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Nível de interação com o vídeo</p></TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <div className="p-3 md:p-4 rounded-lg bg-card/50 border border-border cursor-default">
                    <div className="text-lg md:text-2xl font-bold text-foreground">{vturbMetrics.uniqueClicks.toLocaleString('pt-BR')}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Cliques CTA</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Cliques únicos no CTA</p></TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <div className="p-3 md:p-4 rounded-lg bg-card/50 border border-border cursor-default">
                    <div className="text-lg md:text-2xl font-bold text-foreground">{metrics.ordersCount}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Conversões</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Pedidos finalizados</p></TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <div className="p-3 md:p-4 rounded-lg bg-card/50 border border-border cursor-default">
                    <div className="text-lg md:text-2xl font-bold text-foreground">
                      {vturbMetrics.uniquePlays > 0 ? ((metrics.ordersCount / vturbMetrics.uniquePlays) * 100).toFixed(2).replace('.', ',') : '0,00'}%
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">Tx Conversão</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Conversões / Plays únicos</p></TooltipContent>
              </Tooltip>
            </div>
          )}
        </SectionCard>

        {/* Conversion Funnel */}
        <ConversionFunnel 
          visits={vturbMetrics.uniqueViews}
          plays={vturbMetrics.uniquePlays}
          clicks={vturbMetrics.uniqueClicks}
          orders={metrics.ordersCount}
        />

        {/* Charts Section */}
        <div className="mb-6 md:mb-8">
          <SectionCard color="cyan">
            <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
          </SectionCard>
        </div>


        {/* Sales Map Section */}
        <div className="mb-6 md:mb-8">
          <SectionCard title="Mapa de Vendas" icon={MapPin} color="cyan">
            <SalesMap />
          </SectionCard>
        </div>


        {/* Variant Performance Section */}
        <div className="mb-6 md:mb-8">
          <VariantPerformance />
        </div>

        {/* Temporal Comparisons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Daily Comparison */}
          <SectionCard color="cyan">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Hoje vs Ontem</h3>
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
                  <div className="text-2xl font-bold text-foreground">
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
                  <div className="text-2xl font-bold text-foreground">
                    {dailyComparison.orders.current}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Weekly Comparison */}
          <SectionCard color="cyan">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Semana Atual vs Anterior</h3>
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
                  <div className="text-2xl font-bold text-foreground">
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
                  <div className="text-2xl font-bold text-foreground">
                    {weeklyComparison.orders.current}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Monthly Comparison */}
          <SectionCard color="cyan">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Mês Atual vs Anterior</h3>
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
                  <div className="text-2xl font-bold text-foreground">
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
                  <div className="text-2xl font-bold text-foreground">
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
