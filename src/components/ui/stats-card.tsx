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

const colorClasses: Record<CardColorVariant, {
  border: string;
  glow: string;
  bg: string;
  text: string;
}> = {
  cyan: {
    border: "border-primary/40",
    glow: "shadow-primary/30",
    bg: "bg-primary/10",
    text: "text-primary",
  },
  purple: {
    border: "border-purple-500/40",
    glow: "shadow-purple-500/30",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
  },
  green: {
    border: "border-green-500/40",
    glow: "shadow-green-500/30",
    bg: "bg-green-500/10",
    text: "text-green-400",
  },
  orange: {
    border: "border-orange-500/40",
    glow: "shadow-orange-500/30",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
  },
  pink: {
    border: "border-pink-500/40",
    glow: "shadow-pink-500/30",
    bg: "bg-pink-500/10",
    text: "text-pink-400",
  },
  blue: {
    border: "border-blue-500/40",
    glow: "shadow-blue-500/30",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
  },
  red: {
    border: "border-red-500/40",
    glow: "shadow-red-500/30",
    bg: "bg-red-500/10",
    text: "text-red-400",
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
        "p-4 md:p-6 rounded-2xl bg-card border-2 backdrop-blur-xl",
        "transition-all duration-300",
        colors.border,
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
        "p-4 md:p-6 rounded-2xl bg-card border-2 backdrop-blur-xl",
        colors.border,
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
