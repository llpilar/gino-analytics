import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down";
  trendValue?: string;
  color?: "green" | "blue" | "orange";
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = "green",
}: MetricCardProps) => {
  const colorClasses = {
    green: "neon-border-green",
    blue: "neon-border-blue",
    orange: "neon-border-orange",
  };

  const textColorClasses = {
    green: "neon-text-green",
    blue: "neon-text-blue",
    orange: "neon-text-orange",
  };

  return (
    <div className={cn("bg-card border rounded-lg p-6", colorClasses[color])}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", textColorClasses[color].replace("neon-text", "bg"))}></div>
          <h3 className="text-sm font-bold tracking-wider text-muted-foreground">
            {title}
          </h3>
        </div>
      </div>

      <div className={cn("text-5xl font-bold mb-2", textColorClasses[color])}>
        {value}
      </div>

      {subtitle && (
        <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>
      )}

      {trend && trendValue && (
        <div className="flex items-center gap-2">
          {trend === "up" ? (
            <TrendingUp className="w-5 h-5 text-green-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
          <span className={cn("text-sm font-bold", textColorClasses[color])}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
};
