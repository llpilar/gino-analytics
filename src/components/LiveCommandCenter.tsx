import { useEffect, useState } from "react";
import { LEDDisplay } from "./LEDDisplay";
import { ColombiaGlobe3D } from "./ColombiaGlobe3D";
import { useShopifyRevenueToday, useShopifyAnalytics } from "@/hooks/useShopifyData";
import { format } from "date-fns";
import { Skeleton } from "./ui/skeleton";

export const LiveCommandCenter = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { data: revenueData, isLoading: revenueLoading } = useShopifyRevenueToday();
  const { data: analyticsData } = useShopifyAnalytics();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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

  if (revenueLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-b from-zinc-900 via-black to-zinc-950">
      {/* Desk Surface Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/50 to-zinc-800/30" />
      
      {/* Ambient Lighting Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]" />

      {/* Header Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 md:px-8 py-3 border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary to-green-400 rounded-lg flex items-center justify-center font-black text-black text-sm md:text-base shadow-lg shadow-primary/50">
              SD
            </div>
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">SHOPDASH</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
            <span className="text-red-500 font-bold text-xs md:text-sm uppercase tracking-wider">LIVE</span>
          </div>
        </div>
        <div className="text-sm md:text-base font-mono font-bold text-zinc-300 tracking-wider">
          {format(currentTime, "EEE MMM dd - HH:mm:ss 'GMT'")}
        </div>
      </div>

      {/* 3D Desk Perspective View */}
      <div className="relative z-10 h-[calc(100vh-70px)]" style={{ perspective: '2000px' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8">
          
          {/* Top: Large LED Display Banner */}
          <div className="w-full max-w-6xl mb-8 animate-fade-in">
            <div className="relative p-6 md:p-10 rounded-3xl border-4 border-amber-500/40 bg-gradient-to-r from-black via-amber-950/60 to-black overflow-hidden shadow-2xl shadow-amber-500/20">
              {/* LED Matrix Background */}
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: 'radial-gradient(circle, #f59e0b 2px, transparent 2px)',
                  backgroundSize: '16px 16px'
                }}
              />
              
              {/* Main Display */}
              <div className="relative z-10">
                <div className="text-center mb-4">
                  <div className="text-xs md:text-sm font-bold text-amber-400/80 uppercase tracking-[0.5em] mb-2">
                    SALES PER MINUTE
                  </div>
                  <div className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-amber-500 font-mono tracking-tight drop-shadow-[0_0_30px_rgba(245,158,11,1)]">
                    {formatCurrency(parseFloat(salesPerMinute))}
                  </div>
                </div>
                
                {/* Bottom Row Metrics */}
                <div className="grid grid-cols-2 gap-4 md:gap-8 mt-6">
                  <div className="text-center">
                    <div className="text-xs font-bold text-amber-400/70 uppercase tracking-widest mb-1">
                      Orders per minute
                    </div>
                    <div className="text-2xl md:text-4xl lg:text-5xl font-black text-amber-500 font-mono drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]">
                      {ordersPerMinute}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-amber-400/70 uppercase tracking-widest mb-1">
                      Unique shoppers
                    </div>
                    <div className="text-2xl md:text-4xl lg:text-5xl font-black text-amber-500 font-mono drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]">
                      {uniqueShoppers}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Scanlines */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
              </div>
              
              {/* Glow borders */}
              <div className="absolute inset-0 border-4 border-amber-500/30 rounded-3xl animate-pulse pointer-events-none" />
            </div>
          </div>

          {/* Middle: Globe + Side Panel */}
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            {/* Center: 3D Colombia Globe */}
            <div className="lg:col-span-2 flex items-center justify-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="relative w-full max-w-[700px] aspect-square" 
                   style={{ 
                     transform: 'rotateX(5deg) translateZ(50px)',
                     transformStyle: 'preserve-3d'
                   }}>
                <ColombiaGlobe3D className="w-full h-full" />
                {/* Globe base shadow */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-primary/30 rounded-full blur-3xl" />
                {/* Ambient glow rings */}
                <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-3xl -z-10 animate-pulse" />
                <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-transparent to-transparent blur-3xl -z-10 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>

            {/* Right: Side Monitor Panel */}
            <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="glass-card p-6 border-primary/30 space-y-4"
                   style={{
                     transform: 'rotateY(-5deg) translateZ(30px)',
                     transformStyle: 'preserve-3d'
                   }}>
                
                {/* Title */}
                <div className="text-center mb-4">
                  <div className="text-lg font-black text-primary uppercase tracking-wider drop-shadow-[0_0_10px_rgba(163,230,53,0.6)]">
                    Live Stats
                  </div>
                </div>

                {/* Revenue Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-green-500/10 border border-primary/30 hover:border-primary/50 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Total Revenue
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-primary drop-shadow-[0_0_15px_rgba(163,230,53,0.5)]">
                    {formatCurrency(totalRevenue)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
                    Today • Real-time
                  </div>
                </div>

                {/* Orders Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 hover:border-green-500/50 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Total Orders
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                    {ordersCount}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
                    Today • Live count
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-zinc-800">
                  <div className="text-center p-2">
                    <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Status</div>
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-green-500">Active</span>
                    </div>
                  </div>
                  <div className="text-center p-2">
                    <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Mode</div>
                    <div className="text-xs font-bold text-primary">Live</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
    </div>
  );
};
