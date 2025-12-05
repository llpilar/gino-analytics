import { useShopifyOrders } from "@/hooks/useShopifyData";
import { ShoppingBag, Package, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/stats-card";

interface OrderItem {
  name: string;
  quantity: number;
  productTitle: string;
  productImage?: string;
}

export const NotificationsPanel = () => {
  const { data: ordersData, isLoading } = useShopifyOrders();
  const [blurProductNames, setBlurProductNames] = useState(false);

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
    <SectionCard color="green" className="flex flex-col h-full max-h-[600px]">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
          <h3 className="text-base font-bold tracking-wider uppercase text-foreground">
            Novas Vendas
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setBlurProductNames(!blurProductNames)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
          title={blurProductNames ? "Mostrar nomes dos produtos" : "Ocultar nomes dos produtos"}
        >
          {blurProductNames ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Últimos pedidos em tempo real</p>
      
      <div className="space-y-3 flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {isLoading ? (
          <div className="loading-pulse text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Carregando pedidos...</p>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
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
                className="relative rounded-xl p-4 bg-card/40 border border-green-500/20 hover:bg-green-500/10 transition-all duration-300 animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30 shadow-lg flex-shrink-0">
                    <ShoppingBag className="w-6 h-6 text-green-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold text-foreground text-base truncate">{order.name}</h4>
                      <span className="text-base font-bold text-green-400 shrink-0">
                        {formatCurrency(order.amount, order.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-1 gap-2">
                      <span className={`text-card-foreground truncate flex-1 min-w-0 transition-all duration-300 ${blurProductNames ? 'blur-sm select-none' : ''}`}>
                        {itemText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground gap-2">
                      <span className={`truncate flex-1 min-w-0 transition-all duration-300 ${blurProductNames ? 'blur-sm select-none' : ''}`}>{order.customer}</span>
                      <span className="whitespace-nowrap">{order.time}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center gap-2 text-green-400">
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
      </div>
    </SectionCard>
  );
};
