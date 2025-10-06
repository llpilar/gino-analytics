import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShopifyOrders } from "@/hooks/useShopifyData";
import { ShoppingBag, TrendingUp, Package } from "lucide-react";
import { useMemo } from "react";

export const NotificationsPanel = () => {
  const { data: ordersData, isLoading } = useShopifyOrders();

  const recentOrders = useMemo(() => {
    if (!ordersData?.data?.orders?.edges) return [];
    
    return ordersData.data.orders.edges.slice(0, 5).map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      customer: edge.node.customer?.displayName || 'Cliente',
      amount: parseFloat(edge.node.totalPriceSet?.shopMoney?.amount || '0'),
      currency: edge.node.totalPriceSet?.shopMoney?.currencyCode || 'COP',
      time: new Date(edge.node.createdAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: edge.node.fulfillmentStatus || 'pending'
    }));
  }, [ordersData]);

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(amount);
    }
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('COP', '$');
  };

  return (
    <Card className="glass-card h-full border-zinc-800 flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
          <CardTitle className="text-base font-bold tracking-wider uppercase text-white">
            Novas Vendas
          </CardTitle>
        </div>
        <p className="text-xs text-zinc-400">Últimos pedidos em tempo real</p>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="loading-pulse text-center py-8 text-zinc-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Carregando pedidos...</p>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aguardando novos pedidos...</p>
          </div>
        ) : (
          recentOrders.map((order) => (
            <div 
              key={order.id}
              className="glass-card p-4 border-zinc-700/50 hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{order.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{order.customer}</p>
                  </div>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <p className="text-sm font-bold text-primary whitespace-nowrap">
                    {formatCurrency(order.amount, order.currency)}
                  </p>
                  <p className="text-xs text-zinc-500">{order.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-500">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-semibold">Nova venda confirmada</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
