import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CloakerVisitor {
  score: number;
  score_device_consistency: number | null;
  score_webrtc: number | null;
  score_mouse_pattern: number | null;
  score_keyboard: number | null;
  score_session_replay: number | null;
  score_automation: number | null;
  score_behavior: number | null;
  score_fingerprint: number | null;
  score_network: number | null;
}

interface ScoreBreakdownProps {
  visitor: CloakerVisitor;
}

export function ScoreBreakdown({ visitor }: ScoreBreakdownProps) {
  const scores = [
    { name: "Device", value: visitor.score_device_consistency, weight: 15 },
    { name: "WebRTC", value: visitor.score_webrtc, weight: 10 },
    { name: "Mouse", value: visitor.score_mouse_pattern, weight: 10 },
    { name: "Keyboard", value: visitor.score_keyboard, weight: 10 },
    { name: "Session", value: visitor.score_session_replay, weight: 10 },
    { name: "Automation", value: visitor.score_automation, weight: 15 },
    { name: "Behavior", value: visitor.score_behavior, weight: 10 },
    { name: "Fingerprint", value: visitor.score_fingerprint, weight: 10 },
    { name: "Network", value: visitor.score_network, weight: 10 },
  ];

  const validScores = scores.filter(s => s.value !== null);
  const avgElite = validScores.length > 0 
    ? Math.round(validScores.reduce((acc, s) => acc + (s.value || 0), 0) / validScores.length)
    : 0;

  const getImpactIcon = (score: number | null) => {
    if (score === null) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (score >= 70) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (score >= 40) return <Minus className="w-4 h-4 text-yellow-400" />;
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Breakdown de Scores Elite
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground">Score Elite Médio</div>
            <div className={`text-3xl font-bold ${getScoreColor(avgElite)}`}>
              {avgElite}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Score Final</div>
            <div className={`text-3xl font-bold ${getScoreColor(visitor.score)}`}>
              {visitor.score}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {scores.map((score) => (
            <div 
              key={score.name} 
              className="flex items-center justify-between py-2 px-3 bg-background/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                {getImpactIcon(score.value)}
                <span className="text-sm">{score.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {score.weight}%
                </span>
                <span className={`font-bold min-w-[32px] text-right ${getScoreColor(score.value)}`}>
                  {score.value ?? "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
