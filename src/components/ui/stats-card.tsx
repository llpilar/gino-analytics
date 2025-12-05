import { LucideIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

// Twitter Blue theme: all variants use the same blue primary color
const colorClasses: Record<CardColorVariant, {
  border: string;
  glow: string;
  bg: string;
  text: string;
}> = {
  cyan: {
    border: "border-primary/30",
    glow: "shadow-primary/20",
    bg: "bg-primary/10",
    text: "text-primary",
  },
  purple: {
    border: "border-primary/30",
    glow: "shadow-primary/20",
    bg: "bg-primary/10",
    text: "text-primary",
  },
  green: {
    border: "border-chart-2/30",
    glow: "shadow-chart-2/20",
    bg: "bg-chart-2/10",
    text: "text-chart-2",
  },
  orange: {
    border: "border-chart-3/30",
    glow: "shadow-chart-3/20",
    bg: "bg-chart-3/10",
    text: "text-chart-3",
  },
  pink: {
    border: "border-chart-5/30",
    glow: "shadow-chart-5/20",
    bg: "bg-chart-5/10",
    text: "text-chart-5",
  },
  blue: {
    border: "border-primary/30",
    glow: "shadow-primary/20",
    bg: "bg-primary/10",
    text: "text-primary",
  },
  red: {
    border: "border-destructive/30",
    glow: "shadow-destructive/20",
    bg: "bg-destructive/10",
    text: "text-destructive",
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
        "p-4 md:p-6 rounded-xl bg-card border backdrop-blur-sm",
        "transition-all duration-300",
        "border-border",
        hoverable && "hover:border-primary/30 hover:shadow-sm cursor-pointer",
        "animate-fade-in-up",
        className
      )}
      role="region"
      aria-label={`${title}: ${value}`}
    >
      {/* Header with icon and title */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.bg)}>
          <Icon className={cn("w-5 h-5", colors.text)} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </h3>
        </div>
      </div>
      
      {/* Value */}
      <div className="text-2xl md:text-3xl font-black truncate text-foreground">
        {value}
      </div>
      
      {/* Subtitle or Live indicator */}
      {subtitle ? (
        <p className={cn("text-xs md:text-sm mt-2 font-medium", subtitleColor)}>
          {subtitle}
        </p>
      ) : showLiveIndicator ? (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className="w-3 h-3 text-primary" aria-hidden="true" />
          <span className="text-xs font-semibold text-primary">Ao vivo</span>
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
        "p-4 md:p-6 rounded-xl bg-card border border-border backdrop-blur-sm",
        "animate-fade-in",
        className
      )}
      aria-label={title}
    >
      {title && (
        <header className="flex items-center gap-3 mb-4 md:mb-6">
          {Icon && (
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.bg)}>
              <Icon className={cn("w-5 h-5", colors.text)} aria-hidden="true" />
            </div>
          )}
          <h2 className="text-lg md:text-xl font-black text-foreground">
            {title}
          </h2>
        </header>
      )}
      {children}
    </section>
  );
};
