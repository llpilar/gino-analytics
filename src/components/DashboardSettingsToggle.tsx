import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, RefreshCw } from "lucide-react";
import { useDashboardSettings, RefreshInterval } from "@/contexts/DashboardSettingsContext";

const intervalOptions: { value: RefreshInterval; label: string }[] = [
  { value: 5000, label: "5 segundos" },
  { value: 10000, label: "10 segundos" },
  { value: 30000, label: "30 segundos" },
  { value: 60000, label: "1 minuto" },
];

export const DashboardSettingsToggle = () => {
  const { compactMode, setCompactMode, refreshInterval, setRefreshInterval } = useDashboardSettings();

  return (
    <Card className="bg-card/60 border-2 border-primary/30 backdrop-blur-xl">
      <CardHeader className="p-4 md:p-6">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <CardTitle className="text-foreground text-base md:text-lg">Dashboard</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground text-xs md:text-sm">
          Configure a exibição e atualização dos dados
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0 space-y-6">
        {/* Compact Mode */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Modo Compacto</p>
            <p className="text-xs text-muted-foreground">
              Cards menores para visualizar mais dados
            </p>
          </div>
          <Switch
            checked={compactMode}
            onCheckedChange={setCompactMode}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {/* Refresh Interval */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Atualização Automática</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Frequência de refresh dos dados
            </p>
          </div>
          <Select
            value={String(refreshInterval)}
            onValueChange={(value) => setRefreshInterval(Number(value) as RefreshInterval)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {intervalOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
