import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Comprehensive bot UA patterns - Google Ads, Facebook, crawlers, automation
const BOT_UA_PATTERNS = [
  // Google Ads specific (CRITICAL)
  /adsbot-google/i, /adsbot/i, /mediapartners-google/i, /googleads/i,
  /google-adwords/i, /google-ads/i, /google-inspectiontool/i,
  /google-safety/i, /google-site-verification/i, /google-structured-data/i,
  
  // Standard Google
  /googlebot/i, /google-extended/i, /apis-google/i, /feedfetcher-google/i,
  /storebot-google/i, /google-read-aloud/i,
  
  // Facebook/Meta (CRITICAL)
  /facebookexternalhit/i, /facebot/i, /facebookcatalog/i, /facebook/i,
  /meta-externalagent/i, /meta-externalfetcher/i,
  
  // Other ad platforms
  /bingads/i, /adidxbot/i, /pinterest/i, /twitterbot/i, /linkedinbot/i,
  /snapchat/i, /telegrambot/i, /whatsapp/i, /slackbot/i, /discordbot/i,
  
  // Search engines
  /bingbot/i, /slurp/i, /duckduckbot/i, /baiduspider/i, /yandexbot/i,
  /sogou/i, /exabot/i, /ia_archiver/i, /archive\.org/i,
  
  // SEO tools
  /crawler/i, /spider/i, /semrush/i, /ahrefsbot/i, /mj12bot/i, /dotbot/i,
  /petalbot/i, /bytespider/i, /screaming frog/i, /rogerbot/i, /seokicks/i,
  /sistrix/i, /blexbot/i, /dataforseo/i,
  
  // Automation tools (CRITICAL)
  /headless/i, /phantomjs/i, /selenium/i, /puppeteer/i, /playwright/i,
  /cypress/i, /webdriver/i, /nightmare/i, /casperjs/i, /slimerjs/i,
  /splinter/i, /zombie/i, /httpclient/i,
  
  // Generic patterns
  /bot/i, /crawl/i, /archiver/i, /transcoder/i, /wget/i, /curl/i, 
  /httpx/i, /python-requests/i, /python-urllib/i, /java\//i, /axios/i,
  /node-fetch/i, /go-http-client/i, /libwww/i, /scraper/i, /scanner/i,
];

// Known datacenter/cloud IP patterns
const DATACENTER_KEYWORDS = [
  "amazon", "aws", "google cloud", "gcp", "microsoft azure", "azure",
  "digitalocean", "linode", "vultr", "ovh", "hetzner", "cloudflare",
  "oracle cloud", "ibm cloud", "alibaba", "tencent", "scaleway",
  "upcloud", "kamatera", "contabo", "hostinger", "godaddy",
];

// Known suspicious ISPs
const SUSPICIOUS_ISPS = [
  "google", "facebook", "meta", "amazon", "microsoft",
  "digitalocean", "linode", "vultr", "ovh", "hetzner",
];

interface FingerprintData {
  userAgent: string;
  language: string;
  languages?: string[];
  timezone: string;
  timezoneOffset?: number;
  screenResolution: string;
  availableScreenResolution?: string;
  colorDepth: number;
  deviceMemory: number;
  hardwareConcurrency: number;
  platform: string;
  webglVendor: string;
  webglRenderer: string;
  webglVersion?: string;
  canvasHash: string;
  audioHash: string;
  fontsHash: string;
  pluginsCount: number;
  pluginsHash?: string;
  touchSupport: boolean;
  maxTouchPoints?: number;
  mouseMovements: number;
  mouseVelocities?: number[];
  scrollEvents: number;
  scrollDepth?: number;
  keypressEvents: number;
  clickEvents?: number;
  timeOnPage: number;
  focusChanges: number;
  hasWebdriver: boolean;
  hasPhantom: boolean;
  hasSelenium: boolean;
  hasPuppeteer: boolean;
  hasPlaywright?: boolean;
  hasCypress?: boolean;
  isHeadless: boolean;
  isAutomated: boolean;
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
  connectionType?: string;
  connectionSpeed?: string;
  batteryLevel?: number;
  batteryCharging?: boolean;
  mediaDevices?: number;
  speechSynthesis?: boolean;
  webRTC?: boolean;
  permissions?: string[];
  canvasNoise?: boolean;
  audioNoise?: boolean;
  screenOrientation?: string;
  devicePixelRatio?: number;
  hardwareAcceleration?: boolean;
  pdfViewerEnabled?: boolean;
  webglParams?: Record<string, any>;
  fontsList?: string[];
  timingAttack?: number;
  mousePath?: { x: number; y: number; t: number }[];
}

