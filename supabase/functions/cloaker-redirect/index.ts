import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== IN-MEMORY CACHES ====================
const linkCache = new Map<string, { link: any; timestamp: number }>();
const CACHE_TTL = 60000;

// Rate limiting cache: IP -> { count, windowStart }
const rateLimitCache = new Map<string, { count: number; windowStart: number }>();

// Session cache for behavioral analysis
const sessionCache = new Map<string, { firstSeen: number; visits: number; scores: number[] }>();

function getCachedLink(slug: string): any | null {
  const cached = linkCache.get(slug);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.link;
  }
  linkCache.delete(slug);
  return null;
}

function setCachedLink(slug: string, link: any): void {
  if (linkCache.size > 1000) {
    const oldest = linkCache.keys().next().value;
    if (oldest) linkCache.delete(oldest);
  }
  linkCache.set(slug, { link, timestamp: Date.now() });
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitCache.entries()) {
    if (now - value.windowStart > 3600000) { // 1 hour
      rateLimitCache.delete(key);
    }
  }
}, 300000);

// ==================== RATE LIMITING ====================
function checkRateLimit(ip: string, limit: number, windowMinutes: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const key = ip;
  
  const entry = rateLimitCache.get(key);
  
  if (!entry || (now - entry.windowStart) > windowMs) {
    rateLimitCache.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  entry.count++;
  rateLimitCache.set(key, entry);
  return { allowed: true, remaining: limit - entry.count };
}

// ==================== CLICK LIMITS ====================
interface ClickLimitResult {
  allowed: boolean;
  reason?: string;
}

async function checkClickLimits(link: any, supabase: any): Promise<ClickLimitResult> {
  // Check total clicks limit
  if (link.max_clicks_total && link.clicks_count >= link.max_clicks_total) {
    return { allowed: false, reason: "total_clicks_exceeded" };
  }
  
  // Check daily clicks limit
  if (link.max_clicks_daily) {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = link.last_click_reset;
    
    if (lastReset !== today) {
      // Reset daily counter
      await supabase
        .from("cloaked_links")
        .update({ clicks_today: 0, last_click_reset: today })
        .eq("id", link.id);
      link.clicks_today = 0;
    }
    
    if ((link.clicks_today || 0) >= link.max_clicks_daily) {
      return { allowed: false, reason: "daily_clicks_exceeded" };
    }
  }
  
  return { allowed: true };
}

// ==================== TIME-BASED RULES ====================
function checkTimeRules(link: any): { allowed: boolean; reason?: string } {
  if (link.allowed_hours_start === null || link.allowed_hours_end === null) {
    return { allowed: true };
  }
  
  const now = new Date();
  const currentHour = now.getUTCHours(); // Use UTC for consistency
  
  const start = link.allowed_hours_start;
  const end = link.allowed_hours_end;
  
  // Handle overnight ranges (e.g., 22:00 to 06:00)
  if (start <= end) {
    // Normal range (e.g., 09:00 to 18:00)
    if (currentHour < start || currentHour >= end) {
      return { allowed: false, reason: "outside_allowed_hours" };
    }
  } else {
    // Overnight range (e.g., 22:00 to 06:00)
    if (currentHour < start && currentHour >= end) {
      return { allowed: false, reason: "outside_allowed_hours" };
    }
  }
  
  return { allowed: true };
}

// ==================== IP WHITELIST/BLACKLIST ====================
function checkIPLists(ip: string, link: any): { allowed: boolean; reason?: string } {
  // Whitelist takes priority - if set, only whitelisted IPs allowed
  if (link.whitelist_ips && link.whitelist_ips.length > 0) {
    const isWhitelisted = link.whitelist_ips.some((pattern: string) => {
      if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, "\\d+") + "$");
        return regex.test(ip);
      }
      return pattern === ip;
    });
    
    if (!isWhitelisted) {
      return { allowed: false, reason: "ip_not_whitelisted" };
    }
  }
  
  // Check blacklist
  if (link.blacklist_ips && link.blacklist_ips.length > 0) {
    const isBlacklisted = link.blacklist_ips.some((pattern: string) => {
      if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, "\\d+") + "$");
        return regex.test(ip);
      }
      return pattern === ip;
    });
    
    if (isBlacklisted) {
      return { allowed: false, reason: "ip_blacklisted" };
    }
  }
  
  return { allowed: true };
}

// ==================== A/B URL ROTATION ====================
function selectTargetUrl(link: any): string {
  if (!link.target_urls || !Array.isArray(link.target_urls) || link.target_urls.length === 0) {
    return link.target_url;
  }
  
  // target_urls format: [{ url: string, weight: number }, ...]
  const urls = link.target_urls as { url: string; weight: number }[];
  const totalWeight = urls.reduce((sum, u) => sum + (u.weight || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const urlObj of urls) {
    random -= urlObj.weight || 1;
    if (random <= 0) {
      return urlObj.url;
    }
  }
  
  return urls[urls.length - 1]?.url || link.target_url;
}

// ==================== UTM PASSTHROUGH ====================
function applyUtmPassthrough(targetUrl: string, request: Request): string {
  const incomingUrl = new URL(request.url);
  const targetUrlObj = new URL(targetUrl);
  
  const utmParams = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "ttclid", "msclkid"];
  
  for (const param of utmParams) {
    const value = incomingUrl.searchParams.get(param);
    if (value && !targetUrlObj.searchParams.has(param)) {
      targetUrlObj.searchParams.set(param, value);
    }
  }
  
  return targetUrlObj.toString();
}

