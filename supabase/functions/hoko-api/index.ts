import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HOKO_BASE_URL = 'https://hoko.com.co/api';

// Cache tokens per user
const tokenCache = new Map<string, { token: string; expiry: number }>();

async function getHokoCredentials(userId: string, serviceClient: any): Promise<{ email: string; password: string } | null> {
  try {
    const { data, error } = await serviceClient
      .from('user_integrations')
      .select('config')
      .eq('user_id', userId)
      .eq('integration_type', 'hoko')
      .eq('is_active', true)
      .single();
    
    if (error || !data?.config) {
      console.log('No Hoko integration found for user:', userId);
      return null;
    }
    
    const config = data.config as { email?: string; password?: string };
    if (config.email && config.password) {
      return { email: config.email, password: config.password };
    }
    
    return null;
  } catch (e) {
    console.error('Error fetching user Hoko credentials:', e);
    return null;
  }
}

async function getAuthToken(userId: string, serviceClient: any): Promise<string | null> {
  const cacheKey = userId;
  const cached = tokenCache.get(cacheKey);
  
  // Check if we have a valid cached token
  if (cached && Date.now() < cached.expiry) {
    return cached.token;
  }

  // Get user-specific credentials
  const userCreds = await getHokoCredentials(userId, serviceClient);
  if (!userCreds) {
    // User has no Hoko integration
    console.log('No Hoko integration found for user:', userId);
    return null;
  }

  const { email, password } = userCreds;
  console.log('Using user-specific Hoko credentials for user:', userId);

  console.log('Authenticating with Hoko API...');

  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);

  const response = await fetch(`${HOKO_BASE_URL}/login`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Hoko login failed:', errorText);
    throw new Error(`Hoko authentication failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.message || 'Authentication failed');
  }

  const token = data.token || data.access_token;
  // Cache for 6 days (token typically expires in 1 week)
  tokenCache.set(cacheKey, { 
    token, 
    expiry: Date.now() + (6 * 24 * 60 * 60 * 1000) 
  });

  console.log('Successfully authenticated with Hoko');
  return token;
}

async function hokoRequest(endpoint: string, userId: string, serviceClient: any, method: string = 'GET', body?: any): Promise<any> {
  const token = await getAuthToken(userId, serviceClient);
  
  // If token is null, user doesn't have Hoko integration
  if (token === null) {
    return { noIntegration: true, data: [] };
  }
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };

  if (body && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${HOKO_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  // Check if token expired
  if (data.code === 'LOGIN_EXPIRED') {
    console.log('Token expired, re-authenticating...');
    tokenCache.delete(userId);
    return hokoRequest(endpoint, userId, serviceClient, method, body);
  }

  return data;
}

serve(async (req) => {
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

    const { endpoint, userId: targetUserId, params } = await req.json();
    
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
    
    console.log(`Hoko API request: ${endpoint}, effectiveUserId: ${effectiveUserId}`, params);

    // Create service client for accessing user integrations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    let result;

    switch (endpoint) {
      case 'store':
        result = await hokoRequest('/member/store', effectiveUserId, serviceClient);
        break;

      case 'orders':
        // Fetch all pages of orders with optional date filters
        const allOrders: any[] = [];
        let currentPage = params?.page || 1;
        let hasMorePages = true;
        const maxPages = 10; // Safety limit
        let pagesLoaded = 0;
        let paginationInfo: any = {};
        
        // Build query params including date filters
        const buildOrdersQuery = (page: number) => {
          let query = `?page=${page}`;
          if (params?.start_date) {
            query += `&start_date=${params.start_date}`;
          }
          if (params?.end_date) {
            query += `&end_date=${params.end_date}`;
          }
          return query;
        };
        
        while (hasMorePages && pagesLoaded < maxPages) {
          const queryString = buildOrdersQuery(currentPage);
          console.log(`Fetching orders with query: /member/order${queryString}`);
          const ordersResponse = await hokoRequest(`/member/order${queryString}`, effectiveUserId, serviceClient);
          paginationInfo = {
            current_page: ordersResponse.current_page,
            last_page: ordersResponse.last_page,
            total: ordersResponse.total
          };
          
          if (ordersResponse?.data && Array.isArray(ordersResponse.data)) {
            allOrders.push(...ordersResponse.data);
          }
          
          pagesLoaded++;
          if (currentPage >= (ordersResponse.last_page || 1)) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        }
        
        console.log(`Loaded ${allOrders.length} orders from ${pagesLoaded} pages (date filter: ${params?.start_date || 'none'} to ${params?.end_date || 'none'})`);
        
        // Fetch full details for each order to get customer, items, total, guide info
        const ordersWithDetails = await Promise.all(
          allOrders.map(async (order: any) => {
            try {
              const orderDetail = await hokoRequest(`/member/order/${order.id}`, effectiveUserId, serviceClient);
              // Log first order detail to see structure
              if (allOrders.indexOf(order) === 0) {
                console.log('Order detail structure:', JSON.stringify(orderDetail, null, 2).substring(0, 2000));
              }
              return { ...order, ...orderDetail };
            } catch (e) {
              console.error(`Failed to fetch order ${order.id} details:`, e);
              return order;
            }
          })
        );
        
        result = { 
          ...paginationInfo,
          data: ordersWithDetails,
          total_loaded: ordersWithDetails.length
        };
        break;

      case 'order-detail':
        if (!params?.orderId) {
          throw new Error('Order ID is required');
        }
        // Correct endpoint: /member/order/{id}
        result = await hokoRequest(`/member/order/${params.orderId}`, effectiveUserId, serviceClient);
        break;

      case 'products':
        // Correct endpoint: /member/product/list
        result = await hokoRequest('/member/product/list', effectiveUserId, serviceClient);
        break;

      case 'products-with-stock':
        // Correct endpoint: /member/product/list-with-stock
        result = await hokoRequest('/member/product/list-with-stock', effectiveUserId, serviceClient);
        break;

      case 'product-detail':
        if (!params?.productId) {
          throw new Error('Product ID is required');
        }
        // Correct endpoint: /member/product/detail?id={id}
        result = await hokoRequest(`/member/product/detail?id=${params.productId}`, effectiveUserId, serviceClient);
        break;

      case 'guides':
        // Correct endpoint: /member/guide
        const guidesParams = params?.page ? `?page=${params.page}` : '';
        result = await hokoRequest(`/member/guide${guidesParams}`, effectiveUserId, serviceClient, 'POST');
        break;

      case 'shared-stock':
        // Correct endpoint: /member/shared_stock
        let stockParams = '?';
        if (params?.search) stockParams += `search=${encodeURIComponent(params.search)}&`;
        if (params?.category) stockParams += `category=${params.category}&`;
        if (params?.sortBy) stockParams += `sortBy=${params.sortBy}&`;
        result = await hokoRequest(`/member/shared_stock${stockParams}`, effectiveUserId, serviceClient);
        break;

      case 'liquidaciones':
        // Try multiple possible endpoints for liquidaciones/settlements
        const liquidacionesPage = params?.page || 1;
        let liquidacionesQuery = `?page=${liquidacionesPage}`;
        if (params?.start_date) {
          liquidacionesQuery += `&start_date=${params.start_date}`;
        }
        if (params?.end_date) {
          liquidacionesQuery += `&end_date=${params.end_date}`;
        }
        
        // Try different possible endpoint names
        const possibleEndpoints = [
          `/member/liquidaciones${liquidacionesQuery}`,
          `/member/settlement${liquidacionesQuery}`,
          `/member/settlements${liquidacionesQuery}`,
          `/member/balance${liquidacionesQuery}`,
          `/member/payments${liquidacionesQuery}`,
        ];
        
        let liquidacionesResult = null;
        for (const ep of possibleEndpoints) {
          console.log(`Trying liquidaciones endpoint: ${ep}`);
          try {
            const response = await hokoRequest(ep, effectiveUserId, serviceClient);
            if (!response.exception && !response.message?.includes('could not be found')) {
              console.log(`Found working endpoint: ${ep}`);
              liquidacionesResult = response;
              break;
            }
          } catch (e) {
            console.log(`Endpoint ${ep} failed, trying next...`);
          }
        }
        
        if (!liquidacionesResult) {
          console.log('No liquidaciones endpoint found, returning empty data');
          result = { 
            data: [], 
            message: 'Endpoint de liquidaciones não disponível na API Hoko. Verifique com o suporte da Hoko qual é o endpoint correto.',
            endpoints_tried: possibleEndpoints 
          };
        } else {
          result = liquidacionesResult;
        }
        break;

      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    console.log(`Hoko API response for ${endpoint}:`, JSON.stringify(result).substring(0, 500));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Hoko API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
