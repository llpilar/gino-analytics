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
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      
      {/* Rainbow Arc Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-gradient-to-r from-purple-500/20 via-pink-500/20 via-yellow-500/20 via-green-500/20 to-blue-500/20 blur-3xl" />

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-8 py-4 border-b border-zinc-800/50 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-black text-primary">SHOPDASH</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-500 font-bold text-sm">LIVE</span>
          </div>
        </div>
        <div className="text-lg md:text-xl font-mono text-zinc-300">
          {format(currentTime, "EEE MMM dd - HH:mm:ss 'GMT'")}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-120px)]">
          {/* Left: Globe - 40% width on large screens */}
          <div className="lg:w-[40%] flex items-center justify-center">
            <div className="relative w-full aspect-square max-w-[700px]">
              <LiveGlobe className="w-full h-full" />
            </div>
          </div>

          {/* Right: Metrics - 60% width on large screens */}
          <div className="lg:w-[60%] flex flex-col gap-4 justify-center px-4">
            {/* Sales Per Minute - Large Display */}
            <div className="animate-fade-in">
              <LEDDisplay
                label="SALES PER MINUTE"
                value={formatCurrency(parseFloat(salesPerMinute))}
                size="xl"
                color="amber"
              />
            </div>

            {/* Orders & Shoppers Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <LEDDisplay
                label="ORDERS PER MINUTE"
                value={ordersPerMinute}
                size="lg"
                color="amber"
              />
              <LEDDisplay
                label="UNIQUE SHOPPERS"
                value={uniqueShoppers}
                size="lg"
                color="amber"
              />
            </div>

            {/* Top Live Banner */}
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <LEDDisplay
                value="🔥 TOP LIVE"
                size="lg"
                color="green"
              />
            </div>

            {/* Total Stats - Enhanced Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="glass-card p-6 border-primary/30 hover:border-primary/50 hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    Total Revenue Today
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-black text-primary drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]">
                  {formatCurrency(totalRevenue)}
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Real-time tracking
                </div>
              </div>
              
              <div className="glass-card p-6 border-green-500/30 hover:border-green-500/50 hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    Total Orders Today
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-black text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                  {ordersCount}
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Live order count
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
