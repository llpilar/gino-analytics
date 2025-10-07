import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Eye, ShoppingCart, TrendingUp, Users } from "lucide-react";

interface Metrics {
  visitorsOnline: number;
  activeCheckouts: number;
  revenueToday: number;
  conversionRate: number;
}

export const LiveMetrics = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    visitorsOnline: 0,
    activeCheckouts: 0,
    revenueToday: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    // Simular dados em tempo real
    const interval = setInterval(() => {
      setMetrics({
        visitorsOnline: Math.floor(Math.random() * 50) + 10,
        activeCheckouts: Math.floor(Math.random() * 10),
        revenueToday: Math.random() * 5000 + 1000,
        conversionRate: Math.random() * 5 + 1,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const metricCards = [
    {
      title: "Visitantes Online",
      value: metrics.visitorsOnline,
      icon: Eye,
      color: "text-blue-500",
      format: (val: number) => val.toString(),
    },
    {
      title: "Checkouts Ativos",
      value: metrics.activeCheckouts,
      icon: ShoppingCart,
      color: "text-green-500",
      format: (val: number) => val.toString(),
    },
    {
      title: "Faturamento Hoje",
      value: metrics.revenueToday,
      icon: TrendingUp,
      color: "text-purple-500",
      format: (val: number) => `R$ ${val.toFixed(2)}`,
    },
    {
      title: "Taxa de Conversão",
      value: metrics.conversionRate,
      icon: Users,
      color: "text-orange-500",
      format: (val: number) => `${val.toFixed(1)}%`,
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
                {metric.format(metric.value)}
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
