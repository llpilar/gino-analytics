import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDateFilter, DateFilterPeriod } from "@/contexts/DateFilterContext";

const periodLabels: Record<DateFilterPeriod, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  week: 'Esta Semana',
  month: 'Este Mês',
  max: 'Máximo (90 dias)'
};

export const DateFilter = () => {
  const { period, setPeriod } = useDateFilter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost"
          size="icon"
          className="relative glass-card hover:bg-zinc-800/50"
        >
          <Calendar className="h-5 w-5 text-white" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-zinc-900/95 border-zinc-800 backdrop-blur-xl min-w-[200px]"
      >
        {(Object.keys(periodLabels) as DateFilterPeriod[]).map((p) => (
          <DropdownMenuItem
            key={p}
            onClick={() => setPeriod(p)}
            className={`cursor-pointer ${
              period === p 
                ? 'bg-primary/20 text-primary font-bold' 
                : 'text-white hover:bg-zinc-800/50 hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {periodLabels[p]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
