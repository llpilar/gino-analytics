import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get('FACEBOOK_APP_ID');
    
    if (!appId) {
      throw new Error('FACEBOOK_APP_ID not configured');
    }

    const { redirectUrl } = await req.json();
    
    // Get the Supabase URL for the callback
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const callbackUrl = `${supabaseUrl}/functions/v1/facebook-oauth-callback`;
    
    // State contains the redirect URL to return to after auth
    const state = encodeURIComponent(redirectUrl || 'https://lovableproject.com');

    // Facebook OAuth URL with required permissions
    // Note: For development mode apps, only basic permissions work
    // For ads_read/ads_management, the app needs Marketing API product enabled
    const scopes = [
      'public_profile',
      'email'
    ].join(',');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&scope=${scopes}` +
      `&state=${state}` +
      `&response_type=code`;

    console.log('Generated Facebook OAuth URL');

    return new Response(
      JSON.stringify({ authUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in facebook-oauth-start:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
