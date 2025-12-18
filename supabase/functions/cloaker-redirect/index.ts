import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sophisticated bot detection patterns - includes Google Ads, Facebook, and major crawlers
const BOT_UA_PATTERNS = [
  // Google Ads specific bots (CRITICAL for cloaking)
  /adsbot-google/i, /adsbot/i, /mediapartners-google/i, /googleads/i,
  /google-adwords/i, /google-ads/i, /google-inspectiontool/i,
  /google-safety/i, /google-site-verification/i,
  // Standard Google bots
  /googlebot/i, /google-extended/i, /apis-google/i, /feedfetcher-google/i,
  // Facebook bots (for FB Ads)
  /facebookexternalhit/i, /facebot/i, /facebookcatalog/i, /facebook/i,
  // Other ad platforms
  /bingads/i, /adidxbot/i, /pinterest/i, /twitterbot/i, /linkedinbot/i,
  // Search engines
  /bingbot/i, /slurp/i, /duckduckbot/i, /baiduspider/i, /yandexbot/i,
  /sogou/i, /exabot/i,
  // SEO tools
  /crawler/i, /spider/i, /semrush/i, /ahrefsbot/i, /mj12bot/i, /dotbot/i,
  /petalbot/i, /bytespider/i, /screaming frog/i, /rogerbot/i,
  // Automation tools
  /headless/i, /phantomjs/i, /selenium/i, /puppeteer/i, /playwright/i,
  /cypress/i, /webdriver/i, /nightmare/i, /casperjs/i,
  // Generic patterns
  /bot/i, /crawl/i, /archiver/i, /transcoder/i, /wget/i, /curl/i, /httpx/i,
];

// Known datacenter/hosting ASN patterns
const DATACENTER_PATTERNS = [
  /amazon/i, /google cloud/i, /microsoft azure/i, /digitalocean/i,
  /linode/i, /vultr/i, /ovh/i, /hetzner/i, /cloudflare/i,
];

interface FingerprintData {
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  deviceMemory: number;
  hardwareConcurrency: number;
  platform: string;
  webglVendor: string;
  webglRenderer: string;
  canvasHash: string;
  audioHash: string;
  fontsHash: string;
  pluginsCount: number;
  touchSupport: boolean;
  // Behavioral
  mouseMovements: number;
  scrollEvents: number;
  keypressEvents: number;
  timeOnPage: number;
  focusChanges: number;
  // Automation detection
  hasWebdriver: boolean;
  hasPhantom: boolean;
  hasSelenium: boolean;
  hasPuppeteer: boolean;
  isHeadless: boolean;
  isAutomated: boolean;
  // Additional signals
  doNotTrack: boolean;
  cookiesEnabled: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  addBehavior: boolean;
  openDatabase: boolean;
  cpuClass: string;
  navigatorPlatform: string;
  webglExtensions: number;
  performanceEntries: number;
}