// ==================== EXTRACT UTM PARAMS ====================
function extractUtmParams(request: Request): Record<string, string> {
  const url = new URL(request.url);
  return {
    utm_source: url.searchParams.get("utm_source") || "",
    utm_medium: url.searchParams.get("utm_medium") || "",
    utm_campaign: url.searchParams.get("utm_campaign") || "",
    utm_content: url.searchParams.get("utm_content") || "",
    utm_term: url.searchParams.get("utm_term") || "",
  };
}

// ==================== INSTANT BOT DETECTION ====================
const INSTANT_BOT_KEYWORDS = new Set([
  "googlebot", "adsbot", "mediapartners", "storebot", "bingbot", "yandexbot",
  "baiduspider", "facebookexternalhit", "facebot", "twitterbot", "linkedinbot",
  "slackbot", "telegrambot", "whatsapp", "discordbot", "applebot", "duckduckbot",
  "semrush", "ahrefs", "mj12bot", "dotbot", "petalbot", "bytespider",
  "crawler", "spider", "bot", "crawl", "headless", "phantomjs", "selenium", 
  "puppeteer", "playwright", "webdriver", "lighthouse", "pagespeed",
  "curl", "wget", "python", "java/", "axios", "node-fetch", "scrapy",
  "gptbot", "chatgpt", "claude", "anthropic", "perplexity", "bytedance",
  "tiktok", "pinterest", "snapchat", "meta-external",
]);

function instantBotCheck(ua: string): boolean {
  const uaLower = ua.toLowerCase();
  for (const keyword of INSTANT_BOT_KEYWORDS) {
    if (uaLower.includes(keyword)) return true;
  }
  return false;
}

// ==================== GOOGLE DETECTION ====================
const GOOGLE_IP_RANGES = [
  { start: "64.233.160.0", end: "64.233.191.255" },
  { start: "66.102.0.0", end: "66.102.15.255" },
  { start: "66.249.64.0", end: "66.249.95.255" },
  { start: "72.14.192.0", end: "72.14.255.255" },
  { start: "74.125.0.0", end: "74.125.255.255" },
  { start: "108.177.0.0", end: "108.177.127.255" },
  { start: "142.250.0.0", end: "142.251.255.255" },
  { start: "172.217.0.0", end: "172.217.255.255" },
  { start: "173.194.0.0", end: "173.194.255.255" },
  { start: "209.85.128.0", end: "209.85.255.255" },
  { start: "216.58.192.0", end: "216.58.223.255" },
  { start: "216.239.32.0", end: "216.239.63.255" },
  { start: "34.64.0.0", end: "34.127.255.255" },
  { start: "35.184.0.0", end: "35.247.255.255" },
  { start: "104.154.0.0", end: "104.155.255.255" },
  { start: "104.196.0.0", end: "104.199.255.255" },
  { start: "130.211.0.0", end: "130.211.255.255" },
  { start: "146.148.0.0", end: "146.148.127.255" },
  { start: "66.249.66.0", end: "66.249.66.255" },
  { start: "66.249.68.0", end: "66.249.69.255" },
  { start: "66.249.79.0", end: "66.249.79.255" },
  { start: "192.178.0.0", end: "192.178.255.255" },
  { start: "199.36.153.0", end: "199.36.155.255" },
  { start: "74.114.24.0", end: "74.114.31.255" },
  { start: "23.236.48.0", end: "23.236.63.255" },
  { start: "23.251.128.0", end: "23.251.191.255" },
  { start: "107.167.160.0", end: "107.167.191.255" },
  { start: "107.178.192.0", end: "107.178.255.255" },
  { start: "162.216.148.0", end: "162.216.151.255" },
  { start: "162.222.176.0", end: "162.222.183.255" },
  { start: "136.22.0.0", end: "136.23.255.255" },
  { start: "34.128.0.0", end: "34.159.255.255" },
  { start: "35.186.0.0", end: "35.186.127.255" },
];

// Facebook/Meta IP ranges
const FACEBOOK_IP_RANGES = [
  { start: "31.13.24.0", end: "31.13.31.255" },
  { start: "31.13.64.0", end: "31.13.127.255" },
  { start: "45.64.40.0", end: "45.64.43.255" },
  { start: "66.220.144.0", end: "66.220.159.255" },
  { start: "69.63.176.0", end: "69.63.191.255" },
  { start: "69.171.224.0", end: "69.171.255.255" },
  { start: "74.119.76.0", end: "74.119.79.255" },
  { start: "102.132.96.0", end: "102.132.127.255" },
  { start: "129.134.0.0", end: "129.134.255.255" },
  { start: "157.240.0.0", end: "157.240.255.255" },
  { start: "173.252.64.0", end: "173.252.127.255" },
  { start: "179.60.192.0", end: "179.60.195.255" },
  { start: "185.60.216.0", end: "185.60.223.255" },
  { start: "185.89.216.0", end: "185.89.219.255" },
  { start: "204.15.20.0", end: "204.15.23.255" },
];

// TikTok/ByteDance IP ranges
const TIKTOK_IP_RANGES = [
  { start: "161.117.0.0", end: "161.117.255.255" },
  { start: "128.1.0.0", end: "128.1.255.255" },
  { start: "152.32.128.0", end: "152.32.255.255" },
];

