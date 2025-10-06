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
    const today = new Date().toISOString().split('T')[0];
    
    // Queries diferentes baseadas no endpoint solicitado
    if (endpoint === 'orders-today') {
      graphqlQuery = `
        {
          orders(first: 250, query: "created_at:>='${today}'") {
            edges {
              node {
                id
                name
                createdAt
              }
            }
          }
        }
      `;
    } else if (endpoint === 'revenue-today') {
      graphqlQuery = `
        {
          orders(first: 250, query: "created_at:>='${today}'") {
            edges {
              node {
                id
                currentTotalPriceSet {
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
    } else if (endpoint === 'revenue-yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      graphqlQuery = `
        {
          orders(first: 250, query: "created_at:>='${yesterdayStr}' AND created_at:<'${today}'") {
            edges {
              node {
                id
                currentTotalPriceSet {
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
    } else if (endpoint === 'revenue-3days' || endpoint === 'revenue-7days' || endpoint === 'revenue-15days' || endpoint === 'revenue-30days') {
      let daysAgo = 0;
      
      if (endpoint === 'revenue-3days') daysAgo = 3;
      else if (endpoint === 'revenue-7days') daysAgo = 7;
      else if (endpoint === 'revenue-15days') daysAgo = 15;
      else if (endpoint === 'revenue-30days') daysAgo = 30;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      console.log(`Buscando pedidos dos últimos ${daysAgo} dias a partir de ${startDateStr}`);
      
      // Para 30 dias, precisamos fazer paginação para pegar todos os pedidos
      let allOrders: any[] = [];
      let hasNextPage = true;
      let cursor = null;
      
      while (hasNextPage && allOrders.length < 1000) { // Limite de segurança
        const paginationQuery: string = cursor 
          ? `, after: "${cursor}"` 
          : '';
        
        const paginatedQuery: string = `
          {
            orders(first: 250, sortKey: CREATED_AT, reverse: true, query: "created_at:>='${startDateStr}'"${paginationQuery}) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  id
                  currentTotalPriceSet {
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
        
        const pageResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shopifyAccessToken,
          },
          body: JSON.stringify({ query: paginatedQuery }),
        });
        
        if (!pageResponse.ok) {
          throw new Error(`Erro na paginação: ${pageResponse.status}`);
        }
        
        const pageData = await pageResponse.json();
        const orders = pageData.data?.orders?.edges || [];
        allOrders = [...allOrders, ...orders];
        
        hasNextPage = pageData.data?.orders?.pageInfo?.hasNextPage || false;
        cursor = pageData.data?.orders?.pageInfo?.endCursor || null;
        
        console.log(`Página carregada: ${orders.length} pedidos. Total: ${allOrders.length}`);
      }
      
      console.log(`Total de pedidos encontrados para ${daysAgo} dias: ${allOrders.length}`);
      
      // Retornar no mesmo formato esperado
      return new Response(
        JSON.stringify({
          data: {
            orders: {
              edges: allOrders
            }
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } else if (endpoint === 'low-stock') {
      graphqlQuery = `
        {
          products(first: 50) {
            edges {
              node {
                id
                title
                totalInventory
                variants(first: 10) {
                  edges {
                    node {
                      id
                      inventoryQuantity
                      sku
                    }
                  }
                }
              }
            }
          }
        }
      `;
    } else if (endpoint === 'customers-today') {
      graphqlQuery = `
        {
          customers(first: 250, query: "created_at:>='${today}'") {
            edges {
              node {
                id
                email
                createdAt
              }
            }
          }
        }
      `;
    } else if (endpoint === 'orders') {
      graphqlQuery = `
        {
          orders(first: 5, sortKey: CREATED_AT, reverse: true) {
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
                lineItems(first: 10) {
                  edges {
                    node {
                      name
                      quantity
                      discountedTotalSet {
                        shopMoney {
                          amount
                          currencyCode
                        }
                      }
                      variant {
                        sku
                        product {
                          id
                          title
                          handle
                          featuredImage {
                            url
                          }
                        }
                      }
                    }
                  }
                }
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
    } else if (endpoint === 'products') {
      graphqlQuery = `
        {
          products(first: 20) {
            edges {
              node {
                id
                title
                descriptionHtml
                images(first: 1) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
                variants(first: 1) {
                  edges {
                    node {
                      price
                      compareAtPrice
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      `;
    } else if (endpoint === 'products-sales') {
      // Query para pegar vendas dos últimos 30 dias com detalhes dos produtos
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      graphqlQuery = `
        {
          orders(first: 250, query: "created_at:>='${thirtyDaysAgo.toISOString()}'") {
            edges {
              node {
                id
                createdAt
                lineItems(first: 50) {
                  edges {
                    node {
                      quantity
                      variant {
                        product {
                          id
                          title
                        }
                      }
                    }
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
