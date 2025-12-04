import { LucideIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type CardColorVariant = "cyan" | "purple" | "green" | "orange" | "pink" | "blue";

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
}

const colorClasses: Record<CardColorVariant, {
  border: string;
  glow: string;
  bg: string;
  text: string;
}> = {
  cyan: {
    border: "border-neon-cyan/40",
    glow: "shadow-neon-cyan/30",
    bg: "bg-neon-cyan/10",
    text: "text-neon-cyan",
  },
  purple: {
    border: "border-neon-purple/40",
    glow: "shadow-neon-purple/30",
    bg: "bg-neon-purple/10",
    text: "text-neon-purple",
  },
  green: {
    border: "border-neon-green/40",
    glow: "shadow-neon-green/30",
    bg: "bg-neon-green/10",
    text: "text-neon-green",
  },
  orange: {
    border: "border-neon-orange/40",
    glow: "shadow-neon-orange/30",
    bg: "bg-neon-orange/10",
    text: "text-neon-orange",
  },
  pink: {
    border: "border-neon-pink/40",
    glow: "shadow-neon-pink/30",
    bg: "bg-neon-pink/10",
    text: "text-neon-pink",
  },
  blue: {
    border: "border-neon-blue/40",
    glow: "shadow-neon-blue/30",
    bg: "bg-neon-blue/10",
    text: "text-neon-blue",
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
}: StatsCardProps) => {
  const colors = colorClasses[color];

  return (
    <article
      className={cn(
        "p-4 md:p-6 rounded-2xl bg-surface-elevated border-2 backdrop-blur-xl",
        "transition-all duration-300",
        colors.border, colors.glow, "shadow-lg",
        hoverable && "hover:scale-[1.02] cursor-pointer",
        "animate-fade-in-up",
        className
      )}
      role="region"
      aria-label={`${title}: ${value}`}
    >
      {/* Header with icon and title */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", colors.bg, colors.border)}>
          <Icon className={cn("w-5 h-5", colors.text)} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </h3>
        </div>
      </div>
      
      {/* Value */}
      <div className={cn("text-2xl md:text-3xl font-black truncate", colors.text)}>
        {value}
      </div>
      
      {/* Subtitle or Live indicator */}
      {subtitle ? (
        <p className={cn("text-xs md:text-sm mt-2 font-medium", subtitleColor)}>
          {subtitle}
        </p>
      ) : showLiveIndicator ? (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className={cn("w-3 h-3", colors.text)} aria-hidden="true" />
          <span className={cn("text-xs font-semibold", colors.text)}>Ao vivo</span>
        </div>
      ) : null}
      
      {children}
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
        "p-4 md:p-6 rounded-2xl bg-surface-elevated border-2 backdrop-blur-xl",
        colors.border, colors.glow, "shadow-lg",
        "animate-fade-in",
        className
      )}
      aria-label={title}
    >
      {title && (
        <header className="flex items-center gap-3 mb-4 md:mb-6">
          {Icon && (
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", colors.bg, colors.border)}>
              <Icon className={cn("w-5 h-5", colors.text)} aria-hidden="true" />
            </div>
          )}
          <h2 className={cn("text-lg md:text-xl font-black", colors.text)}>
            {title}
          </h2>
        </header>
      )}
      {children}
    </section>
  );
};
