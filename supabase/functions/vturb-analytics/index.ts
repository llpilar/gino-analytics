import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VTURB_API_BASE = 'https://analytics.vturb.net';

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

    const { endpoint, playerId, startDate, endDate, userId: targetUserId } = await req.json();
    
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
    
    let vturbApiKey: string | undefined;
    
    // Fetch credentials from user_integrations using service role
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: integration, error } = await serviceClient
      .from('user_integrations')
      .select('config')
      .eq('user_id', effectiveUserId)
      .eq('integration_type', 'vturb')
      .eq('is_active', true)
      .maybeSingle();
    
    if (!error && integration?.config?.api_key) {
      vturbApiKey = integration.config.api_key;
      console.log(`Using VTurb credentials for user ${effectiveUserId}`);
    } else {
      // User has no VTurb integration - return empty data
      console.log(`No VTurb integration found for user ${effectiveUserId}, returning empty data`);
      
      // Return appropriate empty response based on endpoint
      if (endpoint === 'list_players') {
        return new Response(
          JSON.stringify([]),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({
          total_viewed: 0,
          total_viewed_device_uniq: 0,
          total_started: 0,
          total_started_device_uniq: 0,
          total_finished: 0,
          total_finished_device_uniq: 0,
          engagement_rate: 0,
          play_rate: 0,
          total_clicked: 0,
          total_clicked_device_uniq: 0,
          over_pitch_rate: 0,
          overall_conversion_rate: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!vturbApiKey) {
      console.error('VTURB_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'VTurb API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`VTurb API request - endpoint: ${endpoint}, playerId: ${playerId || 'all'}, dates: ${startDate} to ${endDate}`);

    const vturbHeaders = {
      'X-Api-Token': vturbApiKey,
      'X-Api-Version': 'v1',
      'Content-Type': 'application/json',
    };

    let apiUrl = VTURB_API_BASE;
    let body: Record<string, unknown> = {
      timezone: 'America/Sao_Paulo',
    };
    
    // Format dates with time for endpoints that require it
    const formatDateWithTime = (date: string, isEndDate: boolean) => {
      if (isEndDate) {
        return `${date} 23:59:59`;
      }
      return `${date} 00:00:00`;
    };
    
    if (startDate) {
      body.start_date = startDate;
    }
    if (endDate) {
      body.end_date = endDate;
    }
    if (playerId) {
      body.player_id = playerId;
    }

    switch (endpoint) {
      case 'overview':
        // Use sessions/stats for complete metrics matching VTurb dashboard
        if (playerId) {
          apiUrl = `${VTURB_API_BASE}/sessions/stats`;
          // sessions/stats requires datetime format
          if (startDate) body.start_date = formatDateWithTime(startDate, false);
          if (endDate) body.end_date = formatDateWithTime(endDate, true);
        } else {
          // Without player_id, use events/total_by_company
          apiUrl = `${VTURB_API_BASE}/events/total_by_company`;
          body.events = ['started', 'viewed', 'finished'];
        }
        break;
      case 'players':
        // Get stats by player - returns list of players with their IDs and stats
        apiUrl = `${VTURB_API_BASE}/events/total_by_company_players`;
        body.events = ['started', 'viewed', 'finished'];
        break;
      case 'list_players':
        // Get list of players using total_by_company_players (list_company_players returns 404)
        apiUrl = `${VTURB_API_BASE}/events/total_by_company_players`;
        body.events = ['started'];
        // Need to provide a date range for this endpoint
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        body.start_date = thirtyDaysAgo.toISOString().split('T')[0];
        body.end_date = today.toISOString().split('T')[0];
        break;
      case 'stats_by_day':
        // Get daily stats
        apiUrl = `${VTURB_API_BASE}/sessions/stats_by_day`;
        if (startDate) body.start_date = formatDateWithTime(startDate, false);
        if (endDate) body.end_date = formatDateWithTime(endDate, true);
        break;
      case 'retention':
        // Get video timed retention data
        apiUrl = `${VTURB_API_BASE}/conversions/video_timed`;
        // retention endpoint requires datetime format
        if (startDate) body.start_date = formatDateWithTime(startDate, false);
        if (endDate) body.end_date = formatDateWithTime(endDate, true);
        break;
      default:
        apiUrl = `${VTURB_API_BASE}/sessions/stats`;
        if (startDate) body.start_date = formatDateWithTime(startDate, false);
        if (endDate) body.end_date = formatDateWithTime(endDate, true);
    }

    console.log(`Fetching VTurb data from: ${apiUrl}`);
    console.log(`Request body: ${JSON.stringify(body)}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: vturbHeaders,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`VTurb API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `VTurb API error: ${response.status}`,
          details: errorText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('VTurb data fetched successfully:', JSON.stringify(data));

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in vturb-analytics function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
