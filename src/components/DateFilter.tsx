import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const DateFilter = () => {
  const { dateRange, setCustomRange } = useDateFilter();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 rounded-full bg-zinc-900/80 border border-zinc-700/50 backdrop-blur-xl hover:bg-zinc-800/50 h-9 px-4",
            (dateRange.from || dateRange.to) && "border-primary/50"
          )}
        >
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-white">
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM", { locale: es })} - {format(dateRange.to, "dd/MM", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: es })
              )
            ) : (
              "Período"
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
  );
};