interface ScoreResult {
  total: number;
  fingerprint: number;
  behavior: number;
  network: number;
  automation: number;
  flags: string[];
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function calculateScore(fp: FingerprintData, link: any, headers: Headers): ScoreResult {
  const flags: string[] = [];
  let fingerprintScore = 25; // Base fingerprint score
  let behaviorScore = 25;    // Base behavior score  
  let networkScore = 25;     // Base network score
  let automationScore = 25;  // Base automation score

  // === FINGERPRINT ANALYSIS ===
  
  // Check for realistic browser fingerprint
  if (fp.webglRenderer && fp.webglVendor) {
    fingerprintScore += 5;
  } else {
    fingerprintScore -= 10;
    flags.push("missing_webgl");
  }

  if (fp.canvasHash && fp.canvasHash !== "0" && fp.canvasHash.length > 5) {
    fingerprintScore += 5;
  } else {
    fingerprintScore -= 5;
    flags.push("suspicious_canvas");
  }

  if (fp.fontsHash && fp.fontsHash.length > 5) {
    fingerprintScore += 3;
  }

  // Device memory check (real browsers usually have 2-32GB)
  if (fp.deviceMemory >= 2 && fp.deviceMemory <= 32) {
    fingerprintScore += 3;
  } else if (fp.deviceMemory === 0) {
    fingerprintScore -= 5;
    flags.push("no_device_memory");
  }

  // Hardware concurrency (real devices: 2-64 cores)
  if (fp.hardwareConcurrency >= 2 && fp.hardwareConcurrency <= 64) {
    fingerprintScore += 3;
  } else {
    fingerprintScore -= 5;
    flags.push("suspicious_cpu");
  }

  // Screen resolution check
  if (fp.screenResolution) {
    const [w, h] = fp.screenResolution.split("x").map(Number);
    if (w >= 320 && w <= 7680 && h >= 240 && h <= 4320) {
      fingerprintScore += 3;
    }
  }

  // Color depth (common values: 24, 32)
  if (fp.colorDepth === 24 || fp.colorDepth === 32) {
    fingerprintScore += 2;
  }

  // Touch support consistency with device type
  const isMobileUA = /mobile|android|iphone|ipad/i.test(fp.userAgent);
  if (isMobileUA && fp.touchSupport) {
    fingerprintScore += 3;
  } else if (!isMobileUA && !fp.touchSupport) {
    fingerprintScore += 2;
  } else if (isMobileUA && !fp.touchSupport) {
    fingerprintScore -= 5;
    flags.push("touch_mismatch");
  }

  // Plugins count (desktop browsers usually have some)
  if (!isMobileUA && fp.pluginsCount === 0) {
    fingerprintScore -= 5;
    flags.push("no_plugins");
  }

  // === BEHAVIORAL ANALYSIS ===
  
  const minTime = link.behavior_time_ms || 2000;
  
  if (fp.timeOnPage >= minTime) {
    behaviorScore += 10;
  } else if (fp.timeOnPage < 500) {
    behaviorScore -= 15;
    flags.push("instant_redirect");
  } else if (fp.timeOnPage < 1000) {
    behaviorScore -= 5;
    flags.push("fast_redirect");
  }

  // Mouse movements (humans usually move mouse)
  if (fp.mouseMovements > 5) {
    behaviorScore += 10;
  } else if (fp.mouseMovements === 0 && !fp.touchSupport) {
    behaviorScore -= 10;
    flags.push("no_mouse_movement");
  }

  // Scroll events
  if (fp.scrollEvents > 0) {
    behaviorScore += 5;
  }

  // Focus changes (humans often change tabs)
  if (fp.focusChanges > 0 && fp.focusChanges < 10) {
    behaviorScore += 3;
  }

  // === AUTOMATION DETECTION ===
  
  // Strong signals - definitive automation
  if (fp.hasWebdriver) {
    automationScore -= 25;
    flags.push("webdriver_detected");
  }

  if (fp.hasSelenium) {
    automationScore -= 25;
    flags.push("selenium_detected");
  }

  if (fp.hasPuppeteer) {
    automationScore -= 25;
    flags.push("puppeteer_detected");
  }

  // Weaker signals - reduce penalty
  if (fp.hasPhantom) {
    automationScore -= 15;
    flags.push("phantom_detected");
  }

  if (fp.isHeadless && fp.isAutomated) {
    // Only penalize if BOTH headless AND automated
    automationScore -= 20;
    flags.push("headless_automated");
  } else if (fp.isHeadless) {
    // Just headless without automation signals - minor penalty
    automationScore -= 5;
    flags.push("headless_detected");
  }

  // Check for bot user agents - this is a strong signal
  for (const pattern of BOT_UA_PATTERNS) {
    if (pattern.test(fp.userAgent)) {
      automationScore -= 30;
      flags.push("bot_ua_pattern");
      break;
    }
  }

  // Storage API consistency check - minor signal
  if (!fp.cookiesEnabled && !fp.localStorage) {
    automationScore -= 5;
    flags.push("storage_disabled");
  }

  // === NETWORK ANALYSIS ===
  
  const cfCountry = headers.get("cf-ipcountry") || 
                    headers.get("x-vercel-ip-country") ||
                    headers.get("x-country-code");
  
  const cfIp = headers.get("cf-connecting-ip") ||
               headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               headers.get("x-real-ip");

  const referer = headers.get("referer") || "";
  const origin = headers.get("origin") || "";

  // === GOOGLE ADS SPECIFIC DETECTION ===
  
  // Check referer for Google Ads review
  const googleAdsReferers = [
    /google\.com\/ads/i, /google\.com\/adwords/i, /googleads\.g\.doubleclick/i,
    /googlesyndication\.com/i, /google\.com\/pagead/i, /adservice\.google/i,
    /google\.com\/search.*(&|\\?)gclid=/i, // Paid clicks often have gclid
  ];
  
  for (const pattern of googleAdsReferers) {
    if (pattern.test(referer) || pattern.test(origin)) {
      // Note: This could be a real user from ads, so don't block, but flag it
      flags.push("google_ads_referer");
      break;
    }
  }

  // Check for Google's internal headers (used by their crawlers)
  const googleHeaders = [
    "x-google-internal", "x-adsbot-google", "x-goog-", "via"
  ];
  
  for (const header of googleHeaders) {
    const value = headers.get(header);
    if (value && /google/i.test(value)) {
      automationScore -= 20;
      flags.push("google_internal_header");
      break;
    }
  }

  // Check for suspicious accept headers (bots often have minimal accept)
  const acceptHeader = headers.get("accept") || "";
  if (!acceptHeader.includes("text/html") && !acceptHeader.includes("*/*")) {
    automationScore -= 5;
    flags.push("suspicious_accept");
  }

  // Check accept-language (bots often lack this or have unusual patterns)
  const acceptLang = headers.get("accept-language") || "";
  if (!acceptLang || acceptLang === "*") {
    automationScore -= 5;
    flags.push("no_accept_lang");
  }

  // Check allowed countries
  if (link.allowed_countries && link.allowed_countries.length > 0) {
    if (cfCountry && !link.allowed_countries.includes(cfCountry)) {
      networkScore -= 30;
      flags.push("country_blocked");
    }
  }

  // Check blocked countries  
  if (link.blocked_countries && link.blocked_countries.length > 0) {
    if (cfCountry && link.blocked_countries.includes(cfCountry)) {
      networkScore -= 30;
      flags.push("country_blocked");
    }
  }

  // Device type check - only apply if configured
  const deviceType = getDeviceType(fp.userAgent);
  if (link.allowed_devices && link.allowed_devices.length > 0) {
    if (!link.allowed_devices.includes(deviceType)) {
      networkScore -= 15;
      flags.push("device_filtered");
    }
  }

  // === COMBINED SIGNALS - Google Ads Bot Profile ===
  // Google Ads reviewers typically: no behavior, headless, fast, no fingerprint diversity
  // Only flag if MULTIPLE strong signals present
  const botSignals = [
    fp.mouseMovements === 0 && !fp.touchSupport,
    fp.scrollEvents === 0,
    fp.timeOnPage < 1000,
    !fp.webglRenderer,
    fp.isHeadless && fp.isAutomated,
  ].filter(Boolean).length;
  
  if (botSignals >= 4) {
    automationScore -= 15;
    flags.push("bot_profile");
  } else if (botSignals >= 3) {
    automationScore -= 8;
    flags.push("suspicious_profile");
  }

  // Normalize scores (0-25 each, total 0-100)
  fingerprintScore = Math.max(0, Math.min(25, fingerprintScore));
  behaviorScore = Math.max(0, Math.min(25, behaviorScore));
  networkScore = Math.max(0, Math.min(25, networkScore));
  automationScore = Math.max(0, Math.min(25, automationScore));

  const total = fingerprintScore + behaviorScore + networkScore + automationScore;

  return {
    total,
    fingerprint: fingerprintScore,
    behavior: behaviorScore,
    network: networkScore,
    automation: automationScore,
    flags,
  };
}

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function generateFingerprintHash(fp: FingerprintData): string {
  const components = [
    fp.userAgent,
    fp.language,
    fp.timezone,
    fp.screenResolution,
    fp.colorDepth,
    fp.deviceMemory,
    fp.hardwareConcurrency,
    fp.platform,
    fp.webglVendor,
    fp.webglRenderer,
    fp.canvasHash,
    fp.fontsHash,
  ].join("|");
  
  return hashString(components);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { slug, fingerprint } = body;
    
    console.log(`[Cloaker] Processing: ${slug}`);

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
      console.log("[Cloaker] Link not found");
      return new Response(
        JSON.stringify({ error: "Link not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // If no fingerprint data, do basic check
    if (!fingerprint) {
      console.log("[Cloaker] No fingerprint, basic check only");
      
      // Simple bot check
      const ua = req.headers.get("user-agent") || "";
      const isBot = BOT_UA_PATTERNS.some(p => p.test(ua));
      
      if (link.block_bots && isBot) {
        return new Response(
          JSON.stringify({ redirectUrl: link.safe_url, decision: "bot_blocked" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update click count
      await supabase
        .from("cloaked_links")
        .update({ clicks_count: link.clicks_count + 1 })
        .eq("id", link.id);

      return new Response(
        JSON.stringify({ redirectUrl: link.target_url, decision: "allowed_basic" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate score with fingerprint data
    const scoreResult = calculateScore(fingerprint as FingerprintData, link, req.headers);
    const fingerprintHash = generateFingerprintHash(fingerprint);
    
    console.log(`[Cloaker] Score: ${scoreResult.total}, Flags: ${scoreResult.flags.join(", ")}`);

    // Get network info from headers
    const cfCountry = req.headers.get("cf-ipcountry") || 
                      req.headers.get("x-vercel-ip-country");
    const cfIp = req.headers.get("cf-connecting-ip") ||
                 req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    // Determine decision based on score
    const minScore = link.min_score || 40;
    let decision: "allow" | "block" | "safe";
    let redirectUrl: string;

    if (scoreResult.total >= minScore) {
      decision = "allow";
      redirectUrl = link.target_url;
    } else if (scoreResult.flags.includes("bot_ua_pattern") || 
               scoreResult.flags.includes("webdriver_detected") ||
               scoreResult.flags.includes("selenium_detected") ||
               scoreResult.flags.includes("puppeteer_detected")) {
      decision = "safe";
      redirectUrl = link.safe_url;
    } else {
      decision = "block";
      redirectUrl = link.safe_url;
    }

    // Store visitor data (async, don't wait)
    (async () => {
      try {
        await supabase.from("cloaker_visitors").insert({
          link_id: link.id,
          fingerprint_hash: fingerprintHash,
          score: scoreResult.total,
          decision,
          user_agent: fingerprint.userAgent,
          language: fingerprint.language,
          timezone: fingerprint.timezone,
          screen_resolution: fingerprint.screenResolution,
          color_depth: fingerprint.colorDepth,
          device_memory: fingerprint.deviceMemory,
          hardware_concurrency: fingerprint.hardwareConcurrency,
          platform: fingerprint.platform,
          webgl_vendor: fingerprint.webglVendor,
          webgl_renderer: fingerprint.webglRenderer,
          canvas_hash: fingerprint.canvasHash,
          audio_hash: fingerprint.audioHash,
          fonts_hash: fingerprint.fontsHash,
          plugins_count: fingerprint.pluginsCount,
          touch_support: fingerprint.touchSupport,
          mouse_movements: fingerprint.mouseMovements,
          scroll_events: fingerprint.scrollEvents,
          keypress_events: fingerprint.keypressEvents,
          time_on_page: fingerprint.timeOnPage,
          focus_changes: fingerprint.focusChanges,
          is_bot: scoreResult.flags.includes("bot_ua_pattern"),
          is_headless: fingerprint.isHeadless,
          is_automated: fingerprint.isAutomated,
          has_webdriver: fingerprint.hasWebdriver,
          has_phantom: fingerprint.hasPhantom,
          has_selenium: fingerprint.hasSelenium,
          has_puppeteer: fingerprint.hasPuppeteer,
          ip_address: cfIp,
          country_code: cfCountry,
          score_fingerprint: scoreResult.fingerprint,
          score_behavior: scoreResult.behavior,
          score_network: scoreResult.network,
          score_automation: scoreResult.automation,
        });
        console.log("[Cloaker] Visitor logged");
      } catch (e) {
        console.error("[Cloaker] Failed to log visitor:", e);
      }
    })();

    // Update click count
    await supabase
      .from("cloaked_links")
      .update({ clicks_count: link.clicks_count + 1 })
      .eq("id", link.id);

    console.log(`[Cloaker] Decision: ${decision}, URL: ${redirectUrl}`);

    return new Response(
      JSON.stringify({ 
        redirectUrl, 
        decision,
        score: scoreResult.total,
        minScore,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Cloaker] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});