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

  // Generate smooth funnel path with bezier curves
  const generateFunnelPath = () => {
    const width = 400;
    const height = 180;
    const segments = stages.length;
    const segmentWidth = width / segments;
    
    // Heights for each stage (percentage of max height, with minimum)
    const maxHeight = height * 0.85;
    const minHeight = 8;
    const heights = stages.map(s => Math.max((s.percent / 100) * maxHeight, minHeight));
    
    const centerY = height / 2;
    
    let topPath = `M 0 ${centerY - heights[0] / 2}`;
    let bottomPath = `L 0 ${centerY + heights[0] / 2}`;
    
    for (let i = 0; i < segments; i++) {
      const x1 = i * segmentWidth;
      const x2 = (i + 1) * segmentWidth;
      const h1 = heights[i];
      const h2 = heights[i + 1] ?? heights[i] * 0.3;
      
      const topY1 = centerY - h1 / 2;
      const topY2 = centerY - h2 / 2;
      const bottomY1 = centerY + h1 / 2;
      const bottomY2 = centerY + h2 / 2;
      
      // Control points for smooth bezier curves
      const cpX1 = x1 + segmentWidth * 0.7;
      const cpX2 = x2 - segmentWidth * 0.3;
      
      if (i < segments - 1) {
        topPath += ` C ${cpX1} ${topY1}, ${cpX2} ${topY2}, ${x2} ${topY2}`;
      } else {
        topPath += ` L ${x2} ${topY1}`;
      }
    }
    
    // Close the path by going back along the bottom
    for (let i = segments - 1; i >= 0; i--) {
      const x1 = (i + 1) * segmentWidth;
      const x2 = i * segmentWidth;
      const h1 = heights[i + 1] ?? heights[i] * 0.3;
      const h2 = heights[i];
      
      const bottomY1 = centerY + h1 / 2;
      const bottomY2 = centerY + h2 / 2;
      
      const cpX1 = x1 - segmentWidth * 0.3;
      const cpX2 = x2 + segmentWidth * 0.7;
      
      if (i < segments - 1) {
        bottomPath = ` C ${cpX1} ${bottomY1}, ${cpX2} ${bottomY2}, ${x2} ${bottomY2}` + bottomPath;
      }
    }
    
    return topPath + ` L ${width} ${centerY + (heights[segments - 1] ?? heights[segments - 2] * 0.3) / 2}` + bottomPath + " Z";
  };

  return (
    <SectionCard title="Funil de Conversão" icon={Filter} color="purple" className="mb-8">
      <div className="relative">
        {/* Labels row */}
        <div className="grid grid-cols-4 mb-2">
          {stages.map((stage) => (
            <div key={stage.label} className="text-center">
              <span className="text-sm font-semibold text-foreground">{stage.label}</span>
            </div>
          ))}
        </div>

        {/* SVG Funnel */}
        <div className="relative h-44 my-4">
          <svg
            viewBox="0 0 400 180"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="funnelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="35%" stopColor="#8b5cf6" />
                <stop offset="70%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <filter id="funnelGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Main funnel shape */}
            <path
              d={generateFunnelPath()}
              fill="url(#funnelGradient)"
              filter="url(#funnelGlow)"
              opacity="0.95"
            />
            
            {/* Vertical separator lines */}
            {[1, 2, 3].map((i) => (
              <line
                key={i}
                x1={i * 100}
                y1="10"
                x2={i * 100}
                y2="170"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="0.5"
                strokeDasharray="4,4"
                opacity="0.3"
              />
            ))}
          </svg>

          {/* Percentage labels overlay */}
          <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
            {stages.map((stage, index) => (
              <Tooltip key={stage.label} delayDuration={500}>
                <TooltipTrigger asChild>
                  <div 
                    className="flex items-center justify-center pointer-events-auto cursor-default"
                    style={{ 
                      paddingTop: index > 0 ? `${Math.min(index * 15, 40)}px` : '0px'
                    }}
                  >
                    <span className="text-xl md:text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                      {stage.percent.toFixed(1).replace('.', ',')}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{stage.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Horizontal connecting line */}
        <div className="relative h-px mx-4 mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-400" />
          {/* Dots at each connection point */}
          {stages.map((_, index) => (
            <div 
              key={index}
              className="absolute w-2 h-2 rounded-full bg-purple-400 -top-0.5"
              style={{ left: `${(index / (stages.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
            />
          ))}
        </div>

        {/* Values row */}
        <div className="grid grid-cols-4">
          {stages.map((stage) => (
            <div key={stage.label} className="text-center">
              <span className="text-lg md:text-xl font-bold text-foreground">
                {stage.value.toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
};
