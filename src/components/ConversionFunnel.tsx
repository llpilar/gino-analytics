import { useMemo } from "react";
import { Eye, Play, MousePointer, ShoppingCart } from "lucide-react";
import { SectionCard } from "@/components/ui/stats-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ConversionFunnelProps {
  visits: number;
  plays: number;
  clicks: number;
  orders: number;
}

export const ConversionFunnel = ({ visits, plays, clicks, orders }: ConversionFunnelProps) => {
  const stages = useMemo(() => {
    const playRate = visits > 0 ? (plays / visits) * 100 : 0;
    const clickRate = plays > 0 ? (clicks / plays) * 100 : 0;
    const conversionRate = clicks > 0 ? (orders / clicks) * 100 : 0;
    const overallRate = visits > 0 ? (orders / visits) * 100 : 0;

    return [
      {
        label: "Visitas",
        value: visits,
        icon: Eye,
        rate: 100,
        dropRate: null,
        color: "from-cyan-500 to-cyan-600",
        bgColor: "bg-cyan-500/20",
        description: "Total de visitantes na página"
      },
      {
        label: "Plays",
        value: plays,
        icon: Play,
        rate: playRate,
        dropRate: 100 - playRate,
        color: "from-purple-500 to-purple-600",
        bgColor: "bg-purple-500/20",
        description: "Deram play no vídeo"
      },
      {
        label: "Cliques",
        value: clicks,
        icon: MousePointer,
        rate: clickRate,
        dropRate: 100 - clickRate,
        color: "from-orange-500 to-orange-600",
        bgColor: "bg-orange-500/20",
        description: "Clicaram no botão de compra"
      },
      {
        label: "Vendas",
        value: orders,
        icon: ShoppingCart,
        rate: conversionRate,
        dropRate: 100 - conversionRate,
        color: "from-green-500 to-green-600",
        bgColor: "bg-green-500/20",
        description: "Finalizaram a compra"
      }
    ];
  }, [visits, plays, clicks, orders]);

  const overallConversion = visits > 0 ? ((orders / visits) * 100).toFixed(2) : "0.00";

  return (
    <SectionCard title="Funil de Conversão" icon={ShoppingCart} color="green" className="mb-8">
      <div className="space-y-6">
        {/* Funnel visualization */}
        <div className="relative flex flex-col items-center gap-2">
          {stages.map((stage, index) => {
            const widthPercent = 100 - (index * 18);
            const Icon = stage.icon;
            
            return (
              <Tooltip key={stage.label} delayDuration={500}>
                <TooltipTrigger asChild>
                  <div 
                    className="relative cursor-default transition-all duration-300 hover:scale-[1.02]"
                    style={{ width: `${widthPercent}%` }}
                  >
                    {/* Main bar */}
                    <div 
                      className={`relative h-16 rounded-lg bg-gradient-to-r ${stage.color} flex items-center justify-between px-4 shadow-lg`}
                    >
                      {/* Icon and label */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-white/20">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-white text-sm md:text-base">{stage.label}</span>
                      </div>
                      
                      {/* Value */}
                      <div className="text-right">
                        <div className="text-xl md:text-2xl font-bold text-white">
                          {stage.value.toLocaleString('pt-BR')}
                        </div>
                        {index > 0 && (
                          <div className="text-xs text-white/70">
                            {stage.rate.toFixed(1)}% do anterior
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Drop indicator */}
                    {index > 0 && stage.dropRate !== null && stage.dropRate > 0 && (
                      <div className="absolute -top-1 right-2 text-xs text-destructive font-medium bg-background/90 px-2 py-0.5 rounded-full border border-destructive/30">
                        -{stage.dropRate.toFixed(0)}%
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stage.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Overall conversion rate */}
        <div className="flex items-center justify-center pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              {overallConversion}%
            </div>
            <div className="text-sm text-muted-foreground">Taxa de Conversão Geral</div>
            <div className="text-xs text-muted-foreground mt-1">Visitas → Vendas</div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};
