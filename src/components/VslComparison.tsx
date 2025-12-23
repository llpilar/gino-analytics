import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVturbListPlayers, useVturbOverview, formatWatchTime, parseVturbData } from "@/hooks/useVturbAnalytics";
import { useUserIntegrations } from "@/hooks/useUserIntegrations";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, Minus, Play, Users, Clock, MousePointerClick, BarChart3, TrendingUp, Eye, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface VslPlayer {
  id: string;
  name: string;
}

interface ComparisonMetric {
  label: string;
  vsl1Value: number | string;
  vsl2Value: number | string;
  vsl1Raw?: number;
  vsl2Raw?: number;
  format?: 'number' | 'percent' | 'time' | 'currency';
  icon: React.ReactNode;
}

const formatValue = (value: number | string, format?: string): string => {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'time':
      return formatWatchTime(value);
    case 'currency':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    default:
      return value.toLocaleString('pt-BR');
  }
};

const ComparisonIndicator = ({ value1, value2 }: { value1: number; value2: number }) => {
  if (value1 === 0 && value2 === 0) {
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
  
  const diff = value1 - value2;
  const percentDiff = value2 !== 0 ? ((diff / value2) * 100) : (value1 > 0 ? 100 : 0);
  
  if (Math.abs(percentDiff) < 1) {
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
  
  const isPositive = diff > 0;
  
  return (
    <div className={cn(
      "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
      isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
    )}>
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(percentDiff).toFixed(0)}%
    </div>
  );
};

const MetricRow = ({ metric }: { metric: ComparisonMetric }) => {
  const vsl1Raw = metric.vsl1Raw ?? (typeof metric.vsl1Value === 'number' ? metric.vsl1Value : 0);
  const vsl2Raw = metric.vsl2Raw ?? (typeof metric.vsl2Value === 'number' ? metric.vsl2Value : 0);
  
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center py-3 md:py-4 border-b border-border/50 last:border-0">
      <div className="text-right">
        <span className="text-base md:text-lg font-semibold text-foreground">
          {formatValue(metric.vsl1Value, metric.format)}
        </span>
      </div>
      
      <div className="flex flex-col items-center gap-1 md:gap-2 min-w-[100px] md:min-w-[120px]">
        <div className="flex items-center gap-1 md:gap-2 text-muted-foreground">
          {metric.icon}
          <span className="text-xs md:text-sm font-medium">{metric.label}</span>
        </div>
        <ComparisonIndicator value1={vsl1Raw} value2={vsl2Raw} />
      </div>
      
      <div className="text-left">
        <span className="text-base md:text-lg font-semibold text-foreground">
          {formatValue(metric.vsl2Value, metric.format)}
        </span>
      </div>
    </div>
  );
};

