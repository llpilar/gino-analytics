import { useEffect, useState } from "react";
import { LEDDisplay } from "./LEDDisplay";
import { Globe } from "./ui/globe-feature-section";
import { ShootingStars } from "./ui/shooting-stars";
import { NavBar } from "./ui/tubelight-navbar";
import { PinContainer } from "./ui/3d-pin";
import { useShopifyRevenueToday, useShopifyAnalytics } from "@/hooks/useShopifyData";
import { format } from "date-fns";
import { Skeleton } from "./ui/skeleton";
import { LayoutDashboard, BarChart3, Package, Settings } from "lucide-react";

export const LiveCommandCenter = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rotationAngle, setRotationAngle] = useState(0);
  const { data: revenueData, isLoading: revenueLoading } = useShopifyRevenueToday();
  const { data: analyticsData } = useShopifyAnalytics();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Orbital rotation animation
  useEffect(() => {
    const rotationTimer = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(rotationTimer);
  }, []);

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
  
  // Mock real-time metrics (can be replaced with actual real-time data)
  const salesPerMinute = ordersCount > 0 ? (totalRevenue / 60).toFixed(2) : "0.00";
  const ordersPerMinute = ordersCount > 0 ? (ordersCount / 60).toFixed(1) : "0.0";
  const uniqueShoppers = ordersCount > 0 ? Math.floor(ordersCount * 0.85).toString() : "0";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('COP', '$');
  };

  // Navigation items for dashboard
  const navItems = [
    { name: 'Dashboard', url: '/', icon: LayoutDashboard },
    { name: 'Analytics', url: '/analises', icon: BarChart3 },
    { name: 'Products', url: '/produtos', icon: Package },
    { name: 'Settings', url: '/configuracoes', icon: Settings }
  ];

  if (revenueLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  // Orbital satellites data
  const satellites = [
    {
      label: "REVENUE",
      value: formatCurrency(totalRevenue),
      color: "from-cyan-500 to-blue-500",
      icon: "💰",
      angle: 0,
      distance: 280,
    },
    {
      label: "ORDERS",
      value: ordersCount.toString(),
      color: "from-green-500 to-emerald-500",
      icon: "📦",
      angle: 90,
      distance: 320,
    },
    {
      label: "$/MIN",
      value: formatCurrency(parseFloat(salesPerMinute)),
      color: "from-purple-500 to-pink-500",
      icon: "⚡",
      angle: 180,
      distance: 300,
    },
    {
      label: "SHOPPERS",
      value: uniqueShoppers,
      color: "from-orange-500 to-red-500",
      icon: "👥",
      angle: 270,
      distance: 340,
    },
  ];

  const getSatellitePosition = (baseAngle: number, distance: number) => {
    const angle = (baseAngle + rotationAngle) * (Math.PI / 180);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    return { x, y };
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black">
      {/* Navigation Bar */}
      <NavBar items={navItems} />
      
      {/* Background with shooting stars and static stars */}
      <div className="absolute inset-0 bg-black">
        <div className="stars-bg absolute inset-0" />
      </div>

      {/* Multiple shooting star layers with neon colors */}
      <ShootingStars starColor="#a3e635" trailColor="#84cc16" minSpeed={15} maxSpeed={35} minDelay={800} maxDelay={2500} />
      <ShootingStars starColor="#3b82f6" trailColor="#60a5fa" minSpeed={10} maxSpeed={25} minDelay={1500} maxDelay={3500} />
      <ShootingStars starColor="#a855f7" trailColor="#c084fc" minSpeed={20} maxSpeed={40} minDelay={1000} maxDelay={3000} />
      <ShootingStars starColor="#ec4899" trailColor="#f472b6" minSpeed={12} maxSpeed={30} minDelay={1200} maxDelay={4000} />
      
      {/* Subtle Ambient Lighting Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[150px]" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[180px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[180px]" />

      {/* Clock Widget - Top Right */}
      <div className="fixed top-4 right-4 z-40">
        <div className="px-6 py-3 rounded-full bg-black/80 border-2 border-cyan-500/30 backdrop-blur-xl shadow-lg shadow-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
              <span className="text-green-400 font-bold text-xs uppercase tracking-widest">LIVE</span>
            </div>
            <div className="text-sm font-mono font-black text-cyan-300 tracking-wider">
              {format(currentTime, "HH:mm:ss")}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Orbital System */}
      <div className="relative z-10 h-screen flex items-center justify-center p-4 pt-20">{/* pt-20 para espaço do navbar */}
        {/* Central Globe */}
        <div className="relative w-[500px] h-[500px] flex items-center justify-center">
          {/* Orbital rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-[560px] h-[560px] border border-cyan-500/20 rounded-full animate-spin" style={{ animationDuration: "60s" }} />
            <div className="absolute w-[640px] h-[640px] border border-purple-500/20 rounded-full animate-spin" style={{ animationDuration: "80s" }} />
            <div className="absolute w-[680px] h-[680px] border border-pink-500/10 rounded-full animate-spin" style={{ animationDuration: "100s" }} />
          </div>

          {/* Globe */}
          <div className="relative z-10 w-full h-full">
            <Globe className="w-full h-full" />
            {/* Efeitos de brilho pulsante ao redor do globo */}
            <div className="absolute inset-0 bg-gradient-radial from-cyan-500/30 via-cyan-500/10 to-transparent blur-3xl animate-pulse" style={{ animationDuration: "3s" }} />
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 via-transparent to-transparent blur-2xl animate-pulse" style={{ animationDuration: "4s", animationDelay: "0.5s" }} />
            
            {/* Anel de energia ao redor */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" style={{ animationDuration: "3s" }} />
          </div>

          {/* Orbital Satellites */}
          {satellites.map((satellite, index) => {
            const pos = getSatellitePosition(satellite.angle, satellite.distance);
            return (
              <div
                key={index}
                className="absolute w-40 h-40 flex items-center justify-center"
                style={{
                  left: `calc(50% + ${pos.x}px)`,
                  top: `calc(50% + ${pos.y}px)`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className={`relative group cursor-pointer`}>
                  {/* Connection line to center */}
                  <div 
                    className="absolute w-1 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent"
                    style={{
                      height: `${satellite.distance}px`,
                      left: "50%",
                      bottom: "50%",
                      transformOrigin: "bottom",
                      transform: `translateX(-50%) rotate(${-satellite.angle - rotationAngle}deg)`,
                    }}
                  />
                  
                  {/* Satellite card */}
                  <div className={`relative p-4 rounded-2xl bg-black/80 border-2 border-transparent bg-gradient-to-br ${satellite.color} backdrop-blur-xl
                    hover:scale-110 transition-all duration-300 shadow-2xl`}
                    style={{
                      boxShadow: `0 0 30px rgba(6, 182, 212, 0.3)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/90 rounded-2xl" />
                    <div className="relative z-10">
                      <div className="text-3xl mb-2 text-center">{satellite.icon}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center mb-1">
                        {satellite.label}
                      </div>
                      <div className={`text-xl font-black text-transparent bg-clip-text bg-gradient-to-r ${satellite.color} text-center`}>
                        {satellite.value}
                      </div>
                    </div>
                    
                    {/* Glow effect */}
                    <div className={`absolute inset-0 rounded-2xl blur-xl opacity-50 bg-gradient-to-br ${satellite.color} -z-10`} />
                  </div>

                  {/* Pulse animation */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-cyan-500/50 animate-ping" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Side Panel - Data Stream with 3D Pin Effect */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-96">
          <PinContainer
            title="Live Data Stream"
            containerClassName="w-full"
          >
            <div className="w-80 space-y-4">
              {/* Main Data Stream Card */}
              <div className="flex flex-col tracking-tight w-full">
                {/* Header with Live Indicator */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-lg shadow-cyan-500/50" />
                  <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider">Live Data Stream</h3>
                </div>
                
                {/* Stats Grid */}
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-transparent border-l-4 border-cyan-500 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Orders/Min</div>
                      <div className="text-xs text-cyan-400 font-mono">LIVE</div>
                    </div>
                    <div className="text-3xl font-black text-cyan-400">{ordersPerMinute}</div>
                    <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse" style={{ width: '75%' }} />
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-transparent border-l-4 border-purple-500 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Sessions</div>
                      <div className="text-xs text-purple-400 font-mono">NOW</div>
                    </div>
                    <div className="text-3xl font-black text-purple-400">{uniqueShoppers}</div>
                    <div className="mt-2 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex-1 h-1 bg-purple-500/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full" 
                            style={{ 
                              width: `${Math.random() * 100}%`,
                              animation: `pulse ${1 + i * 0.2}s ease-in-out infinite`
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-transparent border-l-4 border-green-500 backdrop-blur-sm">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">System Status</div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute" />
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                      </div>
                      <span className="text-lg font-black text-green-400">OPERATIONAL</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">All systems nominal</div>
                  </div>
                </div>

                {/* Performance Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 backdrop-blur-xl">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Uptime</div>
                    <div className="text-xl font-black text-cyan-400">99.9%</div>
                    <div className="text-[8px] text-gray-600 mt-0.5">Last 30 days</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/60 border border-purple-500/30 backdrop-blur-xl">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Latency</div>
                    <div className="text-xl font-black text-purple-400">12ms</div>
                    <div className="text-[8px] text-gray-600 mt-0.5">Avg response</div>
                  </div>
                </div>

                {/* Footer with timestamp */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-800">
                  <div className="text-[10px] text-gray-500 font-mono">
                    Last update: {format(new Date(), "HH:mm:ss")}
                  </div>
                  <div className="text-cyan-400 text-xs font-bold">
                    MONITORING →
                  </div>
                </div>
              </div>
            </div>
          </PinContainer>
        </div>
      </div>

      <style>{`
        .stars-bg {
          background-image: 
            radial-gradient(2px 2px at 20px 30px, #06b6d4, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 40px 70px, #8b5cf6, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 50px 160px, #ec4899, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 90px 40px, #a3e635, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 130px 80px, #60a5fa, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 160px 120px, #84cc16, rgba(0,0,0,0)),
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
    </div>
  );
};
