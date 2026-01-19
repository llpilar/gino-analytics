import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Parse state to get redirect URL and user ID
    let redirectUrl: string | null = null;
    let userId: string | null = null;
    
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        redirectUrl = stateData.redirectUrl || null;
        userId = stateData.userId || null;
      } catch {
        // Fallback for legacy state format (just redirect URL)
        redirectUrl = decodeURIComponent(state);
      }
    }

    if (error) {
      console.error('Facebook OAuth error:', error, errorDescription);
      const errorRedirect = redirectUrl || '/configuracoes';
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${errorRedirect}?fb_error=${encodeURIComponent(errorDescription || error)}` }
      });
    }

    if (!code) {
      console.error('No code received from Facebook');
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectUrl || '/configuracoes'}?fb_error=No+code+received` }
      });
    }

    if (!userId) {
      console.error('No user ID in state');
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectUrl || '/configuracoes'}?fb_error=Authentication+session+expired.+Please+try+again.` }
      });
    }

    const appId = Deno.env.get('FACEBOOK_APP_ID');
    const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!appId || !appSecret) {
      throw new Error('Facebook app credentials not configured');
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/facebook-oauth-callback`;

    // Exchange code for access token
    console.log('Exchanging code for access token...');
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&client_secret=${appSecret}` +
      `&code=${code}`
    );

    const tokenData = await tokenResponse.json();
    console.log('Token response received');

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectUrl || '/configuracoes'}?fb_error=${encodeURIComponent(tokenData.error.message)}` }
      });
    }

    const shortLivedToken = tokenData.access_token;

    // Exchange for long-lived token
    console.log('Exchanging for long-lived token...');
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&fb_exchange_token=${shortLivedToken}`
    );

    const longLivedData = await longLivedResponse.json();

    if (longLivedData.error) {
      console.error('Long-lived token error:', longLivedData.error);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectUrl || '/configuracoes'}?fb_error=${encodeURIComponent(longLivedData.error.message)}` }
      });
    }

    const accessToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in || 5184000; // Default 60 days
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Get Facebook user info
    console.log('Fetching Facebook user info...');
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`
    );
    const userData = await userResponse.json();

    if (userData.error) {
      console.error('User info error:', userData.error);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectUrl || '/configuracoes'}?fb_error=${encodeURIComponent(userData.error.message)}` }
      });
    }

    console.log('Facebook user:', userData.name, userData.id);
    console.log('Token expires at:', expiresAt);

    // Store the connection directly in the database using service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: upsertError } = await supabase
      .from('facebook_connections')
      .upsert({
        user_id: userId,
        access_token: accessToken,
        facebook_user_id: userData.id,
        facebook_user_name: userData.name,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Database upsert error:', upsertError);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectUrl || '/configuracoes'}?fb_error=${encodeURIComponent('Failed to save connection. Please try again.')}` }
      });
    }

    console.log('Facebook connection saved successfully for user:', userId);

    // Redirect to settings page with success indicator
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${redirectUrl || '/configuracoes'}?fb_success=true&fb_name=${encodeURIComponent(userData.name)}` }
    });
  } catch (error) {
    console.error('Error in facebook-oauth-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(null, {
      status: 302,
      headers: { 'Location': `/configuracoes?fb_error=${encodeURIComponent(errorMessage)}` }
    });
  }
});
