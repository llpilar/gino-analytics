import { useState } from "react";
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  subMonths, 
  format 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronDown, X } from "lucide-react";
import { useDateFilter } from "@/contexts/DateFilterContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PresetKey = 
  | "today" 
  | "yesterday" 
  | "7days" 
  | "30days" 
  | "90days" 
  | "6months" 
  | "12months" 
  | "all"
  | "custom";

interface DatePreset {
  key: PresetKey;
  label: string;
  getRange: () => { from: Date; to: Date };
}

const presets: DatePreset[] = [
  {
    key: "today",
    label: "Hoje",
    getRange: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    key: "yesterday",
    label: "Ontem",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    key: "7days",
    label: "Últimos 7 dias",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    key: "30days",
    label: "Últimos 30 dias",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    key: "90days",
    label: "Últimos 90 dias",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 89)),
      to: endOfDay(new Date()),
    }),
  },
  {
    key: "6months",
    label: "Últimos 6 meses",
    getRange: () => ({
      from: startOfDay(subMonths(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    key: "12months",
    label: "Últimos 12 meses",
    getRange: () => ({
      from: startOfDay(subMonths(new Date(), 12)),
      to: endOfDay(new Date()),
    }),
  },
];

export const DateFilterDropdown = () => {
  const { dateRange, setCustomRange } = useDateFilter();
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("today");
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customRange, setCustomRangeLocal] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const handlePresetSelect = (preset: DatePreset) => {
    const range = preset.getRange();
    setSelectedPreset(preset.key);
    setCustomRange(range.from, range.to);
  };

  const handleCustomDateSelect = () => {
    if (customRange.from && customRange.to) {
      setSelectedPreset("custom");
      setCustomRange(customRange.from, customRange.to);
      setIsCustomOpen(false);
    }
  };

  const getSelectedLabel = () => {
    if (selectedPreset === "custom" && dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    const preset = presets.find((p) => p.key === selectedPreset);
    return preset?.label || "Hoje";
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePresetSelect(presets[0]); // Reset to "Hoje"
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 bg-background/50 border-border/50 hover:bg-background/80"
          >
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{getSelectedLabel()}</span>
            {selectedPreset !== "today" && (
              <Badge
                variant="secondary"
                className="ml-1 px-1.5 py-0.5 text-xs cursor-pointer hover:bg-destructive/20"
                onClick={clearSelection}
              >
                <X className="h-3 w-3" />
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-56 bg-popover/95 backdrop-blur-md border-border/50"
        >
          {presets.map((preset) => (
            <DropdownMenuItem
              key={preset.key}
              onClick={() => handlePresetSelect(preset)}
              className={cn(
                "cursor-pointer",
                selectedPreset === preset.key && "text-primary font-medium bg-primary/10"
              )}
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
            <PopoverTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className={cn(
                  "cursor-pointer",
                  selectedPreset === "custom" && "text-primary font-medium bg-primary/10"
                )}
              >
                Personalizado
              </DropdownMenuItem>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" side="right">
              <div className="p-4 space-y-4">
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Selecione o período</p>
                  <CalendarComponent
                    mode="range"
                    selected={{
                      from: customRange.from,
                      to: customRange.to,
                    }}
                    onSelect={(range) => {
                      setCustomRangeLocal({
                        from: range?.from,
                        to: range?.to,
                      });
                    }}
                    numberOfMonths={2}
                    locale={ptBR}
                    className="rounded-md border"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCustomOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCustomDateSelect}
                    disabled={!customRange.from || !customRange.to}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
