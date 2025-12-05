import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory storage for active visitors (resets on function cold start)
const activeVisitors = new Map<string, number>();

// Clean up stale visitors (older than 30 seconds)
const cleanupStaleVisitors = () => {
  const now = Date.now();
  const staleThreshold = 30000; // 30 seconds
  
  for (const [visitorId, timestamp] of activeVisitors.entries()) {
    if (now - timestamp > staleThreshold) {
      activeVisitors.delete(visitorId);
    }
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const visitorId = url.searchParams.get('visitorId') || req.headers.get('x-visitor-id');

    // Clean up stale visitors before processing
    cleanupStaleVisitors();

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const id = body.visitorId || visitorId || crypto.randomUUID();
      
      if (body.action === 'join' || action === 'join') {
        activeVisitors.set(id, Date.now());
        console.log(`Visitor joined: ${id}. Total: ${activeVisitors.size}`);
      } else if (body.action === 'leave' || action === 'leave') {
        activeVisitors.delete(id);
        console.log(`Visitor left: ${id}. Total: ${activeVisitors.size}`);
      } else if (body.action === 'heartbeat' || action === 'heartbeat') {
        activeVisitors.set(id, Date.now());
      }
    }

    const count = activeVisitors.size;
    console.log(`Current visitor count: ${count}`);

    return new Response(
      JSON.stringify({ 
        count,
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
    console.error('Error in visitor-count function:', errorMessage);
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
