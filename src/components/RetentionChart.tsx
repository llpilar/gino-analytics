import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVturbRetention, useVturbListPlayers, formatWatchTime } from '@/hooks/useVturbAnalytics';
import { useUserIntegrations } from '@/hooks/useUserIntegrations';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, Play, Users } from 'lucide-react';

interface RetentionDataPoint {
  time: number;
  retention: number;
  views: number;
  label: string;
}

const RetentionChart = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const { data: players, isLoading: loadingPlayers } = useVturbListPlayers();
  const { data: retentionData, isLoading: loadingRetention } = useVturbRetention(selectedPlayer || undefined);
  
  // Get custom VSL names from user integrations
  const { integrations } = useUserIntegrations();
  const vslNames = useMemo(() => {
    const vslIntegration = integrations?.find(i => i.integration_type === 'vturb');
    const config = vslIntegration?.config as { vsl_names?: Record<string, string> } | null;
    return config?.vsl_names || {};
  }, [integrations]);

  const getPlayerDisplayName = (playerId: string) => {
    return vslNames[playerId] || playerId;
  };

  // Parse retention data
  const chartData: RetentionDataPoint[] = useMemo(() => {
    if (!retentionData || !Array.isArray(retentionData)) {
      return [];
    }

    // Sort by time and calculate retention percentage
    const sorted = [...retentionData].sort((a: any, b: any) => a.second - b.second);
    const maxViews = sorted[0]?.total || 1;

    return sorted.map((point: any) => ({
      time: point.second || 0,
      retention: (point.total / maxViews) * 100,
      views: point.total || 0,
      label: formatWatchTime(point.second || 0),
    }));
  }, [retentionData]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (chartData.length === 0) {
      return { startViews: 0, endViews: 0, avgRetention: 0, dropOff50: null };
    }

    const startViews = chartData[0]?.views || 0;
    const endViews = chartData[chartData.length - 1]?.views || 0;
    const avgRetention = chartData.reduce((sum, p) => sum + p.retention, 0) / chartData.length;
    
    // Find when retention drops below 50%
    const dropOff50 = chartData.find(p => p.retention <= 50);

    return { startViews, endViews, avgRetention, dropOff50 };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="font-medium text-foreground mb-1">{data.label}</p>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Visualizações:</span>
            <span className="font-medium text-foreground">{data.views.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Retenção:</span>
            <span className="font-medium text-foreground">{data.retention.toFixed(2)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-lg">Curva de Retenção</CardTitle>
          </div>
          
          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Selecione uma VSL" />
            </SelectTrigger>
            <SelectContent>
              {loadingPlayers ? (
                <SelectItem value="loading" disabled>Carregando...</SelectItem>
              ) : players && players.length > 0 ? (
                players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {getPlayerDisplayName(player.id)}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>Nenhuma VSL encontrada</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {!selectedPlayer ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Selecione uma VSL para ver a curva de retenção</p>
            </div>
          </div>
        ) : loadingRetention ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-20 flex-1" />
              <Skeleton className="h-20 flex-1" />
              <Skeleton className="h-20 flex-1" />
            </div>
            <Skeleton className="h-[350px] w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum dado de retenção disponível para esta VSL</p>
            </div>
          </div>
        ) : (
          <>
            {/* Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Início</p>
                <p className="text-lg font-bold text-foreground">{metrics.startViews.toLocaleString()}</p>
                <p className="text-xs text-emerald-500">100%</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Final</p>
                <p className="text-lg font-bold text-foreground">{metrics.endViews.toLocaleString()}</p>
                <p className="text-xs text-emerald-500">
                  {((metrics.endViews / metrics.startViews) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Retenção Média</p>
                <p className="text-lg font-bold text-foreground">{metrics.avgRetention.toFixed(1)}%</p>
              </div>
              {metrics.dropOff50 && (
                <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">50% Drop-off</p>
                  <p className="text-lg font-bold text-foreground">{metrics.dropOff50.label}</p>
                </div>
              )}
            </div>

            {/* Chart */}
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    opacity={0.3}
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="label" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={(value, index) => {
                      // Show fewer labels on mobile
                      if (chartData.length > 20) {
                        const step = Math.ceil(chartData.length / 10);
                        return index % step === 0 ? value : '';
                      }
                      return value;
                    }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    y={50} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5" 
                    opacity={0.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="retention"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fill="url(#retentionGradient)"
                    dot={false}
                    activeDot={{ 
                      r: 5, 
                      fill: "hsl(var(--chart-2))",
                      stroke: "hsl(var(--background))",
                      strokeWidth: 2
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RetentionChart;
