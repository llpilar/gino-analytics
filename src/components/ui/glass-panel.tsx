import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "cyan" | "purple" | "green" | "orange" | "pink" | "blue" | "none";
}

export const GlassPanel = ({ 
  children, 
  className, 
  hover = false,
  glow = "none" 
}: GlassPanelProps) => {
  const glowStyles = {
    cyan: "shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    purple: "shadow-[0_0_30px_rgba(168,85,247,0.15)]",
    green: "shadow-[0_0_30px_rgba(34,197,94,0.15)]",
    orange: "shadow-[0_0_30px_rgba(249,115,22,0.15)]",
    pink: "shadow-[0_0_30px_rgba(236,72,153,0.15)]",
    blue: "shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    none: "",
  };

  return (
    <div
      className={cn(
        "glass-panel",
        hover && "glass-panel-hover",
        glowStyles[glow],
        className
      )}
    >
      {/* Highlight line */}
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      {children}
    </div>
  );
};

export const GlassCard = ({ 
  children, 
  className,
  glow = "none"
}: GlassPanelProps) => {
  const glowStyles = {
    cyan: "hover:shadow-[0_0_40px_rgba(6,182,212,0.2)]",
    purple: "hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]",
    green: "hover:shadow-[0_0_40px_rgba(34,197,94,0.2)]",
    orange: "hover:shadow-[0_0_40px_rgba(249,115,22,0.2)]",
    pink: "hover:shadow-[0_0_40px_rgba(236,72,153,0.2)]",
    blue: "hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]",
    none: "",
  };

  return (
    <div
      className={cn(
        "glass-card relative overflow-hidden",
        glowStyles[glow],
        className
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      {/* Highlight line */}
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export const GlassBadge = ({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string 
}) => {
  return (
    <span
      className={cn(
        "glass-badge",
        className
      )}
    >
      {children}
    </span>
  );
};
