import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Brain, TrendingUp, AlertCircle, Lightbulb, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";

interface AnalysisInsight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
}

export const SalesAnalysis = () => {
  const [insights, setInsights] = useState<AnalysisInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    generateInsights();
    // Atualizar a cada 5 minutos
    const interval = setInterval(generateInsights, 300000);
    return () => clearInterval(interval);
  }, []);

  const generateInsights = async () => {
    try {
      setIsLoading(true);
      
      // Buscar dados de vendas para análise
      const { data: salesData, error } = await supabase.functions.invoke('shopify-data', {
        body: { endpoint: 'analytics' }
      });

      if (error) throw error;

      // Chamar a função de análise com IA
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('sales-analysis', {
        body: { salesData: salesData?.data }
      });

      if (analysisError) throw analysisError;

      setInsights(analysisData.insights || []);
    } catch (error) {
      console.error('Erro ao gerar análises:', error);
      toast({
        title: "Erro ao gerar análises",
        description: "Não foi possível gerar as recomendações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-500/20 bg-green-500/5';
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-500/5';
      default:
        return 'border-blue-500/20 bg-blue-500/5';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-white">Análises e Recomendações</h2>
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-32 bg-zinc-800/50" />
          <Skeleton className="h-32 bg-zinc-800/50" />
          <Skeleton className="h-32 bg-zinc-800/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-white">Análises e Recomendações</h2>
        <span className="text-xs text-zinc-500 ml-auto">Atualizado há poucos minutos</span>
      </div>

      <div className="grid gap-4">
        {insights.map((insight, index) => (
          <Card 
            key={index} 
            className={cn(
              "p-6 border-2 transition-all hover:shadow-lg",
              getTypeStyles(insight.type)
            )}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {getIcon(insight.type)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">
                  {insight.title}
                </h3>
                <p className="text-zinc-400 mb-3">
                  {insight.description}
                </p>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <DollarSign className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1">Recomendação:</p>
                    <p className="text-sm text-zinc-300">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {insights.length === 0 && (
          <Card className="p-8 text-center border-zinc-800 bg-zinc-900/50">
            <Brain className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">
              Coletando dados para gerar análises...
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
