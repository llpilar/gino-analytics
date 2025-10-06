import { useState } from "react";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useFacebookAdAccounts, useFacebookAdInsights } from "@/hooks/useFacebookAds";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import { Facebook, TrendingUp, MousePointer, Eye, DollarSign } from "lucide-react";

export const FacebookAdsMetrics = () => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useFacebookAdAccounts();
  const { data: insights, isLoading: insightsLoading } = useFacebookAdInsights(selectedAccount);

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
      <Card className="glass-card p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full" />
      </Card>
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

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Facebook className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold text-white">Facebook Ads</h2>
        </div>
        
        <Select value={selectedAccount || ""} onValueChange={setSelectedAccount}>
          <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
            <SelectValue placeholder="Selecione uma conta de anúncios" />
          </SelectTrigger>
          <SelectContent>
            {accounts?.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {selectedAccount && (
        <>
          {insightsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="glass-card p-6">
                  <Skeleton className="h-12 w-full" />
                </Card>
              ))}
            </div>
          ) : insights ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="h-5 w-5 text-red-400" />
                  <p className="text-sm text-zinc-400">Gasto Total</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(insights.spend)}
                </p>
              </Card>

              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="h-5 w-5 text-blue-400" />
                  <p className="text-sm text-zinc-400">Impressões</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(insights.impressions)}
                </p>
              </Card>

              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <MousePointer className="h-5 w-5 text-green-400" />
                  <p className="text-sm text-zinc-400">Cliques</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(insights.clicks)}
                </p>
              </Card>

              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  <p className="text-sm text-zinc-400">CTR</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {parseFloat(insights.ctr).toFixed(2)}%
                </p>
              </Card>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
