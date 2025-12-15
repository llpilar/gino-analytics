import { useMemo, useState, useEffect } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { 
  DollarSign, ShoppingCart, TrendingUp, Eye, Video, MapPin, Zap, 
  Megaphone, Monitor, LayoutGrid, Layers, X, Maximize2, Target, 
  BarChart3, Percent, ArrowUpRight, ArrowDownRight, Clock, TrendingDown
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SalesChart } from "@/components/SalesChart";
import { useShopifyAnalytics, useShopifyRevenueToday } from "@/hooks/useShopifyData";
import { SalesMap } from "@/components/SalesMap";
import { useDailyComparison, useWeeklyComparison } from "@/hooks/useComparisonMetrics";
import { useCurrency } from "@/contexts/CurrencyContext";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useVturbOverview, parseVturbData } from "@/hooks/useVturbAnalytics";
import { useGA4Visitors } from "@/hooks/useGA4Visitors";
import { useFacebookAdsToday } from "@/hooks/useFacebookAdsToday";
import { ConversionFunnel } from "@/components/ConversionFunnel";
import { differenceInMinutes, isToday, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useDashboardSettings } from "@/contexts/DashboardSettingsContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

type ExpandedPanel = "funnel" | "chart" | "map" | null;

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  change,
  isPositive,
  delay = 0 
}: { 
  title: string; 
  value: string; 
  icon: LucideIcon; 
  gradient: string;
  change?: number;
  isPositive?: boolean;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    className="relative group"
  >
    <div className={cn(
      "relative overflow-hidden rounded-xl p-3 h-full",
      "bg-gradient-to-br from-card/90 to-card/50",
      "border border-border/40 hover:border-border/60",
      "transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
    )}>
      {/* Gradient accent */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-1 opacity-80",
        gradient
      )} />
      
      <div className="flex items-start justify-between mb-2">
        <div className={cn(
          "p-1.5 rounded-lg",
          "bg-gradient-to-br from-primary/10 to-primary/5"
        )}>
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          )}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change).toFixed(0)}%
          </div>
        )}
      </div>
      
      <div className="text-lg md:text-xl font-bold text-foreground tracking-tight leading-none mb-1">
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
        {title}
      </div>
    </div>
  </motion.div>
);

const MiniStatRow = ({ 
  items 
}: { 
  items: { label: string; value: string | number; icon?: LucideIcon }[] 
}) => (
  <div className="flex items-center justify-between gap-2 py-1.5 px-2 bg-muted/30 rounded-lg">
    {items.map((item, i) => (
      <div key={i} className="flex items-center gap-2">
        {item.icon && <item.icon className="h-3 w-3 text-muted-foreground" />}
        <span className="text-xs text-muted-foreground">{item.label}:</span>
        <span className="text-xs font-semibold text-foreground">
          {typeof item.value === 'number' ? item.value.toLocaleString('pt-BR') : item.value}
        </span>
      </div>
    ))}
  </div>
);

