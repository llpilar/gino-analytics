import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== GOOGLE ADS BOT DETECTION (CRITICAL - ENHANCED) ====================

// === GOOGLE CRAWLERS BY PURPOSE (Official Documentation - December 2024) ===

// 1. INDEXING (Core Search) - Main crawlers
const GOOGLE_INDEXING_PATTERNS = [
  // Googlebot Desktop - exact UA
  /Mozilla\/5\.0 \(compatible; Googlebot\/2\.1/i,
  /Googlebot\/2\.1/i,
  /googlebot/i,
  
  // Googlebot Smartphone - exact UA
  /Nexus 5X.*Googlebot/i,
  /Mobile.*Googlebot/i,
  /Googlebot.*Mobile/i,
];

// 2. DISCOVERY (Link & Sitemap Crawling)
const GOOGLE_DISCOVERY_PATTERNS = [
  // Googlebot-Image
  /Googlebot-Image\/1\.0/i,
  /Googlebot-Image/i,
  
  // Storebot-Google (Shopping)
  /Storebot-Google\/1\./i,
  /Storebot-Google/i,
];

// 3. RENDERING (JavaScript & Visual)
const GOOGLE_RENDERING_PATTERNS = [
  // Googlebot Chrome-Lighthouse
  /Chrome\/.*Googlebot/i,
  /Googlebot.*Chrome/i,
  
  // Mediapartners-Google (AdSense)
  /Mediapartners-Google/i,
  /Mediapartners/i,
];

// 4. SPECIALIZED (Ads Testing & Services) - CRITICAL FOR CLOAKING
const GOOGLE_ADS_SPECIALIZED_PATTERNS = [
  // AdsBot-Google - Desktop (CRITICAL)
  /Mozilla\/5\.0 \(compatible; AdsBot-Google/i,
  /AdsBot-Google/i,
  /adsbot/i,
  
  // AdsBot-Google-Mobile (CRITICAL)
  /AdsBot-Google-Mobile/i,
  /iPhone.*AdsBot-Google/i,
  
  // Google-Extended
  /Google-Extended\/1\.0/i,
  /Google-Extended/i,
  
  // AMP Cache
  /google-amp-cache/i,
  /googleusercontent\.com/i,
];

// Combined Google Ads specific patterns (all that should be blocked for ad cloaking)
const GOOGLE_ADS_BOT_PATTERNS = [
  // === EXACT USER-AGENT MATCHES (from official docs) ===
  
  // AdsBot - Desktop
  /Mozilla\/5\.0 \(compatible; AdsBot-Google \(\+http:\/\/www\.google\.com\/adsbot\.html\)\)/i,
  /Mozilla\/5\.0 \(compatible; AdsBot-Google/i,
  /AdsBot-Google/i,
  /adsbot/i,
  
  // AdsBot - Mobile
  /Mozilla\/5\.0 \(iPhone; CPU iPhone OS.*AdsBot-Google-Mobile/i,
  /AdsBot-Google-Mobile/i,
  
  // Mediapartners (AdSense content crawler)
  /Mediapartners-Google/i,
  /Mediapartners/i,
  
  // Storebot (Google Shopping)
  /Mozilla\/5\.0 \(compatible; Storebot-Google\/1\./i,
  /Storebot-Google/i,
  
  // Google-Extended (Analysis crawling)
  /Mozilla\/5\.0 \(compatible; Google-Extended\/1\.0/i,
  /Google-Extended/i,
  
  // === GOOGLEBOT VARIANTS ===
  
  // Googlebot Desktop
  /Mozilla\/5\.0 \(compatible; Googlebot\/2\.1; \+http:\/\/www\.google\.com\/bot\.html\)/i,
  
  // Googlebot Smartphone
  /Mozilla\/5\.0 \(Linux; Android.*Nexus 5X.*Googlebot\/2\.1/i,
  
  // Googlebot Image
  /Googlebot-Image\/1\.0/i,
  /Googlebot-Image/i,
  
  // Generic Googlebot
  /Googlebot\/2\.1/i,
  /Googlebot/i,
  /googlebot/i,
  
  // === OTHER GOOGLE SERVICES ===
  
  // Google Quality & Inspection
  /google-inspectiontool/i,
  /google-safety/i,
  /google-site-verification/i,
  /google-structured-data/i,
  /google-test/i,
  /google-adwords-instant/i,
  /google-adwords-express/i,
  /google-adwords-displayads/i,
  
  // Google Shopping & Merchant
  /google-shopping/i,
  /google-shopping-quality/i,
  /google-product-search/i,
  /google-merchant/i,
  
  // Other Google bots
  /apis-google/i,
  /feedfetcher-google/i,
  /google-read-aloud/i,
  /duplex/i,
  /google-favicon/i,
  /google-speakr/i,
  /google-cloud/i,
  /gce-agent/i,
  
  // AMP Cache
  /google-amp-cache-request/i,
  /googleusercontent\.com/i,
];

// === ENHANCED: Google Ads verification patterns that bypass standard detection ===
const GOOGLE_ADS_STEALTH_PATTERNS = [
  // Google Ads Quality Rater patterns (human reviewers with modified browsers)
  /Chrome\/\d+.*\bGoogle\b/i,
  /Chrome\/\d+.*\bgoogle\.com\b/i,
  
  // Google internal tools
  /Google-AMPHTML/i,
  /Google Web Preview/i,
  /Google-PageRenderer/i,
  /Google-PhysicalWebDemo/i,
  /Google-Certificates-Bridge/i,
  /Google-YouTube-Links/i,
  /GoogleProducer/i,
  /GoogleAssociationService/i,
  /Google-Adwords-Instant/i,
  /Google-AMPHTML/i,
  
  // Lighthouse (used by Google for performance audits of landing pages)
  /Chrome-Lighthouse/i,
  /Lighthouse/i,
  /lighthouse/i,
  /PSTS\/\d/i, // Privacy Sandbox Testing
  
  // Google Web Light (mobile optimization)
  /googleweblight/i,
  /Google-HTTP-Java-Client/i,
  
  // Google Transparency Report
  /Google-Transparency-Report/i,
  
  // Internal Google testing
  /Google-Apps-Script/i,
  /GoogleSecurityScanner/i,
  /Google-Site-Verification/i,
];

// === CRITICAL: Browser fingerprint patterns that indicate Google infrastructure ===
const GOOGLE_INFRASTRUCTURE_INDICATORS = {
  // Chrome versions commonly used by Google bots (often slightly behind latest)
  suspiciousChromeVersions: [
    /Chrome\/119\.0\.\d+\.\d+/,
    /Chrome\/120\.0\.\d+\.\d+/,
    /Chrome\/121\.0\.\d+\.\d+/,
    /Chrome\/122\.0\.\d+\.\d+/,
  ],
  
  // Known Google datacenter ASN patterns
  googleASNs: [
    "AS15169", // Google LLC
    "AS396982", // Google Cloud
    "AS36492", // Google Data Centers
    "AS139070", // Google Asia
    "AS139190", // Google Cloud Asia
  ],
  
  // Specific screen resolutions used by bots
  botResolutions: [
    "800x600",
    "1024x768", 
    "1366x768",
    "1920x1080",
  ],
};

// Google's known IP ranges (IPv4) - Updated December 2024
// Source: https://www.gstatic.com/ipranges/goog.json + cloud.json + special-crawlers.json
const GOOGLE_IP_RANGES = [
  // Google bot/crawler ranges (crawlers)
  { start: "64.233.160.0", end: "64.233.191.255" },
  { start: "66.102.0.0", end: "66.102.15.255" },
  { start: "66.249.64.0", end: "66.249.95.255" },   // Googlebot main range
  { start: "72.14.192.0", end: "72.14.255.255" },
  { start: "74.125.0.0", end: "74.125.255.255" },
  { start: "108.177.0.0", end: "108.177.127.255" },
  { start: "142.250.0.0", end: "142.251.255.255" },
  { start: "172.217.0.0", end: "172.217.255.255" },
  { start: "173.194.0.0", end: "173.194.255.255" },
  { start: "209.85.128.0", end: "209.85.255.255" },
  { start: "216.58.192.0", end: "216.58.223.255" },
  { start: "216.239.32.0", end: "216.239.63.255" },
  
  // Google Cloud ranges (often used for ad verification)
  { start: "34.64.0.0", end: "34.127.255.255" },
  { start: "35.184.0.0", end: "35.247.255.255" },
  { start: "104.154.0.0", end: "104.155.255.255" },
  { start: "104.196.0.0", end: "104.199.255.255" },
  { start: "130.211.0.0", end: "130.211.255.255" },
  { start: "146.148.0.0", end: "146.148.127.255" },
  
  // Additional AdsBot ranges
  { start: "66.249.66.0", end: "66.249.66.255" },    // AdsBot-Google
  { start: "66.249.68.0", end: "66.249.69.255" },    // Mediapartners-Google
  { start: "66.249.79.0", end: "66.249.79.255" },    // AdsBot-Google-Mobile
  
  // === NEW: Additional Google ranges often missed ===
  // Google special crawlers (user-triggered fetchers)
  { start: "192.178.0.0", end: "192.178.255.255" },
  { start: "199.36.153.0", end: "199.36.153.255" },  // Private Google access
  { start: "199.36.154.0", end: "199.36.155.255" },
  
  // Google global cache
  { start: "74.114.24.0", end: "74.114.31.255" },
  
  // Additional Google Cloud Platform ranges
  { start: "23.236.48.0", end: "23.236.63.255" },
  { start: "23.251.128.0", end: "23.251.191.255" },
  { start: "107.167.160.0", end: "107.167.191.255" },
  { start: "107.178.192.0", end: "107.178.255.255" },
  { start: "162.216.148.0", end: "162.216.151.255" },
  { start: "162.222.176.0", end: "162.222.183.255" },
  
  // Google Fiber
  { start: "136.22.0.0", end: "136.23.255.255" },
  
  // Cloud CDN / Load Balancer
  { start: "34.128.0.0", end: "34.159.255.255" },
  { start: "35.186.0.0", end: "35.186.127.255" },
];

// Convert IP to number for range checking
function ipToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// Check if IP is in Google's ranges
function isGoogleIP(ip: string): boolean {
  if (!ip || !ip.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    return false;
  }
  
  const ipNum = ipToNumber(ip);
  
  for (const range of GOOGLE_IP_RANGES) {
    const startNum = ipToNumber(range.start);
    const endNum = ipToNumber(range.end);
    if (ipNum >= startNum && ipNum <= endNum) {
      return true;
    }
  }
  
  return false;
}

// === NEW: Check for suspicious timing patterns ===
function hasGoogleTimingPattern(headers: Headers): boolean {
  // Google bots often have very consistent timing
  const requestTime = headers.get("x-request-time") || "";
  const cfRay = headers.get("cf-ray") || "";
  
  // Check for rapid sequential requests (bots crawl fast)
  return false; // Placeholder for timing analysis
}

// === NEW: Analyze header anomalies specific to Google ===
function analyzeGoogleHeaders(headers: Headers): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  
  // 1. Check Via header
  const via = headers.get("via") || "";
  if (via.toLowerCase().includes("google") || via.toLowerCase().includes("gws")) {
    score += 25;
    reasons.push("google_via_header");
  }
  
  // 2. Check for Google-specific headers
  const googleHeaders = [
    "x-google-cache",
    "x-goog-authenticated-user-email",
    "x-goog-authenticated-user-id", 
    "x-goog-iap-jwt-assertion",
    "x-goog-request-params",
    "x-goog-user-project",
    "x-gfe-backend-request-info",
    "x-gfe-request-trace",
    "x-google-serverless-node-envoy-config-path",
  ];
  
  for (const h of googleHeaders) {
    if (headers.get(h)) {
      score += 40;
      reasons.push(`google_header_${h}`);
    }
  }
  
  // 3. Check Accept header patterns
  const accept = headers.get("accept") || "";
  
  // Google bots often have simplified Accept headers
  if (accept === "text/html" || accept === "*/*") {
    score += 10;
    reasons.push("minimal_accept_header");
  }
  
  // 4. Check Accept-Language
  const acceptLang = headers.get("accept-language") || "";
  if (acceptLang === "" || acceptLang === "*" || acceptLang === "en-US,en;q=0.9") {
    score += 8;
    reasons.push("generic_accept_language");
  }
  
  // 5. Check Accept-Encoding (bots often have standard patterns)
  const acceptEncoding = headers.get("accept-encoding") || "";
  if (acceptEncoding === "gzip, deflate" || acceptEncoding === "gzip, deflate, br") {
    // Common but not definitive
    score += 3;
  }
  
  // 6. Check for missing headers that real browsers have
  const secFetchDest = headers.get("sec-fetch-dest") || "";
  const secFetchMode = headers.get("sec-fetch-mode") || "";
  const secFetchSite = headers.get("sec-fetch-site") || "";
  const secFetchUser = headers.get("sec-fetch-user") || "";
  
  const missingSec = !secFetchDest && !secFetchMode && !secFetchSite;
  if (missingSec) {
    score += 15;
    reasons.push("missing_sec_fetch_headers");
  }
  
  // 7. Check Upgrade-Insecure-Requests
  const upgradeInsecure = headers.get("upgrade-insecure-requests") || "";
  if (!upgradeInsecure) {
    score += 5;
    reasons.push("missing_upgrade_insecure");
  }
  
  // 8. Check for DNT header (bots rarely set it)
  const dnt = headers.get("dnt") || "";
  if (!dnt) {
    score += 2;
  }
  
  // 9. Check referer (Google bots often have no referer or google.com referer)
  const referer = headers.get("referer") || "";
  if (!referer) {
    score += 5;
    reasons.push("no_referer");
  } else if (/google\.com/i.test(referer)) {
    score += 15;
    reasons.push("google_referer");
  }
  
  // 10. Check CF-Connecting-IP vs X-Forwarded-For consistency
  const cfIp = headers.get("cf-connecting-ip") || "";
  const xff = headers.get("x-forwarded-for") || "";
  if (cfIp && xff && !xff.includes(cfIp)) {
    score += 10;
    reasons.push("ip_header_mismatch");
  }
  
  return { score, reasons };
}

// === NEW: Deep user-agent analysis ===
function deepAnalyzeUserAgent(userAgent: string): { score: number; reasons: string[]; isDefiniteBot: boolean } {
  const reasons: string[] = [];
  let score = 0;
  let isDefiniteBot = false;
  
  const ua = userAgent.toLowerCase();
  
  // 1. Direct bot indicators (definitive)
  if (/googlebot|adsbot|mediapartners|storebot/i.test(userAgent)) {
    isDefiniteBot = true;
    score += 100;
    reasons.push("definitive_google_bot_ua");
  }
  
  // 2. Check for bot substring anywhere
  if (/bot/i.test(userAgent) && !/cubot|about/i.test(userAgent)) {
    score += 50;
    reasons.push("contains_bot");
  }
  
  // 3. Check for crawler/spider patterns
  if (/crawler|spider|scraper|fetch|http/i.test(userAgent)) {
    score += 40;
    reasons.push("crawler_pattern");
  }
  
  // 4. Check for headless browser signatures
  if (/headless|phantomjs|nightmare|electron|puppeteer|playwright|selenium|webdriver/i.test(userAgent)) {
    score += 60;
    reasons.push("headless_signature");
  }
  
  // 5. Stealth patterns - Google's hidden inspection tools
  for (const pattern of GOOGLE_ADS_STEALTH_PATTERNS) {
    if (pattern.test(userAgent)) {
      score += 30;
      reasons.push("google_stealth_pattern");
      break;
    }
  }
  
  // 6. Check Chrome version anomalies
  const chromeMatch = userAgent.match(/Chrome\/(\d+)\./);
  if (chromeMatch) {
    const chromeVersion = parseInt(chromeMatch[1]);
    // Current stable is around 120-130. Very old or very new = suspicious
    if (chromeVersion < 90 || chromeVersion > 140) {
      score += 20;
      reasons.push("unusual_chrome_version");
    }
  }
  
  // 7. Check for inconsistent platform claims
  if (/windows/i.test(ua) && /android/i.test(ua)) {
    score += 25;
    reasons.push("platform_mismatch");
  }
  if (/iphone/i.test(ua) && /android/i.test(ua)) {
    score += 25;
    reasons.push("platform_mismatch");
  }
  if (/linux/i.test(ua) && /windows nt/i.test(ua)) {
    score += 25;
    reasons.push("platform_mismatch");
  }
  
  // 8. Check for missing expected components
  // Real Chrome always has AppleWebKit, Safari token
  if (/chrome/i.test(ua) && !/applewebkit/i.test(ua)) {
    score += 30;
    reasons.push("missing_webkit");
  }
  
  // 9. Check for empty or minimal UA
  if (userAgent.length < 50) {
    score += 35;
    reasons.push("minimal_user_agent");
  }
  
  // 10. Check for specific Google internal patterns
  if (/google\.com|googleapis|gstatic/i.test(userAgent)) {
    score += 25;
    reasons.push("google_internal_reference");
  }
  
  // 11. Check for URL in UA (common for bots)
  if (/https?:\/\//i.test(userAgent)) {
    score += 20;
    reasons.push("url_in_ua");
  }
  
  return { score, reasons, isDefiniteBot };
}

// Comprehensive Google Ads bot detection
interface GoogleBotResult {
  isGoogleBot: boolean;
  isAdsBot: boolean;
  confidence: number;
  reasons: string[];
  isDefinitive: boolean;
}

function detectGoogleAdsBot(userAgent: string, ip: string, headers: Headers): GoogleBotResult {
  const reasons: string[] = [];
  let isGoogleBot = false;
  let isAdsBot = false;
  let confidence = 0;
  let isDefinitive = false;

  // 1. User-Agent check (most reliable)
  const isAdsUA = GOOGLE_ADS_BOT_PATTERNS.some(p => p.test(userAgent));
  if (isAdsUA) {
    isGoogleBot = true;
    isAdsBot = true;
    confidence += 50;
    reasons.push("google_ads_user_agent");
    isDefinitive = true;
  }

  // 2. Deep user-agent analysis
  const uaAnalysis = deepAnalyzeUserAgent(userAgent);
  if (uaAnalysis.isDefiniteBot) {
    isGoogleBot = true;
    isDefinitive = true;
    confidence = 100;
    reasons.push(...uaAnalysis.reasons);
  } else if (uaAnalysis.score > 30) {
    confidence += Math.min(uaAnalysis.score / 2, 30);
    reasons.push(...uaAnalysis.reasons);
  }

  // 3. IP range check
  if (isGoogleIP(ip)) {
    isGoogleBot = true;
    confidence += 35;
    reasons.push("google_ip_range");
    
    // If IP is Google AND UA mentions ads, definitive
    if (isAdsUA) {
      confidence = 100;
      isDefinitive = true;
    }
  }

  // 4. Header analysis
  const headerAnalysis = analyzeGoogleHeaders(headers);
  confidence += Math.min(headerAnalysis.score, 40);
  reasons.push(...headerAnalysis.reasons);
  
  if (headerAnalysis.score >= 30) {
    isGoogleBot = true;
  }

  // 5. Check for Google-specific via/proxy headers
  const via = headers.get("via") || "";
  if (via.toLowerCase().includes("google") || via.toLowerCase().includes("gws")) {
    confidence += 20;
    reasons.push("google_via_header");
    isGoogleBot = true;
  }

  // 6. Check Accept-Language (Google bots often have specific patterns)
  const acceptLang = headers.get("accept-language") || "";
  if (acceptLang === "" || acceptLang === "*") {
    if (isGoogleBot) {
      confidence += 8;
      reasons.push("empty_accept_language");
    }
  }

  // 7. Reverse DNS hint (if from Google IP but claims Chrome)
  if (isGoogleIP(ip) && /chrome/i.test(userAgent) && !/googlebot|adsbot/i.test(userAgent)) {
    confidence += 15;
    reasons.push("google_ip_spoofed_ua");
    isGoogleBot = true;
  }

  // 8. Check specific AdsBot patterns
  if (/adsbot/i.test(userAgent)) {
    isAdsBot = true;
    isDefinitive = true;
    confidence = Math.max(confidence, 98);
  }
  
  if (/mediapartners/i.test(userAgent)) {
    isAdsBot = true;
    isDefinitive = true;
    confidence = Math.max(confidence, 98);
    reasons.push("mediapartners_google");
  }

  // 9. === NEW: Stealth pattern detection ===
  for (const pattern of GOOGLE_ADS_STEALTH_PATTERNS) {
    if (pattern.test(userAgent)) {
      confidence += 25;
      reasons.push("stealth_google_pattern");
      isGoogleBot = true;
      break;
    }
  }

  // 10. === NEW: Combined signals threshold ===
  // If we have multiple weak signals, treat as Google bot
  const signalCount = reasons.length;
  if (signalCount >= 4 && confidence >= 40) {
    isGoogleBot = true;
    confidence = Math.max(confidence, 75);
  }

  // 11. === NEW: Check for Lighthouse specifically ===
  if (/lighthouse|chrome-lighthouse/i.test(userAgent)) {
    isGoogleBot = true;
    isAdsBot = true; // Lighthouse is used for landing page quality
    confidence = Math.max(confidence, 90);
    reasons.push("lighthouse");
  }

  return {
    isGoogleBot,
    isAdsBot,
    confidence: Math.min(100, confidence),
    reasons,
    isDefinitive,
  };
}

// ==================== BOT & DATACENTER PATTERNS ====================

const BOT_UA_PATTERNS = [
  // Google Ads (CRITICAL) - covered by GOOGLE_ADS_BOT_PATTERNS but kept for general check
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

const DATACENTER_KEYWORDS = [
  "amazon", "aws", "google cloud", "gcp", "microsoft azure", "azure",
  "digitalocean", "linode", "vultr", "ovh", "hetzner", "cloudflare",
  "oracle cloud", "ibm cloud", "alibaba", "tencent", "scaleway",
  "upcloud", "kamatera", "contabo", "hostinger", "godaddy", "rackspace",
  "quadranet", "choopa", "m247", "leaseweb", "datacamp",
];

// ==================== TYPE DEFINITIONS ====================

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
  crossLayer: number;
  entropy: number;
  flags: string[];
  confidence: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  crossLayerIssues: string[];
  entropyAnalysis: EntropyAnalysis;
}

interface EntropyAnalysis {
  overNormalized: boolean;
  lowEntropy: boolean;
  suspiciousPatterns: string[];
  distributionScore: number;
}

interface SessionData {
  fingerprintHash: string;
  firstSeen: Date;
  lastSeen: Date;
  visitCount: number;
  ipHistory: string[];
  decisionHistory: string[];
  scoreHistory: number[];
}

// ==================== UTILITY FUNCTIONS ====================

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
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

// ==================== CROSS-LAYER CONSISTENCY (CRITICAL) ====================

interface CrossLayerResult {
  score: number;
  issues: string[];
  coherenceScore: number;
}

function analyzeCrossLayerConsistency(fp: FingerprintData, headers: Headers): CrossLayerResult {
  const issues: string[] = [];
  let score = 25; // Start with full score
  
  const ua = fp.userAgent || "";
  const uaLower = ua.toLowerCase();
  
  // Parse UA for expected characteristics
  const isMobileUA = /mobile|android|iphone|ipad/i.test(ua);
  const isIOSUA = /iphone|ipad|ipod/i.test(ua);
  const isAndroidUA = /android/i.test(ua);
  const isChromeUA = /chrome/i.test(ua) && !/edge|edg|opr/i.test(ua);
  const isFirefoxUA = /firefox/i.test(ua);
  const isSafariUA = /safari/i.test(ua) && !/chrome|chromium/i.test(ua);
  const isEdgeUA = /edge|edg/i.test(ua);
  const isWindowsUA = /windows/i.test(ua);
  const isMacUA = /mac os|macintosh/i.test(ua);
  const isLinuxUA = /linux/i.test(ua) && !/android/i.test(ua);
  
  // === 1. UA vs Platform consistency ===
  const platform = (fp.platform || "").toLowerCase();
  const navPlatform = (fp.navigatorPlatform || "").toLowerCase();
  
  if (isWindowsUA && !platform.includes("win") && platform !== "") {
    issues.push("ua_platform_mismatch_windows");
    score -= 8;
  }
  if (isMacUA && !platform.includes("mac") && platform !== "") {
    issues.push("ua_platform_mismatch_mac");
    score -= 8;
  }
  if (isIOSUA && !platform.includes("iphone") && !platform.includes("ipad") && platform !== "") {
    issues.push("ua_platform_mismatch_ios");
    score -= 8;
  }
  if (isAndroidUA && !platform.includes("linux") && !platform.includes("android") && platform !== "") {
    issues.push("ua_platform_mismatch_android");
    score -= 5;
  }
  
  // === 2. UA vs Touch support consistency ===
  if (isMobileUA) {
    if (!fp.touchSupport) {
      issues.push("mobile_ua_no_touch");
      score -= 10;
    }
    if (fp.maxTouchPoints === 0) {
      issues.push("mobile_ua_zero_touch_points");
      score -= 8;
    }
  } else {
    // Desktop with touchscreen is valid, but touch with 0 points is weird
    if (fp.touchSupport && fp.maxTouchPoints === 0) {
      issues.push("touch_enabled_zero_points");
      score -= 5;
    }
  }
  
  // === 3. UA vs WebGL renderer consistency ===
  const webglRenderer = (fp.webglRenderer || "").toLowerCase();
  const webglVendor = (fp.webglVendor || "").toLowerCase();
  
  // iOS should have Apple GPU
  if (isIOSUA) {
    if (webglVendor && !webglVendor.includes("apple") && !webglVendor.includes("imagination")) {
      issues.push("ios_non_apple_gpu");
      score -= 12;
    }
  }
  
  // Android should NOT have Apple GPU
  if (isAndroidUA && webglVendor.includes("apple")) {
    issues.push("android_apple_gpu");
    score -= 15;
  }
  
  // Windows should have Intel/AMD/NVIDIA, not Apple
  if (isWindowsUA && webglVendor.includes("apple")) {
    issues.push("windows_apple_gpu");
    score -= 12;
  }
  
  // Mac should have Apple/Intel/AMD
  if (isMacUA && !isIOSUA) {
    if (webglVendor && !webglVendor.includes("apple") && !webglVendor.includes("intel") && 
        !webglVendor.includes("amd") && !webglVendor.includes("nvidia")) {
      // Could be legitimate VM or software renderer
      if (!webglRenderer.includes("swiftshader") && !webglRenderer.includes("llvmpipe")) {
        issues.push("mac_unexpected_gpu_vendor");
        score -= 5;
      }
    }
  }
  
  // === 4. UA version vs WebGL capabilities ===
  // Modern browsers should have WebGL
  const chromeMatch = ua.match(/chrome\/(\d+)/i);
  const firefoxMatch = ua.match(/firefox\/(\d+)/i);
  
  if (chromeMatch) {
    const chromeVersion = parseInt(chromeMatch[1]);
    if (chromeVersion >= 60 && !fp.webglRenderer && !fp.webglVendor) {
      issues.push("modern_chrome_no_webgl");
      score -= 8;
    }
  }
  
  if (firefoxMatch) {
    const ffVersion = parseInt(firefoxMatch[1]);
    if (ffVersion >= 60 && !fp.webglRenderer && !fp.webglVendor) {
      issues.push("modern_firefox_no_webgl");
      score -= 8;
    }
  }
  
  // === 5. Screen resolution vs Device type consistency ===
  if (fp.screenResolution) {
    const [width, height] = fp.screenResolution.split("x").map(Number);
    
    // Mobile with desktop resolution
    if (isMobileUA && width > 2000 && height > 1200) {
      issues.push("mobile_desktop_resolution");
      score -= 8;
    }
    
    // Desktop with tiny resolution (common headless default)
    if (!isMobileUA && (width < 500 || height < 400)) {
      issues.push("desktop_tiny_resolution");
      score -= 10;
    }
    
    // Exact headless defaults
    if (width === 800 && height === 600) {
      issues.push("headless_default_resolution");
      score -= 12;
    }
  }
  
  // === 6. Device memory vs Device type ===
  if (fp.deviceMemory) {
    // High-end desktop claiming very low memory
    if (!isMobileUA && isWindowsUA && fp.deviceMemory < 2 && fp.hardwareConcurrency > 4) {
      issues.push("desktop_low_memory_high_cpu");
      score -= 6;
    }
  }
  
  // === 7. Hardware concurrency consistency ===
  if (fp.hardwareConcurrency) {
    // Unusual values
    if (fp.hardwareConcurrency === 1 && !isMobileUA) {
      issues.push("single_core_desktop");
      score -= 5;
    }
    // More than 128 cores is suspicious
    if (fp.hardwareConcurrency > 128) {
      issues.push("excessive_cores");
      score -= 8;
    }
  }
  
  // === 8. Language vs Timezone consistency ===
  if (fp.timezone && fp.language) {
    const tz = fp.timezone.toLowerCase();
    const lang = fp.language.toLowerCase();
    
    // Chinese timezone with English-only language
    if (tz.includes("asia/shanghai") || tz.includes("asia/beijing")) {
      if (lang.startsWith("en") && !lang.includes("cn") && !lang.includes("zh")) {
        issues.push("china_tz_english_only");
        score -= 3; // Minor - could be expat
      }
    }
    
    // Japan timezone with non-Japanese browser
    if (tz.includes("asia/tokyo")) {
      if (lang.startsWith("en") && !lang.includes("ja")) {
        // Common for expats, minor flag
      }
    }
  }
  
  // === 9. Plugins vs Browser type ===
  if (isChromeUA && !isMobileUA && fp.pluginsCount === 0) {
    issues.push("chrome_desktop_no_plugins");
    score -= 5;
  }
  
  // Safari should NOT have plugins
  if (isSafariUA && fp.pluginsCount > 0) {
    // Actually Safari can have plugins in some cases
  }
  
  // === 10. CSS Media Query vs Device type ===
  if (fp.cssMediaFingerprint) {
    const cssMedia = fp.cssMediaFingerprint;
    // Format: "1100000010101" - each bit is a media query result
    // (hover: hover) should be 1 on desktop with mouse
    // (pointer: coarse) should be 1 on touch devices
    
    if (cssMedia.length >= 8) {
      const hoverHover = cssMedia[5] === "1";
      const pointerFine = cssMedia[6] === "1";
      const pointerCoarse = cssMedia[7] === "1";
      
      if (isMobileUA && pointerFine && !pointerCoarse) {
        issues.push("mobile_fine_pointer");
        score -= 6;
      }
      
      if (!isMobileUA && !hoverHover && !fp.touchSupport) {
        issues.push("desktop_no_hover_no_touch");
        score -= 5;
      }
    }
  }
  
  // Calculate coherence score (0-100)
  const coherenceScore = Math.max(0, Math.min(100, score * 4));
  
  return {
    score: Math.max(0, Math.min(25, score)),
    issues,
    coherenceScore,
  };
}

// ==================== ENTROPY & STATISTICAL ANALYSIS ====================

function analyzeEntropy(fp: FingerprintData, supabase: any, linkId: string): EntropyAnalysis {
  const suspiciousPatterns: string[] = [];
  let distributionScore = 100;
  let overNormalized = false;
  let lowEntropy = false;
  
  // === 1. Detect over-normalization (too perfect) ===
  
  // Perfect round numbers are suspicious
  if (fp.deviceMemory && fp.deviceMemory === Math.floor(fp.deviceMemory)) {
    // deviceMemory is always rounded, so this is fine
  }
  
  // Screen resolution - check for common "fake" values
  if (fp.screenResolution) {
    const commonFakes = ["1920x1080", "1366x768", "1280x720"];
    const [w, h] = fp.screenResolution.split("x").map(Number);
    
    // Perfectly standard resolution is fine, but check other factors
    if (fp.devicePixelRatio === 1 && w === 1920 && h === 1080) {
      // Very common, but combined with other perfect values = suspicious
    }
  }
  
  // === 2. Behavioral entropy ===
  
  // Mouse movement entropy
  if (fp.mousePath && fp.mousePath.length > 5) {
    const path = fp.mousePath;
    
    // Calculate direction changes
    let directionChanges = 0;
    for (let i = 2; i < path.length; i++) {
      const dx1 = path[i-1].x - path[i-2].x;
      const dy1 = path[i-1].y - path[i-2].y;
      const dx2 = path[i].x - path[i-1].x;
      const dy2 = path[i].y - path[i-1].y;
      
      const angle1 = Math.atan2(dy1, dx1);
      const angle2 = Math.atan2(dy2, dx2);
      
      if (Math.abs(angle1 - angle2) > 0.1) {
        directionChanges++;
      }
    }
    
    const changeRatio = directionChanges / (path.length - 2);
    
    // Too linear (robot)
    if (changeRatio < 0.1) {
      suspiciousPatterns.push("linear_mouse_path");
      distributionScore -= 15;
      lowEntropy = true;
    }
    
    // Too chaotic (random noise injection)
    if (changeRatio > 0.9) {
      suspiciousPatterns.push("chaotic_mouse_path");
      distributionScore -= 10;
      overNormalized = true;
    }
    
    // Check timing regularity
    const timeDiffs: number[] = [];
    for (let i = 1; i < path.length; i++) {
      timeDiffs.push(path[i].t - path[i-1].t);
    }
    
    if (timeDiffs.length > 3) {
      const avgTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
      const variance = timeDiffs.reduce((a, b) => a + Math.pow(b - avgTime, 2), 0) / timeDiffs.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / avgTime; // Coefficient of variation
      
      // Too consistent timing (robotic)
      if (cv < 0.1 && avgTime > 0) {
        suspiciousPatterns.push("robotic_mouse_timing");
        distributionScore -= 12;
        lowEntropy = true;
      }
      
      // Perfectly random timing (artificial noise)
      if (cv > 2.0) {
        suspiciousPatterns.push("artificial_mouse_timing");
        distributionScore -= 8;
        overNormalized = true;
      }
    }
  }
  
  // === 3. Velocity distribution ===
  if (fp.mouseVelocities && fp.mouseVelocities.length > 5) {
    const velocities = fp.mouseVelocities;
    const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / velocities.length;
    
    // Constant velocity (robot)
    if (variance < 0.001 && avg > 0) {
      suspiciousPatterns.push("constant_velocity");
      distributionScore -= 12;
      lowEntropy = true;
    }
    
    // Check for bimodal distribution (stop-go pattern)
    const lowVelocities = velocities.filter(v => v < avg * 0.3).length;
    const highVelocities = velocities.filter(v => v > avg * 1.7).length;
    
    if (lowVelocities > velocities.length * 0.4 && highVelocities > velocities.length * 0.3) {
      suspiciousPatterns.push("bimodal_velocity");
      distributionScore -= 5;
    }
  }
  
  // === 4. Timing variance analysis ===
  if (fp.jsChallenge !== undefined) {
    // Too low variance = emulated environment
    if (fp.jsChallenge < 0.00001) {
      suspiciousPatterns.push("zero_timing_variance");
      distributionScore -= 15;
      lowEntropy = true;
    }
    
    // Too high variance = artificial noise
    if (fp.jsChallenge > 100) {
      suspiciousPatterns.push("excessive_timing_variance");
      distributionScore -= 10;
      overNormalized = true;
    }
  }
  
  // === 5. Canvas/Audio noise detection ===
  if (fp.canvasNoise) {
    suspiciousPatterns.push("canvas_noise_detected");
    distributionScore -= 8;
    overNormalized = true;
  }
  
  if (fp.audioNoise) {
    suspiciousPatterns.push("audio_noise_detected");
    distributionScore -= 8;
    overNormalized = true;
  }
  
  // === 6. DOM manipulation timing ===
  if (fp.domManipulationTime !== undefined) {
    // Instant DOM manipulation (headless)
    if (fp.domManipulationTime < 0.5) {
      suspiciousPatterns.push("instant_dom_manipulation");
      distributionScore -= 10;
      lowEntropy = true;
    }
    
    // Very slow (debugging or throttled)
    if (fp.domManipulationTime > 500) {
      suspiciousPatterns.push("slow_dom_manipulation");
      distributionScore -= 5;
    }
  }
  
  // === 7. Proof of work analysis ===
  if (fp.proofOfWork) {
    const parts = fp.proofOfWork.split(":");
    if (parts[0] === "failed") {
      suspiciousPatterns.push("pow_failed");
      distributionScore -= 5;
    } else {
      const time = parseInt(parts[2]) || 0;
      // Too fast (pre-computed or powerful datacenter)
      if (time < 20) {
        suspiciousPatterns.push("pow_too_fast");
        distributionScore -= 8;
        lowEntropy = true;
      }
      // Very slow (weak device or throttled)
      if (time > 10000) {
        suspiciousPatterns.push("pow_very_slow");
        distributionScore -= 3;
      }
    }
  }
  
  // === 8. Overall pattern detection ===
  
  // Everything is "perfect" = spoofed
  if (fp.consistencyScore && fp.consistencyScore === 100) {
    // Perfect consistency score is actually suspicious
    suspiciousPatterns.push("perfect_consistency");
    distributionScore -= 5;
    overNormalized = true;
  }
  
  return {
    overNormalized,
    lowEntropy,
    suspiciousPatterns,
    distributionScore: Math.max(0, Math.min(100, distributionScore)),
  };
}

// ==================== SESSION & TEMPORAL ANALYSIS ====================

async function analyzeSessionHistory(
  supabase: any, 
  linkId: string, 
  fingerprintHash: string,
  currentIp: string
): Promise<{ score: number; flags: string[]; sessionData: SessionData | null }> {
  const flags: string[] = [];
  let score = 0;
  
  try {
    const { data: previousVisits } = await supabase
      .from("cloaker_visitors")
      .select("created_at, ip_address, decision, score")
      .eq("fingerprint_hash", fingerprintHash)
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (!previousVisits || previousVisits.length === 0) {
      return { score: 0, flags: ["first_visit"], sessionData: null };
    }
    
    const visits = previousVisits as Array<{ created_at: string; ip_address: string; decision: string; score: number }>;
    const visitCount = visits.length;
    
    if (visitCount > 10) {
      const firstVisit = new Date(visits[visits.length - 1].created_at);
      const lastVisit = new Date(visits[0].created_at);
      const daysDiff = (lastVisit.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24);
      
      if (visitCount > 20 && daysDiff < 1) {
        flags.push("high_frequency_visits");
        score -= 10;
      }
      
      if (daysDiff > 7 && visitCount > 5) {
        flags.push("returning_visitor");
        score += 5;
      }
    }
    
    const uniqueIps = [...new Set(visits.map((v) => v.ip_address).filter(Boolean))] as string[];
    
    if (uniqueIps.length > 10 && visitCount < 50) {
      flags.push("many_ips_same_fingerprint");
      score -= 8;
    }
    
    if (currentIp && uniqueIps.length > 0 && !uniqueIps.includes(currentIp)) {
      flags.push("new_ip_for_fingerprint");
    }
    
    const allowedCount = visits.filter((v) => v.decision === "allow").length;
    const blockedCount = visits.filter((v) => v.decision !== "allow").length;
    
    if (blockedCount > allowedCount && blockedCount > 3) {
      flags.push("previously_blocked_returning");
      score -= 5;
    }
    
    if (allowedCount > 5 && blockedCount === 0) {
      flags.push("consistently_allowed");
      score += 3;
    }
    
    const scores = visits.map((v) => v.score).filter((s): s is number => s != null);
    if (scores.length > 3) {
      const recentAvg = scores.slice(0, 3).reduce((a: number, b: number) => a + b, 0) / 3;
      const historicalAvg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      
      if (recentAvg > historicalAvg + 20) {
        flags.push("sudden_score_improvement");
        score -= 5;
      }
    }
    
    const sessionData: SessionData = {
      fingerprintHash,
      firstSeen: new Date(visits[visits.length - 1].created_at),
      lastSeen: new Date(visits[0].created_at),
      visitCount,
      ipHistory: uniqueIps,
      decisionHistory: visits.map((v) => v.decision),
      scoreHistory: scores,
    };
    
    return { score, flags, sessionData };
    
  } catch (e) {
    console.error("[Cloaker] Session analysis error:", e);
    return { score: 0, flags: ["session_analysis_error"], sessionData: null };
  }
}

// ==================== CROWD COLLISION DETECTION ====================

async function detectCrowdCollision(
  supabase: any,
  linkId: string,
  fingerprintHash: string,
  currentIp: string
): Promise<{ score: number; flags: string[] }> {
  const flags: string[] = [];
  let score = 0;
  
  try {
    // Get recent visits to this link
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentVisits } = await supabase
      .from("cloaker_visitors")
      .select("fingerprint_hash, ip_address")
      .eq("link_id", linkId)
      .gte("created_at", oneDayAgo)
      .limit(1000);
    
    if (!recentVisits || recentVisits.length < 10) {
      return { score: 0, flags: [] };
    }
    
    // Count fingerprint occurrences
    const fingerprintCounts: Record<string, number> = {};
    for (const visit of recentVisits) {
      fingerprintCounts[visit.fingerprint_hash] = (fingerprintCounts[visit.fingerprint_hash] || 0) + 1;
    }
    
    // Check if current fingerprint is too common
    const currentFpCount = fingerprintCounts[fingerprintHash] || 0;
    const avgCount = Object.values(fingerprintCounts).reduce((a, b) => a + b, 0) / Object.keys(fingerprintCounts).length;
    
    // Same fingerprint appearing much more than average
    if (currentFpCount > avgCount * 5 && currentFpCount > 10) {
      flags.push("fingerprint_crowd_collision");
      score -= 10;
    }
    
    // === Cluster detection ===
    // Count unique fingerprints per IP
    const ipToFingerprints: Record<string, Set<string>> = {};
    for (const visit of recentVisits) {
      if (visit.ip_address) {
        if (!ipToFingerprints[visit.ip_address]) {
          ipToFingerprints[visit.ip_address] = new Set();
        }
        ipToFingerprints[visit.ip_address].add(visit.fingerprint_hash);
      }
    }
    
    // Check current IP
    if (currentIp && ipToFingerprints[currentIp]) {
      const fingerprintsFromIp = ipToFingerprints[currentIp].size;
      
      // Many different fingerprints from same IP = bot farm or proxy
      if (fingerprintsFromIp > 20) {
        flags.push("ip_fingerprint_cluster");
        score -= 15;
      } else if (fingerprintsFromIp > 10) {
        flags.push("ip_moderate_cluster");
        score -= 8;
      }
    }
    
    // === Detect artificial similarity ===
    // If too many fingerprints are exactly the same, it's suspicious
    const uniqueFingerprints = Object.keys(fingerprintCounts).length;
    const totalVisits = recentVisits.length;
    
    // Very few unique fingerprints for many visits = bot traffic
    if (uniqueFingerprints < totalVisits * 0.1 && totalVisits > 50) {
      flags.push("low_fingerprint_diversity");
      score -= 8;
    }
    
    return { score, flags };
    
  } catch (e) {
    console.error("[Cloaker] Crowd collision error:", e);
    return { score: 0, flags: ["crowd_analysis_error"] };
  }
}

// ==================== BEHAVIORAL ANALYSIS ====================

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
  }
  
  // Velocity analysis
  if (velocities && velocities.length >= 5) {
    const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / velocities.length;
    
    if (variance < 0.0005 && avg > 0) {
      flags.push("constant_velocity");
      score -= 12;
    }
    
    const highSpeedRatio = velocities.filter(v => v > 15).length / velocities.length;
    if (highSpeedRatio > 0.6) {
      flags.push("inhuman_speed");
      score -= 10;
    }
  }
  
  // Positive signals
  if (fp.mouseMovements > 20 && path && path.length > 15) {
    score += 10;
  }
  
  return { score, flags };
}

// ==================== MAIN SCORE CALCULATION ====================

async function calculateScore(
  fp: FingerprintData, 
  link: any, 
  headers: Headers,
  supabase: any
): Promise<ScoreResult> {
  const flags: string[] = [];
  let fingerprintScore = 25;
  let behaviorScore = 25;
  let networkScore = 25;
  let automationScore = 25;

  const isMobileUA = /mobile|android|iphone|ipad/i.test(fp.userAgent);

  // ==================== CROSS-LAYER ANALYSIS (NEW - CRITICAL) ====================
  const crossLayerResult = analyzeCrossLayerConsistency(fp, headers);
  const crossLayerScore = crossLayerResult.score;
  flags.push(...crossLayerResult.issues);
  
  // ==================== ENTROPY ANALYSIS (NEW) ====================
  const entropyResult = analyzeEntropy(fp, supabase, link.id);
  const entropyScore = Math.round(entropyResult.distributionScore / 4); // Convert to 0-25 scale
  flags.push(...entropyResult.suspiciousPatterns);
  
  // ==================== SESSION ANALYSIS (NEW) ====================
  const fingerprintHash = generateFingerprintHash(fp);
  const cfIp = headers.get("cf-connecting-ip") || headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const sessionResult = await analyzeSessionHistory(supabase, link.id, fingerprintHash, cfIp);
  flags.push(...sessionResult.flags);
  behaviorScore += sessionResult.score;
  
  // ==================== CROWD COLLISION (NEW) ====================
  const crowdResult = await detectCrowdCollision(supabase, link.id, fingerprintHash, cfIp);
  flags.push(...crowdResult.flags);
  networkScore += crowdResult.score;

  // ==================== FINGERPRINT ANALYSIS ====================
  
  if (fp.webglRenderer && fp.webglVendor) {
    fingerprintScore += 3;
    if (/swiftshader|llvmpipe|mesa|software|virtualbox|vmware|virgl|lavapipe/i.test(fp.webglRenderer)) {
      fingerprintScore -= 8;
      flags.push("software_renderer");
    }
  } else {
    fingerprintScore -= 8;
    flags.push("no_webgl");
  }

  if (fp.hardwareAcceleration === false) {
    fingerprintScore -= 4;
    flags.push("no_hw_accel");
  }

  if (fp.canvasHash && fp.canvasHash !== "0" && fp.canvasHash.length > 6) {
    fingerprintScore += 3;
  } else {
    fingerprintScore -= 5;
    flags.push("invalid_canvas");
  }

  if (fp.canvasNoise) {
    fingerprintScore -= 3;
    flags.push("canvas_spoofed");
  }
  
  if (fp.audioNoise) {
    fingerprintScore -= 3;
    flags.push("audio_spoofed");
  }

  if (fp.fontsList && fp.fontsList.length < 3) {
    fingerprintScore -= 4;
    flags.push("few_fonts");
  } else if (fp.fontsList && fp.fontsList.length >= 5) {
    fingerprintScore += 3;
  }

  if (fp.deviceMemory >= 2 && fp.deviceMemory <= 32) {
    fingerprintScore += 2;
  } else if (!fp.deviceMemory) {
    fingerprintScore -= 2;
  }

  if (fp.hardwareConcurrency >= 2 && fp.hardwareConcurrency <= 128) {
    fingerprintScore += 2;
  } else if (fp.hardwareConcurrency === 0 || fp.hardwareConcurrency === undefined) {
    fingerprintScore -= 3;
    flags.push("invalid_cpu");
  }

  if (fp.screenResolution) {
    const [w, h] = fp.screenResolution.split("x").map(Number);
    if ((w === 800 && h === 600) || w === 0 || h === 0) {
      fingerprintScore -= 6;
      flags.push("headless_resolution");
    }
  }

  if (isMobileUA && fp.touchSupport && fp.maxTouchPoints && fp.maxTouchPoints > 0) {
    fingerprintScore += 3;
  } else if (isMobileUA && !fp.touchSupport) {
    fingerprintScore -= 5;
    flags.push("mobile_no_touch");
  }

  if (!isMobileUA && /chrome/i.test(fp.userAgent) && fp.pluginsCount === 0) {
    fingerprintScore -= 3;
    flags.push("chrome_no_plugins");
  }

  if (!fp.languages || fp.languages.length === 0) {
    fingerprintScore -= 3;
    flags.push("no_languages");
  }

  if (fp.consistencyScore !== undefined && fp.consistencyScore < 50) {
    fingerprintScore -= 5;
    flags.push("low_consistency");
  }

  // ==================== BEHAVIORAL ANALYSIS ====================
  
  const minTime = link.behavior_time_ms || 1500;
  
  if (fp.timeOnPage >= minTime + 500) {
    behaviorScore += 8;
  } else if (fp.timeOnPage >= minTime) {
    behaviorScore += 5;
  } else if (fp.timeOnPage < 300) {
    behaviorScore -= 15;
    flags.push("INSTANT_ACCESS");
  } else if (fp.timeOnPage < 800) {
    behaviorScore -= 8;
    flags.push("very_fast");
  } else if (fp.timeOnPage < minTime) {
    behaviorScore -= 3;
    flags.push("fast_access");
  }

  const mouseAnalysis = analyzeMouseBehavior(fp);
  behaviorScore += Math.max(-8, mouseAnalysis.score);
  if (mouseAnalysis.flags.length > 0) {
    flags.push(...mouseAnalysis.flags.slice(0, 2));
  }

  if (fp.clickEvents && fp.clickEvents > 0) {
    behaviorScore += 4;
  }

  if (fp.scrollEvents > 0) {
    behaviorScore += 3;
  }
  if (fp.scrollDepth && fp.scrollDepth > 20) {
    behaviorScore += 2;
  }

  if (fp.focusChanges !== undefined && fp.focusChanges >= 0 && fp.focusChanges < 20) {
    behaviorScore += 1;
  }

  if (fp.domManipulationTime !== undefined) {
    if (fp.domManipulationTime < 0.5 || fp.domManipulationTime > 1000) {
      behaviorScore -= 3;
      flags.push("abnormal_dom_time");
    }
  }

  // ==================== AUTOMATION DETECTION ====================
  
  if (fp.hasWebdriver === true) {
    automationScore = 0;
    flags.push("WEBDRIVER");
  }

  if (fp.hasSelenium === true) {
    automationScore = 0;
    flags.push("SELENIUM");
  }

  if (fp.hasPuppeteer === true) {
    automationScore = 0;
    flags.push("PUPPETEER");
  }

  if (fp.hasPlaywright === true) {
    automationScore = 0;
    flags.push("PLAYWRIGHT");
  }

  if (fp.hasCypress === true) {
    automationScore = 0;
    flags.push("CYPRESS");
  }

  if (fp.hasPhantom === true) {
    automationScore = 0;
    flags.push("PHANTOM");
  }

  if (fp.hasNightmare === true) {
    automationScore -= 20;
    flags.push("NIGHTMARE");
  }

  if (fp.isHeadless === true && fp.isAutomated === true) {
    automationScore = 0;
    flags.push("HEADLESS_AUTOMATED");
  } else if (fp.isHeadless === true) {
    automationScore -= 12;
    flags.push("headless");
  } else if (fp.isAutomated === true) {
    automationScore -= 12;
    flags.push("automated");
  }

  if (fp.errorStackPattern === "automation_detected") {
    automationScore -= 15;
    flags.push("automation_in_stack");
  }

  let isBotUA = false;
  for (const pattern of BOT_UA_PATTERNS) {
    if (pattern.test(fp.userAgent)) {
      automationScore = 0;
      flags.push("BOT_UA");
      isBotUA = true;
      break;
    }
  }

  if (!fp.cookiesEnabled && !fp.localStorage) {
    automationScore -= 5;
    flags.push("storage_disabled");
  }

  if (fp.performanceEntries === 0) {
    automationScore -= 2;
  }

  if (fp.mediaDevices === 0 && !isMobileUA) {
    automationScore -= 2;
    flags.push("no_media_devices");
  }

  if (fp.webWorkerSupport === false && fp.wasmSupport === false) {
    automationScore -= 3;
    flags.push("limited_apis");
  }

  // ==================== NETWORK ANALYSIS ====================
  
  const cfCountry = headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country") || headers.get("x-country-code");
  const cfOrg = headers.get("cf-isp") || headers.get("x-isp") || "";

  for (const keyword of DATACENTER_KEYWORDS) {
    if (cfOrg.toLowerCase().includes(keyword)) {
      networkScore -= 18;
      flags.push("DATACENTER_IP");
      break;
    }
  }

  const suspiciousHeaders = ["x-google-internal", "x-adsbot-google", "x-goog-", "x-fb-", "x-meta-"];
  for (const header of suspiciousHeaders) {
    if (headers.get(header)) {
      networkScore -= 20;
      flags.push("PLATFORM_HEADER");
      break;
    }
  }

  const viaHeader = headers.get("via") || "";
  if (/google|facebook|meta|microsoft/i.test(viaHeader)) {
    networkScore -= 15;
    flags.push("via_bot");
  }

  const acceptHeader = headers.get("accept") || "";
  if (!acceptHeader.includes("text/html") && !acceptHeader.includes("*/*")) {
    networkScore -= 8;
    flags.push("no_html_accept");
  }

  const acceptLang = headers.get("accept-language") || "";
  if (!acceptLang || acceptLang === "*") {
    networkScore -= 8;
    flags.push("no_accept_lang");
  }

  if (link.allowed_countries?.length > 0 && cfCountry && !link.allowed_countries.includes(cfCountry)) {
    networkScore -= 25;
    flags.push("country_blocked");
  }
  if (link.blocked_countries?.length > 0 && cfCountry && link.blocked_countries.includes(cfCountry)) {
    networkScore -= 25;
    flags.push("country_blocked");
  }

  const deviceType = getDeviceType(fp.userAgent);
  if (link.allowed_devices?.length > 0 && !link.allowed_devices.includes(deviceType)) {
    networkScore -= 15;
    flags.push("device_filtered");
  }

  if (fp.connectionRtt !== undefined && fp.connectionRtt > 0 && fp.connectionRtt < 10) {
    networkScore -= 5;
    flags.push("low_rtt");
  }

  // ==================== COMBINED ANALYSIS ====================
  
  const criticalFlags = flags.filter(f => 
    f === "WEBDRIVER" || f === "BOT_UA" || f === "HEADLESS_AUTOMATED" || f === "DEFINITIVE_BOT"
  ).length;

  const strongBotSignals = [
    fp.hasWebdriver === true,
    fp.hasPuppeteer === true,
    fp.hasPlaywright === true,
    fp.hasCypress === true,
    fp.isHeadless === true && fp.isAutomated === true && fp.hasWebdriver === true,
    isBotUA,
  ].filter(Boolean).length;

  const suspiciousSignals = [
    fp.mouseMovements === 0 && !fp.touchSupport && fp.timeOnPage > 3000,
    fp.timeOnPage < 300,
    fp.isHeadless === true && fp.isAutomated === true,
    flags.includes("DATACENTER_IP"),
    crossLayerResult.coherenceScore < 50,
    entropyResult.lowEntropy,
    entropyResult.overNormalized,
  ].filter(Boolean).length;

  if (strongBotSignals >= 2) {
    automationScore = 0;
    flags.push("DEFINITIVE_BOT");
  } else if (strongBotSignals >= 1 && suspiciousSignals >= 2) {
    automationScore = Math.max(5, automationScore - 15);
    flags.push("HIGH_BOT_SCORE");
  } else if (suspiciousSignals >= 3) {
    automationScore = Math.max(10, automationScore - 8);
    flags.push("MEDIUM_BOT_SCORE");
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
  
  if (criticalFlags > 0 || strongBotSignals >= 2) {
    confidence = 99;
    riskLevel = "critical";
  } else if (strongBotSignals >= 1 && suspiciousSignals >= 2) {
    confidence = 90;
    riskLevel = "high";
  } else if (suspiciousSignals >= 3 || crossLayerResult.coherenceScore < 40) {
    confidence = 70;
    riskLevel = "high";
  } else if (suspiciousSignals >= 2 || total < 30 || crossLayerResult.coherenceScore < 60) {
    confidence = 55;
    riskLevel = "medium";
  } else {
    confidence = 35;
    riskLevel = "low";
  }

  return {
    total,
    fingerprint: fingerprintScore,
    behavior: behaviorScore,
    network: networkScore,
    automation: automationScore,
    crossLayer: crossLayerScore,
    entropy: entropyScore,
    flags: [...new Set(flags)], // Deduplicate
    confidence,
    riskLevel,
    crossLayerIssues: crossLayerResult.issues,
    entropyAnalysis: entropyResult,
  };
}

// ==================== EDGE FUNCTION HANDLER ====================

Deno.serve(async (req) => {
  console.log(`[Cloaker] Request: ${req.method}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // === GET: Instant header-based redirect ===
  if (req.method === "GET") {
    const url = new URL(req.url);
    const slug = url.searchParams.get("s") || url.searchParams.get("slug");
    
    if (!slug) {
      return new Response("Missing slug parameter", { status: 400 });
    }
    
    console.log(`[Cloaker] GET request for slug: ${slug}`);
    
    const { data: link, error } = await supabase
      .from("cloaked_links")
      .select("*")
      .eq("slug", slug)
      .single();
    
    if (error || !link) {
      console.log("[Cloaker] Link not found");
      return new Response("Not found", { status: 404 });
    }
    
    if (!link.is_active) {
      console.log("[Cloaker] Link inactive");
      return Response.redirect(link.safe_url, 302);
    }

    const userAgent = req.headers.get("user-agent") || "";
    const cfCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || "";
    const cfIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    
    const deviceType = getDeviceType(userAgent);
    const isGenericBot = BOT_UA_PATTERNS.some(p => p.test(userAgent));
    
    // === GOOGLE ADS BOT DETECTION (CRITICAL - ENHANCED) ===
    const googleBotResult = detectGoogleAdsBot(userAgent, cfIp, req.headers);
    const isGoogleAdsBot = googleBotResult.isAdsBot;
    const isGoogleBot = googleBotResult.isGoogleBot;
    const isDefinitiveGoogleBot = googleBotResult.isDefinitive;
    const isBot = isGenericBot || isGoogleBot;
    
    console.log(`[Cloaker] Google Check: isAdsBot=${isGoogleAdsBot}, isGoogleBot=${isGoogleBot}, isDefinitive=${isDefinitiveGoogleBot}, confidence=${googleBotResult.confidence}%, reasons=[${googleBotResult.reasons.join(",")}]`);
    
    let decision: "allow" | "block" = "allow";
    let blockReason = "";

    // PRIORITY 0: Definitive Google Bot - ALWAYS block when block_bots enabled
    if (link.block_bots && isDefinitiveGoogleBot) {
      decision = "block";
      blockReason = `Definitive Google Bot (${googleBotResult.reasons.slice(0, 3).join(", ")})`;
    }
    // PRIORITY 1: Google Ads Bot - ALWAYS block when block_bots is enabled
    else if (link.block_bots && isGoogleAdsBot) {
      decision = "block";
      blockReason = `Google Ads Bot (${googleBotResult.reasons.slice(0, 3).join(", ")})`;
    }
    // PRIORITY 2: High confidence Google Bot
    else if (link.block_bots && isGoogleBot && googleBotResult.confidence >= 60) {
      decision = "block";
      blockReason = `Google Bot (${googleBotResult.confidence}% confidence)`;
    }
    // PRIORITY 3: Device filter
    else if (link.allowed_devices?.length > 0 && !link.allowed_devices.includes(deviceType)) {
      decision = "block";
      blockReason = `Device ${deviceType} not allowed`;
    }
    // PRIORITY 4: Country filters
    else if (link.allowed_countries?.length > 0 && cfCountry && !link.allowed_countries.includes(cfCountry)) {
      decision = "block";
      blockReason = `Country ${cfCountry} not allowed`;
    }
    else if (link.blocked_countries?.length > 0 && cfCountry && link.blocked_countries.includes(cfCountry)) {
      decision = "block";
      blockReason = `Country ${cfCountry} blocked`;
    }
    // PRIORITY 5: Other bots
    else if (link.block_bots && isGenericBot) {
      decision = "block";
      blockReason = "Bot detected (UA pattern)";
    }
    // PRIORITY 6: Google IP with medium confidence
    else if (link.block_bots && isGoogleIP(cfIp) && googleBotResult.confidence >= 40) {
      decision = "block";
      blockReason = `Google IP (${googleBotResult.confidence}% confidence)`;
    }
    // PRIORITY 7: Multiple weak signals = suspicious
    else if (link.block_bots && googleBotResult.reasons.length >= 3 && googleBotResult.confidence >= 35) {
      decision = "block";
      blockReason = `Multiple signals (${googleBotResult.reasons.length} flags, ${googleBotResult.confidence}% confidence)`;
    }

    const redirectUrl = decision === "allow" ? link.target_url : link.safe_url;
    
    console.log(`[Cloaker] Decision: ${decision}${blockReason ? ` (${blockReason})` : ""}`);
    console.log(`[Cloaker] Device: ${deviceType}, Country: ${cfCountry || "unknown"}, IP: ${cfIp}, Bot: ${isBot}`);
    console.log(`[Cloaker] Redirecting to: ${redirectUrl.substring(0, 50)}...`);

    // Log async with Google Ads info
    (async () => {
      try {
        await supabase.from("cloaker_visitors").insert({
          link_id: link.id,
          fingerprint_hash: hashString(userAgent + cfIp),
          score: decision === "allow" ? 100 : 0,
          decision,
          user_agent: userAgent,
          ip_address: cfIp,
          country_code: cfCountry,
          platform: deviceType,
          is_bot: isBot,
        });
        await supabase.from("cloaked_links").update({ clicks_count: link.clicks_count + 1 }).eq("id", link.id);
      } catch (e) {
        console.error("[Cloaker] Log error:", e);
      }
    })();

    return Response.redirect(redirectUrl, 302);
  }

  // === POST: Full fingerprint analysis ===
  try {
    const body = await req.json();
    const { slug, fingerprint } = body;
    
    console.log(`[Cloaker] POST Processing: ${slug}`);

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

    // Calculate comprehensive score with all new analysis
    const scoreResult = await calculateScore(fingerprint as FingerprintData, link, req.headers, supabase);
    const fingerprintHash = generateFingerprintHash(fingerprint);
    
    console.log(`[Cloaker] Score: ${scoreResult.total}, Risk: ${scoreResult.riskLevel}, Confidence: ${scoreResult.confidence}%`);
    console.log(`[Cloaker] Breakdown: FP=${scoreResult.fingerprint}, B=${scoreResult.behavior}, N=${scoreResult.network}, A=${scoreResult.automation}, CL=${scoreResult.crossLayer}, E=${scoreResult.entropy}`);
    console.log(`[Cloaker] CrossLayer Issues: ${scoreResult.crossLayerIssues.slice(0, 5).join(", ") || "none"}`);
    console.log(`[Cloaker] Entropy: overNorm=${scoreResult.entropyAnalysis.overNormalized}, lowEnt=${scoreResult.entropyAnalysis.lowEntropy}`);
    console.log(`[Cloaker] Flags: ${scoreResult.flags.slice(0, 10).join(", ") || "none"}`);

    const cfCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country");
    const cfIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const cfCity = req.headers.get("cf-city") || "";

    // Decision logic with probabilistic approach
    const minScore = link.min_score || 35;
    let decision: "allow" | "block" | "safe";
    let redirectUrl: string;

    const deviceType = getDeviceType(fingerprint.userAgent);
    const cfCountryForFilter = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || "";

    // Hard filters FIRST
    if (link.allowed_devices?.length > 0 && !link.allowed_devices.includes(deviceType)) {
      decision = "safe";
      redirectUrl = link.safe_url;
      console.log(`[Cloaker] BLOCKED: Device ${deviceType} not allowed`);
    }
    else if (link.allowed_countries?.length > 0 && cfCountryForFilter && !link.allowed_countries.includes(cfCountryForFilter)) {
      decision = "safe";
      redirectUrl = link.safe_url;
      console.log(`[Cloaker] BLOCKED: Country ${cfCountryForFilter} not allowed`);
    }
    else if (link.blocked_countries?.length > 0 && cfCountryForFilter && link.blocked_countries.includes(cfCountryForFilter)) {
      decision = "safe";
      redirectUrl = link.safe_url;
      console.log(`[Cloaker] BLOCKED: Country ${cfCountryForFilter} blocked`);
    }
    else {
      // Bot detection with new signals
      const hasDefinitiveBotFlags = scoreResult.flags.some(f => 
        f === "WEBDRIVER" || f === "BOT_UA" || f === "HEADLESS_AUTOMATED" || f === "DEFINITIVE_BOT"
      );

      const hasCrossLayerIssues = scoreResult.crossLayerIssues.length >= 3;
      const hasEntropyIssues = scoreResult.entropyAnalysis.lowEntropy || scoreResult.entropyAnalysis.overNormalized;

      if (link.block_bots && hasDefinitiveBotFlags) {
        decision = "safe";
        redirectUrl = link.safe_url;
        console.log("[Cloaker] BLOCKED: Bot detected");
      } else if (hasDefinitiveBotFlags) {
        decision = "safe";
        redirectUrl = link.safe_url;
        console.log("[Cloaker] BLOCKED: Definitive bot");
      } else if (scoreResult.riskLevel === "critical" && scoreResult.confidence >= 95) {
        decision = "safe";
        redirectUrl = link.safe_url;
        console.log("[Cloaker] BLOCKED: Critical risk");
      } else if (hasCrossLayerIssues && hasEntropyIssues && scoreResult.total < minScore + 15) {
        // NEW: Cross-layer + entropy issues = likely spoofed
        decision = "safe";
        redirectUrl = link.safe_url;
        console.log("[Cloaker] BLOCKED: Cross-layer + entropy anomalies");
      } else if (scoreResult.total >= minScore) {
        decision = "allow";
        redirectUrl = link.target_url;
        console.log(`[Cloaker] ALLOWED: Score ${scoreResult.total} >= ${minScore}`);
      } else if (scoreResult.total >= minScore - 10 && scoreResult.riskLevel === "low") {
        // Probabilistic: borderline but low risk
        decision = "allow";
        redirectUrl = link.target_url;
        console.log(`[Cloaker] ALLOWED: Borderline but low risk`);
      } else {
        decision = "block";
        redirectUrl = link.safe_url;
        console.log(`[Cloaker] BLOCKED: Score ${scoreResult.total} < ${minScore}`);
      }
    }

    // Log visitor
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
        crossLayerCoherence: scoreResult.crossLayer * 4, // Convert to 0-100
        entropyScore: scoreResult.entropy * 4,
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
