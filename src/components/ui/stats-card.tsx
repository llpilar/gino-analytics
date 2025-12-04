import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CardColorVariant = "cyan" | "purple" | "green" | "orange";

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
    border: "border-cyan-500/30",
    shadow: "shadow-cyan-500/10",
    gradient: "from-cyan-400 to-blue-400",
    iconBg: "bg-cyan-500/10",
    iconBorder: "border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  purple: {
    border: "border-purple-500/30",
    shadow: "shadow-purple-500/10",
    gradient: "from-purple-400 to-pink-400",
    iconBg: "bg-purple-500/10",
    iconBorder: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
  green: {
    border: "border-green-500/30",
    shadow: "shadow-green-500/10",
    gradient: "from-green-400 to-emerald-400",
    iconBg: "bg-green-500/10",
    iconBorder: "border-green-500/20",
    iconColor: "text-green-400",
  },
  orange: {
    border: "border-orange-500/30",
    shadow: "shadow-orange-500/10",
    gradient: "from-orange-400 to-red-400",
    iconBg: "bg-orange-500/10",
    iconBorder: "border-orange-500/20",
    iconColor: "text-orange-400",
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
    <div
      className={cn(
        "group relative p-6 rounded-2xl bg-black/80 border-2 backdrop-blur-xl overflow-hidden transition-all duration-300",
        colors.border,
        `shadow-2xl ${colors.shadow}`,
        hoverable && "hover:scale-[1.02] cursor-pointer",
        className
      )}
    >
      {/* Glow effect */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
          colors.gradient
        )}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "p-3 rounded-xl border",
              colors.iconBg,
              colors.iconBorder
            )}
          >
            <Icon className={cn("h-6 w-6", colors.iconColor)} />
          </div>
        </div>

        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          {title}
        </div>
        <div
          className={cn(
            "text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r",
            colors.gradient
          )}
        >
          {value}
        </div>
        {subtitle && (
          <div className={cn("text-sm mt-2 font-medium", subtitleColor)}>
            {subtitle}
          </div>
        )}
        {children}
      </div>

      {/* Animated border on hover */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl border-2 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity",
          colors.border
        )}
      />
    </div>
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
    <div
      className={cn(
        "p-6 rounded-2xl bg-black/80 border-2 backdrop-blur-xl",
        colors.border,
        `shadow-2xl ${colors.shadow}`,
        className
      )}
    >
      {title && (
        <div className="flex items-center gap-2 mb-6">
          {Icon && <Icon className={cn("h-6 w-6", colors.iconColor)} />}
          <h2
            className={cn(
              "text-xl font-black text-transparent bg-clip-text bg-gradient-to-r",
              colors.gradient
            )}
          >
            {title}
          </h2>
        </div>
      )}
      {children}
    </div>
  );
};
