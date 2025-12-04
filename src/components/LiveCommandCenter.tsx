import { useEffect, useState } from "react";
import { Globe } from "./ui/globe-feature-section";
import { ShootingStars } from "./ui/shooting-stars";
import { NavBar } from "./ui/tubelight-navbar";
import { useShopifyRevenueToday, useShopifyAnalytics } from "@/hooks/useShopifyData";
import { format } from "date-fns";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { LayoutDashboard, BarChart3, Package, Settings, Wallet, TrendingUp, DollarSign, ShoppingCart, Users, Zap, Monitor, LayoutGrid } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { ComparisonBadge } from "./ComparisonBadge";
import { useDailyComparison } from "@/hooks/useComparisonMetrics";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { Toaster } from "./ui/toaster";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

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
  const salesPerMinute = ordersCount > 0 ? (totalRevenue / 60).toFixed(2) : "0.00";
  const uniqueShoppers = ordersCount > 0 ? Math.floor(ordersCount * 0.85).toString() : "0";
  const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

  // Navigation items
  const navItems = [
    { name: 'Dashboard', url: '/', icon: LayoutDashboard },
    { name: 'Analytics', url: '/analises', icon: BarChart3 },
    { name: 'Products', url: '/produtos', icon: Package },
    { name: 'Contas', url: '/contas', icon: Wallet },
    { name: 'Settings', url: '/configuracoes', icon: Settings }
  ];

  if (revenueLoading) {
    return <DashboardSkeleton />;
  }

  // Satellite data for orbital view - reduced distance for better fit
  const satellites = [
    { label: "REVENUE", value: formatCurrency(totalRevenue), icon: DollarSign, color: "cyan", angle: 0, distance: 240 },
    { label: "ORDERS", value: ordersCount.toString(), icon: ShoppingCart, color: "green", angle: 90, distance: 260 },
    { label: "$/MIN", value: formatCurrency(parseFloat(salesPerMinute)), icon: Zap, color: "purple", angle: 180, distance: 250 },
    { label: "SHOPPERS", value: uniqueShoppers, icon: Users, color: "orange", angle: 270, distance: 270 },
  ];

  const getSatellitePosition = (baseAngle: number, distance: number) => {
    const angle = (baseAngle + rotationAngle) * (Math.PI / 180);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  };

  const colorVariants = {
    cyan: { bg: "bg-neon-cyan/10", border: "border-neon-cyan/40", text: "text-neon-cyan", glow: "shadow-neon-cyan/30" },
    green: { bg: "bg-neon-green/10", border: "border-neon-green/40", text: "text-neon-green", glow: "shadow-neon-green/30" },
    purple: { bg: "bg-neon-purple/10", border: "border-neon-purple/40", text: "text-neon-purple", glow: "shadow-neon-purple/30" },
    orange: { bg: "bg-neon-orange/10", border: "border-neon-orange/40", text: "text-neon-orange", glow: "shadow-neon-orange/30" },
    pink: { bg: "bg-neon-pink/10", border: "border-neon-pink/40", text: "text-neon-pink", glow: "shadow-neon-pink/30" },
    blue: { bg: "bg-neon-blue/10", border: "border-neon-blue/40", text: "text-neon-blue", glow: "shadow-neon-blue/30" },
  };

  return (
    <main 
      className="min-h-screen w-full relative overflow-hidden bg-black"
      role="main"
      aria-label="Dashboard principal de vendas"
    >
      {/* Navigation Bar */}
      <NavBar items={navItems} />
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black" aria-hidden="true">
        <div className="stars-bg absolute inset-0" />
      </div>

      {/* Shooting Stars */}
      <div aria-hidden="true">
        <ShootingStars starColor="#06b6d4" trailColor="#0891b2" minSpeed={15} maxSpeed={35} minDelay={800} maxDelay={2500} />
        <ShootingStars starColor="#8b5cf6" trailColor="#a78bfa" minSpeed={10} maxSpeed={25} minDelay={1500} maxDelay={3500} />
        <ShootingStars starColor="#ec4899" trailColor="#f472b6" minSpeed={20} maxSpeed={40} minDelay={1000} maxDelay={3000} />
      </div>
      
      {/* Ambient Lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[150px]" aria-hidden="true" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-neon-pink/10 rounded-full blur-[150px]" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-neon-green/5 rounded-full blur-[180px]" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-neon-blue/5 rounded-full blur-[180px]" aria-hidden="true" />

      {/* Clock & Notification - Top Right */}
      <header className="fixed top-4 right-4 z-40 flex items-center gap-3">
        <NotificationCenter />
        <div 
          className="px-4 py-2 rounded-full bg-black/80 border border-neon-cyan/30 backdrop-blur-xl shadow-lg shadow-neon-cyan/20"
          role="status"
          aria-live="polite"
          aria-label={`Hora atual: ${format(currentTime, "HH:mm:ss")}`}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-status-success rounded-full animate-pulse shadow-lg shadow-status-success/50" aria-hidden="true" />
            <span className="text-status-success font-bold text-xs uppercase tracking-widest">LIVE</span>
            <time className="text-sm font-mono font-black text-neon-cyan tracking-wider">
              {format(currentTime, "HH:mm:ss")}
            </time>
          </div>
        </div>
      </header>

      {/* Layout Toggle - Desktop Only */}
      {!isMobile && (
        <div className="fixed top-4 left-4 z-40">
          <div className="flex items-center gap-1 p-1 rounded-full bg-black/80 border border-neon-cyan/30 backdrop-blur-xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLayoutMode("orbital")}
              className={cn(
                "rounded-full h-8 px-3 transition-all",
                layoutMode === "orbital" 
                  ? "bg-neon-cyan/20 text-neon-cyan" 
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
                  ? "bg-neon-cyan/20 text-neon-cyan" 
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
              <div className="absolute w-[460px] h-[460px] border border-neon-cyan/20 rounded-full animate-spin" style={{ animationDuration: "60s" }} />
              <div className="absolute w-[520px] h-[520px] border border-neon-purple/20 rounded-full animate-spin" style={{ animationDuration: "80s" }} />
              <div className="absolute w-[580px] h-[580px] border border-neon-pink/10 rounded-full animate-spin" style={{ animationDuration: "100s" }} />
            </div>

            {/* Globe */}
            <div className="relative z-10 w-[380px] h-[380px]" aria-hidden="true">
              <Globe className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-radial from-neon-cyan/30 via-neon-cyan/10 to-transparent blur-3xl animate-pulse-glow" />
              <div className="absolute inset-0 bg-gradient-radial from-neon-blue/20 via-transparent to-transparent blur-2xl animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
            </div>

            {/* Orbital Satellites */}
            {satellites.map((satellite, index) => {
              const pos = getSatellitePosition(satellite.angle, satellite.distance);
              const colors = colorVariants[satellite.color as keyof typeof colorVariants];
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
                  aria-label={`${satellite.label}: ${satellite.value}`}
                >
                  <div className="relative group cursor-pointer">
                    <div className={cn(
                      "relative p-3 rounded-2xl bg-black/90 border-2 backdrop-blur-xl min-w-[120px]",
                      "hover:scale-105 transition-all duration-300 shadow-2xl",
                      colors.border, colors.glow
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
              );
            })}
          </section>

          {/* Right Side: Data Stream Card */}
          <aside 
            className="absolute right-16 top-1/2 -translate-y-1/2 w-[420px] p-6 rounded-2xl bg-black/80 border-2 border-neon-cyan/30 backdrop-blur-xl shadow-2xl shadow-neon-cyan/10"
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
                  Operacional
                </span>
              </div>
            </header>

            {/* Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" aria-label="Métricas principais">
              {satellites.map((stat, index) => {
                const colors = colorVariants[stat.color as keyof typeof colorVariants];
                const Icon = stat.icon;
                return (
                  <article
                    key={stat.label}
                    className={cn(
                      "p-4 md:p-6 rounded-2xl bg-surface-elevated border-2 backdrop-blur-xl",
                      "transition-all duration-300 hover:scale-[1.02] cursor-pointer",
                      "animate-fade-in-up",
                      colors.border, colors.glow, "shadow-lg"
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
                      <span className={cn("text-xs font-semibold", colors.text)}>Tempo real</span>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Data Stream Panel */}
              <section 
                className="lg:col-span-2 p-4 md:p-6 rounded-2xl bg-surface-elevated border-2 border-neon-cyan/30 backdrop-blur-xl shadow-lg shadow-neon-cyan/10 animate-fade-in"
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
                />
              </section>

              {/* Globe Preview - Desktop Grid Only */}
              <aside 
                className="hidden lg:block p-6 rounded-2xl bg-surface-elevated border-2 border-neon-purple/30 backdrop-blur-xl animate-fade-in overflow-hidden"
                style={{ animationDelay: "500ms" }}
                aria-label="Visualização do globo"
              >
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                  Atividade Global
                </h3>
                <div className="relative w-full aspect-square">
                  <Globe className="w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-radial from-neon-purple/20 via-transparent to-transparent blur-2xl" aria-hidden="true" />
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
}

const DataStreamCard = ({ 
  totalRevenue, 
  ordersCount, 
  avgOrderValue, 
  uniqueShoppers, 
  dailyComparison,
  formatCurrency,
  colorVariants
}: DataStreamCardProps) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col tracking-tight w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-neon-cyan rounded-full animate-pulse shadow-lg shadow-neon-cyan/50" aria-hidden="true" />
            <h3 className="text-sm font-black text-neon-cyan uppercase tracking-wider">Shopify Live</h3>
          </div>
          <time className="text-[10px] text-muted-foreground font-mono">
            {format(new Date(), "HH:mm:ss")}
          </time>
        </div>
        
        {/* Key Metrics */}
        <div className="space-y-3">
          {/* Revenue */}
          <div className={cn("p-4 rounded-xl border-2 backdrop-blur-sm", colorVariants.cyan.bg, colorVariants.cyan.border)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Revenue Today</span>
              {dailyComparison?.revenue && (
                <ComparisonBadge 
                  changePercent={dailyComparison.revenue.changePercent}
                  isPositive={dailyComparison.revenue.isPositive}
                />
              )}
            </div>
            <div className="text-2xl md:text-3xl font-black text-neon-cyan">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-blue rounded-full transition-all duration-500" 
                  style={{ width: '78%' }} 
                  role="progressbar"
                  aria-valuenow={78}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <span className="text-xs text-neon-cyan font-bold">+23%</span>
            </div>
          </div>
          
          {/* Orders Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className={cn("p-3 rounded-xl border-2 backdrop-blur-sm", colorVariants.purple.bg, colorVariants.purple.border)}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Orders</span>
                {dailyComparison?.orders && (
                  <ComparisonBadge 
                    changePercent={dailyComparison.orders.changePercent}
                    isPositive={dailyComparison.orders.isPositive}
                    label=""
                  />
                )}
              </div>
              <div className="text-xl md:text-2xl font-black text-neon-purple">{ordersCount}</div>
              <p className="text-[9px] text-muted-foreground mt-0.5">Total today</p>
            </div>
            
            <div className={cn("p-3 rounded-xl border-2 backdrop-blur-sm", colorVariants.green.bg, colorVariants.green.border)}>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 block">Avg Order</span>
              <div className="text-xl md:text-2xl font-black text-neon-green">
                {formatCurrency(avgOrderValue)}
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">Per order</p>
            </div>
          </div>

          {/* Active Shoppers */}
          <div className={cn("p-4 rounded-xl border-2 backdrop-blur-sm", colorVariants.orange.bg, colorVariants.orange.border)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Active Shoppers</span>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <div className="w-2 h-2 bg-status-success rounded-full animate-ping absolute" aria-hidden="true" />
                  <div className="w-2 h-2 bg-status-success rounded-full" />
                </div>
                <span className="text-[9px] text-status-success font-bold">LIVE</span>
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-neon-orange">
              {uniqueShoppers}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Shopping right now</p>
          </div>
        </div>

        {/* System Status Footer */}
        <footer className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" aria-hidden="true" />
            <span className="text-xs font-bold text-status-success">OPERATIONAL</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Latency: <span className="text-neon-cyan font-bold">12ms</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
