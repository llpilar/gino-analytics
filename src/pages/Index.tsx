import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MetricCard } from "@/components/MetricCard";
import { SalesChart } from "@/components/SalesChart";
import { NotificationsPanel } from "@/components/NotificationsPanel";

const Index = () => {
  // Dados mockados para demonstração
  const totalVendas = "R$ 127.450";
  const totalVendasUSD = "$25,490";
  const totalPedidos = "89";
  const gastosAds = "R$ 12.340";

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1">
        <DashboardHeader />
        
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Métricas principais */}
            <div className="col-span-9">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <MetricCard
                  title="VENDAS TOTAIS (BRL)"
                  value={totalVendas}
                  subtitle="Últimas 24 horas"
                  trend="up"
                  trendValue="+23%"
                  color="green"
                />
                <MetricCard
                  title="VENDAS (USD)"
                  value={totalVendasUSD}
                  subtitle="Conversão automática"
                  trend="up"
                  trendValue="+23%"
                  color="blue"
                />
                <MetricCard
                  title="GASTOS EM ADS"
                  value={gastosAds}
                  subtitle="Meta: R$ 15.000"
                  trend="down"
                  trendValue="-8%"
                  color="orange"
                />
              </div>

              <div className="mb-6">
                <MetricCard
                  title="TOTAL DE PEDIDOS"
                  value={totalPedidos}
                  subtitle="Hoje"
                  trend="up"
                  trendValue="+15 pedidos"
                  color="green"
                />
              </div>

              {/* Gráfico de vendas */}
              <SalesChart />
            </div>

            {/* Painel de notificações */}
            <div className="col-span-3">
              <NotificationsPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
