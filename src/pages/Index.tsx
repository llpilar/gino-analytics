import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { SalesChart } from "@/components/SalesChart";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { ShopifyProductList } from "@/components/ShopifyProductList";
import { LiveClock } from "@/components/LiveClock";
import { useShopifyAnalytics } from "@/hooks/useShopifyData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const { data: analyticsData, isLoading: analyticsLoading } = useShopifyAnalytics();

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1">
        <DashboardHeader />
        
        <div className="p-4 md:p-6 min-h-screen">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="mb-6 liquid-glass border-white/10">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="products" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                Produtos
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Métricas principais */}
                <div className="lg:col-span-9 space-y-6">
                  <DashboardMetrics />
                  
                  {/* Gráfico de vendas */}
                  <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
                </div>

                {/* Sidebar direita com relógio e notificações */}
                <div className="lg:col-span-3 space-y-6">
                  <LiveClock />
                  <NotificationsPanel />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="products">
              <ShopifyProductList />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
