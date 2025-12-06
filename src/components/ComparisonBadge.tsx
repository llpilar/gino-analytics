import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "./ui/badge";

interface ComparisonBadgeProps {
  changePercent: number;
  isPositive: boolean;
  label?: string;
}

export const ComparisonBadge = ({ changePercent, isPositive, label = "vs ontem" }: ComparisonBadgeProps) => {
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive 
    ? "bg-chart-4/10 text-chart-4 border-chart-4/30" 
    : "bg-destructive/10 text-destructive border-destructive/30";
  
  return (
    <Badge 
      className={`gap-1 ${colorClass} border font-medium`}
      aria-label={`${isPositive ? 'Aumento' : 'Queda'} de ${Math.abs(changePercent).toFixed(1)} porcento ${label}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
      {label && <span className="text-[10px] opacity-70 ml-1">{label}</span>}
    </Badge>
  );
};
