import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Comprehensive bot patterns
const BOT_UA_PATTERNS = [
  // Google Ads (CRITICAL)
  /adsbot-google/i, /adsbot/i, /mediapartners-google/i, /googleads/i,
  /google-adwords/i, /google-ads/i, /google-inspectiontool/i,
  /google-safety/i, /google-site-verification/i, /google-structured-data/i,
  /storebot-google/i, /google-read-aloud/i,
  /googlebot/i, /google-extended/i, /apis-google/i, /feedfetcher-google/i,
  
  // Facebook/Meta (CRITICAL)
  /facebookexternalhit/i, /facebot/i, /facebookcatalog/i, /facebook/i,
  /meta-externalagent/i, /meta-externalfetcher/i, /instagram/i,
  
  // Ad platforms
  /bingads/i, /adidxbot/i, /pinterest/i, /twitterbot/i, /linkedinbot/i,
  /snapchat/i, /telegrambot/i, /whatsapp/i, /slackbot/i, /discordbot/i,
  /tiktok/i, /bytedance/i,
  
  // Search engines
  /bingbot/i, /slurp/i, /duckduckbot/i, /baiduspider/i, /yandexbot/i,
  /sogou/i, /exabot/i, /ia_archiver/i, /archive\.org/i, /applebot/i,
  
  // SEO tools
  /crawler/i, /spider/i, /semrush/i, /ahrefsbot/i, /mj12bot/i, /dotbot/i,
  /petalbot/i, /bytespider/i, /screaming frog/i, /rogerbot/i, /seokicks/i,
  /sistrix/i, /blexbot/i, /dataforseo/i, /neevabot/i, /gptbot/i,
  /chatgpt/i, /claude-web/i, /anthropic/i, /cohere/i,
  
  // Automation (CRITICAL)
  /headless/i, /phantomjs/i, /selenium/i, /puppeteer/i, /playwright/i,
  /cypress/i, /webdriver/i, /nightmare/i, /casperjs/i, /slimerjs/i,
  /splinter/i, /zombie/i, /httpclient/i, /mechanize/i,
  
  // Generic
  /bot/i, /crawl/i, /archiver/i, /transcoder/i, /wget/i, /curl/i, 
  /httpx/i, /python-requests/i, /python-urllib/i, /java\//i, /axios/i,
  /node-fetch/i, /go-http-client/i, /libwww/i, /scraper/i, /scanner/i,
  /fetch\//i, /http-client/i, /okhttp/i, /retrofit/i,
];

// Datacenter keywords
const DATACENTER_KEYWORDS = [
  "amazon", "aws", "google cloud", "gcp", "microsoft azure", "azure",
  "digitalocean", "linode", "vultr", "ovh", "hetzner", "cloudflare",
  "oracle cloud", "ibm cloud", "alibaba", "tencent", "scaleway",
  "upcloud", "kamatera", "contabo", "hostinger", "godaddy", "rackspace",
  "quadranet", "choopa", "m247", "leaseweb", "datacamp",
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
  webglExtensions?: number;
  webglParams?: Record<string, any>;
  webglHash?: string;
  canvasHash: string;
  canvasNoise?: boolean;
  audioHash: string;
  audioNoise?: boolean;
  fontsHash: string;
  fontsList?: string[];
  pluginsCount: number;
  pluginsHash?: string;
  touchSupport: boolean;
  maxTouchPoints?: number;
  mouseMovements: number;
  mouseVelocities?: number[];
  mouseAccelerations?: number[];
  mousePath?: { x: number; y: number; t: number }[];
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
  hasNightmare?: boolean;
  isHeadless: boolean;
  isAutomated: boolean;
  doNotTrack: boolean;
  cookiesEnabled: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  openDatabase?: boolean;
  cpuClass: string;
  navigatorPlatform: string;
  performanceEntries: number;
  connectionType?: string;
  connectionSpeed?: string;
  connectionRtt?: number;
  batteryLevel?: number;
  batteryCharging?: boolean;
  mediaDevices?: number;
  mediaDevicesHash?: string;
  speechSynthesis?: boolean;
  speechRecognition?: boolean;
  webRTC?: boolean;
  permissions?: string[];
  screenOrientation?: string;
  devicePixelRatio?: number;
  hardwareAcceleration?: boolean;
  pdfViewerEnabled?: boolean;
  timingVariance?: number;
  mathConstants?: string;
  dateTimestamp?: number;
  errorStackPattern?: string;
  proofOfWork?: string;
  jsChallenge?: number;
  domManipulationTime?: number;
  memoryUsage?: number;
  performanceTiming?: Record<string, number>;
  intlFingerprint?: string;
  cssMediaFingerprint?: string;
  webWorkerSupport?: boolean;
  sharedArrayBufferSupport?: boolean;
  wasmSupport?: boolean;
  serviceWorkerSupport?: boolean;
  credentialsSupport?: boolean;
  notificationPermission?: string;
  clipboardSupport?: boolean;
  gamepadsSupport?: boolean;
  bluetoothSupport?: boolean;
  usbSupport?: boolean;
  serialSupport?: boolean;
  hid?: boolean;
  xr?: boolean;
  consistencyScore?: number;
  inconsistencies?: string[];
}

