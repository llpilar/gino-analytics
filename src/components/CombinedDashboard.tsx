import { useMemo, useState, useEffect } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { DollarSign, ShoppingCart, TrendingUp, Eye, Video, MapPin, Zap, Users, Megaphone, Target, Monitor, LayoutGrid, Layers } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SalesChart } from "@/components/SalesChart";
import { useShopifyAnalytics, useShopifyRevenueToday } from "@/hooks/useShopifyData";
import { SalesMap } from "@/components/SalesMap";
import { useDailyComparison } from "@/hooks/useComparisonMetrics";
import { ComparisonBadge } from "@/components/ComparisonBadge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { StatsCard, SectionCard, CardColorVariant } from "@/components/ui/stats-card";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useVturbOverview, parseVturbData } from "@/hooks/useVturbAnalytics";
import { useGA4Visitors } from "@/hooks/useGA4Visitors";
import { useFacebookAdsToday } from "@/hooks/useFacebookAdsToday";
import { ConversionFunnel } from "@/components/ConversionFunnel";
import { differenceInMinutes, isToday } from "date-fns";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useDashboardSettings } from "@/contexts/DashboardSettingsContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CombinedDashboard = () => {
  const [isMobile, setIsMobile] = useState(false);
  const { data: analyticsData, isLoading: analyticsLoading } = useShopifyAnalytics();
  const { data: revenueData, isLoading: revenueLoading } = useShopifyRevenueToday();
  const { data: dailyComparison } = useDailyComparison();
  const { formatCurrency } = useCurrency();
  const { dateRange } = useDateFilter();
  const { visitorCount } = useGA4Visitors();
  const { data: facebookAdsData } = useFacebookAdsToday();
  const { viewMode, setViewMode } = useDashboardSettings();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1280);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  // VTurb data
  const { data: vturbData, isLoading: vturbLoading } = useVturbOverview("685ac2f3f4d418e9eca55125");
  const vturbMetrics = useMemo(() => parseVturbData(vturbData), [vturbData]);

  // Calculate metrics
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

  // Calculate sales per minute
  const now = new Date();
  const calculateMinutesElapsed = () => {
    if (!dateRange.from || !dateRange.to) return 1;
    const rangeStart = dateRange.from;
    const rangeEnd = dateRange.to;
    if (isToday(rangeEnd)) {
      return Math.max(1, differenceInMinutes(now, rangeStart));
    }
    return Math.max(1, differenceInMinutes(rangeEnd, rangeStart));
  };
  const minutesElapsed = calculateMinutesElapsed();
  const salesPerMinute = totalRevenue > 0 ? totalRevenue / minutesElapsed : 0;

  // Ad metrics
  const adSpend = facebookAdsData?.spend || 0;
  const roas = adSpend > 0 ? totalRevenue / adSpend : 0;

  const mainStats: { title: string; value: string; icon: LucideIcon; color: CardColorVariant; description: string }[] = [
    { title: "Receita", value: formatCurrency(totalRevenue), icon: DollarSign, color: "cyan", description: "Faturamento total" },
    { title: "Pedidos", value: ordersCount.toString(), icon: ShoppingCart, color: "green", description: "Total de pedidos" },
    { title: "Ticket Médio", value: formatCurrency(avgOrderValue), icon: TrendingUp, color: "purple", description: "Valor médio" },
    { title: "VSL Online", value: visitorCount.toLocaleString('pt-BR'), icon: Eye, color: "orange", description: "Visitantes ativos" },
    { title: "R$/min", value: formatCurrency(salesPerMinute), icon: Zap, color: "pink", description: "Receita por minuto" },
    { title: "Gasto Ads", value: formatCurrency(adSpend), icon: Megaphone, color: "red", description: "Investimento em ads" },
  ];

  if (revenueLoading) {
    return (
      <DashboardWrapper>
        <div className="container mx-auto px-3 py-4 min-h-screen">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      {/* Layout Toggle */}
      {!isMobile && (
        <div className="fixed top-4 left-4 z-40">
          <div className="flex items-center gap-1 p-1 rounded-full bg-card border border-primary/30 backdrop-blur-xl">
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("normal")}
                  className="rounded-full h-8 px-3 transition-all text-muted-foreground hover:text-foreground"
                  aria-label="Layout orbital"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Orbital</p></TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("compact")}
                  className="rounded-full h-8 px-3 transition-all text-muted-foreground hover:text-foreground"
                  aria-label="Layout grade"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Grade</p></TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("combined")}
                  className={cn(
                    "rounded-full h-8 px-3 transition-all",
                    viewMode === "combined" 
                      ? "bg-primary/20 text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Modo combinado"
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Combinado</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6 min-h-screen pb-20 md:pb-8">
        {/* Header Compacto */}
        <header className="mb-3 md:mb-4">
          <h1 className="text-base md:text-xl font-black text-foreground">Dashboard Combinado</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground">Visão completa em tempo real</p>
        </header>

        {/* Main Stats - Super Compacto */}
        <section className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4" aria-label="Métricas principais">
          {mainStats.map((stat, index) => (
            <Tooltip key={stat.title} delayDuration={500}>
              <TooltipTrigger asChild>
                <div>
                  <StatsCard
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    hoverable={false}
                    className="!p-2 md:!p-3"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent><p>{stat.description}</p></TooltipContent>
            </Tooltip>
          ))}
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-4">
          {/* VTurb Metrics - Compacto */}
          <SectionCard title="VTurb" icon={Video} color="red" className="!p-3 md:!p-4">
            {vturbLoading ? (
              <div className="grid grid-cols-5 gap-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-1 md:gap-2">
                {[
                  { label: "Views", value: vturbMetrics.uniqueViews },
                  { label: "Plays", value: vturbMetrics.uniquePlays },
                  { label: "Play %", value: `${vturbMetrics.playRate.toFixed(1)}%` },
                  { label: "Pitch %", value: `${vturbMetrics.overPitchRate.toFixed(1)}%` },
                  { label: "CTAs", value: vturbMetrics.uniqueClicks },
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded bg-card/50 border border-border text-center">
                    <div className="text-sm md:text-lg font-bold text-foreground">
                      {typeof item.value === 'number' ? item.value.toLocaleString('pt-BR') : item.value}
                    </div>
                    <div className="text-[9px] md:text-[10px] text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Daily Comparison - Compacto */}
          <SectionCard color="cyan" className="!p-3 md:!p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Hoje vs Ontem</h3>
            {dailyComparison && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Receita</span>
                    <ComparisonBadge 
                      changePercent={dailyComparison.revenue.changePercent}
                      isPositive={dailyComparison.revenue.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {formatCurrency(dailyComparison.revenue.current)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Pedidos</span>
                    <ComparisonBadge 
                      changePercent={dailyComparison.orders.changePercent}
                      isPositive={dailyComparison.orders.isPositive}
                      label=""
                    />
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {dailyComparison.orders.current}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Conversion Funnel - Compacto */}
        <div className="mb-4">
          <ConversionFunnel 
            visits={vturbMetrics.uniqueViews}
            plays={vturbMetrics.uniquePlays}
            clicks={vturbMetrics.uniqueClicks}
            orders={ordersCount}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {/* Sales Chart - Compacto */}
          <SectionCard color="cyan" className="!p-3 md:!p-4">
            <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
          </SectionCard>

          {/* Sales Map - Compacto */}
          <SectionCard title="Mapa" icon={MapPin} color="cyan" className="!p-3 md:!p-4">
            <div className="h-[250px] md:h-[300px]">
              <SalesMap />
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardWrapper>
  );
};
