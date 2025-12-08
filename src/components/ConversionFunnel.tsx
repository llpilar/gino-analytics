import { useMemo } from "react";
import { Filter } from "lucide-react";
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
    const base = visits || 1;
    
    return [
      {
        label: "Visitas",
        value: visits,
        percent: 100,
        description: "Total de visitantes únicos na página"
      },
      {
        label: "Plays",
        value: plays,
        percent: (plays / base) * 100,
        description: "Deram play no vídeo"
      },
      {
        label: "Cliques",
        value: clicks,
        percent: (clicks / base) * 100,
        description: "Clicaram no botão de compra"
      },
      {
        label: "Vendas",
        value: orders,
        percent: (orders / base) * 100,
        description: "Finalizaram a compra"
      }
    ];
  }, [visits, plays, clicks, orders]);

  return (
    <SectionCard title="Funil de Conversão" icon={Filter} color="purple" className="mb-8">
      <div className="space-y-4">
        {/* Labels */}
        <div className="grid grid-cols-4 gap-2">
          {stages.map((stage) => (
            <div key={stage.label} className="text-center">
              <span className="text-sm font-medium text-muted-foreground">{stage.label}</span>
            </div>
          ))}
        </div>

        {/* Funnel visualization */}
        <div className="relative h-40 flex items-center">
          <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="funnelGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            
            {/* Funnel shape - smooth curves */}
            <path
              d={`
                M 0,${50 - (stages[0].percent / 100) * 45}
                C 50,${50 - (stages[0].percent / 100) * 45} 
                  50,${50 - (stages[1].percent / 100) * 45} 
                  100,${50 - (stages[1].percent / 100) * 45}
                C 150,${50 - (stages[1].percent / 100) * 45} 
                  150,${50 - (stages[2].percent / 100) * 45} 
                  200,${50 - (stages[2].percent / 100) * 45}
                C 250,${50 - (stages[2].percent / 100) * 45} 
                  250,${50 - (stages[3].percent / 100) * 45} 
                  300,${50 - (stages[3].percent / 100) * 45}
                C 350,${50 - (stages[3].percent / 100) * 45} 
                  350,${50 - (stages[3].percent / 100) * 45} 
                  400,${50 - (stages[3].percent / 100) * 45}
                L 400,${50 + (stages[3].percent / 100) * 45}
                C 350,${50 + (stages[3].percent / 100) * 45} 
                  350,${50 + (stages[3].percent / 100) * 45} 
                  300,${50 + (stages[3].percent / 100) * 45}
                C 250,${50 + (stages[3].percent / 100) * 45} 
                  250,${50 + (stages[2].percent / 100) * 45} 
                  200,${50 + (stages[2].percent / 100) * 45}
                C 150,${50 + (stages[2].percent / 100) * 45} 
                  150,${50 + (stages[1].percent / 100) * 45} 
                  100,${50 + (stages[1].percent / 100) * 45}
                C 50,${50 + (stages[1].percent / 100) * 45} 
                  50,${50 + (stages[0].percent / 100) * 45} 
                  0,${50 + (stages[0].percent / 100) * 45}
                Z
              `}
              fill="url(#funnelGrad)"
              opacity="0.9"
            />
            
            {/* Divider lines */}
            {[100, 200, 300].map((x) => (
              <line
                key={x}
                x1={x}
                y1="5"
                x2={x}
                y2="95"
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.4"
              />
            ))}
          </svg>

          {/* Percentage overlays */}
          <div className="absolute inset-0 grid grid-cols-4">
            {stages.map((stage) => (
              <Tooltip key={stage.label} delayDuration={500}>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center cursor-default">
                    <span className="text-lg md:text-xl font-bold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)' }}>
                      {stage.percent.toFixed(1).replace('.', ',')}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stage.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Connecting line */}
        <div className="flex items-center justify-between px-[12.5%]">
          <div className="flex-1 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 relative">
            {stages.map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-violet-400 border-2 border-background -top-[3px]"
                style={{ left: `${(i / (stages.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
              />
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-4 gap-2">
          {stages.map((stage) => (
            <div key={stage.label} className="text-center">
              <span className="text-lg font-bold text-foreground">
                {stage.value.toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
};