interface ScoreResult {
  total: number;
  fingerprint: number;
  behavior: number;
  network: number;
  automation: number;
  flags: string[];
  confidence: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Analyze mouse movement patterns for bot detection
function analyzeMouseBehavior(fp: FingerprintData): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;
  
  const path = fp.mousePath;
  const velocities = fp.mouseVelocities;
  const accelerations = fp.mouseAccelerations;
  
  // No mouse data on non-touch device is suspicious
  if (!fp.touchSupport && fp.mouseMovements === 0) {
    flags.push("no_mouse_data");
    score -= 15;
  }
  
  // Check path for robotic patterns
  if (path && path.length >= 5) {
    // Calculate linearity
    let linearSegments = 0;
    let totalSegments = 0;
    
    for (let i = 2; i < path.length; i++) {
      const p1 = path[i - 2];
      const p2 = path[i - 1];
      const p3 = path[i];
      
      const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
      const angleDiff = Math.abs(angle1 - angle2);
      
      if (angleDiff < 0.05) linearSegments++;
      totalSegments++;
    }
    
    if (totalSegments > 0) {
      const linearRatio = linearSegments / totalSegments;
      if (linearRatio > 0.85) {
        flags.push("robotic_path");
        score -= 15;
      } else if (linearRatio > 0.7) {
        flags.push("suspicious_path");
        score -= 8;
      }
    }
    
    // Check timing consistency
    const timeDiffs: number[] = [];
    for (let i = 1; i < path.length; i++) {
      timeDiffs.push(path[i].t - path[i - 1].t);
    }
    
    if (timeDiffs.length > 3) {
      const avgTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
      const variance = timeDiffs.reduce((a, b) => a + Math.pow(b - avgTime, 2), 0) / timeDiffs.length;
      const stdDev = Math.sqrt(variance);
      
      // Very consistent timing is robotic
      if (stdDev < 3 && avgTime > 0) {
        flags.push("robotic_timing");
        score -= 12;
      }
    }
  }
  
  // Velocity analysis
  if (velocities && velocities.length >= 5) {
    const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / velocities.length;
    
    // Very low variance = constant speed = robot
    if (variance < 0.0005 && avg > 0) {
      flags.push("constant_velocity");
      score -= 12;
    }
    
    // Sustained high speeds are suspicious
    const highSpeedRatio = velocities.filter(v => v > 15).length / velocities.length;
    if (highSpeedRatio > 0.6) {
      flags.push("inhuman_speed");
      score -= 10;
    }
  }
  
  // Acceleration analysis
  if (accelerations && accelerations.length >= 5) {
    // Human movements have variable acceleration
    const hasVariableAccel = accelerations.some((a, i, arr) => 
      i > 0 && Math.abs(a - arr[i-1]) > 0.1
    );
    
    if (!hasVariableAccel) {
      flags.push("constant_acceleration");
      score -= 8;
    }
  }
  
  // Positive signals
  if (fp.mouseMovements > 20 && path && path.length > 15) {
    score += 10; // Good amount of natural movement
  }
  
  return { score, flags };
}

// Validate proof of work
function validateProofOfWork(pow: string | undefined): { valid: boolean; time: number } {
  if (!pow) return { valid: false, time: -1 };
  
  const parts = pow.split(":");
  if (parts[0] === "failed") {
    return { valid: false, time: parseInt(parts[1]) || -1 };
  }
  
  const nonce = parseInt(parts[0]);
  const hash = parts[1];
  const time = parseInt(parts[2]) || 0;
  
  // Valid proof should take some time (bots might complete instantly or fail)
  const valid = hash?.startsWith("000") && time > 50 && time < 10000;
  
  return { valid, time };
}

