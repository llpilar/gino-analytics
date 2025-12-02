import { useCurrency } from '@/contexts/CurrencyContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const CurrencyToggle = () => {
  const { currency, setCurrency } = useCurrency();

  const handleToggle = (checked: boolean) => {
    setCurrency(checked ? 'BRL' : 'COP');
  };

  return (
    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-2">
      <Label 
        htmlFor="currency-toggle" 
        className={`text-sm font-medium transition-colors ${currency === 'COP' ? 'text-cyan-400' : 'text-gray-400'}`}
      >
        COP
      </Label>
      <Switch
        id="currency-toggle"
        checked={currency === 'BRL'}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-cyan-500"
      />
      <Label 
        htmlFor="currency-toggle" 
        className={`text-sm font-medium transition-colors ${currency === 'BRL' ? 'text-green-400' : 'text-gray-400'}`}
      >
        BRL
      </Label>
    </div>
  );
};