// Datacenter/Cloud IP ranges
const DATACENTER_IP_RANGES = [
  // AWS
  { start: "3.0.0.0", end: "3.255.255.255" },
  { start: "52.0.0.0", end: "52.255.255.255" },
  { start: "54.0.0.0", end: "54.255.255.255" },
  // DigitalOcean
  { start: "159.89.0.0", end: "159.89.255.255" },
  { start: "167.99.0.0", end: "167.99.255.255" },
  { start: "206.189.0.0", end: "206.189.255.255" },
  // Vultr
  { start: "45.32.0.0", end: "45.32.255.255" },
  { start: "45.63.0.0", end: "45.63.255.255" },
  { start: "45.76.0.0", end: "45.76.255.255" },
  // Linode
  { start: "45.33.0.0", end: "45.33.255.255" },
  { start: "50.116.0.0", end: "50.116.255.255" },
  // Hetzner
  { start: "116.202.0.0", end: "116.203.255.255" },
  { start: "49.12.0.0", end: "49.13.255.255" },
  // OVH
  { start: "51.38.0.0", end: "51.39.255.255" },
  { start: "51.75.0.0", end: "51.79.255.255" },
];

function ipToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isInIpRanges(ip: string, ranges: { start: string; end: string }[]): boolean {
  if (!ip || !ip.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) return false;
  const ipNum = ipToNumber(ip);
  for (const range of ranges) {
    const startNum = ipToNumber(range.start);
    const endNum = ipToNumber(range.end);
    if (ipNum >= startNum && ipNum <= endNum) return true;
  }
  return false;
}

function isGoogleIP(ip: string): boolean {
  return isInIpRanges(ip, GOOGLE_IP_RANGES);
}

function isFacebookIP(ip: string): boolean {
  return isInIpRanges(ip, FACEBOOK_IP_RANGES);
}

function isTikTokIP(ip: string): boolean {
  return isInIpRanges(ip, TIKTOK_IP_RANGES);
}

function isDatacenterIP(ip: string): boolean {
  return isInIpRanges(ip, DATACENTER_IP_RANGES);
}

function instantGoogleCheck(ua: string, ip: string): { isGoogle: boolean; isDefinitive: boolean } {
  const uaLower = ua.toLowerCase();
  
  if (uaLower.includes("googlebot") || uaLower.includes("adsbot") || 
      uaLower.includes("mediapartners") || uaLower.includes("storebot")) {
    return { isGoogle: true, isDefinitive: true };
  }
  
  if (isGoogleIP(ip)) {
    return { isGoogle: true, isDefinitive: true };
  }
  
  if (uaLower.includes("lighthouse") || uaLower.includes("pagespeed") ||
      uaLower.includes("google-") || uaLower.includes("apis-google")) {
    return { isGoogle: true, isDefinitive: true };
  }
  
  return { isGoogle: false, isDefinitive: false };
}

// ==================== COMPREHENSIVE BOT DETECTION ====================
interface BotDetectionResult {
  isBot: boolean;
  botType: string | null;
  confidence: number;
  reasons: string[];
  platform?: string;
}

