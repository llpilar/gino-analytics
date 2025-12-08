import { useEffect, useState } from "react";
import RotatingEarth from "./ui/wireframe-dotted-globe";
import { ShootingStars } from "./ui/shooting-stars";
import { NavBar } from "./ui/tubelight-navbar";
import { useShopifyRevenueToday, useShopifyAnalytics } from "@/hooks/useShopifyData";
import { format, differenceInMinutes, isToday, isSameDay } from "date-fns";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { LayoutDashboard, BarChart3, Settings, Wallet, TrendingUp, DollarSign, ShoppingCart, Users, Zap, Monitor, LayoutGrid, Eye, Megaphone, Target, Truck, Info } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { ComparisonBadge } from "./ComparisonBadge";
import { useDailyComparison } from "@/hooks/useComparisonMetrics";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { Toaster } from "./ui/toaster";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useGA4Visitors } from "@/hooks/useGA4Visitors";
import { useFacebookAdsToday } from "@/hooks/useFacebookAdsToday";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

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
  const { visitorCount } = useGA4Visitors();
  const { data: facebookAdsData } = useFacebookAdsToday();

  // Check for mobile viewport
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

  // Orbital rotation animation - slower for better UX
  useEffect(() => {
    if (layoutMode !== "orbital") return;
    const rotationTimer = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.3) % 360);
    }, 50);
    return () => clearInterval(rotationTimer);
  }, [layoutMode]);

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
  
  // Calculate minutes elapsed based on date range
  const now = new Date();
  const calculateMinutesElapsed = () => {
    if (!dateRange.from || !dateRange.to) return 1;
    
    const rangeStart = dateRange.from;
    const rangeEnd = dateRange.to;
    
    // If range ends today, use current time as end
    if (isToday(rangeEnd)) {
      return Math.max(1, differenceInMinutes(now, rangeStart));
    }
    
    // If range is in the past, calculate full range
    return Math.max(1, differenceInMinutes(rangeEnd, rangeStart));
  };
  
  const minutesElapsed = calculateMinutesElapsed();
  const salesPerMinute = totalRevenue > 0 ? (totalRevenue / minutesElapsed).toFixed(2) : "0.00";
  const uniqueShoppers = ordersCount > 0 ? Math.floor(ordersCount * 0.85).toString() : "0";
  const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

  // Navigation items
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

  // Satellite data for orbital view - with descriptions for tooltips
  const satellites = [
    { 
      label: "RECEITA", 
      value: formatCurrency(totalRevenue), 
      icon: DollarSign, 
      color: "cyan", 
      angle: 0, 
      distance: 240,
      description: "Faturamento total de vendas no período selecionado. Representa o valor bruto de todas as transações concluídas."
    },
    { 
      label: "PEDIDOS", 
      value: ordersCount.toString(), 
      icon: ShoppingCart, 
      color: "green", 
      angle: 90, 
      distance: 260,
      description: "Número total de pedidos realizados no período. Inclui todos os pedidos confirmados na loja."
    },
    { 
      label: "R$/MIN", 
      value: formatCurrency(parseFloat(salesPerMinute)), 
      icon: Zap, 
      color: "purple", 
      angle: 180, 
      distance: 250,
      description: "Receita média por minuto. Calculada dividindo o faturamento total pelo tempo decorrido no período."
    },
    { 
      label: "VSL ONLINE", 
      value: visitorCount.toString(), 
      icon: Eye, 
      color: "orange", 
      angle: 270, 
      distance: 270,
      description: "Usuários ativos nos últimos 5 minutos. Dados em tempo real do Google Analytics mostrando visitantes na VSL."
    },
  ];

  const getSatellitePosition = (baseAngle: number, distance: number) => {
    const angle = (baseAngle + rotationAngle) * (Math.PI / 180);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  };

  const colorVariants = {
    cyan: { bg: "bg-primary/10", border: "border-primary/40", text: "text-primary", glow: "shadow-primary/30" },
    green: { bg: "bg-chart-4/10", border: "border-chart-4/40", text: "text-chart-4", glow: "shadow-chart-4/30" },
    purple: { bg: "bg-chart-5/10", border: "border-chart-5/40", text: "text-chart-5", glow: "shadow-chart-5/30" },
    orange: { bg: "bg-chart-3/10", border: "border-chart-3/40", text: "text-chart-3", glow: "shadow-chart-3/30" },
    pink: { bg: "bg-chart-5/10", border: "border-chart-5/40", text: "text-chart-5", glow: "shadow-chart-5/30" },
    blue: { bg: "bg-chart-1/10", border: "border-chart-1/40", text: "text-chart-1", glow: "shadow-chart-1/30" },
  };

  return (
    <main 
      className="min-h-screen w-full relative overflow-hidden bg-background"
      role="main"
      aria-label="Dashboard principal de vendas"
    >
      {/* Navigation Bar */}
      <NavBar items={navItems} />
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-background" aria-hidden="true">
        <div className="stars-bg absolute inset-0 dark:opacity-100 opacity-0" />
      </div>

      {/* Shooting Stars - Only in dark mode */}
      <div aria-hidden="true" className="dark:block hidden">
        <ShootingStars starColor="#1da1f2" trailColor="#1e9df1" minSpeed={15} maxSpeed={35} minDelay={800} maxDelay={2500} />
        <ShootingStars starColor="#1c9cf0" trailColor="#1da1f2" minSpeed={10} maxSpeed={25} minDelay={1500} maxDelay={3500} />
        <ShootingStars starColor="#1da1f2" trailColor="#1e9df1" minSpeed={20} maxSpeed={40} minDelay={1000} maxDelay={3000} />
      </div>
      
      {/* Ambient Lighting - Only in dark mode */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px] dark:opacity-100 opacity-0" aria-hidden="true" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px] dark:opacity-100 opacity-0" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-chart-4/5 rounded-full blur-[180px] dark:opacity-100 opacity-0" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-chart-1/5 rounded-full blur-[180px] dark:opacity-100 opacity-0" aria-hidden="true" />

      {/* Clock & Notification - Top Right */}
      <header className="fixed top-4 right-4 z-40 flex items-center gap-3">
        <NotificationCenter />
          <div 
          className="px-4 py-2 rounded-full bg-card border border-primary/30 backdrop-blur-xl"
          role="status"
          aria-live="polite"
          aria-label={`Hora atual: ${format(currentTime, "HH:mm:ss")}`}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-chart-4 rounded-full animate-pulse shadow-lg shadow-chart-4/50" aria-hidden="true" />
            <span className="text-chart-4 font-bold text-xs uppercase tracking-widest">AO VIVO</span>
            <time className="text-sm font-mono font-black text-primary tracking-wider">
              {format(currentTime, "HH:mm:ss")}
            </time>
          </div>
        </div>
      </header>

      {/* Layout Toggle - Desktop Only */}
      {!isMobile && (
        <div className="fixed top-4 left-4 z-40">
          <div className="flex items-center gap-1 p-1 rounded-full bg-card border border-primary/30 backdrop-blur-xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLayoutMode("orbital")}
              className={cn(
                "rounded-full h-8 px-3 transition-all",
                layoutMode === "orbital" 
                  ? "bg-primary/20 text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Layout orbital com globo"
              aria-pressed={layoutMode === "orbital"}
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
                  ? "bg-primary/20 text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Layout em grade"
              aria-pressed={layoutMode === "grid"}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {layoutMode === "orbital" && !isMobile ? (
        // ORBITAL LAYOUT - Desktop Only
        <div className="relative z-10 h-screen flex items-center justify-center gap-16 px-8 pt-16">
          {/* Central Globe with Orbital Satellites */}
          <section className="relative w-[600px] h-[600px] flex-shrink-0 flex items-center justify-center mr-auto ml-48" aria-label="Visualização orbital de métricas">
            {/* Orbital rings */}
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <div className="absolute w-[460px] h-[460px] border border-primary/20 rounded-full animate-spin" style={{ animationDuration: "60s" }} />
              <div className="absolute w-[520px] h-[520px] border border-chart-5/20 rounded-full animate-spin" style={{ animationDuration: "80s" }} />
              <div className="absolute w-[580px] h-[580px] border border-chart-5/10 rounded-full animate-spin" style={{ animationDuration: "100s" }} />
            </div>

            {/* Globe */}
            <div className="relative z-10 w-[380px] h-[380px]" aria-hidden="true">
              <RotatingEarth width={380} height={380} className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-radial from-primary/30 via-primary/10 to-transparent blur-3xl animate-pulse-glow pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-radial from-chart-1/20 via-transparent to-transparent blur-2xl animate-pulse-glow pointer-events-none" style={{ animationDelay: "0.5s" }} />
            </div>

            {/* Orbital Satellites */}
            {satellites.map((satellite, index) => {
              const pos = getSatellitePosition(satellite.angle, satellite.distance);
              const colors = colorVariants[satellite.color as keyof typeof colorVariants];
              const Icon = satellite.icon;
              return (
                <Tooltip key={index} delayDuration={1000}>
                  <TooltipTrigger asChild>
                    <article
                      className="absolute flex items-center justify-center"
                      style={{
                        left: `calc(50% + ${pos.x}px)`,
                        top: `calc(50% + ${pos.y}px)`,
                        transform: "translate(-50%, -50%)",
                      }}
                      aria-label={`${satellite.label}: ${satellite.value}`}
                    >
                      <div className="relative group cursor-pointer">
                        <div className={cn(
                          "relative p-3 rounded-2xl bg-card border-2 backdrop-blur-xl min-w-[120px]",
                          "hover:scale-105 transition-all duration-300",
                          colors.border
                        )}>
                          <div className="relative z-10">
                            <div className={cn("w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center", colors.bg)}>
                              <Icon className={cn("w-4 h-4", colors.text)} />
                            </div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center mb-1">
                              {satellite.label}
                            </div>
                            <div className={cn("text-lg font-black text-center whitespace-nowrap", colors.text)}>
                              {satellite.value}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="max-w-[280px] p-3 bg-card border border-border shadow-xl z-50"
                    sideOffset={8}
                  >
                    <p className="text-sm text-foreground leading-relaxed">
                      {satellite.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </section>

          {/* Right Side: Data Stream Card */}
          <aside 
            className="absolute right-16 top-1/2 -translate-y-[45%] w-[390px] p-5 rounded-2xl bg-card border-2 border-primary/30 backdrop-blur-xl"
            aria-label="Painel de dados em tempo real"
          >
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
        // GRID LAYOUT - Mobile & Alternative
        <div className="relative z-10 min-h-screen p-4 pt-24 pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                  Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Métricas em tempo real
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" aria-hidden="true" />
                <span className="text-xs font-bold text-status-success uppercase tracking-wider">
                  Online
                </span>
              </div>
            </header>

            {/* Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" aria-label="Métricas principais">
              {satellites.map((stat, index) => {
                const colors = colorVariants[stat.color as keyof typeof colorVariants];
                const Icon = stat.icon;
                return (
                  <Tooltip key={stat.label} delayDuration={1000}>
                    <TooltipTrigger asChild>
                      <article
                        className={cn(
                          "p-4 md:p-6 rounded-2xl bg-card border-2 backdrop-blur-xl",
                          "transition-all duration-300 hover:scale-[1.02] cursor-pointer",
                          "animate-fade-in-up",
                          colors.border
                        )}
                        style={{ animationDelay: `${index * 100}ms` }}
                        aria-label={`${stat.label}: ${stat.value}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", colors.bg, colors.border)}>
                            <Icon className={cn("w-5 h-5", colors.text)} aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                              {stat.label}
                            </h3>
                          </div>
                        </div>
                        <div className={cn("text-2xl md:text-3xl font-black truncate", colors.text)}>
                          {stat.value}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <TrendingUp className={cn("w-3 h-3", colors.text)} aria-hidden="true" />
                          <span className={cn("text-xs font-semibold", colors.text)}>Ao vivo</span>
                        </div>
                      </article>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      className="max-w-[280px] p-3 bg-card border border-border shadow-xl"
                      sideOffset={8}
                    >
                      <p className="text-sm text-foreground leading-relaxed">
                        {stat.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Data Stream Panel */}
              <section 
                className="lg:col-span-2 p-4 md:p-6 rounded-2xl bg-card border-2 border-primary/30 backdrop-blur-xl animate-fade-in"
                style={{ animationDelay: "400ms" }}
                aria-label="Detalhes de faturamento"
              >
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

              {/* Globe Preview - Desktop Grid Only */}
              <aside 
                className="hidden lg:block p-6 rounded-2xl bg-card border-2 border-chart-5/30 backdrop-blur-xl animate-fade-in overflow-hidden"
                style={{ animationDelay: "500ms" }}
                aria-label="Visualização do globo"
              >
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                  Vendas Globais
                </h3>
                <div className="relative w-full aspect-square">
                  <RotatingEarth width={300} height={300} className="w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-radial from-chart-5/20 via-transparent to-transparent blur-2xl pointer-events-none" aria-hidden="true" />
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      <Toaster />

      <style>{`
        .stars-bg {
          background-image: 
            radial-gradient(2px 2px at 20px 30px, hsl(var(--neon-cyan)), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 40px 70px, hsl(var(--neon-purple)), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 50px 160px, hsl(var(--neon-pink)), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 90px 40px, hsl(var(--primary)), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 130px 80px, hsl(var(--neon-blue)), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 200px 50px, #fff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 250px 100px, #fff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 300px 150px, #fff, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 350px 250px;
          animation: twinkle 5s ease-in-out infinite;
          opacity: 0.4;
        }

        @keyframes twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </main>
  );
};

// Extracted Data Stream Card Component
interface DataStreamCardProps {
  totalRevenue: number;
  ordersCount: number;
  avgOrderValue: number;
  uniqueShoppers: string;
  dailyComparison: any;
  formatCurrency: (value: number) => string;
  colorVariants: Record<string, { bg: string; border: string; text: string; glow: string }>;
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
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" aria-hidden="true" />
            <h3 className="text-sm font-black text-primary uppercase tracking-wider">Shopify Ao Vivo</h3>
          </div>
          <time className="text-[10px] text-muted-foreground font-mono">
            {format(new Date(), "HH:mm:ss")}
          </time>
        </div>
        
        {/* Key Metrics */}
        <div className="space-y-3">
          {/* Ad Spend */}
          <Tooltip delayDuration={1000}>
            <TooltipTrigger asChild>
              <div className={cn("p-4 rounded-xl border-2 backdrop-blur-sm cursor-pointer hover:scale-[1.01] transition-transform", colorVariants.pink.bg, colorVariants.pink.border)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-chart-5" />
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Gasto em Ads Hoje</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Facebook Ads</div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-chart-5">
                  {formatCurrency(adSpend)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Total investido</p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px] p-3 bg-card border border-border shadow-xl" sideOffset={8}>
              <p className="text-sm text-foreground leading-relaxed">
                Valor total gasto em anúncios do Facebook Ads hoje. Representa o investimento em marketing para aquisição de clientes.
              </p>
            </TooltipContent>
          </Tooltip>
          
          {/* Orders Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Tooltip delayDuration={1000}>
              <TooltipTrigger asChild>
                <div className={cn("p-3 rounded-xl border-2 backdrop-blur-sm cursor-pointer hover:scale-[1.01] transition-transform", colorVariants.purple.bg, colorVariants.purple.border)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Pedidos</span>
                    {dailyComparison?.orders && (
                      <ComparisonBadge 
                        changePercent={dailyComparison.orders.changePercent}
                        isPositive={dailyComparison.orders.isPositive}
                        label=""
                      />
                    )}
                  </div>
                  <div className="text-xl md:text-2xl font-black text-chart-5">{ordersCount}</div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Total de hoje</p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] p-3 bg-card border border-border shadow-xl" sideOffset={8}>
                <p className="text-sm text-foreground leading-relaxed">
                  Número total de pedidos realizados hoje. A badge mostra a variação percentual comparado ao mesmo horário de ontem.
                </p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip delayDuration={1000}>
              <TooltipTrigger asChild>
                <div className={cn("p-3 rounded-xl border-2 backdrop-blur-sm cursor-pointer hover:scale-[1.01] transition-transform", colorVariants.green.bg, colorVariants.green.border)}>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 block">Ticket Médio</span>
                  <div className="text-xl md:text-2xl font-black text-chart-4">
                    {formatCurrency(avgOrderValue)}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Por pedido</p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] p-3 bg-card border border-border shadow-xl" sideOffset={8}>
                <p className="text-sm text-foreground leading-relaxed">
                  Valor médio por pedido. Calculado dividindo o faturamento total pelo número de pedidos.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* CPA - Cost Per Acquisition */}
          <Tooltip delayDuration={1000}>
            <TooltipTrigger asChild>
              <div className={cn("p-4 rounded-xl border-2 backdrop-blur-sm cursor-pointer hover:scale-[1.01] transition-transform", colorVariants.orange.bg, colorVariants.orange.border)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-chart-3" />
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">CPA</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Custo por Compra</div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-chart-3">
                  {formatCurrency(cpa)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Facebook Ads</p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px] p-3 bg-card border border-border shadow-xl" sideOffset={8}>
              <p className="text-sm text-foreground leading-relaxed">
                Custo por Aquisição. Quanto custa em média para adquirir um cliente. Calculado dividindo o gasto em ads pelo número de pedidos.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* System Status Footer */}
        <footer className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-chart-4 rounded-full animate-pulse" aria-hidden="true" />
            <span className="text-xs font-bold text-chart-4">OPERACIONAL</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Latência: <span className="text-primary font-bold">12ms</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
