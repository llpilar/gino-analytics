import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { SalesChart } from "@/components/SalesChart";
import { useShopifyAnalytics } from "@/hooks/useShopifyData";

export default function Analises() {
  const { data: analyticsData, isLoading: analyticsLoading } = useShopifyAnalytics();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800">
      <DashboardSidebar />
      
      <main className="flex-1 min-w-0">
        <DashboardHeader />
        
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">Análises</h1>
            </div>
            <p className="text-zinc-400">Visualize métricas e tendências das suas vendas</p>
          </div>

          <div className="space-y-6">
            <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
          </div>
        </div>

        <footer className="border-t border-zinc-800 mt-12 py-4">
          <div className="px-4 md:px-6 lg:px-8">
            <p className="text-center text-xs text-zinc-500">
              Built with <span className="text-primary">Lovable</span> • ShopDash Analytics Dashboard
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}