export const VslComparison = () => {
  const { integrations, getIntegrationConfig } = useUserIntegrations();
  const vturbIntegration = integrations?.find(i => i.integration_type === 'vturb');
  
  const [selectedVsl1, setSelectedVsl1] = useState<string>("");
  const [selectedVsl2, setSelectedVsl2] = useState<string>("");
  
  const { data: playersData, isLoading: isLoadingPlayers } = useVturbListPlayers();
  
  const players: VslPlayer[] = useMemo(() => {
    if (!playersData) return [];
    return playersData.map((p: any) => ({
      id: p.id || p.player_id,
      name: p.name || p.id || p.player_id || 'VSL sem nome'
    }));
  }, [playersData]);
  
  // Get custom names from integration config
  const customNames = useMemo(() => {
    const config = vturbIntegration?.config as Record<string, any> | undefined;
    return config?.playerNames || {};
  }, [vturbIntegration]);
  
  const getPlayerDisplayName = (player: VslPlayer): string => {
    return customNames[player.id] || player.name || player.id;
  };
  
  // Fetch data for both VSLs - hook only fetches when player is selected
  const { data: vsl1RawData, isLoading: isLoadingVsl1 } = useVturbOverview(selectedVsl1 || undefined);
  const { data: vsl2RawData, isLoading: isLoadingVsl2 } = useVturbOverview(selectedVsl2 || undefined);
  
  // Parse the data using the same function used elsewhere
  const vsl1Data = useMemo(() => parseVturbData(vsl1RawData), [vsl1RawData]);
  const vsl2Data = useMemo(() => parseVturbData(vsl2RawData), [vsl2RawData]);
  
  const isLoading = isLoadingVsl1 || isLoadingVsl2;
  
  const comparisonMetrics: ComparisonMetric[] = useMemo(() => {
    return [
      {
        label: "Views",
        vsl1Value: vsl1Data.totalViews,
        vsl2Value: vsl2Data.totalViews,
        icon: <Eye className="h-4 w-4" />,
      },
      {
        label: "Views Únicos",
        vsl1Value: vsl1Data.uniqueViews,
        vsl2Value: vsl2Data.uniqueViews,
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: "Plays",
        vsl1Value: vsl1Data.totalPlays,
        vsl2Value: vsl2Data.totalPlays,
        icon: <Play className="h-4 w-4" />,
      },
      {
        label: "Plays Únicos",
        vsl1Value: vsl1Data.uniquePlays,
        vsl2Value: vsl2Data.uniquePlays,
        icon: <Video className="h-4 w-4" />,
      },
      {
        label: "Play Rate",
        vsl1Value: vsl1Data.playRate,
        vsl2Value: vsl2Data.playRate,
        format: 'percent',
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        label: "Ret. Pitch",
        vsl1Value: vsl1Data.overPitchRate,
        vsl2Value: vsl2Data.overPitchRate,
        format: 'percent',
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        label: "Engajamento",
        vsl1Value: vsl1Data.engagementRate,
        vsl2Value: vsl2Data.engagementRate,
        format: 'percent',
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        label: "Cliques CTA",
        vsl1Value: vsl1Data.uniqueClicks,
        vsl2Value: vsl2Data.uniqueClicks,
        icon: <MousePointerClick className="h-4 w-4" />,
      },
    ];
  }, [vsl1Data, vsl2Data]);
  
  if (isLoadingPlayers) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Comparar VSLs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (players.length < 2) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Comparar VSLs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Você precisa ter pelo menos 2 VSLs para comparar</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Comparar VSLs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 md:gap-4 items-center">
          <Select value={selectedVsl1} onValueChange={setSelectedVsl1}>
            <SelectTrigger className="bg-background/50 border-border/50">
              <SelectValue placeholder="Selecione a VSL 1" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {players.map((player) => (
                <SelectItem 
                  key={player.id} 
                  value={player.id}
                  disabled={player.id === selectedVsl2}
                >
                  {getPlayerDisplayName(player)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="text-muted-foreground font-medium text-sm text-center">VS</div>
          
          <Select value={selectedVsl2} onValueChange={setSelectedVsl2}>
            <SelectTrigger className="bg-background/50 border-border/50">
              <SelectValue placeholder="Selecione a VSL 2" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {players.map((player) => (
                <SelectItem 
                  key={player.id} 
                  value={player.id}
                  disabled={player.id === selectedVsl1}
                >
                  {getPlayerDisplayName(player)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Comparison Results */}
        {selectedVsl1 && selectedVsl2 ? (
          <div className="relative">
            {/* VSL Headers */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-4 pb-4 border-b border-border">
              <div className="text-right">
                <span className="text-sm font-semibold text-primary truncate">
                  {getPlayerDisplayName(players.find(p => p.id === selectedVsl1) || { id: selectedVsl1, name: 'VSL 1' })}
                </span>
              </div>
              <div className="min-w-[100px] md:min-w-[120px]" />
              <div className="text-left">
                <span className="text-sm font-semibold text-primary truncate">
                  {getPlayerDisplayName(players.find(p => p.id === selectedVsl2) || { id: selectedVsl2, name: 'VSL 2' })}
                </span>
              </div>
            </div>
            
            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-4">
                    <Skeleton className="h-8 w-20 ml-auto" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {comparisonMetrics.map((metric, index) => (
                  <MetricRow key={index} metric={metric} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Selecione duas VSLs para comparar suas métricas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
