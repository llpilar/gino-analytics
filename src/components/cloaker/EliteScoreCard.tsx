import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface EliteScoreCardProps {
  title: string;
  score: number | null;
  icon: LucideIcon;
  description?: string;
}

export function EliteScoreCard({ title, score, icon: Icon, description }: EliteScoreCardProps) {
  const displayScore = score ?? 0;
  
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-400";
    if (s >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getProgressColor = (s: number) => {
    if (s >= 80) return "bg-green-500";
    if (s >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="bg-muted/50 border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">{title}</div>
            {description && (
              <div className="text-xs text-muted-foreground">{description}</div>
            )}
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(displayScore)}`}>
            {displayScore}
          </div>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`absolute h-full transition-all duration-500 ${getProgressColor(displayScore)} rounded-full`}
            style={{ width: `${displayScore}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