function detectBot(userAgent: string, ip: string, headers: Headers): BotDetectionResult {
  const reasons: string[] = [];
  let confidence = 0;
  let botType: string | null = null;
  const ua = userAgent.toLowerCase();
  
  // === 1. GOOGLE/ADS ===
  if (/googlebot|adsbot|mediapartners|storebot|google-extended|apis-google|feedfetcher-google/i.test(userAgent)) {
    botType = "google";
    confidence = 100;
    reasons.push("google_ua_pattern");
  } else if (isGoogleIP(ip)) {
    botType = "google";
    confidence = 95;
    reasons.push("google_ip_range");
  } else if (/lighthouse|pagespeed|chrome-lighthouse/i.test(userAgent)) {
    botType = "google";
    confidence = 90;
    reasons.push("google_tool");
  }
  
  // === 2. FACEBOOK/META ===
  if (/facebookexternalhit|facebot|facebook|meta-external|instagram/i.test(userAgent)) {
    botType = "facebook";
    confidence = 100;
    reasons.push("facebook_ua_pattern");
  } else if (isFacebookIP(ip)) {
    botType = "facebook";
    confidence = 95;
    reasons.push("facebook_ip_range");
  }
  
  // === 3. TIKTOK/BYTEDANCE ===
  if (/tiktok|bytedance|bytespider/i.test(userAgent)) {
    botType = "tiktok";
    confidence = 100;
    reasons.push("tiktok_ua_pattern");
  } else if (isTikTokIP(ip)) {
    botType = "tiktok";
    confidence = 90;
    reasons.push("tiktok_ip_range");
  }
  
  // === 4. OTHER AD PLATFORMS ===
  if (/bingads|adidxbot|pinterest|twitterbot|linkedinbot|snapchat|slackbot|discordbot|telegrambot|whatsapp|applebot/i.test(userAgent)) {
    botType = "ad_platform";
    confidence = 95;
    reasons.push("ad_platform_bot");
  }
  
  // === 5. SEARCH ENGINES ===
  if (/bingbot|yandexbot|baiduspider|duckduckbot|sogou|exabot|ia_archiver/i.test(userAgent)) {
    botType = "search_engine";
    confidence = 95;
    reasons.push("search_engine_bot");
  }
  
  // === 6. SEO/ANALYTICS TOOLS ===
  if (/semrush|ahrefsbot|mj12bot|dotbot|petalbot|screaming.frog|rogerbot|seokicks|sistrix|blexbot|dataforseo/i.test(userAgent)) {
    botType = "seo_tool";
    confidence = 95;
    reasons.push("seo_tool_bot");
  }
  
  // === 7. AI CRAWLERS ===
  if (/gptbot|chatgpt|claude|anthropic|perplexity|cohere|ccbot|diffbot/i.test(userAgent)) {
    botType = "ai_crawler";
    confidence = 95;
    reasons.push("ai_crawler_bot");
  }
  
  // === 8. AUTOMATION FRAMEWORKS ===
  if (/headless|phantomjs|selenium|puppeteer|playwright|cypress|webdriver|nightmare|casperjs/i.test(userAgent)) {
    botType = "automation";
    confidence = 100;
    reasons.push("automation_framework");
  }
  
  // === 9. HTTP CLIENTS ===
  if (/curl|wget|python|java\/|axios|node-fetch|go-http|libwww|scrapy|httpx|okhttp|guzzle|urllib|aiohttp/i.test(userAgent)) {
    botType = "http_client";
    confidence = 90;
    reasons.push("http_client");
  }
  
  // === 10. DATACENTER IP ===
  if (!botType && isDatacenterIP(ip)) {
    confidence += 40;
    reasons.push("datacenter_ip");
  }
  
  // === 11. HEADER ANALYSIS ===
  const acceptLang = headers.get("accept-language") || "";
  const accept = headers.get("accept") || "";
  const secFetchDest = headers.get("sec-fetch-dest");
  const secFetchMode = headers.get("sec-fetch-mode");
  
  if (!acceptLang || acceptLang === "*") {
    confidence += 15;
    reasons.push("no_accept_language");
  }
  
  if (accept === "*/*" || !accept.includes("text/html")) {
    confidence += 10;
    reasons.push("minimal_accept_header");
  }
  
  if (!secFetchDest && !secFetchMode && !ua.includes("safari")) {
    confidence += 15;
    reasons.push("no_sec_fetch_headers");
  }
  
  // Via header with platform names
  const via = headers.get("via") || "";
  if (/google|facebook|meta|microsoft|amazon/i.test(via)) {
    confidence += 30;
    reasons.push("platform_via_header");
  }
  
  // === 12. UA ANOMALIES ===
  if (userAgent.length < 50) {
    confidence += 25;
    reasons.push("short_user_agent");
  }
  
  if (/https?:\/\//i.test(userAgent)) {
    confidence += 20;
    reasons.push("url_in_user_agent");
  }
  
  // Generic "bot" in UA
  if (/bot(?!tle)/i.test(ua) && !/about|cubot/i.test(ua)) {
    confidence += 40;
    reasons.push("contains_bot");
    if (!botType) botType = "generic_bot";
  }
  
  if (/crawler|spider|scraper|fetch/i.test(ua)) {
    confidence += 35;
    reasons.push("crawler_pattern");
    if (!botType) botType = "crawler";
  }
  
  const isBot = botType !== null || confidence >= 60;
  
  return {
    isBot,
    botType,
    confidence: Math.min(100, confidence),
    reasons,
    platform: botType || undefined,
  };
}

// ==================== ISP/ASN BLOCKING ====================
function checkIspBlock(isp: string, link: any): boolean {
  if (!link.blocked_isps || !Array.isArray(link.blocked_isps) || link.blocked_isps.length === 0) {
    return false;
  }
  
  const ispLower = (isp || "").toLowerCase();
  return link.blocked_isps.some((blocked: string) => 
    ispLower.includes(blocked.toLowerCase())
  );
}

function checkAsnBlock(asn: string, link: any): boolean {
  if (!link.blocked_asns || !Array.isArray(link.blocked_asns) || link.blocked_asns.length === 0) {
    return false;
  }
  
  const asnUpper = (asn || "").toUpperCase();
  return link.blocked_asns.some((blocked: string) => 
    asnUpper.includes(blocked.toUpperCase())
  );
}

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
  flags: string[];
  confidence: number;
  riskLevel: "low" | "medium" | "high" | "critical";
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

