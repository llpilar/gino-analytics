import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShopifyOrders } from "@/hooks/useShopifyData";
import { ShoppingBag, Package } from "lucide-react";
import { useMemo } from "react";

interface OrderItem {
  name: string;
  quantity: number;
  productTitle: string;
  productImage?: string;
}

export const NotificationsPanel = () => {
  const { data: ordersData, isLoading } = useShopifyOrders();

  const recentOrders = useMemo(() => {
    if (!ordersData?.data?.orders?.edges) return [];
    
    return ordersData.data.orders.edges.slice(0, 5).map((edge: any) => {
      const lineItems: OrderItem[] = edge.node.lineItems?.edges?.map((itemEdge: any) => ({
        name: itemEdge.node.name,
        quantity: itemEdge.node.quantity,
        productTitle: itemEdge.node.variant?.product?.title || itemEdge.node.name,
        productImage: itemEdge.node.variant?.product?.featuredImage?.url
      })) || [];

      return {
        id: edge.node.id,
        name: edge.node.name,
        customer: edge.node.customer?.displayName || 'Cliente',
        amount: parseFloat(edge.node.totalPriceSet?.shopMoney?.amount || '0'),
        currency: edge.node.totalPriceSet?.shopMoney?.currencyCode || 'COP',
        time: new Date(edge.node.createdAt).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        items: lineItems,
        totalItems: lineItems.reduce((acc, item) => acc + item.quantity, 0)
      };
    });
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
    <Card className="glass-card border-zinc-800 flex flex-col h-full max-h-[600px]">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
          <CardTitle className="text-base font-bold tracking-wider uppercase text-white">
            Novas Vendas
          </CardTitle>
        </div>
        <p className="text-xs text-zinc-400">Últimos pedidos em tempo real</p>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
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
          recentOrders.map((order) => {
            const firstItem = order.items[0];
            const itemText = firstItem 
              ? `${order.totalItems} ${order.totalItems === 1 ? 'item' : 'itens'} de ${firstItem.productTitle}`
              : `${order.totalItems} ${order.totalItems === 1 ? 'item' : 'itens'}`;
            
            return (
              <div 
                key={order.id}
                className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/20 shadow-2xl hover:shadow-primary/20 transition-all duration-300 animate-fade-in"
                style={{
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 20px rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-lg flex-shrink-0">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-white text-lg">{order.name}</h4>
                      <span className="text-lg font-bold text-primary ml-3 flex-shrink-0">
                        {formatCurrency(order.amount, order.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-zinc-300 truncate">{itemText}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <span className="truncate">{order.customer}</span>
                      <span className="ml-2 flex-shrink-0">{order.time}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center gap-2 text-primary">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                  <span className="text-sm font-semibold">Nova venda confirmada</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
