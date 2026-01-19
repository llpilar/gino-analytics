import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get access token using service account
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Encode header and claim
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${headerB64}.${claimB64}`;

  // Import private key and sign
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error('Token exchange error:', tokenData);
    throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

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

    const { userId: targetUserId } = await req.json();
    
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
    
    let serviceAccountJson: string | undefined;
    let propertyId: string | undefined;
    
    // Fetch credentials from user_integrations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: integration, error } = await serviceClient
      .from('user_integrations')
      .select('config')
      .eq('user_id', effectiveUserId)
      .eq('integration_type', 'ga4')
      .eq('is_active', true)
      .maybeSingle();
    
    if (!error && integration?.config) {
      serviceAccountJson = integration.config.service_account_json;
      propertyId = integration.config.property_id;
      console.log(`Using GA4 credentials for user ${effectiveUserId}`);
    } else {
      // User has no GA4 integration - return zero
      console.log(`No GA4 integration found for user ${effectiveUserId}, returning zero`);
      return new Response(
        JSON.stringify({ 
          count: 0,
          period: 'last5Minutes',
          timestamp: new Date().toISOString(),
          noIntegration: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!serviceAccountJson) {
      console.error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
      throw new Error('Google service account not configured');
    }

    if (!propertyId) {
      console.error('Missing GA4_PROPERTY_ID');
      throw new Error('GA4 Property ID not configured');
    }

    console.log(`Fetching GA4 real-time data for property: ${propertyId}`);

    // Get access token
    const accessToken = await getAccessToken(serviceAccountJson);
    console.log('Successfully obtained access token');

    // Fetch real-time active users from GA4 Data API
    const ga4Response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: [
            { name: 'activeUsers' }
          ],
          minuteRanges: [
            { name: 'last5Minutes', startMinutesAgo: 5, endMinutesAgo: 0 }
          ]
        }),
      }
    );

    const ga4Data = await ga4Response.json();

    if (!ga4Response.ok) {
      console.error('GA4 API error:', ga4Data);
      throw new Error(`GA4 API error: ${JSON.stringify(ga4Data)}`);
    }

    console.log('GA4 response:', JSON.stringify(ga4Data));

    // Extract active users count
    let activeUsers = 0;
    if (ga4Data.rows && ga4Data.rows.length > 0) {
      activeUsers = parseInt(ga4Data.rows[0].metricValues?.[0]?.value || '0', 10);
    }

    console.log(`Active users in last 5 minutes: ${activeUsers}`);

    return new Response(
      JSON.stringify({ 
        count: activeUsers,
        period: 'last5Minutes',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in ga4-realtime function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, count: 0 }),
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