// ==================== COMPREHENSIVE SCORING ====================
function calculateScore(fp: FingerprintData, link: any, headers: Headers, ip: string): ScoreResult {
  const flags: string[] = [];
  let fingerprintScore = 25;
  let behaviorScore = 25;
  let networkScore = 25;
  let automationScore = 25;
  
  const ua = fp.userAgent || "";
  const isMobileUA = /mobile|android|iphone|ipad/i.test(ua);
  
  // === FINGERPRINT ANALYSIS ===
  
  // Basic fingerprint validation
  if (!fp.userAgent || fp.userAgent.length < 20) {
    fingerprintScore -= 10;
    flags.push("invalid_ua");
  }
  
  if (!fp.language || fp.language.length < 2) {
    fingerprintScore -= 3;
    flags.push("no_language");
  }
  
  if (!fp.timezone) {
    fingerprintScore -= 3;
    flags.push("no_timezone");
  }
  
  if (!fp.screenResolution || !/^\d+x\d+$/.test(fp.screenResolution)) {
    fingerprintScore -= 5;
    flags.push("invalid_screen");
  } else {
    const [w, h] = fp.screenResolution.split("x").map(Number);
    if (w === 800 && h === 600) {
      fingerprintScore -= 8;
      flags.push("headless_resolution");
    }
  }
  
  // WebGL validation
  if (!fp.webglVendor && !fp.webglRenderer) {
    fingerprintScore -= 5;
    flags.push("no_webgl");
  }
  
  // SwiftShader detection (common in headless)
  if (/swiftshader|llvmpipe|software/i.test(fp.webglRenderer || "")) {
    fingerprintScore -= 8;
    flags.push("software_renderer");
  }
  
  // Canvas hash validation
  if (!fp.canvasHash || fp.canvasHash === "0" || fp.canvasHash === "") {
    fingerprintScore -= 5;
    flags.push("no_canvas");
  }
  
  // Platform consistency
  if (/windows/i.test(ua) && fp.platform && !/win/i.test(fp.platform)) {
    fingerprintScore -= 8;
    flags.push("platform_mismatch");
  }
  
  if (/iphone|ipad/i.test(ua) && fp.webglVendor && !/apple/i.test(fp.webglVendor)) {
    fingerprintScore -= 10;
    flags.push("ios_non_apple_gpu");
  }
  
  // Touch support consistency
  if (isMobileUA && !fp.touchSupport) {
    fingerprintScore -= 8;
    flags.push("mobile_no_touch");
  }
  
  // === BEHAVIOR ANALYSIS ===
  
  const minTime = link.behavior_time_ms || 2000;
  
  if (fp.timeOnPage < 200) {
    behaviorScore -= 12;
    flags.push("instant_access");
  } else if (fp.timeOnPage < minTime) {
    behaviorScore -= 5;
    flags.push("fast_access");
  }
  
  if (fp.mouseMovements === 0 && !fp.touchSupport) {
    behaviorScore -= 8;
    flags.push("no_mouse");
  } else if (fp.mouseMovements > 0) {
    behaviorScore += 3;
  }
  
  if (fp.scrollEvents > 0) {
    behaviorScore += 2;
  }
  
  if (fp.clickEvents && fp.clickEvents > 0) {
    behaviorScore += 3;
  }
  
  // Mouse path analysis
  if (fp.mousePath && fp.mousePath.length > 5) {
    // Check for linear movement (robotic)
    const path = fp.mousePath;
    let directionChanges = 0;
    for (let i = 2; i < path.length; i++) {
      const dx1 = path[i-1].x - path[i-2].x;
      const dy1 = path[i-1].y - path[i-2].y;
      const dx2 = path[i].x - path[i-1].x;
      const dy2 = path[i].y - path[i-1].y;
      const angle1 = Math.atan2(dy1, dx1);
      const angle2 = Math.atan2(dy2, dx2);
      if (Math.abs(angle1 - angle2) > 0.1) directionChanges++;
    }
    const changeRatio = directionChanges / (path.length - 2);
    if (changeRatio < 0.1) {
      behaviorScore -= 10;
      flags.push("linear_mouse");
    }
  }
  
  // Velocity analysis
  if (fp.mouseVelocities && fp.mouseVelocities.length > 3) {
    const avg = fp.mouseVelocities.reduce((a, b) => a + b, 0) / fp.mouseVelocities.length;
    const variance = fp.mouseVelocities.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / fp.mouseVelocities.length;
    if (variance < 0.001 && avg > 0) {
      behaviorScore -= 8;
      flags.push("constant_velocity");
    }
  }
  
  // === AUTOMATION DETECTION ===
  
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
  
  if (fp.isHeadless === true && fp.isAutomated === true) {
    automationScore = 0;
    flags.push("HEADLESS_AUTOMATED");
  } else if (fp.isHeadless === true) {
    automationScore -= 15;
    flags.push("headless");
  } else if (fp.isAutomated === true) {
    automationScore -= 15;
    flags.push("automated");
  }
  
  // Bot detection from fingerprint
  const botResult = detectBot(fp.userAgent, ip, headers);
  if (botResult.isBot) {
    if (botResult.confidence >= 90) {
      automationScore = 0;
      flags.push("BOT_" + (botResult.botType || "detected").toUpperCase());
    } else {
      automationScore -= Math.floor(botResult.confidence / 4);
      flags.push("possible_bot");
    }
    flags.push(...botResult.reasons);
  }
  
  // Storage disabled
  if (!fp.cookiesEnabled && !fp.localStorage) {
    automationScore -= 8;
    flags.push("storage_disabled");
  }
  
  // === NETWORK ANALYSIS ===
  
  const cfCountry = headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country") || "";
  const cfOrg = headers.get("cf-isp") || headers.get("x-isp") || "";
  
  // IP-based checks
  if (isGoogleIP(ip)) {
    networkScore -= 20;
    flags.push("GOOGLE_IP");
  }
  
  if (isFacebookIP(ip)) {
    networkScore -= 18;
    flags.push("FACEBOOK_IP");
  }
  
  if (isTikTokIP(ip)) {
    networkScore -= 18;
    flags.push("TIKTOK_IP");
  }
  
  if (link.block_datacenter && isDatacenterIP(ip)) {
    networkScore -= 15;
    flags.push("DATACENTER_IP");
  }
  
  // Country filters
  if (link.allowed_countries?.length > 0 && cfCountry && !link.allowed_countries.includes(cfCountry)) {
    networkScore -= 25;
    flags.push("country_not_allowed");
  }
  
  if (link.blocked_countries?.length > 0 && cfCountry && link.blocked_countries.includes(cfCountry)) {
    networkScore -= 25;
    flags.push("country_blocked");
  }
  
  // Device filter
  const deviceType = getDeviceType(fp.userAgent);
  if (link.allowed_devices?.length > 0 && !link.allowed_devices.includes(deviceType)) {
    networkScore -= 15;
    flags.push("device_filtered");
  }
  
  // ISP/ASN blocking
  if (checkIspBlock(cfOrg, link)) {
    networkScore -= 20;
    flags.push("ISP_BLOCKED");
  }
  
  // Header analysis
  const acceptLang = headers.get("accept-language") || "";
  if (!acceptLang || acceptLang === "*") {
    networkScore -= 8;
    flags.push("no_accept_lang");
  }
  
  const via = headers.get("via") || "";
  if (/google|facebook|meta|microsoft/i.test(via)) {
    networkScore -= 15;
    flags.push("platform_via");
  }
  
  // Normalize scores
  fingerprintScore = Math.max(0, Math.min(25, fingerprintScore));
  behaviorScore = Math.max(0, Math.min(25, behaviorScore));
  networkScore = Math.max(0, Math.min(25, networkScore));
  automationScore = Math.max(0, Math.min(25, automationScore));
  
  const total = fingerprintScore + behaviorScore + networkScore + automationScore;
  
  // Calculate confidence and risk level
  const criticalFlags = flags.filter(f => 
    f === "WEBDRIVER" || f === "SELENIUM" || f === "PUPPETEER" || f === "PLAYWRIGHT" || 
    f === "CYPRESS" || f === "PHANTOM" || f === "HEADLESS_AUTOMATED" || f.startsWith("BOT_")
  ).length;
  
  let confidence: number;
  let riskLevel: "low" | "medium" | "high" | "critical";
  
  if (criticalFlags > 0) {
    confidence = 99;
    riskLevel = "critical";
  } else if (automationScore <= 5 || total < 25) {
    confidence = 90;
    riskLevel = "high";
  } else if (total < 40) {
    confidence = 65;
    riskLevel = "medium";
  } else if (total < 60) {
    confidence = 45;
    riskLevel = "medium";
  } else {
    confidence = 25;
    riskLevel = "low";
  }
  
  return {
    total,
    fingerprint: fingerprintScore,
    behavior: behaviorScore,
    network: networkScore,
    automation: automationScore,
    flags: [...new Set(flags)],
    confidence,
    riskLevel,
  };
}

