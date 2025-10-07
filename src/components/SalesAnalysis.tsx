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
  flipped?: boolean;
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

  const toggleFlip = (index: number) => {
    setInsights(prev => prev.map((insight, i) => 
      i === index ? { ...insight, flipped: !insight.flipped } : insight
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-white">Análises e Recomendações</h2>
        <span className="text-xs text-zinc-500 ml-auto">Atualizado há poucos minutos</span>
      </div>

      <div className="grid gap-4">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className="relative h-[180px] cursor-pointer perspective-1000"
            onClick={() => toggleFlip(index)}
            style={{ perspective: '1000px' }}
          >
            <div 
              className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
                insight.flipped ? 'rotate-y-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: insight.flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Frente do Card */}
              <Card 
                className={`absolute inset-0 p-6 border-2 backface-hidden ${getTypeStyles(insight.type)}`}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="flex items-start gap-4 h-full">
                  <div className="mt-1">
                    {getIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">
                      {insight.title}
                    </h3>
                    <p className="text-zinc-400">
                      {insight.description}
                    </p>
                    <p className="text-xs text-zinc-500 mt-4">Clique para ver a recomendação</p>
                  </div>
                </div>
              </Card>

              {/* Verso do Card */}
              <Card 
                className={`absolute inset-0 p-6 border-2 backface-hidden ${getTypeStyles(insight.type)}`}
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="flex flex-col h-full justify-center gap-4">
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-primary mb-2">Recomendação:</p>
                      <p className="text-zinc-300">{insight.recommendation}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 text-center">Clique para voltar</p>
                </div>
              </Card>
            </div>
          </div>
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
