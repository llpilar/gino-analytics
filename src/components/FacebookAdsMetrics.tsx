import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useFacebookAdAccounts, useFacebookAdInsights } from "@/hooks/useFacebookAds";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import { Facebook, TrendingUp, MousePointer, Eye, DollarSign } from "lucide-react";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { format } from "date-fns";
import { StatsCard, SectionCard, CardColorVariant } from "@/components/ui/stats-card";
import { LucideIcon } from "lucide-react";

export const FacebookAdsMetrics = () => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const { dateRange } = useDateFilter();
  
  const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;
  
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useFacebookAdAccounts();
  const { data: insights, isLoading: insightsLoading } = useFacebookAdInsights(selectedAccount, startDate, endDate);

  if (accountsError) {
    return (
      <Alert className="border-blue-500/20 bg-blue-500/10">
        <Facebook className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-zinc-300">
          Configure seu Facebook Access Token para visualizar as métricas de anúncios.
          <br />
          <a 
            href="https://developers.facebook.com/tools/explorer/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline mt-2 inline-block"
          >
            Obter token no Graph API Explorer →
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  if (accountsLoading) {
    return (
      <SectionCard title="Facebook Ads" icon={Facebook} color="blue">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full" />
      </SectionCard>
    );
  }

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const formatNumber = (value: string) => {
    return new Intl.NumberFormat('pt-BR').format(parseFloat(value));
  };

  const metricsCards: { title: string; value: string; icon: LucideIcon; color: CardColorVariant }[] = insights ? [
    {
      title: "Gasto Total",
      value: formatCurrency(insights.spend),
      icon: DollarSign,
      color: "orange",
    },
    {
      title: "Impressões",
      value: formatNumber(insights.impressions),
      icon: Eye,
      color: "blue",
    },
    {
      title: "Cliques",
      value: formatNumber(insights.clicks),
      icon: MousePointer,
      color: "green",
    },
    {
      title: "CTR",
      value: `${parseFloat(insights.ctr).toFixed(2)}%`,
      icon: TrendingUp,
      color: "purple",
    },
  ] : [];

  return (
    <div className="space-y-6">
      <SectionCard title="Facebook Ads" icon={Facebook} color="blue">
        <Select value={selectedAccount || ""} onValueChange={setSelectedAccount}>
          <SelectTrigger className="bg-black/60 border-blue-500/30 text-white focus:border-blue-500">
            <SelectValue placeholder="Selecione uma conta de anúncios" />
          </SelectTrigger>
          <SelectContent className="bg-black/95 border-blue-500/30">
            {accounts?.map((account) => (
              <SelectItem key={account.id} value={account.id} className="text-white hover:bg-blue-500/20">
                {account.name} ({account.currency})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SectionCard>

      {selectedAccount && (
        <>
          {insightsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SectionCard key={i} color="cyan">
                  <Skeleton className="h-12 w-full" />
                </SectionCard>
              ))}
            </div>
          ) : insights ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metricsCards.map((metric) => (
                <StatsCard
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  icon={metric.icon}
                  color={metric.color}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
