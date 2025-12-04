import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLiveShopify } from "@/hooks/useLiveShopify";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SectionCard } from "@/components/ui/stats-card";
import { ShoppingCart } from "lucide-react";

export const ActiveSessions = () => {
  const { data, isLoading } = useLiveShopify();

  const getOrderStatus = (createdAt: string) => {
    const orderDate = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 5) return "purchased";
    if (diffInMinutes < 30) return "checkout";
    return "viewing";
  };

  const statusColors = {
    viewing: "bg-blue-500",
    checkout: "bg-yellow-500",
    purchased: "bg-green-500",
  };

  const statusLabels = {
    viewing: "Navegando",
    checkout: "No Carrinho",
    purchased: "Comprou",
  };

  const recentOrders = data?.orders?.slice(0, 10) || [];

  return (
    <SectionCard title="Pedidos Recentes" icon={ShoppingCart} color="purple" className="h-[500px]">
      <ScrollArea className="h-[380px] pr-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Carregando...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum pedido recente
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order: any, index: number) => {
              const status = getOrderStatus(order.createdAt);
              const timeAgo = formatDistanceToNow(new Date(order.createdAt), {
                addSuffix: true,
                locale: ptBR,
              });

              return (
                <div
                  key={order.id || index}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-black/40 border border-purple-500/20 hover:bg-purple-500/10 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {order.name ? order.name.substring(1, 3) : `#${index + 1}`}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">
                        {order.name || `Pedido #${index + 1}`}
                      </p>
                      <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                        {timeAgo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(order.totalPrice || 0)}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          statusColors[status]
                        } animate-pulse`}
                      ></span>
                      <span className="text-xs text-muted-foreground">
                        {statusLabels[status]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </SectionCard>
  );
};