interface ScoreResult {
  total: number;
  fingerprint: number;
  behavior: number;
  network: number;
  automation: number;
  flags: string[];
  confidence: number;
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

// Analyze mouse movement patterns
function analyzeMousePath(path?: { x: number; y: number; t: number }[]): {
  isHuman: boolean;
  flags: string[];
} {
  const flags: string[] = [];
  
  if (!path || path.length < 5) {
    return { isHuman: false, flags: ["insufficient_mouse_data"] };
  }
  
  // Check for perfectly linear movements (bot behavior)
  let linearCount = 0;
  let totalSegments = 0;
  
  for (let i = 2; i < path.length; i++) {
    const p1 = path[i - 2];
    const p2 = path[i - 1];
    const p3 = path[i];
    
    // Calculate angles
    const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    const angleDiff = Math.abs(angle1 - angle2);
    
    if (angleDiff < 0.05) { // Very straight line
      linearCount++;
    }
    totalSegments++;
  }
  
  const linearRatio = linearCount / totalSegments;
  if (linearRatio > 0.8) {
    flags.push("robotic_mouse_path");
  }
  
  // Check timing consistency (bots often have very consistent timing)
  const timeDiffs: number[] = [];
  for (let i = 1; i < path.length; i++) {
    timeDiffs.push(path[i].t - path[i - 1].t);
  }
  
  if (timeDiffs.length > 3) {
    const avgTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    const variance = timeDiffs.reduce((a, b) => a + Math.pow(b - avgTime, 2), 0) / timeDiffs.length;
    const stdDev = Math.sqrt(variance);
    
    // Very consistent timing is suspicious
    if (stdDev < 5 && avgTime > 0) {
      flags.push("robotic_timing");
    }
  }
  
  return { 
    isHuman: flags.length === 0, 
    flags 
  };
}

// Analyze velocity patterns
function analyzeVelocities(velocities?: number[]): { isHuman: boolean; flags: string[] } {
  const flags: string[] = [];
  
  if (!velocities || velocities.length < 5) {
    return { isHuman: true, flags: [] };
  }
  
  // Calculate variance
  const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length;
  const variance = velocities.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / velocities.length;
  
  // Very low variance is suspicious (robotic)
  if (variance < 0.001 && avg > 0) {
    flags.push("constant_velocity");
  }
  
  // Very high speeds sustained are suspicious
  const highSpeedCount = velocities.filter(v => v > 10).length;
  if (highSpeedCount / velocities.length > 0.5) {
    flags.push("inhuman_speed");
  }
  
  return { isHuman: flags.length === 0, flags };
}

function calculateScore(fp: FingerprintData, link: any, headers: Headers): ScoreResult {
  const flags: string[] = [];
  let fingerprintScore = 25;
  let behaviorScore = 25;
  let networkScore = 25;
  let automationScore = 25;

  // ==================== FINGERPRINT ANALYSIS ====================
  
  // WebGL checks
  if (fp.webglRenderer && fp.webglVendor) {
    fingerprintScore += 3;
    
    // Check for known software renderers (headless)
    if (/swiftshader|llvmpipe|mesa|software|virtualbox|vmware/i.test(fp.webglRenderer)) {
      fingerprintScore -= 10;
      flags.push("software_renderer");
    }
  } else {
    fingerprintScore -= 10;
    flags.push("no_webgl");
  }

  // Hardware acceleration check
  if (fp.hardwareAcceleration === false) {
    fingerprintScore -= 5;
    flags.push("no_hw_acceleration");
  }

  // Canvas fingerprint
  if (fp.canvasHash && fp.canvasHash !== "0" && fp.canvasHash.length > 6) {
    fingerprintScore += 3;
  } else {
    fingerprintScore -= 8;
    flags.push("invalid_canvas");
  }

  // Canvas noise detection (anti-fingerprinting)
  if (fp.canvasNoise) {
    fingerprintScore -= 5;
    flags.push("canvas_noise_detected");
  }

  // Audio fingerprint noise
  if (fp.audioNoise) {
    fingerprintScore -= 5;
    flags.push("audio_noise_detected");
  }

  // Fonts check
  if (fp.fontsHash && fp.fontsHash.length > 5) {
    fingerprintScore += 2;
    
    // Check font count (real browsers have many fonts)
    if (fp.fontsList && fp.fontsList.length < 5) {
      fingerprintScore -= 3;
      flags.push("few_fonts");
    }
  }

  // Device memory (real browsers: 2-32GB)
  if (fp.deviceMemory >= 2 && fp.deviceMemory <= 32) {
    fingerprintScore += 2;
  } else if (fp.deviceMemory === 0 || !fp.deviceMemory) {
    fingerprintScore -= 5;
    flags.push("no_device_memory");
  }

  // Hardware concurrency (real: 2-64 cores)
  if (fp.hardwareConcurrency >= 2 && fp.hardwareConcurrency <= 64) {
    fingerprintScore += 2;
  } else {
    fingerprintScore -= 5;
    flags.push("invalid_cpu_cores");
  }

  // Screen resolution validation
  if (fp.screenResolution) {
    const [w, h] = fp.screenResolution.split("x").map(Number);
    if (w >= 320 && w <= 7680 && h >= 240 && h <= 4320) {
      fingerprintScore += 2;
    }
    
    // Check for common headless resolutions
    if ((w === 800 && h === 600) || (w === 1024 && h === 768)) {
      fingerprintScore -= 3;
      flags.push("headless_resolution");
    }
  }

  // Device pixel ratio
  if (fp.devicePixelRatio && fp.devicePixelRatio >= 1 && fp.devicePixelRatio <= 4) {
    fingerprintScore += 1;
  }

  // Color depth
  if (fp.colorDepth === 24 || fp.colorDepth === 32) {
    fingerprintScore += 1;
  }

  // Touch support consistency
  const isMobileUA = /mobile|android|iphone|ipad/i.test(fp.userAgent);
  if (isMobileUA && fp.touchSupport && fp.maxTouchPoints && fp.maxTouchPoints > 0) {
    fingerprintScore += 3;
  } else if (!isMobileUA && !fp.touchSupport) {
    fingerprintScore += 2;
  } else if (isMobileUA && !fp.touchSupport) {
    fingerprintScore -= 5;
    flags.push("touch_mismatch");
  }

  // Plugins (desktop browsers usually have some)
  if (!isMobileUA && fp.pluginsCount === 0) {
    fingerprintScore -= 5;
    flags.push("no_plugins");
  }

  // Languages array check
  if (fp.languages && fp.languages.length > 0) {
    fingerprintScore += 2;
  } else {
    fingerprintScore -= 3;
    flags.push("no_languages");
  }

  // WebRTC support
  if (fp.webRTC === false) {
    fingerprintScore -= 2;
    flags.push("no_webrtc");
  }

  // Speech synthesis
  if (fp.speechSynthesis === false) {
    fingerprintScore -= 1;
    flags.push("no_speech");
  }

  // ==================== BEHAVIORAL ANALYSIS ====================
  
  const minTime = link.behavior_time_ms || 2000;
  
  // Time on page
  if (fp.timeOnPage >= minTime) {
    behaviorScore += 8;
  } else if (fp.timeOnPage < 500) {
    behaviorScore -= 20;
    flags.push("instant_access");
  } else if (fp.timeOnPage < 1000) {
    behaviorScore -= 10;
    flags.push("very_fast_access");
  } else if (fp.timeOnPage < 1500) {
    behaviorScore -= 5;
    flags.push("fast_access");
  }

  // Mouse movements analysis
  if (fp.mouseMovements > 10) {
    behaviorScore += 8;
  } else if (fp.mouseMovements > 3) {
    behaviorScore += 4;
  } else if (fp.mouseMovements === 0 && !fp.touchSupport) {
    behaviorScore -= 15;
    flags.push("no_mouse");
  }

  // Mouse path analysis
  const mouseAnalysis = analyzeMousePath(fp.mousePath);
  if (!mouseAnalysis.isHuman) {
    behaviorScore -= 10;
    flags.push(...mouseAnalysis.flags);
  } else if (fp.mousePath && fp.mousePath.length > 10) {
    behaviorScore += 5;
  }

  // Velocity analysis
  const velocityAnalysis = analyzeVelocities(fp.mouseVelocities);
  if (!velocityAnalysis.isHuman) {
    behaviorScore -= 8;
    flags.push(...velocityAnalysis.flags);
  }

  // Click events
  if (fp.clickEvents && fp.clickEvents > 0) {
    behaviorScore += 3;
  }

  // Scroll events
  if (fp.scrollEvents > 0) {
    behaviorScore += 3;
  }

  // Scroll depth
  if (fp.scrollDepth && fp.scrollDepth > 20) {
    behaviorScore += 2;
  }

  // Focus changes (humans change tabs)
  if (fp.focusChanges > 0 && fp.focusChanges < 10) {
    behaviorScore += 2;
  }

  // Timing attack detection (bots have very consistent timing)
  if (fp.timingAttack !== undefined) {
    if (fp.timingAttack < 0.0001 && fp.timingAttack >= 0) {
      behaviorScore -= 8;
      flags.push("robotic_timing_variance");
    }
  }

  // ==================== AUTOMATION DETECTION ====================
  
  // Critical automation signals
  if (fp.hasWebdriver) {
    automationScore -= 25;
    flags.push("WEBDRIVER");
  }

  if (fp.hasSelenium) {
    automationScore -= 25;
    flags.push("SELENIUM");
  }

  if (fp.hasPuppeteer) {
    automationScore -= 25;
    flags.push("PUPPETEER");
  }

  if (fp.hasPlaywright) {
    automationScore -= 25;
    flags.push("PLAYWRIGHT");
  }

  if (fp.hasCypress) {
    automationScore -= 20;
    flags.push("CYPRESS");
  }

  if (fp.hasPhantom) {
    automationScore -= 20;
    flags.push("PHANTOM");
  }

  // Headless detection
  if (fp.isHeadless && fp.isAutomated) {
    automationScore -= 25;
    flags.push("HEADLESS_AUTOMATED");
  } else if (fp.isHeadless) {
    automationScore -= 10;
    flags.push("headless");
  } else if (fp.isAutomated) {
    automationScore -= 15;
    flags.push("automated");
  }

  // Bot user agent patterns
  for (const pattern of BOT_UA_PATTERNS) {
    if (pattern.test(fp.userAgent)) {
      automationScore -= 25;
      flags.push("BOT_UA");
      break;
    }
  }

  // Storage APIs check
  if (!fp.cookiesEnabled && !fp.localStorage) {
    automationScore -= 8;
    flags.push("storage_disabled");
  }

  // Performance entries
  if (fp.performanceEntries === 0) {
    automationScore -= 5;
    flags.push("no_perf_entries");
  }

  // Media devices (headless often has 0)
  if (fp.mediaDevices === 0) {
    automationScore -= 3;
    flags.push("no_media_devices");
  }

  // ==================== NETWORK ANALYSIS ====================
  
  const cfCountry = headers.get("cf-ipcountry") || 
                    headers.get("x-vercel-ip-country") ||
                    headers.get("x-country-code");
  
  const cfIp = headers.get("cf-connecting-ip") ||
               headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               headers.get("x-real-ip");

  const cfAsn = headers.get("cf-asn");
  const cfOrg = headers.get("cf-isp") || "";

  // Check for datacenter IPs
  for (const keyword of DATACENTER_KEYWORDS) {
    if (cfOrg.toLowerCase().includes(keyword)) {
      networkScore -= 15;
      flags.push("datacenter_ip");
      break;
    }
  }

  // Check for suspicious ISPs
  for (const isp of SUSPICIOUS_ISPS) {
    if (cfOrg.toLowerCase().includes(isp)) {
      networkScore -= 10;
      flags.push("suspicious_isp");
      break;
    }
  }

  // Google Ads specific referer detection
  const referer = headers.get("referer") || "";
  const googleAdsPatterns = [
    /google\.com\/ads/i, /googleads/i, /googlesyndication/i,
    /doubleclick/i, /adservice\.google/i, /pagead/i,
  ];
  
  for (const pattern of googleAdsPatterns) {
    if (pattern.test(referer)) {
      flags.push("google_ads_referer");
      break;
    }
  }

  // Google internal headers
  const googleHeaders = ["x-google-internal", "x-adsbot-google", "x-goog-"];
  for (const header of googleHeaders) {
    const value = headers.get(header);
    if (value) {
      networkScore -= 20;
      flags.push("google_internal_header");
      break;
    }
  }

  // Via header check
  const viaHeader = headers.get("via") || "";
  if (/google|facebook|meta/i.test(viaHeader)) {
    networkScore -= 15;
    flags.push("via_header_bot");
  }

  // Accept header check
  const acceptHeader = headers.get("accept") || "";
  if (!acceptHeader.includes("text/html") && !acceptHeader.includes("*/*")) {
    networkScore -= 5;
    flags.push("suspicious_accept");
  }

  // Accept-language check
  const acceptLang = headers.get("accept-language") || "";
  if (!acceptLang || acceptLang === "*") {
    networkScore -= 5;
    flags.push("no_accept_lang");
  }

  // Country filtering
  if (link.allowed_countries && link.allowed_countries.length > 0) {
    if (cfCountry && !link.allowed_countries.includes(cfCountry)) {
      networkScore -= 25;
      flags.push("country_blocked");
    }
  }

  if (link.blocked_countries && link.blocked_countries.length > 0) {
    if (cfCountry && link.blocked_countries.includes(cfCountry)) {
      networkScore -= 25;
      flags.push("country_blocked");
    }
  }

  // Device filtering
  const deviceType = getDeviceType(fp.userAgent);
  if (link.allowed_devices && link.allowed_devices.length > 0) {
    if (!link.allowed_devices.includes(deviceType)) {
      networkScore -= 15;
      flags.push("device_filtered");
    }
  }

  // ==================== COMBINED BOT PROFILE DETECTION ====================
  
  // Count critical bot signals
  const criticalFlags = flags.filter(f => 
    f === "WEBDRIVER" || f === "SELENIUM" || f === "PUPPETEER" || 
    f === "PLAYWRIGHT" || f === "BOT_UA" || f === "HEADLESS_AUTOMATED"
  ).length;

  // Count suspicious signals
  const suspiciousSignals = [
    fp.mouseMovements === 0 && !fp.touchSupport,
    fp.scrollEvents === 0,
    fp.timeOnPage < 1500,
    !fp.webglRenderer,
    fp.pluginsCount === 0 && !isMobileUA,
    fp.isHeadless,
    fp.hardwareAcceleration === false,
    !fp.cookiesEnabled,
    fp.mediaDevices === 0,
  ].filter(Boolean).length;

  // Google Ads bot profile (no behavior, fast, headless, no fingerprint diversity)
  if (suspiciousSignals >= 5) {
    automationScore -= 15;
    flags.push("HIGH_BOT_PROBABILITY");
  } else if (suspiciousSignals >= 4) {
    automationScore -= 10;
    flags.push("MEDIUM_BOT_PROBABILITY");
  } else if (suspiciousSignals >= 3) {
    automationScore -= 5;
    flags.push("low_bot_probability");
  }

  // Normalize scores
  fingerprintScore = Math.max(0, Math.min(25, fingerprintScore));
  behaviorScore = Math.max(0, Math.min(25, behaviorScore));
  networkScore = Math.max(0, Math.min(25, networkScore));
  automationScore = Math.max(0, Math.min(25, automationScore));

  const total = fingerprintScore + behaviorScore + networkScore + automationScore;
  
  // Calculate confidence (how sure we are about our decision)
  const confidence = criticalFlags > 0 ? 95 : 
                     suspiciousSignals >= 5 ? 85 :
                     suspiciousSignals >= 3 ? 70 : 50;

  return {
    total,
    fingerprint: fingerprintScore,
    behavior: behaviorScore,
    network: networkScore,
    automation: automationScore,
    flags,
    confidence,
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

    // If no fingerprint, perform basic but strict check
    if (!fingerprint) {
      console.log("[Cloaker] No fingerprint - strict mode");
      
      const ua = req.headers.get("user-agent") || "";
      const isBot = BOT_UA_PATTERNS.some(p => p.test(ua));
      
      if (link.block_bots && isBot) {
        console.log("[Cloaker] Blocked: Bot UA detected (no fingerprint)");
        return new Response(
          JSON.stringify({ redirectUrl: link.safe_url, decision: "blocked_bot" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Require fingerprint for higher security
      if (link.collect_fingerprint) {
        console.log("[Cloaker] Blocked: Fingerprint required but not provided");
        return new Response(
          JSON.stringify({ redirectUrl: link.safe_url, decision: "blocked_no_fp" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from("cloaked_links")
        .update({ clicks_count: link.clicks_count + 1 })
        .eq("id", link.id);

      return new Response(
        JSON.stringify({ redirectUrl: link.target_url, decision: "allowed_basic" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate comprehensive score
    const scoreResult = calculateScore(fingerprint as FingerprintData, link, req.headers);
    const fingerprintHash = generateFingerprintHash(fingerprint);
    
    console.log(`[Cloaker] Score: ${scoreResult.total}, Confidence: ${scoreResult.confidence}%`);
    console.log(`[Cloaker] Flags: ${scoreResult.flags.join(", ") || "none"}`);
    console.log(`[Cloaker] Breakdown: FP=${scoreResult.fingerprint}, B=${scoreResult.behavior}, N=${scoreResult.network}, A=${scoreResult.automation}`);

    // Get network info
    const cfCountry = req.headers.get("cf-ipcountry") || 
                      req.headers.get("x-vercel-ip-country");
    const cfIp = req.headers.get("cf-connecting-ip") ||
                 req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const cfCity = req.headers.get("cf-city") || "";

    // Decision logic
    const minScore = link.min_score || 40;
    let decision: "allow" | "block" | "safe";
    let redirectUrl: string;

    // Check for critical automation flags first
    const hasCriticalFlags = scoreResult.flags.some(f => 
      f === "WEBDRIVER" || f === "SELENIUM" || f === "PUPPETEER" || 
      f === "PLAYWRIGHT" || f === "BOT_UA" || f === "HEADLESS_AUTOMATED" ||
      f === "HIGH_BOT_PROBABILITY"
    );

    if (hasCriticalFlags) {
      decision = "safe";
      redirectUrl = link.safe_url;
      console.log("[Cloaker] Blocked: Critical automation flag detected");
    } else if (scoreResult.total >= minScore) {
      decision = "allow";
      redirectUrl = link.target_url;
    } else {
      decision = "block";
      redirectUrl = link.safe_url;
    }

    // Log visitor data (async)
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
          is_bot: scoreResult.flags.includes("BOT_UA"),
          is_headless: fingerprint.isHeadless,
          is_automated: fingerprint.isAutomated,
          has_webdriver: fingerprint.hasWebdriver,
          has_phantom: fingerprint.hasPhantom,
          has_selenium: fingerprint.hasSelenium,
          has_puppeteer: fingerprint.hasPuppeteer,
          ip_address: cfIp,
          country_code: cfCountry,
          city: cfCity,
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
        confidence: scoreResult.confidence,
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
