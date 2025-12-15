import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";
import { useVisualEffects } from "@/contexts/VisualEffectsContext";

export const VisualEffectsToggle = () => {
  const { premiumEffects, setPremiumEffects } = useVisualEffects();

  return (
    <Card className="bg-card/60 border-2 border-primary/30 backdrop-blur-xl">
      <CardHeader className="p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-foreground text-base md:text-lg">Efeitos Visuais</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground text-xs md:text-sm">
          Personalize a aparência do dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Efeitos Premium</p>
            <p className="text-xs text-muted-foreground">
              Ativa animações, brilhos e efeitos visuais avançados
            </p>
          </div>
          <Switch
            checked={premiumEffects}
            onCheckedChange={setPremiumEffects}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </CardContent>
    </Card>
  );
};
