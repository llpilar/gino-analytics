import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardMetrics } from "@/components/DashboardMetrics";

import { SalesChart } from "@/components/SalesChart";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { ShopifyProductList } from "@/components/ShopifyProductList";
import { ProductSalesTable } from "@/components/ProductSalesTable";
import { LiveClock } from "@/components/LiveClock";
import { useShopifyAnalytics } from "@/hooks/useShopifyData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const { data: analyticsData, isLoading: analyticsLoading } = useShopifyAnalytics();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800">
      <DashboardSidebar />
      
      <main className="flex-1 min-w-0">
        <DashboardHeader />
        
        <div className="p-4 md:p-6 lg:p-8">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="glass-card border-zinc-800 mb-6 p-1">
              <TabsTrigger 
                value="dashboard" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg font-semibold"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg font-semibold"
              >
                Produtos
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                {/* Main Content */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-4 md:space-y-6 min-w-0">
                  <DashboardMetrics />
                  <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-4 md:space-y-6 min-w-0">
                  <LiveClock />
                  <div className="max-h-[600px] overflow-hidden">
                    <NotificationsPanel />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="products" className="space-y-6">
              <ProductSalesTable />
              <ShopifyProductList />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
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
};

export default Index;
