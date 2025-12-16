import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HOKO_BASE_URL = 'https://hoko.com.co/api';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAuthToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const email = Deno.env.get('HOKO_EMAIL');
  const password = Deno.env.get('HOKO_PASSWORD');

  if (!email || !password) {
    throw new Error('Missing HOKO_EMAIL or HOKO_PASSWORD environment variables');
  }

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

  cachedToken = data.token || data.access_token;
  // Cache for 6 days (token typically expires in 1 week)
  tokenExpiry = Date.now() + (6 * 24 * 60 * 60 * 1000);

  console.log('Successfully authenticated with Hoko');
  return cachedToken!;
}

async function hokoRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
  const token = await getAuthToken();
  
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
    cachedToken = null;
    tokenExpiry = 0;
    return hokoRequest(endpoint, method, body);
  }

  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, params } = await req.json();
    console.log(`Hoko API request: ${endpoint}`, params);

    let result;

    switch (endpoint) {
      case 'store':
        result = await hokoRequest('/member/store');
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
          const ordersResponse = await hokoRequest(`/member/order${queryString}`);
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
              const orderDetail = await hokoRequest(`/member/order/${order.id}`);
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
        result = await hokoRequest(`/member/order/${params.orderId}`);
        break;

      case 'products':
        // Correct endpoint: /member/product/list
        result = await hokoRequest('/member/product/list');
        break;

      case 'products-with-stock':
        // Correct endpoint: /member/product/list-with-stock
        result = await hokoRequest('/member/product/list-with-stock');
        break;

      case 'product-detail':
        if (!params?.productId) {
          throw new Error('Product ID is required');
        }
        // Correct endpoint: /member/product/detail?id={id}
        result = await hokoRequest(`/member/product/detail?id=${params.productId}`);
        break;

      case 'guides':
        // Correct endpoint: /member/guide
        const guidesParams = params?.page ? `?page=${params.page}` : '';
        result = await hokoRequest(`/member/guide${guidesParams}`, 'POST');
        break;

      case 'shared-stock':
        // Correct endpoint: /member/shared_stock
        let stockParams = '?';
        if (params?.search) stockParams += `search=${encodeURIComponent(params.search)}&`;
        if (params?.category) stockParams += `category=${params.category}&`;
        if (params?.sortBy) stockParams += `sortBy=${params.sortBy}&`;
        result = await hokoRequest(`/member/shared_stock${stockParams}`);
        break;

      case 'liquidaciones':
        // Fetch liquidaciones (settlements) with pagination
        const liquidacionesPage = params?.page || 1;
        let liquidacionesQuery = `?page=${liquidacionesPage}`;
        if (params?.start_date) {
          liquidacionesQuery += `&start_date=${params.start_date}`;
        }
        if (params?.end_date) {
          liquidacionesQuery += `&end_date=${params.end_date}`;
        }
        console.log(`Fetching liquidaciones: /member/liquidacion${liquidacionesQuery}`);
        result = await hokoRequest(`/member/liquidacion${liquidacionesQuery}`);
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
