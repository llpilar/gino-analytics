import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { Skeleton } from "./ui/skeleton";
import { TrendingUp } from "lucide-react";

interface SalesChartProps {
  analyticsData: any;
  isLoading: boolean;
}

export const SalesChart = ({ analyticsData, isLoading }: SalesChartProps) => {
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

    const ordersByDay: { [key: string]: number } = {};
    
    analyticsData.data.orders.edges.forEach(({ node }: any) => {
      const date = new Date(node.createdAt);
      const dateKey = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!ordersByDay[dateKey]) {
        ordersByDay[dateKey] = 0;
      }
      
      const amount = parseFloat(node.totalPriceSet.shopMoney.amount);
      ordersByDay[dateKey] += amount;
    });

    return Object.entries(ordersByDay)
      .map(([data, vendas]) => ({ data, vendas }))
      .sort((a, b) => {
        const [dayA, monthA] = a.data.split('/').map(Number);
        const [dayB, monthB] = b.data.split('/').map(Number);
        return monthA === monthB ? dayA - dayB : monthA - monthB;
      });
  }, [analyticsData]);

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full bg-zinc-800/50" />;
  }

  return (
    <Card className="glass-card border-zinc-800">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-bold tracking-wider uppercase text-white">
              Vendas dos Últimos 7 Dias
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">Performance de vendas</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={300} className="md:h-[380px]">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9EFF5E" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#9EFF5E" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="data" 
              stroke="#71717a"
              style={{ fontSize: '12px', fontWeight: '500' }}
              tickLine={false}
            />
            <YAxis 
              stroke="#71717a"
              style={{ fontSize: '12px', fontWeight: '500' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
              }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              itemStyle={{ color: '#9EFF5E' }}
            />
            <Line 
              type="monotone" 
              dataKey="vendas" 
              stroke="#9EFF5E" 
              strokeWidth={3}
              fill="url(#colorVendas)"
              dot={{ 
                fill: '#9EFF5E', 
                r: 5, 
                strokeWidth: 2, 
                stroke: '#18181b' 
              }}
              activeDot={{ 
                r: 7, 
                fill: '#9EFF5E',
                stroke: '#18181b',
                strokeWidth: 2,
                filter: 'drop-shadow(0 0 6px #9EFF5E)'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
