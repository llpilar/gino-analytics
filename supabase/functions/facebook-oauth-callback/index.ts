import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Get the redirect URL from state
    const redirectUrl = state ? decodeURIComponent(state) : null;

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

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    // Try to get user from the state (we'll pass it through the flow)
    // For now, we need to use a different approach since callback doesn't have auth
    // We'll use the service role to store with a temporary identifier and update later
    
    // Actually, we need to handle this differently - the callback comes from Facebook redirect
    // So we need to extract user info from somewhere else
    // Let's use a simpler approach: store the connection with facebook_user_id as key
    // and update with user_id later when they load the settings page

    // For now, let's create a temporary entry that will be claimed
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store the token temporarily using Facebook user ID
    // We'll need a way to associate this with the logged-in user
    // For this demo, we'll use a cookie or localStorage approach
    
    console.log('Facebook user:', userData.name, userData.id);
    console.log('Token expires at:', expiresAt);

    // Create HTML page that stores the token and redirects
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Conectando Facebook...</title>
          <script>
            // Store token data temporarily
            localStorage.setItem('fb_pending_connection', JSON.stringify({
              access_token: '${accessToken}',
              facebook_user_id: '${userData.id}',
              facebook_user_name: '${userData.name}',
              token_expires_at: '${expiresAt}'
            }));
            // Redirect to settings page
            window.location.href = '${redirectUrl || '/configuracoes'}?fb_success=true';
          </script>
        </head>
        <body>
          <p>Conectando sua conta do Facebook...</p>
        </body>
      </html>
    `;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
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
