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
    return <Skeleton className="h-[400px] w-full bg-zinc-800/50" />;
  }

  return (
    <Card className="bg-transparent border-0">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Tendência de Vendas - {period === 'daily' ? 'Últimos 7 Dias' : period === 'weekly' ? 'Visão Semanal' : 'Visão Mensal'}
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Acompanhamento e análise de performance</p>
            </div>
          </div>
          
          <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)} className="flex-shrink-0">
            <TabsList className="bg-black/60 border-2 border-cyan-500/30">
              <TabsTrigger 
                value="daily" 
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/50 text-xs px-4 font-bold"
              >
                Diário
              </TabsTrigger>
              <TabsTrigger 
                value="weekly" 
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/50 text-xs px-4 font-bold"
              >
                Semanal
              </TabsTrigger>
              <TabsTrigger 
                value="monthly" 
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/50 text-xs px-4 font-bold"
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
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
            <XAxis 
              dataKey="data" 
              stroke="#64748b"
              style={{ fontSize: '11px', fontWeight: '700' }}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <YAxis 
              stroke="#64748b"
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
              axisLine={{ stroke: '#1e293b' }}
              width={60}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#000', 
                border: '2px solid #06b6d4',
                borderRadius: '12px',
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
                padding: '12px'
              }}
              labelStyle={{ color: '#06b6d4', fontWeight: 'bold', marginBottom: '4px' }}
              itemStyle={{ color: '#06b6d4', fontWeight: '700' }}
              formatter={(value: number) => [new Intl.NumberFormat('pt-BR').format(value), 'Vendas']}
            />
            <Line 
              type="monotone" 
              dataKey="vendas" 
              stroke="#06b6d4" 
              strokeWidth={4}
              fill="url(#colorVendas)"
              dot={{ 
                fill: '#06b6d4', 
                r: 6, 
                strokeWidth: 3, 
                stroke: '#000' 
              }}
              activeDot={{ 
                r: 9, 
                fill: '#06b6d4',
                stroke: '#000',
                strokeWidth: 3,
                filter: 'drop-shadow(0 0 12px #06b6d4)'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
