import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

interface OrderNode {
  id: string;
  createdAt: string;
  totalPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
}

interface SalesChartProps {
  analyticsData?: {
    data?: {
      orders?: {
        edges: Array<{ node: OrderNode }>;
      };
    };
  };
  isLoading: boolean;
}

export const SalesChart = ({ analyticsData, isLoading }: SalesChartProps) => {
  const chartData = useMemo(() => {
    if (!analyticsData?.data?.orders?.edges) {
      // Dados mockados se não houver dados reais
      return [
        { date: "06/10", vendas: 45000, gastos: 8000, pedidos: 12000 },
        { date: "07/10", vendas: 280000, gastos: 52000, pedidos: 35000 },
        { date: "08/10", vendas: 220000, gastos: 48000, pedidos: 28000 },
        { date: "09/10", vendas: 290000, gastos: 55000, pedidos: 38000 },
        { date: "10/10", vendas: 180000, gastos: 42000, pedidos: 24000 },
        { date: "11/10", vendas: 350000, gastos: 65000, pedidos: 45000 },
        { date: "12/10", vendas: 480000, gastos: 82000, pedidos: 58000 },
        { date: "13/10", vendas: 320000, gastos: 58000, pedidos: 42000 },
      ];
    }

    // Agrupar pedidos por dia
    const ordersByDay: { [key: string]: { vendas: number; pedidos: number } } = {};
    
    analyticsData.data.orders.edges.forEach(({ node }) => {
      const date = new Date(node.createdAt);
      const dateKey = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!ordersByDay[dateKey]) {
        ordersByDay[dateKey] = { vendas: 0, pedidos: 0 };
      }
      
      const amount = parseFloat(node.totalPriceSet.shopMoney.amount);
      ordersByDay[dateKey].vendas += amount;
      ordersByDay[dateKey].pedidos += 1;
    });

    // Converter para array e ordenar por data
    return Object.entries(ordersByDay)
      .map(([date, data]) => ({
        date,
        vendas: data.vendas,
        pedidos: data.pedidos,
        gastos: data.vendas * 0.15, // Estimativa de 15% do faturamento
      }))
      .sort((a, b) => {
        const [dayA, monthA] = a.date.split('/').map(Number);
        const [dayB, monthB] = b.date.split('/').map(Number);
        return monthA === monthB ? dayA - dayB : monthA - monthB;
      });
  }, [analyticsData]);
  return (
    <Card className="bg-card border-border p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-bold text-sm neon-border-blue">
            SEMANA
          </button>
          <button className="px-4 py-2 bg-muted text-muted-foreground rounded font-bold text-sm hover:bg-muted/80">
            MÊS
          </button>
          <button className="px-4 py-2 bg-muted text-muted-foreground rounded font-bold text-sm hover:bg-muted/80">
            ANO
          </button>
        </div>
        <div className="flex gap-4 md:gap-6 ml-auto flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--neon-green))]"></div>
            <span className="text-xs md:text-sm font-bold text-muted-foreground">VENDAS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--neon-blue))]"></div>
            <span className="text-xs md:text-sm font-bold text-muted-foreground">PEDIDOS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--neon-orange))]"></div>
            <span className="text-xs md:text-sm font-bold text-muted-foreground">GASTOS ADS</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300} className="md:h-[400px]">
        <LineChart data={isLoading ? [] : chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(value) => `${value / 1000}K`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Line
            type="monotone"
            dataKey="vendas"
            stroke="hsl(var(--neon-green))"
            strokeWidth={3}
            dot={false}
            filter="drop-shadow(0 0 8px hsl(var(--glow-green)))"
          />
          <Line
            type="monotone"
            dataKey="pedidos"
            stroke="hsl(var(--neon-blue))"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="gastos"
            stroke="hsl(var(--neon-orange))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
