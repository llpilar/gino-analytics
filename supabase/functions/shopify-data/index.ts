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
      let maxResults = 250;
      
      if (endpoint === 'revenue-3days') {
        daysAgo = 3;
        maxResults = 250;
      } else if (endpoint === 'revenue-7days') {
        daysAgo = 7;
        maxResults = 250;
      } else if (endpoint === 'revenue-15days') {
        daysAgo = 15;
        maxResults = 250;
      } else if (endpoint === 'revenue-30days') {
        daysAgo = 30;
        maxResults = 250; // Shopify limita a 250 por query
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      console.log(`Buscando pedidos dos últimos ${daysAgo} dias a partir de ${startDateStr}`);
      
      graphqlQuery = `
        {
          orders(first: ${maxResults}, sortKey: CREATED_AT, reverse: true, query: "created_at:>='${startDateStr}'") {
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
