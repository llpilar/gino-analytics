import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShopifyOrders } from "@/hooks/useShopifyData";
import { ShoppingBag, TrendingUp } from "lucide-react";
import { useMemo } from "react";

export const NotificationsPanel = () => {
  const { data: ordersData } = useShopifyOrders();

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
      })
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
    <Card className="glass-card h-full">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <CardTitle className="text-lg font-bold tracking-wider uppercase">
            Novas Vendas
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Últimos pedidos em tempo real</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aguardando novos pedidos...</p>
          </div>
        ) : (
          recentOrders.map((order) => (
            <div 
              key={order.id}
              className="liquid-glass rounded-xl p-4 border border-white/10 hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{order.name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">
                    {formatCurrency(order.amount, order.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-500">
                <TrendingUp className="w-3 h-3" />
                <span>Nova venda</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
