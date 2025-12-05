import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down";
  trendValue?: string;
  color?: "green" | "blue" | "orange" | "primary";
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = "primary",
}: MetricCardProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 transition-all duration-300 hover:border-primary/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <h3 className="text-sm font-bold tracking-wider text-muted-foreground">
            {title}
          </h3>
        </div>
      </div>

      <div className="text-5xl font-bold mb-2 text-foreground">
        {value}
      </div>

      {subtitle && (
        <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>
      )}

      {trend && trendValue && (
        <div className="flex items-center gap-2">
          {trend === "up" ? (
            <TrendingUp className="w-5 h-5 text-primary" />
          ) : (
            <TrendingDown className="w-5 h-5 text-destructive" />
          )}
          <span className="text-sm font-bold text-primary">
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
};
