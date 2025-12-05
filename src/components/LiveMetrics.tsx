import { Eye, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { useLiveShopify } from "@/hooks/useLiveShopify";
import { StatsCard, CardColorVariant } from "@/components/ui/stats-card";
import { LucideIcon } from "lucide-react";

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

  const metricCards: { title: string; value: number; icon: LucideIcon; color: CardColorVariant; format: (val: number) => string; conversion?: (val: number) => string; showConversion: boolean }[] = [
    {
      title: "Pedidos Hoje",
      value: data?.orderCount || 0,
      icon: ShoppingCart,
      color: "green",
      format: (val: number) => val.toString(),
      showConversion: false,
    },
    {
      title: "Faturamento Hoje",
      value: data?.totalRevenue || 0,
      icon: TrendingUp,
      color: "purple",
      format: (val: number) => formatCOP(val),
      conversion: (val: number) => formatBRL(val),
      showConversion: true,
    },
    {
      title: "Produtos Ativos",
      value: data?.products?.length || 0,
      icon: Package,
      color: "blue",
      format: (val: number) => val.toString(),
      showConversion: false,
    },
    {
      title: "Ticket Médio",
      value: data?.orderCount && data?.orderCount > 0 
        ? (data?.totalRevenue || 0) / data.orderCount 
        : 0,
      icon: Eye,
      color: "orange",
      format: (val: number) => formatCOP(val),
      conversion: (val: number) => formatBRL(val),
      showConversion: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric) => (
        <StatsCard
          key={metric.title}
          title={metric.title}
          value={isLoading ? "..." : metric.format(metric.value)}
          subtitle={metric.showConversion && !isLoading && metric.conversion ? `≈ ${metric.conversion(metric.value)}` : undefined}
          subtitleColor="text-muted-foreground"
          icon={metric.icon}
          color={metric.color}
        >
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 bg-chart-4 rounded-full mr-2 animate-pulse"></span>
            Ao vivo
          </div>
        </StatsCard>
      ))}
    </div>
  );
};
