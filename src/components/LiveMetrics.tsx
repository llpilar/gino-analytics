import { Card } from "@/components/ui/card";
import { Eye, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { useLiveShopify } from "@/hooks/useLiveShopify";

export const LiveMetrics = () => {
  const { data, isLoading } = useLiveShopify();

  const metricCards = [
    {
      title: "Pedidos Hoje",
      value: data?.orderCount || 0,
      icon: ShoppingCart,
      color: "text-green-500",
      format: (val: number) => val.toString(),
    },
    {
      title: "Faturamento Hoje",
      value: data?.totalRevenue || 0,
      icon: TrendingUp,
      color: "text-purple-500",
      format: (val: number) => {
        const formatted = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(val);
        return formatted;
      },
    },
    {
      title: "Produtos Ativos",
      value: data?.products?.length || 0,
      icon: Package,
      color: "text-blue-500",
      format: (val: number) => val.toString(),
    },
    {
      title: "Ticket Médio",
      value: data?.orderCount && data?.orderCount > 0 
        ? (data?.totalRevenue || 0) / data.orderCount 
        : 0,
      icon: Eye,
      color: "text-orange-500",
      format: (val: number) => {
        const formatted = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(val);
        return formatted;
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric) => (
        <Card key={metric.title} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <p className="text-2xl font-bold mt-2">
                {isLoading ? "..." : metric.format(metric.value)}
              </p>
            </div>
            <metric.icon className={`h-8 w-8 ${metric.color}`} />
          </div>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Ao vivo
          </div>
        </Card>
      ))}
    </div>
  );
};