// Validate JS challenge
function validateJsChallenge(variance: number | undefined): { valid: boolean; flags: string[] } {
  const flags: string[] = [];
  
  if (variance === undefined) {
    flags.push("no_js_challenge");
    return { valid: false, flags };
  }
  
  // Bots often have very low or very high variance
  if (variance < 0.00001) {
    flags.push("suspicious_timing_variance");
    return { valid: false, flags };
  }
  
  if (variance > 100) {
    flags.push("abnormal_timing_variance");
    return { valid: false, flags };
  }
  
  return { valid: true, flags };
}

function calculateScore(fp: FingerprintData, link: any, headers: Headers): ScoreResult {
  const flags: string[] = [];
  let fingerprintScore = 25;
  let behaviorScore = 25;
  let networkScore = 25;
  let automationScore = 25;

  // ==================== FINGERPRINT ANALYSIS (0-25) ====================
  
  // WebGL checks
  if (fp.webglRenderer && fp.webglVendor) {
    fingerprintScore += 2;
    
    // Software renderer = headless
    if (/swiftshader|llvmpipe|mesa|software|virtualbox|vmware|virgl|lavapipe/i.test(fp.webglRenderer)) {
      fingerprintScore -= 15;
      flags.push("SOFTWARE_RENDERER");
    }
  } else {
    fingerprintScore -= 12;
    flags.push("no_webgl");
  }

  // Hardware acceleration
  if (fp.hardwareAcceleration === false) {
    fingerprintScore -= 8;
    flags.push("no_hw_accel");
  }

  // Canvas fingerprint
  if (fp.canvasHash && fp.canvasHash !== "0" && fp.canvasHash.length > 6) {
    fingerprintScore += 2;
  } else {
    fingerprintScore -= 10;
    flags.push("invalid_canvas");
  }

  // Anti-fingerprinting detection
  if (fp.canvasNoise) {
    fingerprintScore -= 8;
    flags.push("canvas_spoofed");
  }
  
  if (fp.audioNoise) {
    fingerprintScore -= 8;
    flags.push("audio_spoofed");
  }

  // Fonts
  if (fp.fontsList && fp.fontsList.length < 5) {
    fingerprintScore -= 5;
    flags.push("few_fonts");
  } else if (fp.fontsList && fp.fontsList.length > 10) {
    fingerprintScore += 2;
  }

  // Device memory
  if (fp.deviceMemory >= 2 && fp.deviceMemory <= 32) {
    fingerprintScore += 1;
  } else if (!fp.deviceMemory) {
    fingerprintScore -= 5;
    flags.push("no_device_memory");
  }

  // CPU cores
  if (fp.hardwareConcurrency >= 2 && fp.hardwareConcurrency <= 128) {
    fingerprintScore += 1;
  } else {
    fingerprintScore -= 5;
    flags.push("invalid_cpu");
  }

  // Screen resolution
  if (fp.screenResolution) {
    const [w, h] = fp.screenResolution.split("x").map(Number);
    // Common headless resolutions
    if ((w === 800 && h === 600) || (w === 1024 && h === 768) || w === 0 || h === 0) {
      fingerprintScore -= 8;
      flags.push("headless_resolution");
    }
  }

  // Touch consistency
  const isMobileUA = /mobile|android|iphone|ipad/i.test(fp.userAgent);
  if (isMobileUA && fp.touchSupport && fp.maxTouchPoints && fp.maxTouchPoints > 0) {
    fingerprintScore += 2;
  } else if (isMobileUA && !fp.touchSupport) {
    fingerprintScore -= 8;
    flags.push("mobile_no_touch");
  }

  // Plugins on desktop Chrome
  if (!isMobileUA && /chrome/i.test(fp.userAgent) && fp.pluginsCount === 0) {
    fingerprintScore -= 8;
    flags.push("chrome_no_plugins");
  }

  // Languages
  if (!fp.languages || fp.languages.length === 0) {
    fingerprintScore -= 5;
    flags.push("no_languages");
  }

  // Math constants (should be consistent)
  if (!fp.mathConstants) {
    fingerprintScore -= 3;
  }

  // Consistency score from client
  if (fp.consistencyScore !== undefined && fp.consistencyScore < 70) {
    fingerprintScore -= 8;
    flags.push("low_consistency");
    if (fp.inconsistencies) {
      flags.push(...fp.inconsistencies);
    }
  }

  // ==================== BEHAVIORAL ANALYSIS (0-25) ====================
  
  const minTime = link.behavior_time_ms || 2000;
  
  // Time on page
  if (fp.timeOnPage >= minTime + 500) {
    behaviorScore += 6;
  } else if (fp.timeOnPage < 500) {
    behaviorScore -= 20;
    flags.push("INSTANT_ACCESS");
  } else if (fp.timeOnPage < 1000) {
    behaviorScore -= 15;
    flags.push("very_fast");
  } else if (fp.timeOnPage < minTime) {
    behaviorScore -= 8;
    flags.push("fast_access");
  }

  // Mouse behavior analysis
  const mouseAnalysis = analyzeMouseBehavior(fp);
  behaviorScore += mouseAnalysis.score;
  flags.push(...mouseAnalysis.flags);

  // Click events
  if (fp.clickEvents && fp.clickEvents > 0) {
    behaviorScore += 3;
  }

  // Scroll
  if (fp.scrollEvents > 0) {
    behaviorScore += 2;
  }
  if (fp.scrollDepth && fp.scrollDepth > 20) {
    behaviorScore += 2;
  }

  // Focus changes
  if (fp.focusChanges && fp.focusChanges > 0 && fp.focusChanges < 15) {
    behaviorScore += 2;
  }

  // DOM manipulation time (bots often have unusual times)
  if (fp.domManipulationTime !== undefined) {
    if (fp.domManipulationTime < 1 || fp.domManipulationTime > 500) {
      behaviorScore -= 5;
      flags.push("abnormal_dom_time");
    }
  }

  // Proof of work validation
  const powResult = validateProofOfWork(fp.proofOfWork);
  if (!powResult.valid) {
    behaviorScore -= 8;
    flags.push("pow_failed");
  } else if (powResult.time < 100) {
    behaviorScore -= 5;
    flags.push("pow_too_fast");
  }

  // JS challenge validation
  const jsResult = validateJsChallenge(fp.jsChallenge);
  if (!jsResult.valid) {
    behaviorScore -= 5;
    flags.push(...jsResult.flags);
  }

  // Timing variance (very low = robotic)
  if (fp.timingVariance !== undefined && fp.timingVariance < 0.00001) {
    behaviorScore -= 8;
    flags.push("robotic_timing");
  }

  // ==================== AUTOMATION DETECTION (0-25) ====================
  
  // Critical automation indicators
  if (fp.hasWebdriver) {
    automationScore = 0;
    flags.push("WEBDRIVER");
  }

  if (fp.hasSelenium) {
    automationScore = 0;
    flags.push("SELENIUM");
  }

  if (fp.hasPuppeteer) {
    automationScore = 0;
    flags.push("PUPPETEER");
  }

  if (fp.hasPlaywright) {
    automationScore = 0;
    flags.push("PLAYWRIGHT");
  }

  if (fp.hasCypress) {
    automationScore -= 25;
    flags.push("CYPRESS");
  }

  if (fp.hasPhantom) {
    automationScore -= 25;
    flags.push("PHANTOM");
  }

  if (fp.hasNightmare) {
    automationScore -= 25;
    flags.push("NIGHTMARE");
  }

  // Headless + Automated combination
  if (fp.isHeadless && fp.isAutomated) {
    automationScore = 0;
    flags.push("HEADLESS_AUTOMATED");
  } else if (fp.isHeadless) {
    automationScore -= 15;
    flags.push("headless");
  } else if (fp.isAutomated) {
    automationScore -= 18;
    flags.push("automated");
  }

  // Error stack pattern
  if (fp.errorStackPattern === "automation_detected") {
    automationScore -= 20;
    flags.push("automation_in_stack");
  }

  // Bot UA patterns
  for (const pattern of BOT_UA_PATTERNS) {
    if (pattern.test(fp.userAgent)) {
      automationScore = 0;
      flags.push("BOT_UA");
      break;
    }
  }

  // Storage disabled
  if (!fp.cookiesEnabled && !fp.localStorage) {
    automationScore -= 10;
    flags.push("storage_disabled");
  }

  // Performance entries
  if (fp.performanceEntries === 0) {
    automationScore -= 5;
    flags.push("no_perf_entries");
  }

  // Media devices
  if (fp.mediaDevices === 0) {
    automationScore -= 5;
    flags.push("no_media_devices");
  }

  // Missing browser APIs that real browsers have
  if (fp.webWorkerSupport === false) {
    automationScore -= 3;
    flags.push("no_workers");
  }
  if (fp.wasmSupport === false) {
    automationScore -= 3;
    flags.push("no_wasm");
  }

  // ==================== NETWORK ANALYSIS (0-25) ====================
  
  const cfCountry = headers.get("cf-ipcountry") || 
                    headers.get("x-vercel-ip-country") ||
                    headers.get("x-country-code");
  
  const cfIp = headers.get("cf-connecting-ip") ||
               headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               headers.get("x-real-ip");

  const cfOrg = headers.get("cf-isp") || headers.get("x-isp") || "";

  // Datacenter detection
  for (const keyword of DATACENTER_KEYWORDS) {
    if (cfOrg.toLowerCase().includes(keyword)) {
      networkScore -= 18;
      flags.push("DATACENTER_IP");
      break;
    }
  }

  // Google internal headers
  const suspiciousHeaders = ["x-google-internal", "x-adsbot-google", "x-goog-", "x-fb-", "x-meta-"];
  for (const header of suspiciousHeaders) {
    if (headers.get(header)) {
      networkScore -= 20;
      flags.push("PLATFORM_HEADER");
      break;
    }
  }

  // Via header
  const viaHeader = headers.get("via") || "";
  if (/google|facebook|meta|microsoft/i.test(viaHeader)) {
    networkScore -= 15;
    flags.push("via_bot");
  }

  // Accept header
  const acceptHeader = headers.get("accept") || "";
  if (!acceptHeader.includes("text/html") && !acceptHeader.includes("*/*")) {
    networkScore -= 8;
    flags.push("no_html_accept");
  }

  // Accept-Language
  const acceptLang = headers.get("accept-language") || "";
  if (!acceptLang || acceptLang === "*") {
    networkScore -= 8;
    flags.push("no_accept_lang");
  }

  // Country filtering
  if (link.allowed_countries?.length > 0 && cfCountry && !link.allowed_countries.includes(cfCountry)) {
    networkScore -= 25;
    flags.push("country_blocked");
  }
  if (link.blocked_countries?.length > 0 && cfCountry && link.blocked_countries.includes(cfCountry)) {
    networkScore -= 25;
    flags.push("country_blocked");
  }

  // Device filtering
  const deviceType = getDeviceType(fp.userAgent);
  if (link.allowed_devices?.length > 0 && !link.allowed_devices.includes(deviceType)) {
    networkScore -= 15;
    flags.push("device_filtered");
  }

  // Connection RTT (very low can indicate datacenter)
  if (fp.connectionRtt !== undefined && fp.connectionRtt > 0 && fp.connectionRtt < 10) {
    networkScore -= 5;
    flags.push("low_rtt");
  }

  // ==================== COMBINED ANALYSIS ====================
  
  // Count critical flags
  const criticalFlags = flags.filter(f => 
    f === "WEBDRIVER" || f === "SELENIUM" || f === "PUPPETEER" || 
    f === "PLAYWRIGHT" || f === "BOT_UA" || f === "HEADLESS_AUTOMATED" ||
    f === "DATACENTER_IP" || f === "PLATFORM_HEADER" || f === "SOFTWARE_RENDERER"
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
    fp.canvasNoise,
    fp.audioNoise,
    !powResult.valid,
  ].filter(Boolean).length;

  // Bot profile detection
  if (suspiciousSignals >= 6) {
    automationScore = Math.max(0, automationScore - 15);
    flags.push("HIGH_BOT_SCORE");
  } else if (suspiciousSignals >= 4) {
    automationScore = Math.max(0, automationScore - 10);
    flags.push("MEDIUM_BOT_SCORE");
  } else if (suspiciousSignals >= 3) {
    automationScore = Math.max(0, automationScore - 5);
    flags.push("low_bot_score");
  }

  // Normalize scores
  fingerprintScore = Math.max(0, Math.min(25, fingerprintScore));
  behaviorScore = Math.max(0, Math.min(25, behaviorScore));
  networkScore = Math.max(0, Math.min(25, networkScore));
  automationScore = Math.max(0, Math.min(25, automationScore));

  const total = fingerprintScore + behaviorScore + networkScore + automationScore;
  
  // Calculate confidence and risk level
  let confidence: number;
  let riskLevel: "low" | "medium" | "high" | "critical";
  
  if (criticalFlags > 0) {
    confidence = 98;
    riskLevel = "critical";
  } else if (suspiciousSignals >= 6) {
    confidence = 90;
    riskLevel = "high";
  } else if (suspiciousSignals >= 4) {
    confidence = 75;
    riskLevel = "medium";
  } else if (suspiciousSignals >= 2) {
    confidence = 60;
    riskLevel = "medium";
  } else {
    confidence = 50;
    riskLevel = "low";
  }

  return {
    total,
    fingerprint: fingerprintScore,
    behavior: behaviorScore,
    network: networkScore,
    automation: automationScore,
    flags,
    confidence,
    riskLevel,
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
    fp.pluginsHash,
    fp.webglHash,
  ].filter(Boolean).join("|");
  
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

    // No fingerprint - strict mode
    if (!fingerprint) {
      console.log("[Cloaker] No fingerprint - blocking");
      
      const ua = req.headers.get("user-agent") || "";
      const isBot = BOT_UA_PATTERNS.some(p => p.test(ua));
      
      if (isBot || link.collect_fingerprint) {
        return new Response(
          JSON.stringify({ redirectUrl: link.safe_url, decision: "blocked_no_fp" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase.from("cloaked_links").update({ clicks_count: link.clicks_count + 1 }).eq("id", link.id);
      return new Response(
        JSON.stringify({ redirectUrl: link.target_url, decision: "allowed_basic" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate comprehensive score
    const scoreResult = calculateScore(fingerprint as FingerprintData, link, req.headers);
    const fingerprintHash = generateFingerprintHash(fingerprint);
    
    console.log(`[Cloaker] Score: ${scoreResult.total}, Risk: ${scoreResult.riskLevel}, Confidence: ${scoreResult.confidence}%`);
    console.log(`[Cloaker] Breakdown: FP=${scoreResult.fingerprint}, B=${scoreResult.behavior}, N=${scoreResult.network}, A=${scoreResult.automation}`);
    console.log(`[Cloaker] Flags: ${scoreResult.flags.slice(0, 10).join(", ") || "none"}`);

    const cfCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country");
    const cfIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const cfCity = req.headers.get("cf-city") || "";

    // Decision logic
    const minScore = link.min_score || 40;
    let decision: "allow" | "block" | "safe";
    let redirectUrl: string;

    // Check for critical flags first - always block
    const hasCriticalFlags = scoreResult.flags.some(f => 
      f === "WEBDRIVER" || f === "SELENIUM" || f === "PUPPETEER" || 
      f === "PLAYWRIGHT" || f === "BOT_UA" || f === "HEADLESS_AUTOMATED" ||
      f === "HIGH_BOT_SCORE" || f === "SOFTWARE_RENDERER" || f === "DATACENTER_IP"
    );

    if (hasCriticalFlags) {
      decision = "safe";
      redirectUrl = link.safe_url;
      console.log("[Cloaker] BLOCKED: Critical flag detected");
    } else if (scoreResult.riskLevel === "critical" || scoreResult.riskLevel === "high") {
      decision = "safe";
      redirectUrl = link.safe_url;
      console.log("[Cloaker] BLOCKED: High risk level");
    } else if (scoreResult.total >= minScore) {
      decision = "allow";
      redirectUrl = link.target_url;
    } else {
      decision = "block";
      redirectUrl = link.safe_url;
      console.log(`[Cloaker] BLOCKED: Score ${scoreResult.total} < ${minScore}`);
    }

    // Log visitor (async)
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
      } catch (e) {
        console.error("[Cloaker] Log error:", e);
      }
    })();

    await supabase.from("cloaked_links").update({ clicks_count: link.clicks_count + 1 }).eq("id", link.id);

    console.log(`[Cloaker] Decision: ${decision}, URL: ${redirectUrl.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({ 
        redirectUrl, 
        decision,
        score: scoreResult.total,
        minScore,
        confidence: scoreResult.confidence,
        riskLevel: scoreResult.riskLevel,
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
