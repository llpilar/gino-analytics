import { useMemo, useState, useEffect } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { DollarSign, ShoppingCart, TrendingUp, Eye, Video, MapPin, Zap, Megaphone, Monitor, LayoutGrid, Layers, X, Maximize2, Target, BarChart3, Percent } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SalesChart } from "@/components/SalesChart";
import { useShopifyAnalytics, useShopifyRevenueToday } from "@/hooks/useShopifyData";
import { SalesMap } from "@/components/SalesMap";
import { useDailyComparison, useWeeklyComparison } from "@/hooks/useComparisonMetrics";
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
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

type ExpandedPanel = "funnel" | "chart" | "map" | null;

export const CombinedDashboard = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);
  const { data: analyticsData, isLoading: analyticsLoading } = useShopifyAnalytics();
  const { data: revenueData, isLoading: revenueLoading } = useShopifyRevenueToday();
  const { data: dailyComparison } = useDailyComparison();
  const { data: weeklyComparison } = useWeeklyComparison();
  const { formatCurrency } = useCurrency();
  const { dateRange } = useDateFilter();
  const { visitorCount } = useGA4Visitors();
  const { data: facebookAdsData } = useFacebookAdsToday();
  const { viewMode, setViewMode } = useDashboardSettings();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1280);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  const { data: vturbData, isLoading: vturbLoading } = useVturbOverview("685ac2f3f4d418e9eca55125");
  const vturbMetrics = useMemo(() => parseVturbData(vturbData), [vturbData]);

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

  const adSpend = facebookAdsData?.spend || 0;
  const cpa = facebookAdsData?.cpa || 0;
  const roas = adSpend > 0 ? totalRevenue / adSpend : 0;
  const conversionRate = vturbMetrics.uniquePlays > 0 ? (ordersCount / vturbMetrics.uniquePlays) * 100 : 0;

  const mainStats: { title: string; value: string; icon: LucideIcon; color: CardColorVariant; description: string }[] = [
    { title: "Receita", value: formatCurrency(totalRevenue), icon: DollarSign, color: "cyan", description: "Faturamento total" },
    { title: "Pedidos", value: ordersCount.toString(), icon: ShoppingCart, color: "green", description: "Total de pedidos" },
    { title: "Ticket", value: formatCurrency(avgOrderValue), icon: TrendingUp, color: "purple", description: "Ticket médio" },
    { title: "Online", value: visitorCount.toLocaleString('pt-BR'), icon: Eye, color: "orange", description: "VSL Online" },
    { title: "R$/min", value: formatCurrency(salesPerMinute), icon: Zap, color: "pink", description: "Receita/minuto" },
    { title: "Ads", value: formatCurrency(adSpend), icon: Megaphone, color: "red", description: "Gasto em ads" },
    { title: "ROAS", value: `${roas.toFixed(2)}x`, icon: Target, color: "cyan", description: "Retorno sobre ads" },
    { title: "CPA", value: formatCurrency(cpa), icon: DollarSign, color: "orange", description: "Custo por aquisição" },
    { title: "Conv %", value: `${conversionRate.toFixed(2)}%`, icon: Percent, color: "green", description: "Taxa de conversão" },
  ];

  const togglePanel = (panel: ExpandedPanel) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  if (revenueLoading) {
    return (
      <DashboardWrapper>
        <div className="container mx-auto px-3 py-4 min-h-screen">
          <div className="grid grid-cols-3 md:grid-cols-9 gap-2 mb-4">
            {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
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
        {/* Header */}
        <header className="mb-3">
          <h1 className="text-base md:text-lg font-black text-foreground">Dashboard Combinado</h1>
        </header>

        {/* Main Stats - 9 columns */}
        <section className="grid grid-cols-3 md:grid-cols-9 gap-1.5 md:gap-2 mb-3" aria-label="Métricas principais">
          {mainStats.map((stat) => (
            <Tooltip key={stat.title} delayDuration={500}>
              <TooltipTrigger asChild>
                <div className="p-2 rounded-lg bg-card/80 border border-border/50 hover:border-primary/30 transition-colors cursor-default">
                  <div className="flex items-center gap-1.5 mb-1">
                    <stat.icon className={cn("h-3 w-3", `text-${stat.color === 'cyan' ? 'primary' : stat.color === 'green' ? 'chart-4' : stat.color === 'purple' ? 'chart-5' : stat.color === 'orange' ? 'chart-3' : stat.color === 'pink' ? 'chart-5' : 'destructive'}`)} />
                    <span className="text-[9px] text-muted-foreground uppercase font-medium truncate">{stat.title}</span>
                  </div>
                  <div className="text-sm md:text-base font-bold text-foreground truncate">{stat.value}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>{stat.description}</p></TooltipContent>
            </Tooltip>
          ))}
        </section>

        {/* VTurb + Comparisons Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-3">
          {/* VTurb Mini */}
          <div className="p-2 rounded-lg bg-card/80 border border-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Video className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[10px] text-muted-foreground uppercase font-bold">VTurb</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[
                { label: "Views", value: vturbMetrics.uniqueViews },
                { label: "Plays", value: vturbMetrics.uniquePlays },
                { label: "Play%", value: `${vturbMetrics.playRate.toFixed(0)}%` },
                { label: "Pitch", value: `${vturbMetrics.overPitchRate.toFixed(0)}%` },
                { label: "CTAs", value: vturbMetrics.uniqueClicks },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs md:text-sm font-bold text-foreground">
                    {typeof item.value === 'number' ? item.value.toLocaleString('pt-BR') : item.value}
                  </div>
                  <div className="text-[8px] text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Comparison */}
          <div className="p-2 rounded-lg bg-card/80 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Hoje vs Ontem</span>
            {dailyComparison && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Receita</span>
                    <ComparisonBadge changePercent={dailyComparison.revenue.changePercent} isPositive={dailyComparison.revenue.isPositive} label="" />
                  </div>
                  <div className="text-sm font-bold text-foreground">{formatCurrency(dailyComparison.revenue.current)}</div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Pedidos</span>
                    <ComparisonBadge changePercent={dailyComparison.orders.changePercent} isPositive={dailyComparison.orders.isPositive} label="" />
                  </div>
                  <div className="text-sm font-bold text-foreground">{dailyComparison.orders.current}</div>
                </div>
              </div>
            )}
          </div>

          {/* Weekly Comparison */}
          <div className="p-2 rounded-lg bg-card/80 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Semana vs Anterior</span>
            {weeklyComparison && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Receita</span>
                    <ComparisonBadge changePercent={weeklyComparison.revenue.changePercent} isPositive={weeklyComparison.revenue.isPositive} label="" />
                  </div>
                  <div className="text-sm font-bold text-foreground">{formatCurrency(weeklyComparison.revenue.current)}</div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Pedidos</span>
                    <ComparisonBadge changePercent={weeklyComparison.orders.changePercent} isPositive={weeklyComparison.orders.isPositive} label="" />
                  </div>
                  <div className="text-sm font-bold text-foreground">{weeklyComparison.orders.current}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Panels Row - Funnel, Chart, Map */}
        <LayoutGroup>
          <motion.div 
            layout
            className={cn(
              "grid gap-2",
              expandedPanel ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
            )}
          >
            {/* Funnel Panel */}
            <AnimatePresence mode="popLayout">
              {(!expandedPanel || expandedPanel === "funnel") && (
                <motion.div 
                  layout
                  layoutId="funnel-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className={cn(
                    "relative rounded-lg bg-card/80 border border-border/50 overflow-hidden cursor-pointer group",
                    expandedPanel === "funnel" && "border-primary/30"
                  )}
                  onClick={() => !expandedPanel && togglePanel("funnel")}
                >
                  <motion.div 
                    className="absolute top-2 right-2 z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: expandedPanel === "funnel" ? 1 : 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    {expandedPanel === "funnel" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 bg-card/80 hover:bg-card"
                        onClick={(e) => { e.stopPropagation(); setExpandedPanel(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                  <motion.div layout="position" className={cn("p-2", expandedPanel === "funnel" && "p-4")}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Funil de Conversão</span>
                    </div>
                    <motion.div 
                      layout
                      animate={{ height: expandedPanel === "funnel" ? "auto" : 180 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <ConversionFunnel 
                        visits={vturbMetrics.uniqueViews}
                        plays={vturbMetrics.uniquePlays}
                        clicks={vturbMetrics.uniqueClicks}
                        orders={ordersCount}
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chart Panel */}
            <AnimatePresence mode="popLayout">
              {(!expandedPanel || expandedPanel === "chart") && (
                <motion.div 
                  layout
                  layoutId="chart-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className={cn(
                    "relative rounded-lg bg-card/80 border border-border/50 overflow-hidden cursor-pointer group",
                    expandedPanel === "chart" && "border-primary/30"
                  )}
                  onClick={() => !expandedPanel && togglePanel("chart")}
                >
                  <motion.div 
                    className="absolute top-2 right-2 z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: expandedPanel === "chart" ? 1 : 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    {expandedPanel === "chart" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 bg-card/80 hover:bg-card"
                        onClick={(e) => { e.stopPropagation(); setExpandedPanel(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                  <motion.div layout="position" className={cn("p-2", expandedPanel === "chart" && "p-4")}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <BarChart3 className="h-3.5 w-3.5 text-chart-4" />
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Tendência de Vendas</span>
                    </div>
                    <motion.div 
                      animate={{ height: expandedPanel === "chart" ? 400 : 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Map Panel */}
            <AnimatePresence mode="popLayout">
              {(!expandedPanel || expandedPanel === "map") && (
                <motion.div 
                  layout
                  layoutId="map-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className={cn(
                    "relative rounded-lg bg-card/80 border border-border/50 overflow-hidden cursor-pointer group",
                    expandedPanel === "map" && "border-primary/30"
                  )}
                  onClick={() => !expandedPanel && togglePanel("map")}
                >
                  <motion.div 
                    className="absolute top-2 right-2 z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: expandedPanel === "map" ? 1 : 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    {expandedPanel === "map" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 bg-card/80 hover:bg-card"
                        onClick={(e) => { e.stopPropagation(); setExpandedPanel(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                  <motion.div layout="position" className={cn("p-2", expandedPanel === "map" && "p-4")}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin className="h-3.5 w-3.5 text-chart-3" />
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Mapa de Vendas</span>
                    </div>
                    <motion.div 
                      animate={{ height: expandedPanel === "map" ? 400 : 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SalesMap />
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
    </DashboardWrapper>
  );
};
