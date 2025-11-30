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
    <div className={cn("relative p-6 rounded-xl border-2 border-zinc-800/50 overflow-hidden", bgGlowClasses[color])}>
      {/* LED Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, ${color === 'amber' ? '#f59e0b' : color === 'green' ? '#22c55e' : color === 'red' ? '#ef4444' : '#3b82f6'} 1px, transparent 1px)`,
          backgroundSize: '8px 8px'
        }}
      />
      
      {/* Display */}
      <div className="relative z-10">
        {label && (
          <div className="text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">
            {label}
          </div>
        )}
        <div className={cn(
          "font-mono font-black tracking-wider",
          sizeClasses[size],
          colorClasses[color],
          glowClasses[color]
        )}>
          {displayValue}
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-pulse" />
      </div>
    </div>
  );
};
