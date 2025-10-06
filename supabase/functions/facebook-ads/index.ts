import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user session from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get Facebook access token from user's provider token
    const { data: sessionData } = await supabase.auth.getSession();
    const facebookToken = sessionData.session?.provider_token;

    if (!facebookToken) {
      return new Response(
        JSON.stringify({ error: 'No Facebook token found. Please login with Facebook.' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { endpoint, startDate, endDate } = await req.json();

    console.log(`Fetching Facebook Ads data: ${endpoint}`);

    let url: string;
    let fields: string;

    switch (endpoint) {
      case 'accounts':
        // Get ad accounts
        url = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,currency,account_status&access_token=${facebookToken}`;
        break;
      
      case 'insights':
        // Get insights for an account (need to pass account_id in request)
        const { accountId } = await req.json();
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];
        
        fields = 'spend,impressions,clicks,ctr,cpc,cpm,reach,actions,action_values';
        url = `https://graph.facebook.com/v18.0/${accountId}/insights?fields=${fields}&time_range={'since':'${start}','until':'${end}'}&access_token=${facebookToken}`;
        break;
      
      case 'campaigns':
        // Get campaigns for an account
        const { accountId: campaignAccountId } = await req.json();
        fields = 'id,name,status,objective,daily_budget,lifetime_budget';
        url = `https://graph.facebook.com/v18.0/${campaignAccountId}/campaigns?fields=${fields}&access_token=${facebookToken}`;
        break;
      
      default:
        throw new Error('Invalid endpoint');
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Facebook API error:', errorData);
      throw new Error(`Facebook API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Facebook data received:', JSON.stringify(data).substring(0, 200));

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in facebook-ads function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
