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
    ? "bg-status-success/20 text-status-success border-status-success/40" 
    : "bg-status-error/20 text-status-error border-status-error/40";
  
  return (
    <Badge 
      className={`gap-1 ${colorClass} border-2 font-bold`}
      aria-label={`${isPositive ? 'Aumento' : 'Queda'} de ${Math.abs(changePercent).toFixed(1)} porcento ${label}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
      {label && <span className="text-[10px] opacity-70 ml-1">{label}</span>}
    </Badge>
  );
};
