import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";
import { Skeleton } from "./ui/skeleton";

interface SalesChartProps {
  analyticsData: any;
  isLoading: boolean;
}

export const SalesChart = ({ analyticsData, isLoading }: SalesChartProps) => {
  const chartData = useMemo(() => {
    if (!analyticsData?.data?.orders?.edges) {
      return [
        { data: "06/10", vendas: 450000 },
        { data: "07/10", vendas: 280000 },
        { data: "08/10", vendas: 620000 },
        { data: "09/10", vendas: 390000 },
        { data: "10/10", vendas: 780000 },
        { data: "11/10", vendas: 550000 },
        { data: "12/10", vendas: 880000 },
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
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          <CardTitle className="text-lg font-bold tracking-wider uppercase">
            Vendas dos Últimos 7 Dias
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300} className="md:h-[400px]">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 86%, 56%)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(142, 86%, 56%)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="data" 
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(142,233,144,0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="vendas" 
              stroke="hsl(142, 86%, 56%)" 
              strokeWidth={3}
              fill="url(#colorVendas)"
              dot={{ fill: 'hsl(142, 86%, 56%)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
