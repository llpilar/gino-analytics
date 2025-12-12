import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user's Facebook connection
    const { data: connection, error: connError } = await supabase
      .from('facebook_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No Facebook connection found', needsConnection: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token expired', needsReconnection: true }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = connection.access_token;
    const { endpoint, accountId, startDate, endDate } = await req.json();

    console.log('Facebook User Ads request:', { endpoint, accountId, userId: user.id });

    let apiUrl: string;

    switch (endpoint) {
      case 'accounts':
        // Get all ad accounts the user has access to
        apiUrl = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,currency,account_status,business_name&access_token=${accessToken}`;
        break;

      case 'business_managers':
        // Get all Business Managers
        apiUrl = `https://graph.facebook.com/v18.0/me/businesses?fields=id,name,created_time&access_token=${accessToken}`;
        break;

      case 'bm_ad_accounts':
        // Get ad accounts from a specific Business Manager
        if (!accountId) throw new Error('Business Manager ID required');
        apiUrl = `https://graph.facebook.com/v18.0/${accountId}/owned_ad_accounts?fields=id,name,currency,account_status&access_token=${accessToken}`;
        break;

      case 'insights':
        if (!accountId) throw new Error('Account ID required');
        const insightFields = 'spend,impressions,clicks,ctr,cpc,cpm,reach,actions,action_values';
        const timeRange = startDate && endDate 
          ? `&time_range={"since":"${startDate}","until":"${endDate}"}`
          : '';
        apiUrl = `https://graph.facebook.com/v18.0/${accountId}/insights?fields=${insightFields}${timeRange}&access_token=${accessToken}`;
        break;

      case 'campaigns':
        if (!accountId) throw new Error('Account ID required');
        apiUrl = `https://graph.facebook.com/v18.0/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${accessToken}`;
        break;

      default:
        throw new Error(`Invalid endpoint: ${endpoint}`);
    }

    console.log('Fetching from Facebook API...');
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error('Facebook API error:', data.error);
      
      // Check if it's a permission error
      if (data.error.code === 200 || data.error.code === 190) {
        return new Response(
          JSON.stringify({ 
            error: data.error.message, 
            needsReconnection: true,
            facebookError: data.error 
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(data.error.message);
    }

    console.log('Facebook API response received successfully');
    return new Response(
      JSON.stringify({ data: data.data || data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in facebook-user-ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
