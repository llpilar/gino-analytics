import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN');
    const shopDomain = 'g1n0hi-gx.myshopify.com';

    if (!shopifyAccessToken) {
      throw new Error('SHOPIFY_ACCESS_TOKEN não configurado');
    }

    const { endpoint } = await req.json();
    
    let graphqlQuery = '';
    
    // Queries diferentes baseadas no endpoint solicitado
    if (endpoint === 'orders') {
      graphqlQuery = `
        {
          orders(first: 10, reverse: true) {
            edges {
              node {
                id
                name
                createdAt
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                customer {
                  displayName
                }
                fulfillmentStatus
              }
            }
          }
        }
      `;
    } else if (endpoint === 'summary') {
      // Query para pegar dados resumidos das últimas 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      graphqlQuery = `
        {
          orders(first: 250, reverse: true, query: "created_at:>='${yesterday.toISOString()}'") {
            edges {
              node {
                id
                name
                createdAt
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      `;
    } else if (endpoint === 'analytics') {
      // Query para dados históricos (última semana)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      graphqlQuery = `
        {
          orders(first: 250, reverse: true, query: "created_at:>='${weekAgo.toISOString()}'") {
            edges {
              node {
                id
                createdAt
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      `;
    }

    console.log('Consultando Shopify GraphQL API...');
    
    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAccessToken,
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da Shopify API:', errorText);
      throw new Error(`Shopify API retornou erro: ${response.status}`);
    }

    const data = await response.json();
    console.log('Dados recebidos da Shopify:', JSON.stringify(data).substring(0, 200));

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Erro ao buscar dados da Shopify:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Verifique se o token e domínio da Shopify estão corretos'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
