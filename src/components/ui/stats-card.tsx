import { LucideIcon } from "lucide-react";
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
}

const colorClasses: Record<CardColorVariant, {
  border: string;
  shadow: string;
  gradient: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
}> = {
  cyan: {
    border: "border-neon-cyan/30",
    shadow: "shadow-neon-cyan/10",
    gradient: "from-neon-cyan to-neon-blue",
    iconBg: "bg-neon-cyan/10",
    iconBorder: "border-neon-cyan/20",
    iconColor: "text-neon-cyan",
  },
  purple: {
    border: "border-neon-purple/30",
    shadow: "shadow-neon-purple/10",
    gradient: "from-neon-purple to-neon-pink",
    iconBg: "bg-neon-purple/10",
    iconBorder: "border-neon-purple/20",
    iconColor: "text-neon-purple",
  },
  green: {
    border: "border-neon-green/30",
    shadow: "shadow-neon-green/10",
    gradient: "from-neon-green to-neon-green-light",
    iconBg: "bg-neon-green/10",
    iconBorder: "border-neon-green/20",
    iconColor: "text-neon-green",
  },
  orange: {
    border: "border-neon-orange/30",
    shadow: "shadow-neon-orange/10",
    gradient: "from-neon-orange to-neon-orange-light",
    iconBg: "bg-neon-orange/10",
    iconBorder: "border-neon-orange/20",
    iconColor: "text-neon-orange",
  },
  pink: {
    border: "border-neon-pink/30",
    shadow: "shadow-neon-pink/10",
    gradient: "from-neon-pink to-neon-purple",
    iconBg: "bg-neon-pink/10",
    iconBorder: "border-neon-pink/20",
    iconColor: "text-neon-pink",
  },
  blue: {
    border: "border-neon-blue/30",
    shadow: "shadow-neon-blue/10",
    gradient: "from-neon-blue to-neon-cyan",
    iconBg: "bg-neon-blue/10",
    iconBorder: "border-neon-blue/20",
    iconColor: "text-neon-blue",
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
}: StatsCardProps) => {
  const colors = colorClasses[color];

  return (
    <article
      className={cn(
        "group relative p-4 md:p-6 rounded-2xl bg-surface-elevated border-2 backdrop-blur-xl overflow-hidden transition-all duration-300",
        colors.border,
        `shadow-2xl ${colors.shadow}`,
        hoverable && "hover:scale-[1.02] cursor-pointer",
        "animate-fade-in",
        className
      )}
      role="region"
      aria-label={`${title}: ${value}`}
    >
      {/* Glow effect */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
          colors.gradient
        )}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div
            className={cn(
              "p-2.5 md:p-3 rounded-xl border",
              colors.iconBg,
              colors.iconBorder
            )}
          >
            <Icon className={cn("h-5 w-5 md:h-6 md:w-6", colors.iconColor)} aria-hidden="true" />
          </div>
        </div>

        <h3 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          {title}
        </h3>
        <div
          className={cn(
            "text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r",
            colors.gradient
          )}
        >
          {value}
        </div>
        {subtitle && (
          <p className={cn("text-xs md:text-sm mt-2 font-medium", subtitleColor)}>
            {subtitle}
          </p>
        )}
        {children}
      </div>

      {/* Animated border on hover */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl border-2 opacity-0 group-hover:opacity-100 animate-pulse-glow transition-opacity",
          colors.border
        )}
        aria-hidden="true"
      />
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
        "p-4 md:p-6 rounded-2xl bg-surface-elevated border-2 backdrop-blur-xl animate-fade-in",
        colors.border,
        `shadow-2xl ${colors.shadow}`,
        className
      )}
      aria-label={title}
    >
      {title && (
        <header className="flex items-center gap-2 mb-4 md:mb-6">
          {Icon && <Icon className={cn("h-5 w-5 md:h-6 md:w-6", colors.iconColor)} aria-hidden="true" />}
          <h2
            className={cn(
              "text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r",
              colors.gradient
            )}
          >
            {title}
          </h2>
        </header>
      )}
      {children}
    </section>
  );
};
