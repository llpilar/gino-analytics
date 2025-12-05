import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VTURB_API_BASE = 'https://analytics.vturb.com.br/api/v1';

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

    const { endpoint, videoId, startDate, endDate } = await req.json();
    
    console.log(`VTurb API request - endpoint: ${endpoint}, videoId: ${videoId || 'all'}, dates: ${startDate} to ${endDate}`);

    let apiUrl = VTURB_API_BASE;
    const params = new URLSearchParams();
    
    if (videoId) {
      params.append('video_id', videoId);
    }
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }

    switch (endpoint) {
      case 'overview':
        // Get general stats
        apiUrl = `${VTURB_API_BASE}/stats?${params.toString()}`;
        break;
      case 'plays':
        apiUrl = `${VTURB_API_BASE}/plays?${params.toString()}`;
        break;
      case 'views':
        apiUrl = `${VTURB_API_BASE}/views?${params.toString()}`;
        break;
      case 'retention':
        apiUrl = `${VTURB_API_BASE}/retention?${params.toString()}`;
        break;
      case 'videos':
        apiUrl = `${VTURB_API_BASE}/videos`;
        break;
      default:
        apiUrl = `${VTURB_API_BASE}/stats?${params.toString()}`;
    }

    console.log(`Fetching VTurb data from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vturbApiKey}`,
        'Content-Type': 'application/json',
      },
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
    console.log('VTurb data fetched successfully');

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
