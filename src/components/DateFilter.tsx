import { Calendar, ChevronDown } from "lucide-react";
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
          variant="outline" 
          className="bg-black/60 border-cyan-500/30 text-white hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all"
        >
          <Calendar className="h-4 w-4 mr-2 text-cyan-400" />
          {periodLabels[period]}
          <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-black/95 border-cyan-500/30 backdrop-blur-xl">
        {(Object.keys(periodLabels) as DateFilterPeriod[]).map((p) => (
          <DropdownMenuItem
            key={p}
            onClick={() => setPeriod(p)}
            className={`cursor-pointer ${
              period === p 
                ? 'bg-cyan-500/20 text-cyan-400 font-bold' 
                : 'text-white hover:bg-cyan-500/10 hover:text-cyan-400'
            }`}
          >
            {periodLabels[p]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
