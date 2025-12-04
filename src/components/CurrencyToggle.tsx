import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

export const CurrencyToggle = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-900/80 border border-zinc-700/50 backdrop-blur-xl">
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
  );
};
