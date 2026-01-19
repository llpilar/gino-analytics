import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with user's token to verify authentication
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { endpoint, customDates, userId: targetUserId } = await req.json();
    
    // Determine effective user ID
    let effectiveUserId = user.id;
    
    // If trying to access another user's data, verify admin role
    if (targetUserId && targetUserId !== user.id) {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (roleError || !roleData) {
        console.error('Unauthorized impersonation attempt by user:', user.id, 'for target:', targetUserId);
        throw new Error('Unauthorized: Admin role required for impersonation');
      }
      
      console.log('Admin impersonation authorized:', user.id, 'impersonating:', targetUserId);
      effectiveUserId = targetUserId;
    }
    
    let shopifyAccessToken: string | undefined;
    let shopDomain: string | undefined;
    
    // Fetch credentials from user_integrations using service role
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: integration, error } = await serviceClient
      .from('user_integrations')
      .select('config')
      .eq('user_id', effectiveUserId)
      .eq('integration_type', 'shopify')
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user integration:', error);
    }
    
    if (integration?.config) {
      shopifyAccessToken = integration.config.access_token;
      shopDomain = integration.config.store_domain;
      console.log(`Using Shopify credentials for user ${effectiveUserId}`);
    } else {
      // User has no Shopify integration - return empty data
      console.log(`No Shopify integration found for user ${effectiveUserId}, returning empty data`);
      return new Response(
        JSON.stringify({
          data: {
            orders: { edges: [] },
            products: { edges: [] },
            customers: { edges: [] }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!shopifyAccessToken || !shopDomain) {
      throw new Error('SHOPIFY_ACCESS_TOKEN não configurado');
    }
    
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
      let startDateISO: string;
      let endDateISO: string;
      
      // Se houver datas customizadas, usar elas com timestamps completos
      if (customDates && customDates.from && customDates.to) {
        startDateISO = new Date(customDates.from).toISOString();
        endDateISO = new Date(customDates.to).toISOString();
        console.log(`Buscando pedidos de período customizado: ${startDateISO} até ${endDateISO}`);
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
        startDate.setHours(0, 0, 0, 0);
        startDateISO = startDate.toISOString();
        endDateISO = new Date().toISOString();
        
        console.log(`Buscando pedidos dos últimos ${daysAgo} dias a partir de ${startDateISO}`);
      }
      
      // Precisamos fazer paginação para pegar todos os pedidos
      let allOrders: any[] = [];
      let hasNextPage = true;
      let cursor = null;
      
      while (hasNextPage && allOrders.length < 10000) { // Limite de segurança aumentado
        const paginationQuery: string = cursor 
          ? `, after: "${cursor}"` 
          : '';
        
        // Construir query com range de datas usando timestamps completos
        const dateQuery = customDates && customDates.to
          ? `created_at:>='${startDateISO}' AND created_at:<='${endDateISO}'`
          : `created_at:>='${startDateISO}'`;
        
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
                  name
                  createdAt
                  currentTotalPriceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                  shippingAddress {
                    city
                    provinceCode
                    countryCode
                    country
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
      // Suporte a datas customizadas para filtro de pedidos
      let dateFilter = '';
      if (customDates && customDates.from && customDates.to) {
        const startDateISO = new Date(customDates.from).toISOString();
        const endDateISO = new Date(customDates.to).toISOString();
        dateFilter = `, query: "created_at:>='${startDateISO}' AND created_at:<='${endDateISO}'"`;
        console.log(`Buscando pedidos de ${startDateISO} até ${endDateISO}`);
      }
      
      graphqlQuery = `
        {
          orders(first: 250, sortKey: CREATED_AT, reverse: true${dateFilter}) {
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
                displayFulfillmentStatus
                fulfillmentOrders(first: 5) {
                  edges {
                    node {
                      status
                      deliveryMethod {
                        methodType
                      }
                    }
                  }
                }
                shippingAddress {
                  city
                  provinceCode
                  countryCode
                  country
                  address1
                  zip
                }
                customer {
                  displayName
                  email
                  phone
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
      // Query para pegar vendas com detalhes dos produtos e variantes
      let startDateISO: string;
      let endDateISO: string;
      
      // Se houver datas customizadas, usar elas
      if (customDates && customDates.from && customDates.to) {
        startDateISO = new Date(customDates.from).toISOString();
        endDateISO = new Date(customDates.to).toISOString();
        console.log(`[products-sales] Buscando vendas de ${startDateISO} até ${endDateISO}`);
      } else {
        // Caso contrário, usar os últimos 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        startDateISO = thirtyDaysAgo.toISOString();
        endDateISO = new Date().toISOString();
        console.log(`[products-sales] Buscando vendas dos últimos 30 dias`);
      }
      
      // Usar paginação para pegar todos os pedidos
      let allOrders: any[] = [];
      let hasNextPage = true;
      let cursor = null;
      
      while (hasNextPage && allOrders.length < 5000) {
        const paginationQuery: string = cursor 
          ? `, after: "${cursor}"` 
          : '';
        
        const paginatedQuery: string = `
          {
            orders(first: 250, sortKey: CREATED_AT, reverse: true, query: "created_at:>='${startDateISO}' AND created_at:<='${endDateISO}'"${paginationQuery}) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  id
                  name
                  createdAt
                  lineItems(first: 50) {
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
                          id
                          title
                          sku
                          price
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
        
        console.log(`[products-sales] Página carregada: ${orders.length} pedidos. Total: ${allOrders.length}`);
      }
      
      console.log(`[products-sales] Total de pedidos encontrados: ${allOrders.length}`);
      
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
    } else {
      // Default query - basic orders
      graphqlQuery = `
        {
          orders(first: 50, reverse: true) {
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
    }
    
    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAccessToken,
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error(data.errors[0]?.message || 'GraphQL error');
    }

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
    console.error('Error in shopify-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
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
