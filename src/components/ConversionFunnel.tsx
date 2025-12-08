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
        description: "Total de visitantes únicos"
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
        description: "Clicaram no CTA"
      },
      {
        label: "Vendas",
        value: orders,
        percent: (orders / base) * 100,
        description: "Conversões finais"
      }
    ];
  }, [visits, plays, clicks, orders]);

  // Generate SVG path for the funnel
  const generateFunnelPath = () => {
    const width = 100;
    const height = 200;
    const segments = stages.length;
    const segmentWidth = width / segments;
    
    // Heights for each stage (as percentage of max height)
    const heights = stages.map(s => Math.max((s.percent / 100) * height, 4));
    
    let path = "";
    
    // Start from top-left
    path += `M 0 ${(height - heights[0]) / 2}`;
    
    // Draw top edge with curves
    for (let i = 0; i < segments - 1; i++) {
      const x1 = (i + 1) * segmentWidth;
      const y1 = (height - heights[i]) / 2;
      const y2 = (height - heights[i + 1]) / 2;
      const cpX = x1;
      
      path += ` L ${x1 - segmentWidth * 0.3} ${y1}`;
      path += ` Q ${cpX} ${y1}, ${cpX} ${(y1 + y2) / 2}`;
      path += ` Q ${cpX} ${y2}, ${x1 + segmentWidth * 0.3} ${y2}`;
    }
    
    // End of top edge
    path += ` L ${width} ${(height - heights[segments - 1]) / 2}`;
    
    // Right edge
    path += ` L ${width} ${(height + heights[segments - 1]) / 2}`;
    
    // Draw bottom edge with curves (reverse)
    for (let i = segments - 1; i > 0; i--) {
      const x1 = i * segmentWidth;
      const y1 = (height + heights[i]) / 2;
      const y2 = (height + heights[i - 1]) / 2;
      const cpX = x1;
      
      path += ` L ${x1 + segmentWidth * 0.3} ${y1}`;
      path += ` Q ${cpX} ${y1}, ${cpX} ${(y1 + y2) / 2}`;
      path += ` Q ${cpX} ${y2}, ${x1 - segmentWidth * 0.3} ${y2}`;
    }
    
    // End of bottom edge
    path += ` L 0 ${(height + heights[0]) / 2}`;
    path += " Z";
    
    return path;
  };

  return (
    <SectionCard title="Funil de Conversão" icon={Filter} color="purple" className="mb-8">
      <div className="relative">
        {/* Labels row */}
        <div className="grid grid-cols-4 mb-4">
          {stages.map((stage) => (
            <div key={stage.label} className="text-center">
              <span className="text-sm font-medium text-muted-foreground">{stage.label}</span>
            </div>
          ))}
        </div>

        {/* SVG Funnel */}
        <div className="relative h-48 mb-4">
          <svg
            viewBox="0 0 100 200"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="funnelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" />
                <stop offset="50%" stopColor="hsl(var(--chart-2))" />
                <stop offset="100%" stopColor="hsl(var(--chart-4))" />
              </linearGradient>
            </defs>
            <path
              d={generateFunnelPath()}
              fill="url(#funnelGradient)"
              opacity="0.9"
            />
            
            {/* Vertical separator lines */}
            {[1, 2, 3].map((i) => (
              <line
                key={i}
                x1={i * 25}
                y1="0"
                x2={i * 25}
                y2="200"
                stroke="hsl(var(--border))"
                strokeWidth="0.3"
                strokeDasharray="2,2"
              />
            ))}
          </svg>

          {/* Percentage labels overlay */}
          <div className="absolute inset-0 grid grid-cols-4">
            {stages.map((stage) => (
              <Tooltip key={stage.label} delayDuration={500}>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center cursor-default">
                    <span className="text-lg md:text-2xl font-bold text-white drop-shadow-lg">
                      {stage.percent.toFixed(1)}%
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

        {/* Values row */}
        <div className="grid grid-cols-4 pt-4 border-t border-border">
          {stages.map((stage) => (
            <div key={stage.label} className="text-center">
              <span className="text-lg md:text-xl font-bold text-foreground">
                {stage.value.toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
        </div>

        {/* Horizontal line under the funnel connecting all values */}
        <div className="absolute bottom-12 left-0 right-0 h-px bg-gradient-to-r from-chart-1 via-chart-2 to-chart-4" />
      </div>
    </SectionCard>
  );
};
