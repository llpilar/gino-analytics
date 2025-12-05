import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const vturbApiKey = Deno.env.get('VTURB_API_KEY');
    
    if (!vturbApiKey) {
      console.error('VTURB_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'VTurb API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { endpoint, playerId, startDate, endDate } = await req.json();
    
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
        // Get total events (started, viewed, finished)
        apiUrl = `${VTURB_API_BASE}/events/total_by_company`;
        body.events = ['started', 'viewed', 'finished'];
        break;
      case 'players':
        // Get stats by player
        apiUrl = `${VTURB_API_BASE}/events/total_by_company_players`;
        body.events = ['started', 'viewed', 'finished'];
        break;
      case 'stats_by_day':
        // Get daily stats
        apiUrl = `${VTURB_API_BASE}/conversions/stats_by_day`;
        break;
      case 'retention':
        // Get video timed retention data
        apiUrl = `${VTURB_API_BASE}/conversions/video_timed`;
        break;
      default:
        apiUrl = `${VTURB_API_BASE}/events/total_by_company`;
        body.events = ['started', 'viewed', 'finished'];
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
    console.log('VTurb data fetched successfully:', JSON.stringify(data).slice(0, 200));

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
