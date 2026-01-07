import { useMemo, useState, useEffect } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { 
  DollarSign, ShoppingCart, TrendingUp, Eye, Video, MapPin, Zap, 
  Megaphone, X, Maximize2, Target, 
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
import { useVturbOverview, useVturbListPlayers, parseVturbData } from "@/hooks/useVturbAnalytics";
import { useGA4Visitors } from "@/hooks/useGA4Visitors";
import { useFacebookAdsToday } from "@/hooks/useFacebookAdsToday";
import { ConversionFunnel } from "@/components/ConversionFunnel";
import { differenceInMinutes, isToday, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { VslPlayerSelector } from "@/components/VslPlayerSelector";

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
      "relative overflow-hidden rounded-xl p-2 sm:p-3 lg:p-4 xl:p-5 h-full",
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
          "p-1 sm:p-1.5 lg:p-2 rounded-lg",
          "bg-gradient-to-br from-primary/10 to-primary/5"
        )}>
          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-primary" />
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
      
      <div className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-foreground tracking-tight leading-none mb-1">
        {value}
      </div>
      <div className="text-[8px] sm:text-[10px] lg:text-xs xl:text-sm text-muted-foreground uppercase tracking-wider font-medium">
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
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>(undefined);
  const { data: analyticsData, isLoading: analyticsLoading } = useShopifyAnalytics();
  const { data: revenueData, isLoading: revenueLoading } = useShopifyRevenueToday();
  const { data: dailyComparison } = useDailyComparison();
  const { data: weeklyComparison } = useWeeklyComparison();
  const { formatCurrency } = useCurrency();
  const { dateRange } = useDateFilter();
  const { visitorCount } = useGA4Visitors();
  const { data: facebookAdsData } = useFacebookAdsToday();

  // VTurb data
  const { data: vturbPlayersList, isLoading: vturbPlayersLoading } = useVturbListPlayers();
  const { data: vturbData } = useVturbOverview(selectedPlayerId);
  const vturbMetrics = useMemo(() => parseVturbData(vturbData), [vturbData]);

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

      <div className="w-full max-w-[2400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 min-h-screen pb-24 md:pb-8">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-foreground tracking-tight">
              Central de Comando
            </h1>
            <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
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
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 lg:gap-4 xl:gap-5 mb-4">
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
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 lg:gap-4 xl:gap-5 mb-4"
        >
          <div className="rounded-xl bg-gradient-to-br from-card/90 to-card/50 border border-border/40 p-2 sm:p-3 lg:p-4 xl:p-5">
            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3 lg:mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1 sm:p-1.5 lg:p-2 rounded-lg bg-red-500/10">
                  <Video className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-red-400" />
                </div>
                <span className="text-[10px] sm:text-xs lg:text-sm xl:text-base font-bold text-foreground uppercase tracking-wide">VTurb</span>
              </div>
              <VslPlayerSelector
                players={vturbPlayersList || []}
                selectedPlayerId={selectedPlayerId}
                onPlayerChange={setSelectedPlayerId}
                isLoading={vturbPlayersLoading}
              />
            </div>
            <div className="grid grid-cols-5 gap-1 sm:gap-2 lg:gap-3">
              {[
                { label: "Views", value: vturbMetrics.uniqueViews },
                { label: "Plays", value: vturbMetrics.uniquePlays },
                { label: "Play%", value: `${vturbMetrics.playRate.toFixed(0)}%` },
                { label: "Pitch", value: `${vturbMetrics.overPitchRate.toFixed(0)}%` },
                { label: "CTAs", value: vturbMetrics.uniqueClicks },
              ].map((item, i) => (
                <div key={i} className="text-center p-1 sm:p-2 lg:p-3 rounded-lg bg-muted/30">
                  <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-foreground">
                    {typeof item.value === 'number' ? item.value.toLocaleString('pt-BR') : item.value}
                  </div>
                  <div className="text-[7px] sm:text-[9px] lg:text-xs text-muted-foreground uppercase">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-card/90 to-card/50 border border-border/40 p-2 sm:p-3 lg:p-4 xl:p-5">
            <div className="flex items-center gap-2 mb-2 sm:mb-3 lg:mb-4">
              <div className="p-1 sm:p-1.5 lg:p-2 rounded-lg bg-blue-500/10">
                <Megaphone className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-400" />
              </div>
              <span className="text-[10px] sm:text-xs lg:text-sm xl:text-base font-bold text-foreground uppercase tracking-wide">Ads</span>
            </div>
            <div className="grid grid-cols-2 gap-1 sm:gap-2 lg:gap-3">
              {[
                { label: "CPA", value: formatCurrency(cpa) },
                { label: "Conversões", value: facebookAdsData?.purchases?.toString() || "0" },
              ].map((item, i) => (
                <div key={i} className="text-center p-1 sm:p-2 lg:p-3 rounded-lg bg-muted/30">
                  <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-foreground">{item.value}</div>
                  <div className="text-[7px] sm:text-[9px] lg:text-xs text-muted-foreground uppercase">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-card/90 to-card/50 border border-border/40 p-2 sm:p-3 lg:p-4 xl:p-5">
            <div className="flex items-center gap-2 mb-2 sm:mb-3 lg:mb-4">
              <div className="p-1 sm:p-1.5 lg:p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary" />
              </div>
              <span className="text-[10px] sm:text-xs lg:text-sm xl:text-base font-bold text-foreground uppercase tracking-wide">Comparativos</span>
            </div>
            <div className="space-y-1 sm:space-y-2 lg:space-y-3">
              {dailyComparison && (
                <div className="flex items-center justify-between p-1 sm:p-2 lg:p-3 rounded-lg bg-muted/30">
                  <span className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Hoje vs Ontem</span>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] sm:text-xs lg:text-sm font-bold",
                    dailyComparison.revenue.isPositive ? "text-emerald-400" : "text-red-400"
                  )}>
                    {dailyComparison.revenue.isPositive ? <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" /> : <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" />}
                    {dailyComparison.revenue.changePercent.toFixed(0)}%
                  </div>
                </div>
              )}
              {weeklyComparison && (
                <div className="flex items-center justify-between p-1 sm:p-2 lg:p-3 rounded-lg bg-muted/30">
                  <span className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Semana vs Anterior</span>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] sm:text-xs lg:text-sm font-bold",
                    weeklyComparison.revenue.isPositive ? "text-emerald-400" : "text-red-400"
                  )}>
                    {weeklyComparison.revenue.isPositive ? <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" /> : <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" />}
                    {weeklyComparison.revenue.changePercent.toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Expandable Analysis Panels */}
        <div className="grid gap-3 md:gap-4 lg:gap-5 xl:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Funnel Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative rounded-xl overflow-hidden bg-gradient-to-br from-card/90 to-card/50 border border-border/40"
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">Funil de Conversão</span>
              </div>
              <div className="h-[350px] sm:h-[380px] md:h-[420px] lg:h-[450px] xl:h-[500px] 2xl:h-[550px]">
                <ConversionFunnel 
                  visits={vturbMetrics.uniqueViews}
                  plays={vturbMetrics.uniquePlays}
                  clicks={vturbMetrics.uniqueClicks}
                  orders={ordersCount}
                />
              </div>
            </div>
          </motion.div>

          {/* Map Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="relative rounded-xl overflow-hidden bg-gradient-to-br from-card/90 to-card/50 border border-border/40"
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-chart-3/10">
                  <MapPin className="h-4 w-4 text-chart-3" />
                </div>
                <span className="text-sm font-bold text-foreground">Mapa de Vendas</span>
              </div>
              <div className="h-[350px] sm:h-[380px] md:h-[420px] lg:h-[450px] xl:h-[500px] 2xl:h-[550px] rounded-lg overflow-hidden">
                <SalesMap compact />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardWrapper>
  );
};
