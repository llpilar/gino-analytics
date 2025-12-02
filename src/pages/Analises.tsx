import { DashboardWrapper } from "@/components/DashboardWrapper";
import { BarChart3 } from "lucide-react";
import { SalesChart } from "@/components/SalesChart";
import { useShopifyAnalytics } from "@/hooks/useShopifyData";

export default function Analises() {
  const { data: analyticsData, isLoading: analyticsLoading } = useShopifyAnalytics();

  return (
    <DashboardWrapper>
      <div className="container mx-auto p-6 md:p-8 lg:p-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <BarChart3 className="h-7 w-7 text-cyan-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Analytics
            </h1>
          </div>
          <p className="text-gray-400 text-sm md:text-base">Visualize métricas e tendências das suas vendas</p>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-black/60 border border-cyan-500/30 backdrop-blur-xl">
            <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
          </div>
        </div>
      </div>
    </DashboardWrapper>
  );
}