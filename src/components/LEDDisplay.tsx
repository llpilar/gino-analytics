import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LEDDisplayProps {
  value: string;
  label?: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "amber" | "green" | "red" | "blue";
}

export const LEDDisplay = ({ value, label, size = "lg", color = "amber" }: LEDDisplayProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const sizeClasses = {
    sm: "text-2xl md:text-3xl",
    md: "text-4xl md:text-5xl",
    lg: "text-6xl md:text-7xl",
    xl: "text-7xl md:text-8xl lg:text-9xl"
  };

  const colorClasses = {
    amber: "text-amber-500",
    green: "text-green-500",
    red: "text-red-500",
    blue: "text-blue-500"
  };

  const glowClasses = {
    amber: "drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]",
    green: "drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]",
    red: "drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]",
    blue: "drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"
  };

  const bgGlowClasses = {
    amber: "bg-amber-500/5",
    green: "bg-green-500/5",
    red: "bg-red-500/5",
    blue: "bg-blue-500/5"
  };

  return (
    <div className={cn("relative p-6 rounded-2xl border-2 border-zinc-800/30 overflow-hidden bg-zinc-950/80 backdrop-blur-sm", bgGlowClasses[color])}>
      {/* LED Dot Matrix Background - More Dense */}
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `radial-gradient(circle, ${color === 'amber' ? '#f59e0b' : color === 'green' ? '#22c55e' : color === 'red' ? '#ef4444' : '#3b82f6'} 1.5px, transparent 1.5px)`,
          backgroundSize: '10px 10px'
        }}
      />
      
      {/* Inner Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40" />
      
      {/* Display */}
      <div className="relative z-10">
        {label && (
          <div className="text-xs md:text-sm font-bold text-white/70 uppercase tracking-[0.3em] mb-3 drop-shadow-lg">
            {label}
          </div>
        )}
        <div className={cn(
          "font-mono font-black tracking-tight leading-none",
          sizeClasses[size],
          colorClasses[color],
          glowClasses[color]
        )}>
          {displayValue}
        </div>
      </div>

      {/* Scanline Effect - More Visible */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-pulse" 
             style={{ animationDuration: '3s' }} />
      </div>
      
      {/* Border Glow */}
      <div className={cn("absolute inset-0 rounded-2xl opacity-50", 
        color === 'amber' ? 'shadow-[inset_0_0_20px_rgba(245,158,11,0.3)]' :
        color === 'green' ? 'shadow-[inset_0_0_20px_rgba(34,197,94,0.3)]' :
        color === 'red' ? 'shadow-[inset_0_0_20px_rgba(239,68,68,0.3)]' :
        'shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]'
      )} />
    </div>
  );
};
