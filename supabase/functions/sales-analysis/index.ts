import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { salesData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    // Processar dados de vendas
    const orders = salesData?.orders?.edges || [];
    
    if (orders.length === 0) {
      return new Response(
        JSON.stringify({ 
          insights: [{
            type: 'info',
            title: 'Dados Insuficientes',
            description: 'Não há dados suficientes para gerar análises no momento.',
            recommendation: 'Continue vendendo e volte mais tarde para ver as análises.'
          }]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular métricas para análise
    const totalRevenue = orders.reduce((acc: number, edge: any) => {
      const amount = parseFloat(edge.node?.totalPriceSet?.shopMoney?.amount || '0');
      return acc + amount;
    }, 0);

    const averageOrderValue = totalRevenue / orders.length;

    // Agrupar vendas por dia da semana
    const salesByDayOfWeek: { [key: string]: number } = {};
    orders.forEach((edge: any) => {
      const date = new Date(edge.node.createdAt);
      const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][date.getDay()];
      salesByDayOfWeek[dayName] = (salesByDayOfWeek[dayName] || 0) + 1;
    });

    // Vendas hoje vs média
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((edge: any) => 
      edge.node.createdAt.startsWith(today)
    ).length;
    
    const averageOrdersPerDay = orders.length / 7;

    // Criar prompt para IA
    const prompt = `Você é um especialista em análise de vendas e marketing digital. Analise os seguintes dados de uma loja online e forneça 3-4 insights e recomendações PRÁTICAS e ACIONÁVEIS.

Dados:
- Total de pedidos (últimos 7 dias): ${orders.length}
- Receita total: ${totalRevenue.toFixed(0)} COP
- Valor médio do pedido: ${averageOrderValue.toFixed(0)} COP
- Pedidos hoje: ${todayOrders}
- Média de pedidos por dia: ${averageOrdersPerDay.toFixed(1)}
- Distribuição por dia da semana: ${JSON.stringify(salesByDayOfWeek)}

Analise esses dados e identifique:
1. Padrões de vendas por dia da semana (quais dias vendem mais/menos)
2. Se hoje está tendo performance acima ou abaixo da média
3. Oportunidades de otimização de orçamento de anúncios
4. Tendências importantes

Para cada insight, retorne um objeto JSON com:
- type: "success" (bom desempenho), "warning" (atenção necessária), ou "info" (informação útil)
- title: Título curto e direto
- description: Descrição clara do insight (1-2 frases)
- recommendation: Ação específica e prática que o usuário deve tomar

Responda APENAS com um array JSON válido de insights. Exemplo:
[
  {
    "type": "success",
    "title": "Sexta-feira é seu melhor dia",
    "description": "Análise dos últimos 7 dias mostra que sextas-feiras têm 45% mais vendas que a média.",
    "recommendation": "Aumente seu orçamento de anúncios em 30-40% nas quintas à noite e sextas-feiras para maximizar o retorno."
  }
]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um especialista em e-commerce e análise de dados de vendas.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API de IA:', errorText);
      throw new Error('Falha ao gerar análises com IA');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('Resposta da IA:', aiResponse);

    // Extrair JSON da resposta
    let insights;
    try {
      // Tentar encontrar JSON na resposta
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        insights = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', parseError);
      // Fallback para insights básicos
      insights = [
        {
          type: 'info',
          title: 'Análise em Progresso',
          description: `Você teve ${orders.length} pedidos nos últimos 7 dias, com uma receita de ${totalRevenue.toFixed(0)} COP.`,
          recommendation: 'Continue monitorando seus dados para identificar padrões de vendas.'
        }
      ];
    }

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função sales-analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        insights: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
