// Calculadora de Lucratividade
import { useState, useMemo } from "react";
import { Calculator, TrendingUp, TrendingDown, DollarSign, Package, Undo2, Percent, PiggyBank, Facebook, Globe } from "lucide-react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useShopifyOrders } from "@/hooks/useShopifyData";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Lucratividade = () => {
  const { dateRange } = useDateFilter();
  const { data: shopifyData, isLoading } = useShopifyOrders();
  const { formatCurrency, currency } = useCurrency();

  // Inputs manuais (valores em COP - moeda base do Shopify)
  const [efetividade, setEfetividade] = useState(70); // % de pedidos entregues
  const [devolucao, setDevolucao] = useState(10); // % de devoluções
  const [custoOperacional, setCustoOperacional] = useState(500000); // Custos operacionais
  const [custoFacebookAds, setCustoFacebookAds] = useState(0); // Custos Facebook Ads
  const [custoGoogleAds, setCustoGoogleAds] = useState(0); // Custos Google Ads
  const [margemMinima, setMargemMinima] = useState(30); // % de margem mínima desejada

  // Faturamento do Shopify (sempre em COP)
  const faturamentoBruto = useMemo(() => {
    if (!shopifyData?.data?.orders?.edges) return 0;
    return shopifyData.data.orders.edges.reduce((acc: number, edge: any) => {
      const amount = parseFloat(edge.node?.totalPriceSet?.shopMoney?.amount || 0);
      return acc + amount;
    }, 0);
  }, [shopifyData]);

  const totalPedidos = shopifyData?.data?.orders?.edges?.length || 0;

  // Cálculos
  const pedidosEntregues = Math.round(totalPedidos * (efetividade / 100));
  const pedidosDevolvidos = Math.round(totalPedidos * (devolucao / 100));
  const pedidosEfetivos = pedidosEntregues - pedidosDevolvidos;

  // Total de custos
  const custoTotal = custoOperacional + custoFacebookAds + custoGoogleAds;

  // Receita líquida considerando efetividade e devolução
  const taxaEfetiva = (efetividade / 100) * (1 - devolucao / 100);
  const receitaLiquida = faturamentoBruto * taxaEfetiva;

  // Lucro após todos os custos
  const lucroOperacional = receitaLiquida - custoTotal;
  const margemReal = receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0;

  // Análise de meta
  const atingiuMeta = margemReal >= margemMinima;
  const diferencaMargem = margemReal - margemMinima;

  // Receita mínima necessária para atingir margem
  const receitaMinimaNecessaria = margemMinima > 0 ? custoTotal / (1 - margemMinima / 100) : custoTotal;
  const faturamentoMinimoNecessario = taxaEfetiva > 0 ? receitaMinimaNecessaria / taxaEfetiva : 0;

  const periodLabel = dateRange.from && dateRange.to 
    ? `${format(dateRange.from, "dd/MM", { locale: ptBR })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`
    : "Período selecionado";

  return (
    <DashboardWrapper>
      <div className="space-y-4 md:space-y-6 py-3 md:py-6 px-4 md:px-8">
        <PageHeader
          title="Calculadora de Lucro"
          subtitle="Simule cenários de lucratividade com base na efetividade e custos"
        />

        {/* Dados Automáticos do Shopify */}
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Dados do Shopify - {periodLabel} ({currency})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Faturamento Bruto</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-xl md:text-2xl font-bold text-primary">{formatCurrency(faturamentoBruto)}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total de Pedidos</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-xl md:text-2xl font-bold">{totalPedidos}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-xl md:text-2xl font-bold">
                    {formatCurrency(totalPedidos > 0 ? faturamentoBruto / totalPedidos : 0)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inputs Manuais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Taxa de Efetividade */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-green-500" />
                Taxa de Efetividade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-500">{efetividade}%</span>
                <span className="text-xs text-muted-foreground">Pedidos entregues</span>
              </div>
              <Slider
                value={[efetividade]}
                onValueChange={(value) => setEfetividade(value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                ≈ {pedidosEntregues} pedidos entregues de {totalPedidos}
              </p>
            </CardContent>
          </Card>

          {/* Taxa de Devolução */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Undo2 className="h-4 w-4 text-red-500" />
                Taxa de Devolução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-500">{devolucao}%</span>
                <span className="text-xs text-muted-foreground">Pedidos devolvidos</span>
              </div>
              <Slider
                value={[devolucao]}
                onValueChange={(value) => setDevolucao(value[0])}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                ≈ {pedidosDevolvidos} devoluções
              </p>
            </CardContent>
          </Card>

          {/* Custos Operacionais */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-yellow-500" />
                Custos Operacionais ({currency})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  value={custoOperacional}
                  onChange={(e) => setCustoOperacional(Number(e.target.value))}
                  className="text-lg font-bold"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(custoOperacional)} em custos fixos
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Margem Mínima */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Percent className="h-4 w-4 text-blue-500" />
                Margem Mínima Ideal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-500">{margemMinima}%</span>
                <span className="text-xs text-muted-foreground">Meta de lucro</span>
              </div>
              <Slider
                value={[margemMinima]}
                onValueChange={(value) => setMargemMinima(value[0])}
                min={0}
                max={80}
                step={1}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Facebook Ads */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook Ads ({currency})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  value={custoFacebookAds}
                  onChange={(e) => setCustoFacebookAds(Number(e.target.value))}
                  className="text-lg font-bold"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(custoFacebookAds)} em anúncios
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Google Ads */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-red-500" />
                Google Ads ({currency})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  value={custoGoogleAds}
                  onChange={(e) => setCustoGoogleAds(Number(e.target.value))}
                  className="text-lg font-bold"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(custoGoogleAds)} em anúncios
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Custos */}
        <Card className="glass-card border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4 text-yellow-500" />
              Resumo de Custos ({currency})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Operacionais</p>
                <p className="text-lg font-bold">{formatCurrency(custoOperacional)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Facebook Ads</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(custoFacebookAds)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Google Ads</p>
                <p className="text-lg font-bold text-red-500">{formatCurrency(custoGoogleAds)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total de Custos</p>
                <p className="text-lg font-bold text-yellow-500">{formatCurrency(custoTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className={`glass-card border-2 ${atingiuMeta ? 'border-green-500/50' : 'border-red-500/50'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Resultado da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pedidos Efetivos</p>
                <p className="text-xl md:text-2xl font-bold">{pedidosEfetivos}</p>
                <p className="text-[10px] text-muted-foreground">
                  ({Math.round(taxaEfetiva * 100)}% do total)
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Receita Líquida</p>
                <p className="text-xl md:text-2xl font-bold text-primary">{formatCurrency(receitaLiquida)}</p>
                <p className="text-[10px] text-muted-foreground">
                  Após efetividade e devoluções
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Lucro Operacional</p>
                <p className={`text-xl md:text-2xl font-bold ${lucroOperacional >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(lucroOperacional)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Receita - Custos Totais
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Margem Real</p>
                <div className="flex items-center gap-2">
                  <p className={`text-xl md:text-2xl font-bold ${atingiuMeta ? 'text-green-500' : 'text-red-500'}`}>
                    {margemReal.toFixed(1)}%
                  </p>
                  {atingiuMeta ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className={`text-[10px] ${atingiuMeta ? 'text-green-500' : 'text-red-500'}`}>
                  {atingiuMeta ? '+' : ''}{diferencaMargem.toFixed(1)}% vs meta
                </p>
              </div>
            </div>

            {/* Análise */}
            <div className={`mt-6 p-4 rounded-lg ${atingiuMeta ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {atingiuMeta ? (
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-500">Meta Atingida!</p>
                    <p className="text-sm text-muted-foreground">
                      Sua margem de {margemReal.toFixed(1)}% está {diferencaMargem.toFixed(1)}% acima da meta de {margemMinima}%.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <TrendingDown className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-500">Abaixo da Meta</p>
                    <p className="text-sm text-muted-foreground">
                      Para atingir {margemMinima}% de margem, você precisa faturar pelo menos{' '}
                      <span className="font-bold text-foreground">{formatCurrency(faturamentoMinimoNecessario)}</span>{' '}
                      bruto no período.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
};

export default Lucratividade;
