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
        // Correct endpoint: /member/order (not /member/orders)
        const ordersParams = params?.page ? `?page=${params.page}` : '';
        const ordersListResponse = await hokoRequest(`/member/order${ordersParams}`);
        
        // Fetch full details for each order to get customer, items, total, guide info
        if (ordersListResponse?.data && Array.isArray(ordersListResponse.data)) {
          const ordersWithDetails = await Promise.all(
            ordersListResponse.data.slice(0, 15).map(async (order: any) => {
              try {
                const orderDetail = await hokoRequest(`/member/order/${order.id}`);
                return { ...order, ...orderDetail };
              } catch (e) {
                console.error(`Failed to fetch order ${order.id} details:`, e);
                return order;
              }
            })
          );
          result = { ...ordersListResponse, data: ordersWithDetails };
        } else {
          result = ordersListResponse;
        }
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
