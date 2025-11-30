import { useEffect, useState } from "react";
import { LEDDisplay } from "./LEDDisplay";
import { LiveGlobe } from "./LiveGlobe";
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
    <div className="min-h-screen w-full relative overflow-hidden bg-black">
      {/* Animated Background with Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
      
      {/* Rainbow Arc Effect - More Vibrant */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-purple-600/30 via-pink-500/30 via-yellow-400/30 via-green-500/30 to-blue-500/30 blur-2xl animate-pulse" />
      
      {/* Purple Glow Left */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      
      {/* Green Glow Right */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 md:px-8 py-3 border-b border-zinc-800/50 bg-black/60 backdrop-blur-xl">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center font-black text-black text-sm md:text-base">
              SD
            </div>
            <h1 className="text-xl md:text-2xl font-black text-primary tracking-tight">SHOPDASH</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
            <span className="text-red-500 font-bold text-xs md:text-sm">LIVE</span>
          </div>
        </div>
        <div className="text-sm md:text-base font-mono text-zinc-300 tracking-wider">
          {format(currentTime, "EEE MMM dd - HH:mm:ss 'GMT'")}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-[calc(100vh-80px)] flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-8">
          {/* Left: Globe - Larger, 55% */}
          <div className="lg:col-span-7 flex items-center justify-center py-8 lg:py-0">
            <div className="relative w-full max-w-[800px] aspect-square">
              <LiveGlobe className="w-full h-full" />
              {/* Glow effect around globe */}
              <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent blur-3xl -z-10" />
            </div>
          </div>

          {/* Right: Metrics - 45% */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-center">
            {/* Sales Per Minute - Hero Display */}
            <div className="animate-fade-in">
              <LEDDisplay
                label="SALES PER MINUTE"
                value={formatCurrency(parseFloat(salesPerMinute))}
                size="xl"
                color="amber"
              />
            </div>

            {/* Orders & Shoppers - Side by Side */}
            <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <LEDDisplay
                label="ORDERS PER MINUTE"
                value={ordersPerMinute}
                size="md"
                color="amber"
              />
              <LEDDisplay
                label="UNIQUE SHOPPERS"
                value={uniqueShoppers}
                size="md"
                color="amber"
              />
            </div>

            {/* Top Live Banner - Full Width */}
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="relative p-8 rounded-2xl border-4 border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-amber-900/40 to-amber-950/40 overflow-hidden">
                {/* LED Grid Background */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #f59e0b 1.5px, transparent 1.5px)',
                    backgroundSize: '12px 12px'
                  }}
                />
                <div className="relative z-10 text-center">
                  <div className="text-5xl md:text-6xl lg:text-7xl font-black text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,1)] tracking-wider animate-pulse">
                    TOP LIVE
                  </div>
                </div>
                {/* Animated border glow */}
                <div className="absolute inset-0 border-4 border-amber-500/50 rounded-2xl animate-pulse" />
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
