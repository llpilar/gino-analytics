import { Card } from "@/components/ui/card";
import { Eye, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { useLiveShopify } from "@/hooks/useLiveShopify";

const EXCHANGE_RATE = 0.0011; // 1 COP = 0.0011 BRL

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatBRL = (copValue: number) => {
  const brlValue = copValue * EXCHANGE_RATE;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(brlValue);
};

export const LiveMetrics = () => {
  const { data, isLoading } = useLiveShopify();

  const metricCards = [
    {
      title: "Pedidos Hoje",
      value: data?.orderCount || 0,
      icon: ShoppingCart,
      color: "text-green-500",
      format: (val: number) => val.toString(),
      showConversion: false,
    },
    {
      title: "Faturamento Hoje",
      value: data?.totalRevenue || 0,
      icon: TrendingUp,
      color: "text-purple-500",
      format: (val: number) => formatCOP(val),
      conversion: (val: number) => formatBRL(val),
      showConversion: true,
    },
    {
      title: "Produtos Ativos",
      value: data?.products?.length || 0,
      icon: Package,
      color: "text-blue-500",
      format: (val: number) => val.toString(),
      showConversion: false,
    },
    {
      title: "Ticket Médio",
      value: data?.orderCount && data?.orderCount > 0 
        ? (data?.totalRevenue || 0) / data.orderCount 
        : 0,
      icon: Eye,
      color: "text-orange-500",
      format: (val: number) => formatCOP(val),
      conversion: (val: number) => formatBRL(val),
      showConversion: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric) => (
        <Card key={metric.title} className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <p className="text-2xl font-bold mt-2">
                {isLoading ? "..." : metric.format(metric.value)}
              </p>
              {metric.showConversion && !isLoading && metric.conversion && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {metric.conversion(metric.value)}
                </p>
              )}
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