export const CombinedDashboard = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const { data: vturbData } = useVturbOverview("685ac2f3f4d418e9eca55125");
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

  const togglePanel = (panel: ExpandedPanel) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  if (revenueLoading) {
    return (
      <DashboardWrapper>
        <div className="container mx-auto px-4 py-6 min-h-screen">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      {/* Layout Toggle */}
      {!isMobile && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-4 left-4 z-40"
        >
          <div className="flex items-center gap-1 p-1 rounded-full bg-card/90 border border-border/50 backdrop-blur-xl shadow-lg">
            {[
              { mode: "normal" as const, icon: Monitor, label: "Orbital" },
              { mode: "compact" as const, icon: LayoutGrid, label: "Grade" },
              { mode: "combined" as const, icon: Layers, label: "Combinado" },
            ].map((item) => (
              <Tooltip key={item.mode} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode(item.mode)}
                    className={cn(
                      "rounded-full h-8 px-3 transition-all duration-200",
                      viewMode === item.mode 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>{item.label}</p></TooltipContent>
              </Tooltip>
            ))}
          </div>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-4 md:px-6 min-h-screen pb-24 md:pb-8">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
              Central de Comando
            </h1>
            <p className="text-xs text-muted-foreground">
              {format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-border/40">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-mono font-semibold text-foreground">
              {format(currentTime, "HH:mm:ss")}
            </span>
          </div>
        </motion.header>

        {/* Main Stats Grid - 6 columns on desktop */}
        <section className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3 mb-4">
          <StatCard 
            title="Receita Total" 
            value={formatCurrency(totalRevenue)} 
            icon={DollarSign} 
            gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
            change={dailyComparison?.revenue.changePercent}
            isPositive={dailyComparison?.revenue.isPositive}
            delay={0}
          />
          <StatCard 
            title="Pedidos" 
            value={ordersCount.toString()} 
            icon={ShoppingCart} 
            gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
            change={dailyComparison?.orders.changePercent}
            isPositive={dailyComparison?.orders.isPositive}
            delay={0.05}
          />
          <StatCard 
            title="Ticket Médio" 
            value={formatCurrency(avgOrderValue)} 
            icon={TrendingUp} 
            gradient="bg-gradient-to-r from-violet-500 to-purple-500"
            delay={0.1}
          />
          <StatCard 
            title="Visitantes" 
            value={visitorCount.toLocaleString('pt-BR')} 
            icon={Eye} 
            gradient="bg-gradient-to-r from-amber-500 to-orange-500"
            delay={0.15}
          />
          <StatCard 
            title="ROAS" 
            value={`${roas.toFixed(2)}x`} 
            icon={Target} 
            gradient="bg-gradient-to-r from-pink-500 to-rose-500"
            delay={0.2}
          />
          <StatCard 
            title="R$/min" 
            value={formatCurrency(salesPerMinute)} 
            icon={Zap} 
            gradient="bg-gradient-to-r from-cyan-500 to-blue-500"
            delay={0.25}
          />
        </section>

        {/* Secondary Metrics Row */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 mb-4"
        >
          {/* VTurb Card */}
          <div className="rounded-xl bg-gradient-to-br from-card/90 to-card/50 border border-border/40 p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-red-500/10">
                <Video className="h-4 w-4 text-red-400" />
              </div>
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">VTurb Analytics</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "Views", value: vturbMetrics.uniqueViews },
                { label: "Plays", value: vturbMetrics.uniquePlays },
                { label: "Play%", value: `${vturbMetrics.playRate.toFixed(0)}%` },
                { label: "Pitch", value: `${vturbMetrics.overPitchRate.toFixed(0)}%` },
                { label: "CTAs", value: vturbMetrics.uniqueClicks },
              ].map((item, i) => (
                <div key={i} className="text-center p-2 rounded-lg bg-muted/30">
                  <div className="text-sm md:text-base font-bold text-foreground">
                    {typeof item.value === 'number' ? item.value.toLocaleString('pt-BR') : item.value}
                  </div>
                  <div className="text-[9px] text-muted-foreground uppercase">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Facebook Ads Card */}
          <div className="rounded-xl bg-gradient-to-br from-card/90 to-card/50 border border-border/40 p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Megaphone className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">Facebook Ads</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Gasto", value: formatCurrency(adSpend) },
                { label: "CPA", value: formatCurrency(cpa) },
                { label: "Conv%", value: `${conversionRate.toFixed(1)}%` },
              ].map((item, i) => (
                <div key={i} className="text-center p-2 rounded-lg bg-muted/30">
                  <div className="text-sm md:text-base font-bold text-foreground">{item.value}</div>
                  <div className="text-[9px] text-muted-foreground uppercase">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparisons Card */}
          <div className="rounded-xl bg-gradient-to-br from-card/90 to-card/50 border border-border/40 p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">Comparativos</span>
            </div>
            <div className="space-y-2">
              {dailyComparison && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground">Hoje vs Ontem</span>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-bold",
                    dailyComparison.revenue.isPositive ? "text-emerald-400" : "text-red-400"
                  )}>
                    {dailyComparison.revenue.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {dailyComparison.revenue.changePercent.toFixed(0)}%
                  </div>
                </div>
              )}
              {weeklyComparison && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground">Semana vs Anterior</span>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-bold",
                    weeklyComparison.revenue.isPositive ? "text-emerald-400" : "text-red-400"
                  )}>
                    {weeklyComparison.revenue.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {weeklyComparison.revenue.changePercent.toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Expandable Analysis Panels */}
        <LayoutGroup>
          <motion.div 
            layout
            className={cn(
              "grid gap-3",
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
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className={cn(
                    "relative rounded-xl overflow-hidden cursor-pointer group",
                    "bg-gradient-to-br from-card/90 to-card/50",
                    "border border-border/40 hover:border-primary/30",
                    "transition-all duration-300",
                    expandedPanel === "funnel" && "border-primary/50 cursor-default shadow-xl shadow-primary/10"
                  )}
                  onClick={() => !expandedPanel && togglePanel("funnel")}
                >
                  {/* Glow effect when expanded */}
                  {expandedPanel === "funnel" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                  )}
                  
                  <div className="absolute top-3 right-3 z-10">
                    {expandedPanel === "funnel" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg shadow-md"
                        onClick={(e) => { e.stopPropagation(); setExpandedPanel(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-lg bg-primary/10 backdrop-blur-sm">
                        <Maximize2 className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                  
                  <div className={cn("p-4", expandedPanel === "funnel" && "p-6")}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-bold text-foreground">Funil de Conversão</span>
                    </div>
                    <div 
                      className="overflow-hidden"
                      style={{ height: expandedPanel === "funnel" ? 400 : 200 }}
                    >
                      <div className={cn(
                        "w-full h-full transition-transform duration-300",
                        !expandedPanel && "pointer-events-none scale-[0.9] origin-top"
                      )}>
                        <ConversionFunnel 
                          visits={vturbMetrics.uniqueViews}
                          plays={vturbMetrics.uniquePlays}
                          clicks={vturbMetrics.uniqueClicks}
                          orders={ordersCount}
                        />
                      </div>
                    </div>
                  </div>
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
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className={cn(
                    "relative rounded-xl overflow-hidden cursor-pointer group",
                    "bg-gradient-to-br from-card/90 to-card/50",
                    "border border-border/40 hover:border-chart-4/30",
                    "transition-all duration-300",
                    expandedPanel === "chart" && "border-chart-4/50 cursor-default shadow-xl shadow-chart-4/10"
                  )}
                  onClick={() => !expandedPanel && togglePanel("chart")}
                >
                  {expandedPanel === "chart" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-chart-4/5 via-transparent to-chart-4/5 pointer-events-none" />
                  )}
                  
                  <div className="absolute top-3 right-3 z-10">
                    {expandedPanel === "chart" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg shadow-md"
                        onClick={(e) => { e.stopPropagation(); setExpandedPanel(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-lg bg-chart-4/10 backdrop-blur-sm">
                        <Maximize2 className="h-4 w-4 text-chart-4" />
                      </div>
                    )}
                  </div>
                  
                  <div className={cn("p-4", expandedPanel === "chart" && "p-6")}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-chart-4/10">
                        <BarChart3 className="h-4 w-4 text-chart-4" />
                      </div>
                      <span className="text-sm font-bold text-foreground">Tendência de Vendas</span>
                    </div>
                    <div 
                      className="overflow-hidden"
                      style={{ height: expandedPanel === "chart" ? 400 : 200 }}
                    >
                      <div className={cn(
                        "w-full h-full",
                        !expandedPanel && "pointer-events-none"
                      )}>
                        <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
                      </div>
                    </div>
                  </div>
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
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className={cn(
                    "relative rounded-xl overflow-hidden cursor-pointer group",
                    "bg-gradient-to-br from-card/90 to-card/50",
                    "border border-border/40 hover:border-chart-3/30",
                    "transition-all duration-300",
                    expandedPanel === "map" && "border-chart-3/50 cursor-default shadow-xl shadow-chart-3/10"
                  )}
                  onClick={() => !expandedPanel && togglePanel("map")}
                >
                  {expandedPanel === "map" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 via-transparent to-chart-3/5 pointer-events-none" />
                  )}
                  
                  <div className="absolute top-3 right-3 z-10">
                    {expandedPanel === "map" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg shadow-md"
                        onClick={(e) => { e.stopPropagation(); setExpandedPanel(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-lg bg-chart-3/10 backdrop-blur-sm">
                        <Maximize2 className="h-4 w-4 text-chart-3" />
                      </div>
                    )}
                  </div>
                  
                  <div className={cn("p-4", expandedPanel === "map" && "p-6")}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-chart-3/10">
                        <MapPin className="h-4 w-4 text-chart-3" />
                      </div>
                      <span className="text-sm font-bold text-foreground">Mapa de Vendas</span>
                    </div>
                    <div 
                      className="overflow-hidden rounded-lg"
                      style={{ height: expandedPanel === "map" ? 400 : 200 }}
                    >
                      <div className={cn(
                        "w-full h-full",
                        !expandedPanel && "pointer-events-none"
                      )}>
                        <SalesMap />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
    </DashboardWrapper>
  );
};
