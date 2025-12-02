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

    const { endpoint, customDates } = await req.json();
    
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
    } else if (endpoint === 'revenue-yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      console.log(`[PAGINAÇÃO ATIVA] Buscando pedidos de ontem: ${yesterdayStr} até ${today}`);
      
      // Usar paginação para pegar todos os pedidos de ontem
      let allOrders: any[] = [];
      let hasNextPage = true;
      let cursor = null;
      
      while (hasNextPage && allOrders.length < 10000) {
        const paginationQuery: string = cursor 
          ? `, after: "${cursor}"` 
          : '';
        
        const paginatedQuery: string = `
          {
            orders(first: 250, sortKey: CREATED_AT, reverse: true, query: "created_at:>='${yesterdayStr}' AND created_at:<'${today}'"${paginationQuery}) {
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
        
        console.log(`[PAGINAÇÃO] Página carregada: ${orders.length} pedidos. Total ontem: ${allOrders.length}. hasNextPage: ${hasNextPage}`);
      }
      
      console.log(`Total de pedidos de ontem: ${allOrders.length}`);
      
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
    } else if (endpoint === 'revenue-3days' || endpoint === 'revenue-7days' || endpoint === 'revenue-15days' || endpoint === 'revenue-30days' || endpoint === 'revenue-today') {
      let startDateStr: string;
      let endDateStr: string;
      
      // Se houver datas customizadas, usar elas
      if (customDates && customDates.from && customDates.to) {
        startDateStr = new Date(customDates.from).toISOString().split('T')[0];
        endDateStr = new Date(customDates.to).toISOString().split('T')[0];
        console.log(`Buscando pedidos de período customizado: ${startDateStr} até ${endDateStr}`);
      } else {
        // Caso contrário, usar os períodos predefinidos
        let daysAgo = 0;
        
        if (endpoint === 'revenue-today') daysAgo = 0;
        else if (endpoint === 'revenue-3days') daysAgo = 3;
        else if (endpoint === 'revenue-7days') daysAgo = 7;
        else if (endpoint === 'revenue-15days') daysAgo = 15;
        else if (endpoint === 'revenue-30days') daysAgo = 30;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        startDateStr = startDate.toISOString().split('T')[0];
        endDateStr = new Date().toISOString().split('T')[0];
        
        console.log(`Buscando pedidos dos últimos ${daysAgo} dias a partir de ${startDateStr}`);
      }
      
      // Precisamos fazer paginação para pegar todos os pedidos
      let allOrders: any[] = [];
      let hasNextPage = true;
      let cursor = null;
      
      while (hasNextPage && allOrders.length < 10000) { // Limite de segurança aumentado
        const paginationQuery: string = cursor 
          ? `, after: "${cursor}"` 
          : '';
        
        // Construir query com range de datas se houver endDate
        const dateQuery = customDates && customDates.to
          ? `created_at:>='${startDateStr}' AND created_at:<='${endDateStr}'`
          : `created_at:>='${startDateStr}'`;
        
        const paginatedQuery: string = `
          {
            orders(first: 250, sortKey: CREATED_AT, reverse: true, query: "${dateQuery}"${paginationQuery}) {
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
      
      console.log(`Total de pedidos encontrados: ${allOrders.length}`);
      
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
      // Query para pegar vendas dos últimos 30 dias com detalhes dos produtos e variantes
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
                        id
                        title
                        sku
                        price
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
    
    // Se não tiver graphqlQuery definido (foi processado com paginação acima), não fazer nada mais
    if (!graphqlQuery) {
      return new Response(
        JSON.stringify({ error: 'Query já foi processada acima' }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Remover bloco duplicado - revenue-today agora é processado apenas no bloco principal acima
    // (linhas 152-256)

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
