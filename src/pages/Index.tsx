import { DashboardLayout } from "@/components/DashboardLayout";
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
    <DashboardLayout>
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
            {/* First Row: Metrics + Clock */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              <div className="lg:col-span-8 xl:col-span-9">
                <DashboardMetrics />
              </div>
              <div className="lg:col-span-4 xl:col-span-3">
                <LiveClock />
              </div>
            </div>

            {/* Second Row: Sales Chart + Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              <div className="lg:col-span-8 xl:col-span-9">
                <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
              </div>
              <div className="lg:col-span-4 xl:col-span-3">
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
    </DashboardLayout>
  );
};

export default Index;
