import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Known bot user agents
const BOT_PATTERNS = [
  /facebookexternalhit/i,
  /facebot/i,
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /sogou/i,
  /exabot/i,
  /facebot/i,
  /ia_archiver/i,
  /crawler/i,
  /spider/i,
  /bot/i,
  /semrush/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
];

function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, userAgent, language } = await req.json();
    
    console.log(`Processing redirect for slug: ${slug}`);
    console.log(`User Agent: ${userAgent}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the link
    const { data: link, error } = await supabase
      .from("cloaked_links")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !link) {
      console.log("Link not found or inactive");
      return new Response(
        JSON.stringify({ error: "Link not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Increment click count
    await supabase
      .from("cloaked_links")
      .update({ clicks_count: link.clicks_count + 1 })
      .eq("id", link.id);

    // Check if it's a bot
    const isBotRequest = isBot(userAgent || "");
    if (link.block_bots && isBotRequest) {
      console.log("Bot detected, redirecting to safe URL");
      return new Response(
        JSON.stringify({ redirectUrl: link.safe_url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check device type
    const deviceType = getDeviceType(userAgent || "");
    if (link.allowed_devices && link.allowed_devices.length > 0) {
      if (!link.allowed_devices.includes(deviceType)) {
        console.log(`Device ${deviceType} not allowed, redirecting to safe URL`);
        return new Response(
          JSON.stringify({ redirectUrl: link.safe_url }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get country from request headers (if available via CDN)
    const cfCountry = req.headers.get("cf-ipcountry") || 
                      req.headers.get("x-vercel-ip-country") ||
                      req.headers.get("x-country-code");
    
    if (cfCountry) {
      // Check allowed countries
      if (link.allowed_countries && link.allowed_countries.length > 0) {
        if (!link.allowed_countries.includes(cfCountry)) {
          console.log(`Country ${cfCountry} not allowed, redirecting to safe URL`);
          return new Response(
            JSON.stringify({ redirectUrl: link.safe_url }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Check blocked countries
      if (link.blocked_countries && link.blocked_countries.length > 0) {
        if (link.blocked_countries.includes(cfCountry)) {
          console.log(`Country ${cfCountry} blocked, redirecting to safe URL`);
          return new Response(
            JSON.stringify({ redirectUrl: link.safe_url }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // All checks passed, redirect to target URL
    console.log("All checks passed, redirecting to target URL");
    return new Response(
      JSON.stringify({ redirectUrl: link.target_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing redirect:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});