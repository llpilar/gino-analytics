import { LucideIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVisualEffects } from "@/contexts/VisualEffectsContext";
import { useDashboardSettings } from "@/contexts/DashboardSettingsContext";

export type CardColorVariant = "cyan" | "purple" | "green" | "orange" | "pink" | "blue" | "red";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: string;
  icon: LucideIcon;
  color?: CardColorVariant;
  hoverable?: boolean;
  className?: string;
  children?: React.ReactNode;
  showLiveIndicator?: boolean;
  delay?: number;
}

const colorClasses: Record<CardColorVariant, {
  border: string;
  glow: string;
  bg: string;
  text: string;
  gradient: string;
}> = {
  cyan: {
    border: "border-primary/20 hover:border-primary/40",
    glow: "hover:shadow-[0_0_30px_rgba(var(--primary),0.15)]",
    bg: "bg-gradient-to-br from-primary/15 to-primary/5",
    text: "text-primary",
    gradient: "from-primary/20 via-primary/5 to-transparent",
  },
  purple: {
    border: "border-chart-5/20 hover:border-chart-5/40",
    glow: "hover:shadow-[0_0_30px_rgba(var(--chart-5),0.15)]",
    bg: "bg-gradient-to-br from-chart-5/15 to-chart-5/5",
    text: "text-chart-5",
    gradient: "from-chart-5/20 via-chart-5/5 to-transparent",
  },
  green: {
    border: "border-chart-2/20 hover:border-chart-2/40",
    glow: "hover:shadow-[0_0_30px_rgba(var(--chart-2),0.15)]",
    bg: "bg-gradient-to-br from-chart-2/15 to-chart-2/5",
    text: "text-chart-2",
    gradient: "from-chart-2/20 via-chart-2/5 to-transparent",
  },
  orange: {
    border: "border-chart-3/20 hover:border-chart-3/40",
    glow: "hover:shadow-[0_0_30px_rgba(var(--chart-3),0.15)]",
    bg: "bg-gradient-to-br from-chart-3/15 to-chart-3/5",
    text: "text-chart-3",
    gradient: "from-chart-3/20 via-chart-3/5 to-transparent",
  },
  pink: {
    border: "border-chart-5/20 hover:border-chart-5/40",
    glow: "hover:shadow-[0_0_30px_rgba(var(--chart-5),0.15)]",
    bg: "bg-gradient-to-br from-chart-5/15 to-chart-5/5",
    text: "text-chart-5",
    gradient: "from-chart-5/20 via-chart-5/5 to-transparent",
  },
  blue: {
    border: "border-primary/20 hover:border-primary/40",
    glow: "hover:shadow-[0_0_30px_rgba(var(--primary),0.15)]",
    bg: "bg-gradient-to-br from-primary/15 to-primary/5",
    text: "text-primary",
    gradient: "from-primary/20 via-primary/5 to-transparent",
  },
  red: {
    border: "border-destructive/20 hover:border-destructive/40",
    glow: "hover:shadow-[0_0_30px_rgba(var(--destructive),0.15)]",
    bg: "bg-gradient-to-br from-destructive/15 to-destructive/5",
    text: "text-destructive",
    gradient: "from-destructive/20 via-destructive/5 to-transparent",
  },
};

export const StatsCard = ({
  title,
  value,
  subtitle,
  subtitleColor = "text-muted-foreground",
  icon: Icon,
  color = "cyan",
  hoverable = true,
  className,
  children,
  showLiveIndicator = false,
  delay = 0,
}: StatsCardProps) => {
  const colors = colorClasses[color];
  const { premiumEffects } = useVisualEffects();
  const { compactMode } = useDashboardSettings();

  return (
    <article
      className={cn(
        "group relative rounded-2xl overflow-hidden",
        compactMode ? "p-3 md:p-4" : "p-5 md:p-6",
        "bg-card/80 backdrop-blur-xl border",
        "transition-all duration-500 ease-out",
        colors.border,
        hoverable && premiumEffects && cn("hover:scale-[1.02] hover:-translate-y-1 cursor-pointer", colors.glow),
        hoverable && !premiumEffects && "cursor-pointer",
        className
      )}
      style={premiumEffects ? { animationDelay: `${delay}ms` } : undefined}
      role="region"
      aria-label={`${title}: ${value}`}
    >
      {/* Gradient overlay - only with premium effects */}
      {premiumEffects && (
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-500",
            "group-hover:opacity-100",
            colors.gradient
          )} 
        />
      )}
      
      {/* Shine effect on hover - only with premium effects */}
      {premiumEffects && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon and title */}
        <div className={cn("flex items-center gap-3", compactMode ? "mb-2" : "mb-4")}>
          <div className={cn(
            "rounded-xl flex items-center justify-center",
            compactMode ? "w-8 h-8" : "w-11 h-11",
            premiumEffects && "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            colors.bg
          )}>
            <Icon className={cn(compactMode ? "w-4 h-4" : "w-5 h-5", premiumEffects && "transition-all duration-300", colors.text)} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-bold text-muted-foreground uppercase tracking-widest truncate",
              compactMode ? "text-[9px]" : "text-[10px] md:text-xs"
            )}>
              {title}
            </h3>
          </div>
        </div>
        
        {/* Value with gradient text effect */}
        <div className={cn(
          "font-black truncate",
          "bg-clip-text transition-all duration-300",
          "text-foreground",
          compactMode ? "text-xl md:text-2xl" : "text-2xl md:text-3xl lg:text-4xl"
        )}>
          {value}
        </div>
        
        {/* Subtitle or Live indicator */}
        {subtitle ? (
          <p className={cn(
            "font-medium",
            subtitleColor,
            compactMode ? "text-[10px] mt-1" : "text-xs md:text-sm mt-3"
          )}>
            {subtitle}
          </p>
        ) : showLiveIndicator ? (
          <div className={cn("flex items-center gap-2", compactMode ? "mt-1" : "mt-3")}>
            <div className="relative">
              <div className={cn("w-2 h-2 rounded-full", colors.text.replace('text-', 'bg-'))} />
              <div className={cn("absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75", colors.text.replace('text-', 'bg-'))} />
            </div>
            <span className={cn("font-semibold", colors.text, compactMode ? "text-[10px]" : "text-xs")}>Ao vivo</span>
          </div>
        ) : null}
        
        {children}
      </div>
    </article>
  );
};

interface SectionCardProps {
  title?: string;
  icon?: LucideIcon;
  color?: CardColorVariant;
  className?: string;
  children: React.ReactNode;
}

export const SectionCard = ({
  title,
  icon: Icon,
  color = "cyan",
  className,
  children,
}: SectionCardProps) => {
  const colors = colorClasses[color];

  return (
    <section
      className={cn(
        "relative p-5 md:p-6 rounded-2xl overflow-hidden",
        "bg-card/80 backdrop-blur-xl border border-border/50",
        "transition-all duration-300",
        className
      )}
      aria-label={title}
    >
      {/* Subtle gradient background */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", colors.gradient)} />
      
      <div className="relative z-10">
        {title && (
          <header className="flex items-center gap-3 mb-5 md:mb-6">
            {Icon && (
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", colors.bg)}>
                <Icon className={cn("w-5 h-5", colors.text)} aria-hidden="true" />
              </div>
            )}
            <h2 className="text-lg md:text-xl font-black text-foreground tracking-tight">
              {title}
            </h2>
          </header>
        )}
        {children}
      </div>
    </section>
  );
};
