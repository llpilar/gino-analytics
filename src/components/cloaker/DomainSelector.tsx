import { useCloakerDomains } from "@/hooks/useCloakerDomains";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DomainSelectorProps {
  value: string | null;
  onChange: (domainId: string | null) => void;
  showDefault?: boolean;
}

export function DomainSelector({ value, onChange, showDefault = true }: DomainSelectorProps) {
  const { verifiedDomains, defaultDomain, isLoading } = useCloakerDomains();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Domínio Personalizado
        </Label>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  if (verifiedDomains.length === 0) {
    return null; // Don't show if no verified domains
  }

  const getDisplayValue = () => {
    if (value === "default" && defaultDomain) {
      return `${defaultDomain.domain} (Padrão)`;
    }
    if (value === "none") {
      return "Usar domínio do sistema";
    }
    const domain = verifiedDomains.find((d) => d.id === value);
    return domain?.domain || "Selecione um domínio";
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Globe className="h-4 w-4" />
        Domínio Personalizado
      </Label>
      <Select
        value={value || "none"}
        onValueChange={(val) => onChange(val === "none" ? null : val)}
      >
        <SelectTrigger>
          <SelectValue>{getDisplayValue()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>Usar domínio do sistema</span>
            </div>
          </SelectItem>
          
          {showDefault && defaultDomain && (
            <SelectItem value="default">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span>{defaultDomain.domain}</span>
                <span className="text-xs text-muted-foreground">(Padrão)</span>
              </div>
            </SelectItem>
          )}

          {verifiedDomains.map((domain) => (
            <SelectItem key={domain.id} value={domain.id}>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{domain.domain}</span>
                {domain.is_default && (
                  <span className="text-xs text-muted-foreground">(Padrão)</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Links com domínio personalizado aparecerão como: https://seu-dominio.com/{"{slug}"}
      </p>
    </div>
  );
}
