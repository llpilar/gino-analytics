import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SalesChartProps {
  analyticsData: any;
  isLoading: boolean;
}

type PeriodType = 'daily' | 'weekly' | 'monthly';

export const SalesChart = ({ analyticsData, isLoading }: SalesChartProps) => {
  const [period, setPeriod] = useState<PeriodType>('daily');
  const chartData = useMemo(() => {
    if (!analyticsData?.data?.orders?.edges) {
      return [
        { data: "06/10", vendas: 450000 },
        { data: "07/10", vendas: 680000 },
        { data: "08/10", vendas: 520000 },
        { data: "09/10", vendas: 790000 },
        { data: "10/10", vendas: 880000 },
        { data: "11/10", vendas: 650000 },
        { data: "12/10", vendas: 920000 },
      ];
    }

    const ordersMap: { [key: string]: number } = {};
    
    analyticsData.data.orders.edges.forEach(({ node }: any) => {
      const date = new Date(node.createdAt);
      let dateKey: string;
      
      if (period === 'daily') {
        dateKey = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'weekly') {
        // Agrupar por semana
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = `Sem ${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Agrupar por mês
        dateKey = `${date.toLocaleDateString('pt-BR', { month: 'short' })}`;
      }
      
      if (!ordersMap[dateKey]) {
        ordersMap[dateKey] = 0;
      }
      
      const amount = parseFloat(node.totalPriceSet.shopMoney.amount);
      ordersMap[dateKey] += amount;
    });

    return Object.entries(ordersMap)
      .map(([data, vendas]) => ({ data, vendas }))
      .sort((a, b) => {
        if (period === 'monthly') return a.data.localeCompare(b.data);
        const [dayA, monthA] = a.data.replace('Sem ', '').split('/').map(Number);
        const [dayB, monthB] = b.data.replace('Sem ', '').split('/').map(Number);
        return monthA === monthB ? dayA - dayB : monthA - monthB;
      });
  }, [analyticsData, period]);

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full bg-muted/50" />;
  }

  return (
    <Card className="bg-transparent border-0">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base font-black tracking-wider uppercase text-primary">
                Tendência de Vendas - {period === 'daily' ? 'Últimos 7 Dias' : period === 'weekly' ? 'Visão Semanal' : 'Visão Mensal'}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Acompanhamento e análise de performance</p>
            </div>
          </div>
          
          <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)} className="flex-shrink-0">
            <TabsList className="bg-card/60 border-2 border-primary/30">
              <TabsTrigger 
                value="daily" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/50 text-xs px-4 font-bold"
              >
                Diário
              </TabsTrigger>
              <TabsTrigger 
                value="weekly" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/50 text-xs px-4 font-bold"
              >
                Semanal
              </TabsTrigger>
              <TabsTrigger 
                value="monthly" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/50 text-xs px-4 font-bold"
              >
                Mensal
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="px-2 sm:px-6">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" />
                <stop offset="50%" stopColor="hsl(var(--chart-2))" />
                <stop offset="100%" stopColor="hsl(var(--chart-4))" />
              </linearGradient>
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="data" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '11px', fontWeight: '700' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '11px', fontWeight: '700' }}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                }
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}K`;
                }
                return new Intl.NumberFormat('pt-BR').format(value);
              }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={60}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '2px solid hsl(var(--chart-1))',
                borderRadius: '12px',
                boxShadow: '0 0 30px hsla(var(--chart-1), 0.3)',
                padding: '12px'
              }}
              labelStyle={{ color: 'hsl(var(--chart-1))', fontWeight: 'bold', marginBottom: '4px' }}
              itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: '700' }}
              formatter={(value: number) => [new Intl.NumberFormat('pt-BR').format(value), 'Vendas']}
            />
            <Line 
              type="monotone" 
              dataKey="vendas" 
              stroke="url(#lineGradient)" 
              strokeWidth={4}
              fill="url(#colorVendas)"
              dot={{ 
                fill: 'hsl(var(--chart-1))', 
                r: 6, 
                strokeWidth: 3, 
                stroke: 'hsl(var(--background))' 
              }}
              activeDot={{ 
                r: 9, 
                fill: 'hsl(var(--chart-2))',
                stroke: 'hsl(var(--background))',
                strokeWidth: 3,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
