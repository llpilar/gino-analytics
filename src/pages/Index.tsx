import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MetricCard } from "@/components/MetricCard";
import { SalesChart } from "@/components/SalesChart";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { useShopifySummary, useShopifyAnalytics } from "@/hooks/useShopifyData";
import { useMemo } from "react";

const Index = () => {
  const { data: summaryData, isLoading: summaryLoading } = useShopifySummary();
  const { data: analyticsData, isLoading: analyticsLoading } = useShopifyAnalytics();

  const metrics = useMemo(() => {
    if (!summaryData?.data?.orders?.edges) {
      return {
        totalVendasBRL: "R$ 0",
        totalVendasUSD: "$0",
        totalPedidos: "0",
        gastosAds: "R$ 0",
        trendVendas: "+0%",
        trendPedidos: "+0",
      };
    }

    const orders = summaryData.data.orders.edges;
    let totalBRL = 0;
    let totalUSD = 0;

    orders.forEach(({ node }) => {
      const amount = parseFloat(node.totalPriceSet.shopMoney.amount);
      const currency = node.totalPriceSet.shopMoney.currencyCode;

      if (currency === 'BRL') {
        totalBRL += amount;
      } else if (currency === 'USD') {
        totalUSD += amount;
      } else {
        // Conversão aproximada para outras moedas (pode melhorar com API de câmbio)
        totalBRL += amount * 5; // Exemplo simplificado
      }
    });

    const totalPedidos = orders.length;
    // Gastos em ADS seria calculado de outra fonte - aqui é um placeholder
    const gastosAds = totalBRL * 0.15; // 15% do faturamento como exemplo

    return {
      totalVendasBRL: `R$ ${totalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      totalVendasUSD: `$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      totalPedidos: totalPedidos.toString(),
      gastosAds: `R$ ${gastosAds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      trendVendas: "+23%", // Calcularia comparando com período anterior
      trendPedidos: `+${Math.floor(totalPedidos * 0.15)}`,
    };
  }, [summaryData]);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1">
        <DashboardHeader />
        
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Métricas principais */}
            <div className="lg:col-span-9">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-6">
                <MetricCard
                  title="VENDAS TOTAIS (BRL)"
                  value={summaryLoading ? "Carregando..." : metrics.totalVendasBRL}
                  subtitle="Últimas 24 horas"
                  trend="up"
                  trendValue={metrics.trendVendas}
                  color="green"
                />
                <MetricCard
                  title="VENDAS (USD)"
                  value={summaryLoading ? "Carregando..." : metrics.totalVendasUSD}
                  subtitle="Conversão automática"
                  trend="up"
                  trendValue={metrics.trendVendas}
                  color="blue"
                />
                <MetricCard
                  title="GASTOS EM ADS"
                  value={summaryLoading ? "Carregando..." : metrics.gastosAds}
                  subtitle="Estimativa: 15% do faturamento"
                  trend="down"
                  trendValue="-8%"
                  color="orange"
                />
              </div>

              <div className="mb-6">
                <MetricCard
                  title="TOTAL DE PEDIDOS"
                  value={summaryLoading ? "Carregando..." : metrics.totalPedidos}
                  subtitle="Últimas 24 horas"
                  trend="up"
                  trendValue={metrics.trendPedidos}
                  color="green"
                />
              </div>

              {/* Gráfico de vendas */}
              <SalesChart analyticsData={analyticsData} isLoading={analyticsLoading} />
            </div>

            {/* Painel de notificações */}
            <div className="lg:col-span-3">
              <NotificationsPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