// ==================== REDIRECT WITH DELAY ====================
async function createDelayedRedirect(url: string, delayMs: number): Promise<Response> {
  if (delayMs <= 0) {
    return Response.redirect(url, 302);
  }
  
  // Return HTML that delays before redirecting
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="${Math.ceil(delayMs / 1000)};url=${url}">
  <title>Redirecting...</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9f9f9; }
    .loader { width: 48px; height: 48px; border: 5px solid #e0e0e0; border-bottom-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader"></div>
  <script>setTimeout(function() { window.location.href = "${url}"; }, ${delayMs});</script>
</body>
</html>
`;
  
  return new Response(html, {
    headers: { 
      ...corsHeaders, 
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

// ==================== EDGE FUNCTION HANDLER ====================
Deno.serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // === GET: Fast redirect path ===
  if (req.method === "GET") {
    const url = new URL(req.url);
    const slug = url.searchParams.get("s") || url.searchParams.get("slug");
    
    if (!slug) {
      return new Response("Missing slug parameter", { status: 400 });
    }
    
    const userAgent = req.headers.get("user-agent") || "";
    const cfIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const cfCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || "";
    const cfIsp = req.headers.get("cf-isp") || req.headers.get("x-isp") || "";
    const referer = req.headers.get("referer") || "";
    
    // Try cache first
    let link = getCachedLink(slug);
    
    if (!link) {
      const { data, error } = await supabase
        .from("cloaked_links")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error || !data) {
        console.log(`[Cloaker] 404 ${slug} (${Date.now() - startTime}ms)`);
        return new Response("Not found", { status: 404 });
      }
      
      link = data;
      setCachedLink(slug, link);
    }
    
    if (!link.is_active) {
      return Response.redirect(link.safe_url, 302);
    }
    
    // Extract UTM params early
    const utmParams = extractUtmParams(req);
    
    // === PRE-CHECKS (fast path) ===
    
    // 1. IP Whitelist/Blacklist
    const ipCheck = checkIPLists(cfIp, link);
    if (!ipCheck.allowed) {
      console.log(`[Cloaker] BLOCKED: ${ipCheck.reason} (${Date.now() - startTime}ms)`);
      return Response.redirect(link.safe_url, 302);
    }
    
    // 2. Time rules
    const timeCheck = checkTimeRules(link);
    if (!timeCheck.allowed) {
      console.log(`[Cloaker] BLOCKED: ${timeCheck.reason} (${Date.now() - startTime}ms)`);
      return Response.redirect(link.safe_url, 302);
    }
    
    // 3. Click limits
    const clickCheck = await checkClickLimits(link, supabase);
    if (!clickCheck.allowed) {
      console.log(`[Cloaker] BLOCKED: ${clickCheck.reason} (${Date.now() - startTime}ms)`);
      return Response.redirect(link.safe_url, 302);
    }
    
    // 4. Rate limiting
    if (link.rate_limit_per_ip && link.rate_limit_per_ip > 0) {
      const rateCheck = checkRateLimit(cfIp, link.rate_limit_per_ip, link.rate_limit_window_minutes || 60);
      if (!rateCheck.allowed) {
        console.log(`[Cloaker] BLOCKED: rate_limit (${Date.now() - startTime}ms)`);
        return Response.redirect(link.safe_url, 302);
      }
    }
    
    // 5. Country filters
    if (link.allowed_countries?.length > 0 && cfCountry && !link.allowed_countries.includes(cfCountry)) {
      console.log(`[Cloaker] BLOCKED: country_not_allowed ${cfCountry} (${Date.now() - startTime}ms)`);
      return Response.redirect(link.safe_url, 302);
    }
    if (link.blocked_countries?.length > 0 && cfCountry && link.blocked_countries.includes(cfCountry)) {
      console.log(`[Cloaker] BLOCKED: country_blocked ${cfCountry} (${Date.now() - startTime}ms)`);
      return Response.redirect(link.safe_url, 302);
    }
    
    // 6. Device filter
    const deviceType = getDeviceType(userAgent);
    if (link.allowed_devices?.length > 0 && !link.allowed_devices.includes(deviceType)) {
      console.log(`[Cloaker] BLOCKED: device_filtered ${deviceType} (${Date.now() - startTime}ms)`);
      return Response.redirect(link.safe_url, 302);
    }
    
    // 7. ISP/ASN blocking
    if (checkIspBlock(cfIsp, link)) {
      console.log(`[Cloaker] BLOCKED: isp_blocked (${Date.now() - startTime}ms)`);
      return Response.redirect(link.safe_url, 302);
    }
    
    // === BOT DETECTION ===
    const instantBot = instantBotCheck(userAgent);
    const instantGoogle = instantGoogleCheck(userAgent, cfIp);
    const fullBotCheck = detectBot(userAgent, cfIp, req.headers);
    
    const shouldBlock = link.block_bots && (
      instantBot ||
      instantGoogle.isDefinitive ||
      fullBotCheck.isBot ||
      (link.block_vpn && isDatacenterIP(cfIp)) ||
      isGoogleIP(cfIp) ||
      isFacebookIP(cfIp) ||
      isTikTokIP(cfIp)
    );
    
    if (shouldBlock) {
      console.log(`[Cloaker] BLOCKED: bot_detected type=${fullBotCheck.botType} conf=${fullBotCheck.confidence}% (${Date.now() - startTime}ms)`);
      
      // Async log
      queueMicrotask(() => {
        supabase.from("cloaker_visitors").insert({
          link_id: link.id,
          fingerprint_hash: "fast-block",
          score: 0,
          decision: "block",
          user_agent: userAgent.substring(0, 500),
          ip_address: cfIp,
          country_code: cfCountry,
          is_bot: true,
          referer,
          ...utmParams,
          processing_time_ms: Date.now() - startTime,
        });
        
        supabase.from("cloaked_links").update({ 
          clicks_count: (link.clicks_count || 0) + 1,
          clicks_today: (link.clicks_today || 0) + 1,
        }).eq("id", link.id);
      });
      
      return Response.redirect(link.safe_url, 302);
    }
    
    // === ALLOW ===
    console.log(`[Cloaker] ALLOW (${Date.now() - startTime}ms)`);
    
    // Select target URL (A/B testing)
    let targetUrl = selectTargetUrl(link);
    
    // Apply UTM passthrough
    if (link.passthrough_utm) {
      targetUrl = applyUtmPassthrough(targetUrl, req);
    }
    
    // Async log
    queueMicrotask(() => {
      supabase.from("cloaker_visitors").insert({
        link_id: link.id,
        fingerprint_hash: "get-allow",
        score: 100,
        decision: "allow",
        user_agent: userAgent.substring(0, 500),
        ip_address: cfIp,
        country_code: cfCountry,
        platform: deviceType,
        is_bot: false,
        referer,
        redirect_url: targetUrl,
        ...utmParams,
        processing_time_ms: Date.now() - startTime,
      });
      
      supabase.from("cloaked_links").update({ 
        clicks_count: (link.clicks_count || 0) + 1,
        clicks_today: (link.clicks_today || 0) + 1,
      }).eq("id", link.id);
    });
    
    // Apply redirect delay if configured
    const delayMs = link.redirect_delay_ms || 0;
    if (delayMs > 0) {
      return createDelayedRedirect(targetUrl, delayMs);
    }
    
    return Response.redirect(targetUrl, 302);
  }

  // === POST: Full fingerprint analysis ===
  try {
    const body = await req.json();
    const { slug, fingerprint } = body;
    
    const ua = req.headers.get("user-agent") || "";
    const cfIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const cfCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || "";
    const cfCity = req.headers.get("cf-city") || "";
    const cfIsp = req.headers.get("cf-isp") || "";
    const referer = req.headers.get("referer") || "";
    
    const utmParams = extractUtmParams(req);
    
    const { data: link, error } = await supabase
      .from("cloaked_links")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !link) {
      return new Response(
        JSON.stringify({ error: "Link not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    // === PRE-CHECKS ===
    const ipCheck = checkIPLists(cfIp, link);
    if (!ipCheck.allowed) {
      return new Response(
        JSON.stringify({ redirectUrl: link.safe_url, decision: ipCheck.reason }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const timeCheck = checkTimeRules(link);
    if (!timeCheck.allowed) {
      return new Response(
        JSON.stringify({ redirectUrl: link.safe_url, decision: timeCheck.reason }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const clickCheck = await checkClickLimits(link, supabase);
    if (!clickCheck.allowed) {
      return new Response(
        JSON.stringify({ redirectUrl: link.safe_url, decision: clickCheck.reason }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (link.rate_limit_per_ip && link.rate_limit_per_ip > 0) {
      const rateCheck = checkRateLimit(cfIp, link.rate_limit_per_ip, link.rate_limit_window_minutes || 60);
      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({ redirectUrl: link.safe_url, decision: "rate_limited" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Quick bot check for definitive bots
    const quickBotCheck = detectBot(ua, cfIp, req.headers);
    if (link.block_bots && quickBotCheck.isBot && quickBotCheck.confidence >= 90) {
      console.log(`[Cloaker] POST FAST-BLOCK: ${quickBotCheck.botType} (${Date.now() - startTime}ms)`);
      return new Response(
        JSON.stringify({ redirectUrl: link.safe_url, decision: "blocked_definitive_bot" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!fingerprint) {
      if (link.collect_fingerprint || (link.block_bots && quickBotCheck.isBot)) {
        return new Response(
          JSON.stringify({ redirectUrl: link.safe_url, decision: "blocked_no_fingerprint" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      let targetUrl = selectTargetUrl(link);
      if (link.passthrough_utm) {
        targetUrl = applyUtmPassthrough(targetUrl, req);
      }
      
      return new Response(
        JSON.stringify({ redirectUrl: targetUrl, decision: "allowed_basic" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Full score calculation
    const scoreResult = calculateScore(fingerprint as FingerprintData, link, req.headers, cfIp);
    const fingerprintHash = generateFingerprintHash(fingerprint);
    
    console.log(`[Cloaker] POST Score=${scoreResult.total} Risk=${scoreResult.riskLevel} Flags=${scoreResult.flags.slice(0, 5).join(",")} (${Date.now() - startTime}ms)`);

    const deviceType = getDeviceType(fingerprint.userAgent);
    const minScore = link.min_score || 35;
    
    let decision: "allow" | "block" | "safe";
    let targetUrl: string;

    // Hard filters
    if (link.allowed_devices?.length > 0 && !link.allowed_devices.includes(deviceType)) {
      decision = "safe";
      targetUrl = link.safe_url;
    }
    else if (link.allowed_countries?.length > 0 && cfCountry && !link.allowed_countries.includes(cfCountry)) {
      decision = "safe";
      targetUrl = link.safe_url;
    }
    else if (link.blocked_countries?.length > 0 && cfCountry && link.blocked_countries.includes(cfCountry)) {
      decision = "safe";
      targetUrl = link.safe_url;
    }
    else if (checkIspBlock(cfIsp, link)) {
      decision = "safe";
      targetUrl = link.safe_url;
    }
    else {
      // Score-based decision
      const hasDefinitiveBotFlags = scoreResult.flags.some(f => 
        f === "WEBDRIVER" || f === "SELENIUM" || f === "PUPPETEER" || f === "PLAYWRIGHT" ||
        f === "CYPRESS" || f === "PHANTOM" || f === "HEADLESS_AUTOMATED" || f.startsWith("BOT_")
      );

      if (link.block_bots && hasDefinitiveBotFlags) {
        decision = "safe";
        targetUrl = link.safe_url;
      } else if (hasDefinitiveBotFlags) {
        decision = "safe";
        targetUrl = link.safe_url;
      } else if (scoreResult.riskLevel === "critical" && scoreResult.confidence >= 95) {
        decision = "safe";
        targetUrl = link.safe_url;
      } else if (scoreResult.total >= minScore) {
        decision = "allow";
        targetUrl = selectTargetUrl(link);
        if (link.passthrough_utm) {
          targetUrl = applyUtmPassthrough(targetUrl, req);
        }
      } else if (scoreResult.total >= minScore - 10 && scoreResult.riskLevel === "low") {
        decision = "allow";
        targetUrl = selectTargetUrl(link);
        if (link.passthrough_utm) {
          targetUrl = applyUtmPassthrough(targetUrl, req);
        }
      } else {
        decision = "block";
        targetUrl = link.safe_url;
      }
    }

    // Log visitor
    queueMicrotask(async () => {
      try {
        await supabase.from("cloaker_visitors").insert({
          link_id: link.id,
          fingerprint_hash: fingerprintHash,
          score: scoreResult.total,
          decision,
          user_agent: fingerprint.userAgent?.substring(0, 500),
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
          is_bot: scoreResult.flags.some(f => f.startsWith("BOT_") || f === "WEBDRIVER"),
          is_headless: fingerprint.isHeadless,
          is_automated: fingerprint.isAutomated,
          has_webdriver: fingerprint.hasWebdriver,
          has_phantom: fingerprint.hasPhantom,
          has_selenium: fingerprint.hasSelenium,
          has_puppeteer: fingerprint.hasPuppeteer,
          ip_address: cfIp,
          country_code: cfCountry,
          city: cfCity,
          isp: cfIsp,
          score_fingerprint: scoreResult.fingerprint,
          score_behavior: scoreResult.behavior,
          score_network: scoreResult.network,
          score_automation: scoreResult.automation,
          referer,
          redirect_url: targetUrl,
          ...utmParams,
          processing_time_ms: Date.now() - startTime,
        });
        
        await supabase.from("cloaked_links").update({ 
          clicks_count: (link.clicks_count || 0) + 1,
          clicks_today: (link.clicks_today || 0) + 1,
        }).eq("id", link.id);
      } catch (e) {
        console.error("[Cloaker] Log error:", e);
      }
    });

    console.log(`[Cloaker] Decision: ${decision}, Score: ${scoreResult.total}/${minScore}`);

    return new Response(
      JSON.stringify({ 
        redirectUrl: targetUrl, 
        decision,
        score: scoreResult.total,
        minScore,
        confidence: scoreResult.confidence,
        riskLevel: scoreResult.riskLevel,
        delayMs: decision === "allow" ? (link.redirect_delay_ms || 0) : 0,
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
