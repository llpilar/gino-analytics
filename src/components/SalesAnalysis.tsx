import { useEffect, useState } from "react";
import { Brain, TrendingUp, AlertCircle, Lightbulb, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";
import { SectionCard } from "@/components/ui/stats-card";
import { cn } from "@/lib/utils";

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
        return 'border-green-500/30 bg-green-500/5';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      default:
        return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  if (isLoading) {
    return (
      <SectionCard title="Análises e Recomendações" icon={Brain} color="purple">
        <div className="grid gap-4">
          <Skeleton className="h-32 bg-purple-500/10" />
          <Skeleton className="h-32 bg-purple-500/10" />
          <Skeleton className="h-32 bg-purple-500/10" />
        </div>
      </SectionCard>
    );
  }

  const toggleFlip = (index: number) => {
    setInsights(prev => prev.map((insight, i) => 
      i === index ? { ...insight, flipped: !insight.flipped } : insight
    ));
  };

  return (
    <SectionCard title="Análises e Recomendações" icon={Brain} color="purple">
      <span className="text-xs text-zinc-500 block mb-4">Atualizado há poucos minutos</span>

      <div className="grid gap-4">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className="relative cursor-pointer"
            onClick={() => toggleFlip(index)}
            style={{ perspective: '1000px' }}
          >
            <div 
              className="relative w-full transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: insight.flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                minHeight: '200px'
              }}
            >
              {/* Frente do Card */}
              <div 
                className={cn(
                  "p-4 md:p-6 rounded-xl border-2 bg-black/40",
                  getTypeStyles(insight.type),
                  insight.flipped ? 'invisible' : 'visible'
                )}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="mt-1 flex-shrink-0">
                    {getIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-white mb-2">
                      {insight.title}
                    </h3>
                    <p className="text-sm md:text-base text-zinc-400 mb-3">
                      {insight.description}
                    </p>
                    <p className="text-xs text-zinc-500">Clique para ver a recomendação</p>
                  </div>
                </div>
              </div>

              {/* Verso do Card */}
              <div 
                className={cn(
                  "absolute top-0 left-0 right-0 bottom-0 p-4 md:p-6 rounded-xl border-2 flex items-center bg-black/40",
                  getTypeStyles(insight.type),
                  insight.flipped ? 'visible' : 'invisible'
                )}
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateX(180deg)'
                }}
              >
                <div className="w-full space-y-3 md:space-y-4">
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 md:w-5 h-4 md:h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-semibold text-purple-400 mb-2">Recomendação:</p>
                      <p className="text-sm md:text-base text-zinc-300 break-words">{insight.recommendation}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 text-center">Clique para voltar</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {insights.length === 0 && (
          <div className="p-8 text-center rounded-xl bg-black/40 border border-purple-500/20">
            <Brain className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">
              Coletando dados para gerar análises...
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
};
