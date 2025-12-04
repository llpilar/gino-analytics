import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const HeaderControls = () => {
  const { dateRange, setCustomRange } = useDateFilter();
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-3">
      {/* Currency Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-black/80 border border-primary/30 backdrop-blur-xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrency('COP')}
          className={cn(
            "h-7 px-3 rounded-full text-xs font-bold transition-all",
            currency === 'COP'
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          )}
        >
          COP
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrency('BRL')}
          className={cn(
            "h-7 px-3 rounded-full text-xs font-bold transition-all",
            currency === 'BRL'
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          )}
        >
          BRL
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Período:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost"
              size="sm"
              className="gap-2 rounded-full bg-black/80 border border-primary/30 backdrop-blur-xl hover:bg-zinc-800/50 h-9 px-4"
            >
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-white">
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM", { locale: es })} - {format(dateRange.to, "dd/MM", { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM", { locale: es })
                  )
                ) : (
                  "Selecionar"
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 bg-zinc-900/95 border-zinc-700 backdrop-blur-xl" 
            align="end"
          >
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => setCustomRange(range?.from, range?.to)}
              numberOfMonths={2}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
