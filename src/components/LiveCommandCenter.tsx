import { useEffect, useState } from "react";
import { Globe } from "./ui/globe-feature-section";
import { NavBar } from "./ui/tubelight-navbar";
import { useShopifyRevenueToday, useShopifyAnalytics } from "@/hooks/useShopifyData";
import { format, differenceInMinutes, isToday } from "date-fns";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { LayoutDashboard, BarChart3, Settings, Wallet, TrendingUp, DollarSign, ShoppingCart, Zap, Monitor, LayoutGrid, Eye, Megaphone, Target, Truck } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { ComparisonBadge } from "./ComparisonBadge";
import { useDailyComparison } from "@/hooks/useComparisonMetrics";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { Toaster } from "./ui/toaster";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useVslbioboostVisitors } from "@/hooks/useVslbioboostVisitors";
import { useFacebookAdsToday } from "@/hooks/useFacebookAdsToday";

type LayoutMode = "orbital" | "grid";

export const LiveCommandCenter = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rotationAngle, setRotationAngle] = useState(0);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const [isMobile, setIsMobile] = useState(false);
  const { data: revenueData, isLoading: revenueLoading } = useShopifyRevenueToday();
  const { data: analyticsData } = useShopifyAnalytics();
  const { data: dailyComparison } = useDailyComparison();
  const { orderCount: realtimeOrderCount } = useRealtimeOrders();
  const { formatCurrency } = useCurrency();
  const { dateRange } = useDateFilter();
  const { visitorCount } = useVslbioboostVisitors();
  const { data: facebookAdsData } = useFacebookAdsToday();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1280;
      setIsMobile(mobile);
      if (mobile) setLayoutMode("grid");
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (layoutMode !== "orbital") return;
    const rotationTimer = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.3) % 360);
    }, 50);
    return () => clearInterval(rotationTimer);
  }, [layoutMode]);

  const totalRevenue = revenueData?.data?.orders?.edges?.reduce((acc: number, edge: any) => {
    const amount = parseFloat(
      edge.node.currentTotalPriceSet?.shopMoney?.amount || 
      edge.node.totalPriceSet?.shopMoney?.amount || 
      '0'
    );
    return acc + amount;
  }, 0) || 0;

  const ordersCount = revenueData?.data?.orders?.edges?.length || 0;
  
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
  const salesPerMinute = totalRevenue > 0 ? (totalRevenue / minutesElapsed).toFixed(2) : "0.00";
  const uniqueShoppers = ordersCount > 0 ? Math.floor(ordersCount * 0.85).toString() : "0";
  const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

  const navItems = [
    { name: 'Dashboard', url: '/', icon: LayoutDashboard },
    { name: 'Análises', url: '/analises', icon: BarChart3 },
    { name: 'Envios', url: '/envios', icon: Truck },
    { name: 'Contas', url: '/contas', icon: Wallet },
    { name: 'Configurações', url: '/configuracoes', icon: Settings }
  ];

  if (revenueLoading) {
    return <DashboardSkeleton />;
  }

  const satellites = [
    { label: "RECEITA", value: formatCurrency(totalRevenue), icon: DollarSign, color: "primary" },
    { label: "PEDIDOS", value: ordersCount.toString(), icon: ShoppingCart, color: "success" },
    { label: "R$/MIN", value: formatCurrency(parseFloat(salesPerMinute)), icon: Zap, color: "primary" },
    { label: "VSL ONLINE", value: visitorCount.toString(), icon: Eye, color: "warning" },
  ];

  const getSatellitePosition = (baseAngle: number, distance: number) => {
    const angle = (baseAngle + rotationAngle) * (Math.PI / 180);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  };

  const colorVariants = {
    primary: { bg: "bg-sky-500/10", border: "border-sky-500/20", text: "text-sky-400" },
    success: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    warning: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
    error: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
  };

  return (
    <main className="min-h-screen w-full relative overflow-hidden bg-[#020617]">
      <NavBar items={navItems} />
      
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(148,163,184,0.08),_transparent_50%)]" />
        <div className="subtle-dots absolute inset-0 opacity-30" />
      </div>

      {/* Subtle ambient glow */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-sky-500/[0.02] rounded-full blur-[200px]" />
      <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-slate-500/[0.03] rounded-full blur-[200px]" />

      {/* Clock & Notification */}
      <header className="fixed top-4 right-4 z-40 flex items-center gap-3">
        <NotificationCenter />
        <div className="px-4 py-2 rounded-full bg-slate-950/70 border border-white/[0.08] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 font-medium text-xs uppercase tracking-widest">AO VIVO</span>
            <time className="text-sm font-mono font-semibold text-slate-300 tracking-wider">
              {format(currentTime, "HH:mm:ss")}
            </time>
          </div>
        </div>
      </header>

      {/* Layout Toggle */}
      {!isMobile && (
        <div className="fixed top-4 left-4 z-40">
          <div className="flex items-center gap-1 p-1 rounded-full bg-slate-950/70 border border-white/[0.08] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLayoutMode("orbital")}
              className={cn(
                "rounded-full h-8 px-3 transition-all",
                layoutMode === "orbital" 
                  ? "bg-white/[0.1] text-slate-100" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLayoutMode("grid")}
              className={cn(
                "rounded-full h-8 px-3 transition-all",
                layoutMode === "grid" 
                  ? "bg-white/[0.1] text-slate-100" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {layoutMode === "orbital" && !isMobile ? (
        <div className="relative z-10 h-screen flex items-center justify-center gap-16 px-8 pt-16">
          {/* Central Globe */}
          <section className="relative w-[600px] h-[600px] flex-shrink-0 flex items-center justify-center mr-auto ml-48">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-[460px] h-[460px] border border-white/[0.04] rounded-full animate-spin" style={{ animationDuration: "60s" }} />
              <div className="absolute w-[520px] h-[520px] border border-white/[0.03] rounded-full animate-spin" style={{ animationDuration: "80s" }} />
            </div>

            <div className="relative z-10 w-[380px] h-[380px]">
              <Globe className="w-full h-full" />
              <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(14,165,233,0.1),_transparent_60%)] blur-2xl animate-pulse-glow" />
            </div>

            {/* Orbital Satellites */}
            {[
              { label: "RECEITA", value: formatCurrency(totalRevenue), icon: DollarSign, angle: 0, distance: 240 },
              { label: "PEDIDOS", value: ordersCount.toString(), icon: ShoppingCart, angle: 90, distance: 260 },
              { label: "R$/MIN", value: formatCurrency(parseFloat(salesPerMinute)), icon: Zap, angle: 180, distance: 250 },
              { label: "VSL ONLINE", value: visitorCount.toString(), icon: Eye, angle: 270, distance: 270 },
            ].map((satellite, index) => {
              const pos = getSatellitePosition(satellite.angle, satellite.distance);
              const Icon = satellite.icon;
              return (
                <article
                  key={index}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `calc(50% + ${pos.x}px)`,
                    top: `calc(50% + ${pos.y}px)`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="relative group cursor-pointer">
                    <div className="glass-card p-3 min-w-[120px] hover:scale-105 transition-all duration-300">
                      <div className="relative z-10">
                        <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center bg-white/[0.05] border border-white/[0.08]">
                          <Icon className="w-4 h-4 text-sky-400" />
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-1">
                          {satellite.label}
                        </div>
                        <div className="text-lg font-bold text-slate-100 text-center whitespace-nowrap">
                          {satellite.value}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Right Side Panel */}
          <aside className="absolute right-16 top-1/2 -translate-y-[45%] w-[390px] glass-card p-5">
            <DataStreamCard 
              totalRevenue={totalRevenue}
              ordersCount={ordersCount}
              avgOrderValue={avgOrderValue}
              uniqueShoppers={uniqueShoppers}
              dailyComparison={dailyComparison}
              formatCurrency={formatCurrency}
              colorVariants={colorVariants}
              adSpend={facebookAdsData?.spend || 0}
              cpa={facebookAdsData?.cpa || 0}
            />
          </aside>
        </div>
      ) : (
        <div className="relative z-10 min-h-screen p-4 pt-24 pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">
                  Dashboard
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Métricas em tempo real
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Online
                </span>
              </div>
            </header>

            {/* Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {satellites.map((stat, index) => {
                const colors = colorVariants[stat.color as keyof typeof colorVariants];
                const Icon = stat.icon;
                return (
                  <article
                    key={stat.label}
                    className="glass-card p-4 md:p-5 animate-fade-in-up hover:scale-[1.01] cursor-pointer"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", colors.bg, colors.border)}>
                        <Icon className={cn("w-5 h-5", colors.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                          {stat.label}
                        </h3>
                      </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-slate-100 truncate">
                      {stat.value}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">Ao vivo</span>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 glass-card p-4 md:p-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
                <DataStreamCard 
                  totalRevenue={totalRevenue}
                  ordersCount={ordersCount}
                  avgOrderValue={avgOrderValue}
                  uniqueShoppers={uniqueShoppers}
                  dailyComparison={dailyComparison}
                  formatCurrency={formatCurrency}
                  colorVariants={colorVariants}
                  adSpend={facebookAdsData?.spend || 0}
                  cpa={facebookAdsData?.cpa || 0}
                />
              </section>

              <aside className="hidden lg:block glass-card p-6 animate-fade-in overflow-hidden" style={{ animationDelay: "500ms" }}>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Vendas Globais
                </h3>
                <div className="relative w-full aspect-square">
                  <Globe className="w-full h-full" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(14,165,233,0.1),_transparent_60%)] blur-2xl" />
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </main>
  );
};

interface DataStreamCardProps {
  totalRevenue: number;
  ordersCount: number;
  avgOrderValue: number;
  uniqueShoppers: string;
  dailyComparison: any;
  formatCurrency: (value: number) => string;
  colorVariants: Record<string, { bg: string; border: string; text: string }>;
  adSpend: number;
  cpa: number;
}

const DataStreamCard = ({ 
  totalRevenue, 
  ordersCount, 
  avgOrderValue, 
  uniqueShoppers, 
  dailyComparison,
  formatCurrency,
  colorVariants,
  adSpend,
  cpa
}: DataStreamCardProps) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col tracking-tight w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">Shopify Ao Vivo</h3>
          </div>
          <time className="text-[10px] text-slate-500 font-mono">
            {format(new Date(), "HH:mm:ss")}
          </time>
        </div>
        
        {/* Key Metrics */}
        <div className="space-y-3">
          {/* Ad Spend */}
          <div className={cn("p-4 rounded-xl border bg-white/[0.02]", colorVariants.warning.border)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Megaphone className={cn("w-4 h-4", colorVariants.warning.text)} />
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Gasto em Ads Hoje</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-2xl font-bold", colorVariants.warning.text)}>
                {formatCurrency(adSpend)}
              </span>
            </div>
          </div>

          {/* CPA */}
          <div className={cn("p-4 rounded-xl border bg-white/[0.02]", colorVariants.primary.border)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className={cn("w-4 h-4", colorVariants.primary.text)} />
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">CPA Hoje</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-2xl font-bold", colorVariants.primary.text)}>
                {formatCurrency(cpa)}
              </span>
            </div>
          </div>
          
          {/* Total Revenue */}
          <div className={cn("p-4 rounded-xl border bg-white/[0.02]", colorVariants.success.border)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className={cn("w-4 h-4", colorVariants.success.text)} />
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Faturamento</span>
              </div>
              {dailyComparison && dailyComparison.yesterday?.revenue > 0 && (
                <ComparisonBadge
                  changePercent={((totalRevenue - dailyComparison.yesterday.revenue) / dailyComparison.yesterday.revenue) * 100}
                  isPositive={totalRevenue >= dailyComparison.yesterday.revenue}
                  label=""
                />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-3xl font-bold", colorVariants.success.text)}>
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>

          {/* Average Ticket */}
          <div className={cn("p-4 rounded-xl border bg-white/[0.02]", colorVariants.primary.border)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className={cn("w-4 h-4", colorVariants.primary.text)} />
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Ticket Médio</span>
              </div>
              {dailyComparison && dailyComparison.yesterday?.averageOrderValue > 0 && (
                <ComparisonBadge
                  changePercent={((avgOrderValue - dailyComparison.yesterday.averageOrderValue) / dailyComparison.yesterday.averageOrderValue) * 100}
                  isPositive={avgOrderValue >= dailyComparison.yesterday.averageOrderValue}
                  label=""
                />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-2xl font-bold", colorVariants.primary.text)}>
                {formatCurrency(avgOrderValue)}
              </span>
              <span className="text-slate-500 text-sm">/ pedido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
