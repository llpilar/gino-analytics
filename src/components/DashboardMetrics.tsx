import { MetricCard } from "./MetricCard";
import { useShopifyOrdersToday, useShopifyRevenueToday, useShopifyLowStock, useShopifyCustomersToday } from "@/hooks/useShopifyData";
import { useMemo } from "react";
import { Skeleton } from "./ui/skeleton";

export const DashboardMetrics = () => {
  const { data: ordersData, isLoading: ordersLoading } = useShopifyOrdersToday();
  const { data: revenueData, isLoading: revenueLoading } = useShopifyRevenueToday();
  const { data: stockData, isLoading: stockLoading } = useShopifyLowStock();
  const { data: customersData, isLoading: customersLoading } = useShopifyCustomersToday();

  const ordersCount = useMemo(() => {
    return ordersData?.data?.orders?.edges?.length || 0;
  }, [ordersData]);

  const totalRevenue = useMemo(() => {
    if (!revenueData?.data?.orders?.edges) return 0;
    
    return revenueData.data.orders.edges.reduce((acc: number, edge: any) => {
      const amount = parseFloat(edge.node.currentTotalPriceSet?.shopMoney?.amount || '0');
      return acc + amount;
    }, 0);
  }, [revenueData]);

  const lowStockProducts = useMemo(() => {
    if (!stockData?.data?.products?.edges) return [];
    
    return stockData.data.products.edges
      .filter((edge: any) => {
        const totalInventory = edge.node.totalInventory || 0;
        return totalInventory < 10 && totalInventory > 0;
      })
      .map((edge: any) => ({
        title: edge.node.title,
        inventory: edge.node.totalInventory
      }));
  }, [stockData]);

  const customersCount = useMemo(() => {
    return customersData?.data?.customers?.edges?.length || 0;
  }, [customersData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  if (ordersLoading || revenueLoading || stockLoading || customersLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="PEDIDOS DE HOJE"
        value={ordersCount.toString()}
        subtitle={`${ordersCount} pedido${ordersCount !== 1 ? 's' : ''} criado${ordersCount !== 1 ? 's' : ''} hoje`}
        color="blue"
      />
      
      <MetricCard
        title="FATURAMENTO DE HOJE"
        value={formatCurrency(totalRevenue)}
        subtitle="Total em vendas de hoje"
        color="green"
      />
      
      <MetricCard
        title="ESTOQUE BAIXO"
        value={lowStockProducts.length.toString()}
        subtitle={lowStockProducts.length > 0 
          ? `${lowStockProducts.slice(0, 2).map((p: any) => p.title).join(', ')}${lowStockProducts.length > 2 ? '...' : ''}`
          : 'Nenhum produto com estoque baixo'
        }
        color="orange"
      />
      
      <MetricCard
        title="NOVOS CLIENTES"
        value={customersCount.toString()}
        subtitle={`${customersCount} cliente${customersCount !== 1 ? 's' : ''} novo${customersCount !== 1 ? 's' : ''} hoje`}
        color="green"
      />
    </div>
  );
};
