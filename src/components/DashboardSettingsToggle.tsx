import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, RefreshCw, Monitor, Layers } from "lucide-react";
import { useDashboardSettings, RefreshInterval, ViewMode } from "@/contexts/DashboardSettingsContext";
import { cn } from "@/lib/utils";

const intervalOptions: { value: RefreshInterval; label: string }[] = [
  { value: 5000, label: "5 segundos" },
  { value: 10000, label: "10 segundos" },
  { value: 30000, label: "30 segundos" },
  { value: 60000, label: "1 minuto" },
];

const viewModeOptions: { value: ViewMode; label: string; description: string; icon: typeof Monitor }[] = [
  { value: "normal", label: "Normal", description: "Visualização padrão", icon: Monitor },
  { value: "compact", label: "Compacto", description: "Cards menores", icon: LayoutGrid },
  { value: "combined", label: "Combinado", description: "Dashboard + Análises", icon: Layers },
];

export const DashboardSettingsToggle = () => {
  const { viewMode, setViewMode, refreshInterval, setRefreshInterval } = useDashboardSettings();

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
        {/* View Mode Selection */}
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Modo de Visualização</p>
            <p className="text-xs text-muted-foreground">
              Escolha como exibir o dashboard
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {viewModeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = viewMode === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setViewMode(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200",
                    isSelected 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-border bg-card/50 text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isSelected && "text-primary")} />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            {viewModeOptions.find(o => o.value === viewMode)?.description}
          </p>
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
