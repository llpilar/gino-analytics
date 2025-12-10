import { useState } from "react";
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  subMonths,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { X } from "lucide-react";
import { useDateFilter } from "@/contexts/DateFilterContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    key: "all",
    label: "Todo período",
    getRange: () => ({
      from: startOfDay(subMonths(new Date(), 24)),
      to: endOfDay(new Date()),
    }),
  },
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
  const [isOpen, setIsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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
    setIsOpen(false);
  };

  const handleCustomClick = () => {
    setIsOpen(false);
    setIsCalendarOpen(true);
  };

  const handleCustomDateSelect = () => {
    if (customRange.from && customRange.to) {
      setSelectedPreset("custom");
      setCustomRange(customRange.from, customRange.to);
      setIsCalendarOpen(false);
    }
  };

  const getSelectedLabel = () => {
    if (selectedPreset === "custom" && dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd/MM/yy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yy", { locale: ptBR })}`;
    }
    const preset = presets.find((p) => p.key === selectedPreset);
    return preset?.label || "Hoje";
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePresetSelect(presets[1]); // Reset to "Hoje"
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center bg-card border border-border rounded-full p-0.5 sm:p-1 cursor-pointer">
            <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-accent text-foreground transition-all duration-300">
              {getSelectedLabel()}
            </div>
            {selectedPreset !== "today" && (
              <div
                className="px-1.5 py-0.5 rounded-full text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                onClick={clearSelection}
              >
                <X className="h-3 w-3" />
              </div>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-48 bg-card border-border z-50"
          sideOffset={4}
        >
          {presets.map((preset) => (
            <DropdownMenuItem
              key={preset.key}
              onClick={() => handlePresetSelect(preset)}
              className={cn(
                "cursor-pointer py-2 px-3",
                selectedPreset === preset.key 
                  ? "text-primary font-medium" 
                  : "text-foreground/80"
              )}
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onClick={handleCustomClick}
            className={cn(
              "cursor-pointer py-2 px-3",
              selectedPreset === "custom" 
                ? "text-primary font-medium" 
                : "text-foreground/80"
            )}
          >
            Personalizado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="sm:max-w-fit">
          <DialogHeader>
            <DialogTitle>Selecione o período</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
              className="rounded-md border pointer-events-auto"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCalendarOpen(false)}
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
        </DialogContent>
      </Dialog>
    </>
  );
};
