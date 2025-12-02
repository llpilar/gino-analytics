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
    ? "bg-green-500/20 text-green-400 border-green-500/40" 
    : "bg-red-500/20 text-red-400 border-red-500/40";
  
  return (
    <Badge className={`gap-1 ${colorClass} border-2 font-bold`}>
      <Icon className="h-3 w-3" />
      {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
      <span className="text-[10px] opacity-70 ml-1">{label}</span>
    </Badge>
  );
};
