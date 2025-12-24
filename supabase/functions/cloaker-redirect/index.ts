import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== IN-MEMORY CACHES ====================
const linkCache = new Map<string, { link: any; timestamp: number }>();
const CACHE_TTL = 60000;
const rateLimitCache = new Map<string, { count: number; windowStart: number }>();
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

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitCache.entries()) {
    if (now - value.windowStart > 3600000) rateLimitCache.delete(key);
  }
}, 300000);

// ==================== RATE LIMITING ====================
function checkRateLimit(ip: string, limit: number, windowMinutes: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const entry = rateLimitCache.get(ip);
  
  if (!entry || (now - entry.windowStart) > windowMs) {
    rateLimitCache.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (entry.count >= limit) return { allowed: false, remaining: 0 };
  
  entry.count++;
  rateLimitCache.set(ip, entry);
  return { allowed: true, remaining: limit - entry.count };
}

// ==================== CLICK LIMITS ====================
async function checkClickLimits(link: any, supabase: any): Promise<{ allowed: boolean; reason?: string }> {
  if (link.max_clicks_total && link.clicks_count >= link.max_clicks_total) {
    return { allowed: false, reason: "total_clicks_exceeded" };
  }
  
  if (link.max_clicks_daily) {
    const today = new Date().toISOString().split('T')[0];
    if (link.last_click_reset !== today) {
      await supabase.from("cloaked_links").update({ clicks_today: 0, last_click_reset: today }).eq("id", link.id);
      link.clicks_today = 0;
    }
    if ((link.clicks_today || 0) >= link.max_clicks_daily) {
      return { allowed: false, reason: "daily_clicks_exceeded" };
    }
  }
  
  return { allowed: true };
}

// ==================== TIME RULES ====================
function checkTimeRules(link: any): { allowed: boolean; reason?: string } {
  if (link.allowed_hours_start === null || link.allowed_hours_end === null) return { allowed: true };
  
  const currentHour = new Date().getUTCHours();
  const start = link.allowed_hours_start;
  const end = link.allowed_hours_end;
  
  if (start <= end) {
    if (currentHour < start || currentHour >= end) return { allowed: false, reason: "outside_allowed_hours" };
  } else {
    if (currentHour < start && currentHour >= end) return { allowed: false, reason: "outside_allowed_hours" };
  }
  
  return { allowed: true };
}

// ==================== IP WHITELIST/BLACKLIST ====================
function checkIPLists(ip: string, link: any): { allowed: boolean; reason?: string } {
  if (link.whitelist_ips?.length > 0) {
    const isWhitelisted = link.whitelist_ips.some((pattern: string) => {
      if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, "\\d+") + "$");
        return regex.test(ip);
      }
      return pattern === ip;
    });
    if (!isWhitelisted) return { allowed: false, reason: "ip_not_whitelisted" };
  }
  
  if (link.blacklist_ips?.length > 0) {
    const isBlacklisted = link.blacklist_ips.some((pattern: string) => {
      if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, "\\d+") + "$");
        return regex.test(ip);
      }
      return pattern === ip;
    });
    if (isBlacklisted) return { allowed: false, reason: "ip_blacklisted" };
  }
  
  return { allowed: true };
}

// ==================== A/B URL ROTATION ====================
function selectTargetUrl(link: any): string {
  if (!link.target_urls || !Array.isArray(link.target_urls) || link.target_urls.length === 0) {
    return link.target_url;
  }
  
  const urls = link.target_urls as { url: string; weight: number }[];
  const totalWeight = urls.reduce((sum, u) => sum + (u.weight || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const urlObj of urls) {
    random -= urlObj.weight || 1;
    if (random <= 0) return urlObj.url;
  }
  
  return urls[urls.length - 1]?.url || link.target_url;
}

// ==================== UTM PASSTHROUGH ====================
function applyUtmPassthrough(targetUrl: string, request: Request): string {
  const incomingUrl = new URL(request.url);
  const targetUrlObj = new URL(targetUrl);
  
  const utmParams = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "ttclid", "msclkid", "gbraid", "wbraid", "dclid"];
  
  for (const param of utmParams) {
    const value = incomingUrl.searchParams.get(param);
    if (value && !targetUrlObj.searchParams.has(param)) {
      targetUrlObj.searchParams.set(param, value);
    }
  }
  
  return targetUrlObj.toString();
}

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

// ==================== GOOGLE ADS - ULTRA COMPREHENSIVE DETECTION ====================

// Google's Official Bot User-Agents (December 2024 - Updated)
const GOOGLE_BOT_UA_PATTERNS = [
  // === ADSBOT (CRITICAL - Primary Ad Verification) ===
  /AdsBot-Google/i,
  /AdsBot-Google-Mobile/i,
  /AdsBot-Google-Mobile-Apps/i,
  /Mozilla\/5\.0.*AdsBot-Google/i,
  /Mozilla\/5\.0 \(compatible; AdsBot-Google/i,
  /Mozilla\/5\.0 \(iPhone.*AdsBot-Google-Mobile/i,
  /Mozilla\/5\.0 \(Linux; Android.*AdsBot-Google-Mobile/i,
  
  // === GOOGLEBOT (Search & Display Network) ===
  /Googlebot\/2\.1/i,
  /Googlebot-Image/i,
  /Googlebot-Video/i,
  /Googlebot-News/i,
  /Googlebot-Mobile/i,
  /Mozilla\/5\.0.*compatible.*Googlebot/i,
  /Mozilla\/5\.0 \(Linux; Android.*Nexus.*Googlebot/i,
  /Mozilla\/5\.0 \(compatible; Googlebot\/2\.1/i,
  
  // === MEDIAPARTNERS (AdSense Content Matching) ===
  /Mediapartners-Google/i,
  /Mediapartners/i,
  /Mediapartners-Google\/2\.1/i,
  
  // === STOREBOT (Google Shopping) ===
  /Storebot-Google/i,
  /Mozilla\/5\.0.*Storebot-Google/i,
  
  // === GOOGLE-EXTENDED (AI/ML Training Crawling) ===
  /Google-Extended/i,
  /Mozilla\/5\.0.*Google-Extended/i,
  
  // === GOOGLE ADS SPECIFIC TOOLS ===
  /Google-Adwords/i,
  /Google-Adwords-Instant/i,
  /Google-Adwords-Express/i,
  /Google-Adwords-DisplayAds/i,
  /Google-Shopping/i,
  /Google-Shopping-Quality/i,
  /Google-Product-Search/i,
  /Google-Merchant/i,
  /Google-Merchant-Center/i,
  /Google-InspectionTool/i,
  /Google-Safety/i,
  /Google-Site-Verification/i,
  /Google-Structured-Data/i,
  /Google-StructuredDataTestingTool/i,
  
  // === LIGHTHOUSE/PAGESPEED (Landing Page Quality) ===
  /Lighthouse/i,
  /Chrome-Lighthouse/i,
  /PageSpeed/i,
  /PageSpeed Insights/i,
  /Google PageSpeed/i,
  /PSTS\/\d/i,
  /Google Page Speed/i,
  
  // === GOOGLE QUALITY RATERS & INTERNAL TOOLS ===
  /Google-Read-Aloud/i,
  /Google-Speakr/i,
  /Google-Duplex/i,
  /DuplexWeb-Google/i,
  /Google-Favicon/i,
  /Google-YouTube-Links/i,
  /GoogleProducer/i,
  /GoogleAssociationService/i,
  /Google-PhysicalWeb/i,
  /Google-Certificates-Bridge/i,
  /Google-Test/i,
  /Google-Testing/i,
  /GoogleSecurityScanner/i,
  /Google-Transparency-Report/i,
  /Google-Apps-Script/i,
  /Google-HTTP-Java-Client/i,
  /Google-AMPHTML/i,
  /Google-AMP-Cache/i,
  /Google-AMP-Prefetch/i,
  /Google-Web-Preview/i,
  /Google-WebPreview/i,
  /Google-PageRenderer/i,
  /Google-Cloud-Scheduler/i,
  /Google-Cloud/i,
  /GCE-Agent/i,
  
  // === FEEDFETCHER (RSS/News) ===
  /FeedFetcher-Google/i,
  /Feedfetcher-Google-CoOp/i,
  /Google-Podcast/i,
  /Google-Podcasts/i,
  
  // === GOOGLE APIS ===
  /APIs-Google/i,
  /googleweblight/i,
  /google\.com\/bot/i,
  
  // === STEALTH PATTERNS (Google tools that try to look like browsers) ===
  /Chrome\/\d+\.0\.\d+\.\d+.*\+https:\/\/developers\.google\.com/i,
  /compatible.*Google/i,
  /Google\+/i,
];

// Google's Complete IP Ranges (Updated December 2024)
// Source: https://www.gstatic.com/ipranges/goog.json + cloud.json + special-crawlers.json
const GOOGLE_IP_RANGES = [
  // === GOOGLEBOT MAIN RANGES (crawl-*.googlebot.com) ===
  { start: "66.249.64.0", end: "66.249.95.255" },   // Primary Googlebot range
  { start: "66.249.66.0", end: "66.249.66.255" },   // AdsBot-Google
  { start: "66.249.68.0", end: "66.249.69.255" },   // Mediapartners-Google
  { start: "66.249.79.0", end: "66.249.79.255" },   // AdsBot-Google-Mobile
  
  // === GOOGLE SERVICES IPs ===
  { start: "64.233.160.0", end: "64.233.191.255" },
  { start: "66.102.0.0", end: "66.102.15.255" },
  { start: "72.14.192.0", end: "72.14.255.255" },
  { start: "74.125.0.0", end: "74.125.255.255" },
  { start: "108.177.0.0", end: "108.177.127.255" },
  { start: "142.250.0.0", end: "142.251.255.255" },
  { start: "172.217.0.0", end: "172.217.255.255" },
  { start: "173.194.0.0", end: "173.194.255.255" },
  { start: "209.85.128.0", end: "209.85.255.255" },
  { start: "216.58.192.0", end: "216.58.223.255" },
  { start: "216.239.32.0", end: "216.239.63.255" },
  
  // === GOOGLE CLOUD PLATFORM (Used for Ad Verification) ===
  { start: "34.64.0.0", end: "34.127.255.255" },
  { start: "34.128.0.0", end: "34.159.255.255" },
  { start: "35.184.0.0", end: "35.247.255.255" },
  { start: "35.186.0.0", end: "35.186.127.255" },
  { start: "104.154.0.0", end: "104.155.255.255" },
  { start: "104.196.0.0", end: "104.199.255.255" },
  { start: "130.211.0.0", end: "130.211.255.255" },
  { start: "146.148.0.0", end: "146.148.127.255" },
  
  // === GOOGLE SPECIAL CRAWLERS ===
  { start: "192.178.0.0", end: "192.178.255.255" },
  { start: "199.36.153.0", end: "199.36.155.255" },
  { start: "74.114.24.0", end: "74.114.31.255" },
  
  // === GOOGLE GLOBAL CACHE ===
  { start: "23.236.48.0", end: "23.236.63.255" },
  { start: "23.251.128.0", end: "23.251.191.255" },
  { start: "107.167.160.0", end: "107.167.191.255" },
  { start: "107.178.192.0", end: "107.178.255.255" },
  { start: "162.216.148.0", end: "162.216.151.255" },
  { start: "162.222.176.0", end: "162.222.183.255" },
  
  // === GOOGLE FIBER (Sometimes used for testing) ===
  { start: "136.22.0.0", end: "136.23.255.255" },
  
  // === ADDITIONAL GOOGLE RANGES (2024) ===
  { start: "8.8.4.0", end: "8.8.8.255" },           // Google DNS (sometimes crawlers)
  { start: "8.34.208.0", end: "8.35.207.255" },
  { start: "8.35.192.0", end: "8.35.207.255" },
  { start: "23.228.128.0", end: "23.228.191.255" },
  { start: "34.0.0.0", end: "34.63.255.255" },
  { start: "35.0.0.0", end: "35.183.255.255" },
  { start: "35.248.0.0", end: "35.255.255.255" },
  { start: "64.15.112.0", end: "64.15.127.255" },
  { start: "64.233.64.0", end: "64.233.127.255" },
  { start: "70.32.128.0", end: "70.32.159.255" },
  { start: "72.14.192.0", end: "72.14.255.255" },
  { start: "74.114.24.0", end: "74.114.31.255" },
  { start: "104.132.0.0", end: "104.135.255.255" },
  { start: "104.237.160.0", end: "104.237.191.255" },
  { start: "108.170.192.0", end: "108.170.255.255" },
  { start: "108.177.0.0", end: "108.177.127.255" },
  { start: "142.250.0.0", end: "142.251.255.255" },
  { start: "146.148.0.0", end: "146.148.127.255" },
  { start: "162.216.148.0", end: "162.216.151.255" },
  { start: "172.110.32.0", end: "172.110.39.255" },
  { start: "172.217.0.0", end: "172.217.255.255" },
  { start: "172.253.0.0", end: "172.253.255.255" },
  { start: "173.194.0.0", end: "173.194.255.255" },
  { start: "173.255.112.0", end: "173.255.127.255" },
  { start: "192.104.160.0", end: "192.104.161.255" },
  { start: "192.158.28.0", end: "192.158.31.255" },
  { start: "192.178.0.0", end: "192.179.255.255" },
  { start: "193.186.4.0", end: "193.186.7.255" },
  { start: "199.36.153.0", end: "199.36.159.255" },
  { start: "199.192.112.0", end: "199.192.127.255" },
  { start: "199.223.232.0", end: "199.223.239.255" },
  { start: "207.223.160.0", end: "207.223.175.255" },
  { start: "208.65.152.0", end: "208.65.155.255" },
  { start: "208.68.108.0", end: "208.68.111.255" },
  { start: "208.81.188.0", end: "208.81.191.255" },
  { start: "208.117.224.0", end: "208.117.255.255" },
  { start: "209.85.128.0", end: "209.85.255.255" },
  { start: "216.58.192.0", end: "216.58.223.255" },
  { start: "216.73.80.0", end: "216.73.95.255" },
  { start: "216.239.32.0", end: "216.239.63.255" },
  { start: "216.252.220.0", end: "216.252.223.255" },
];

// Google ASN Numbers
const GOOGLE_ASNS = [
  "AS15169",  // Google LLC
  "AS396982", // Google Cloud
  "AS36492",  // Google Fiber
  "AS139070", // Google Asia
  "AS139190", // Google Cloud Asia
  "AS36040",  // YouTube
  "AS43515",  // Google Switzerland
  "AS41264",  // Google Ireland
  "AS19527",  // Google (legacy)
  "AS22577",  // Google Cloud (legacy)
  "AS22859",  // Google Cloud (legacy)
  "AS26910",  // Google Cloud
  "AS36039",  // Google
  "AS36384",  // Google
  "AS36385",  // Google
  "AS36411",  // Google
  "AS394507", // Google Cloud
  "AS394639", // Google Cloud
  "AS395973", // Google Cloud
];

// Headers that indicate Google traffic
const GOOGLE_HEADER_PATTERNS = [
  "x-google-",
  "x-goog-",
  "x-gfe-",
  "x-cloud-trace-context",
  "x-appengine-",
  "x-forwarded-for-google",
  "via: 1.1 google",
  "via: google",
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

// Datacenter/Cloud IP ranges (expanded)
const DATACENTER_IP_RANGES = [
  // AWS
  { start: "3.0.0.0", end: "3.255.255.255" },
  { start: "52.0.0.0", end: "52.255.255.255" },
  { start: "54.0.0.0", end: "54.255.255.255" },
  { start: "18.0.0.0", end: "18.255.255.255" },
  { start: "13.0.0.0", end: "13.255.255.255" },
  // Azure
  { start: "20.0.0.0", end: "20.255.255.255" },
  { start: "40.74.0.0", end: "40.125.255.255" },
  { start: "104.40.0.0", end: "104.47.255.255" },
  // DigitalOcean
  { start: "159.89.0.0", end: "159.89.255.255" },
  { start: "167.99.0.0", end: "167.99.255.255" },
  { start: "206.189.0.0", end: "206.189.255.255" },
  { start: "64.225.0.0", end: "64.225.255.255" },
  // Vultr
  { start: "45.32.0.0", end: "45.32.255.255" },
  { start: "45.63.0.0", end: "45.63.255.255" },
  { start: "45.76.0.0", end: "45.76.255.255" },
  { start: "149.28.0.0", end: "149.28.255.255" },
  // Linode
  { start: "45.33.0.0", end: "45.33.255.255" },
  { start: "50.116.0.0", end: "50.116.255.255" },
  { start: "139.162.0.0", end: "139.162.255.255" },
  // Hetzner
  { start: "116.202.0.0", end: "116.203.255.255" },
  { start: "49.12.0.0", end: "49.13.255.255" },
  { start: "95.216.0.0", end: "95.217.255.255" },
  // OVH
  { start: "51.38.0.0", end: "51.39.255.255" },
  { start: "51.75.0.0", end: "51.79.255.255" },
  { start: "51.68.0.0", end: "51.68.255.255" },
  // Cloudflare Workers
  { start: "172.64.0.0", end: "172.71.255.255" },
  { start: "104.16.0.0", end: "104.31.255.255" },
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

// ==================== GOOGLE ADS DEEP DETECTION ====================
interface GoogleDetectionResult {
  isGoogle: boolean;
  isAdsBot: boolean;
  isDefinitive: boolean;
  confidence: number;
  reasons: string[];
  botType: string | null;
}

function detectGoogleAds(userAgent: string, ip: string, headers: Headers): GoogleDetectionResult {
  const reasons: string[] = [];
  let confidence = 0;
  let isGoogle = false;
  let isAdsBot = false;
  let isDefinitive = false;
  let botType: string | null = null;
  
  const ua = userAgent.toLowerCase();
  
  // === 1. DIRECT USER-AGENT MATCHING (Highest Priority) ===
  for (const pattern of GOOGLE_BOT_UA_PATTERNS) {
    if (pattern.test(userAgent)) {
      isGoogle = true;
      confidence = 100;
      isDefinitive = true;
      
      // Determine specific bot type
      if (/adsbot/i.test(userAgent)) {
        isAdsBot = true;
        botType = "AdsBot";
        reasons.push("ADSBOT_UA_MATCH");
      } else if (/mediapartners/i.test(userAgent)) {
        isAdsBot = true;
        botType = "Mediapartners";
        reasons.push("MEDIAPARTNERS_UA_MATCH");
      } else if (/storebot/i.test(userAgent)) {
        isAdsBot = true;
        botType = "Storebot";
        reasons.push("STOREBOT_UA_MATCH");
      } else if (/lighthouse|pagespeed/i.test(userAgent)) {
        isAdsBot = true;
        botType = "Lighthouse";
        reasons.push("LIGHTHOUSE_UA_MATCH");
      } else if (/googlebot/i.test(userAgent)) {
        botType = "Googlebot";
        reasons.push("GOOGLEBOT_UA_MATCH");
      } else if (/google-shopping|merchant/i.test(userAgent)) {
        isAdsBot = true;
        botType = "Google Shopping";
        reasons.push("GOOGLE_SHOPPING_UA_MATCH");
      } else if (/google-adwords|google-ads/i.test(userAgent)) {
        isAdsBot = true;
        botType = "Google Ads";
        reasons.push("GOOGLE_ADS_UA_MATCH");
      } else {
        botType = "Google Bot";
        reasons.push("GOOGLE_UA_MATCH");
      }
      break;
    }
  }
  
  // === 2. IP RANGE CHECK ===
  if (isGoogleIP(ip)) {
    isGoogle = true;
    confidence = Math.max(confidence, 95);
    reasons.push("GOOGLE_IP_RANGE");
    
    if (!isDefinitive) {
      // IP is Google but UA doesn't look like a bot
      // This could be Google Quality Rater or stealth verification
      if (!botType) botType = "Google IP (Stealth)";
      if (confidence >= 95) isDefinitive = true;
    }
  }
  
  // === 3. HEADER ANALYSIS (Critical for Stealth Detection) ===
  const allHeaders: string[] = [];
  headers.forEach((value, key) => {
    allHeaders.push(`${key.toLowerCase()}: ${value.toLowerCase()}`);
  });
  
  // Check for Google-specific headers
  for (const pattern of GOOGLE_HEADER_PATTERNS) {
    for (const header of allHeaders) {
      if (header.includes(pattern.toLowerCase())) {
        isGoogle = true;
        confidence += 30;
        reasons.push(`GOOGLE_HEADER_${pattern.split("-")[1]?.toUpperCase() || "DETECTED"}`);
        break;
      }
    }
  }
  
  // Via header check
  const via = headers.get("via") || "";
  if (/google|gws|gfe/i.test(via)) {
    isGoogle = true;
    confidence += 25;
    reasons.push("GOOGLE_VIA_HEADER");
  }
  
  // X-Forwarded-For patterns (Google often has specific patterns)
  const xff = headers.get("x-forwarded-for") || "";
  if (xff) {
    const xffIps = xff.split(",").map(s => s.trim());
    for (const xffIp of xffIps) {
      if (isGoogleIP(xffIp)) {
        isGoogle = true;
        confidence += 20;
        reasons.push("GOOGLE_XFF_IP");
        break;
      }
    }
  }
  
  // === 4. ACCEPT HEADER ANALYSIS ===
  const accept = headers.get("accept") || "";
  const acceptLang = headers.get("accept-language") || "";
  const acceptEncoding = headers.get("accept-encoding") || "";
  
  // Bots often have minimal or specific Accept headers
  if (accept === "*/*" || accept === "text/html" || accept === "") {
    confidence += 8;
    reasons.push("MINIMAL_ACCEPT");
  }
  
  if (!acceptLang || acceptLang === "*" || acceptLang === "en-US,en;q=0.9") {
    confidence += 8;
    reasons.push("GENERIC_ACCEPT_LANG");
  }
  
  // === 5. SEC-FETCH HEADERS (Modern browser fingerprint) ===
  const secFetchDest = headers.get("sec-fetch-dest");
  const secFetchMode = headers.get("sec-fetch-mode");
  const secFetchSite = headers.get("sec-fetch-site");
  const secFetchUser = headers.get("sec-fetch-user");
  
  // Missing all Sec-Fetch headers (bots often don't have these)
  if (!secFetchDest && !secFetchMode && !secFetchSite && !secFetchUser) {
    // Only flag if not mobile Safari (which sometimes lacks these)
    if (!/safari/i.test(ua) || /chrome/i.test(ua)) {
      confidence += 15;
      reasons.push("NO_SEC_FETCH_HEADERS");
    }
  }
  
  // === 6. USER-AGENT ANOMALY DETECTION ===
  
  // Very short UA
  if (userAgent.length < 50) {
    confidence += 20;
    reasons.push("SHORT_UA");
  }
  
  // UA contains URL (common for bots)
  if (/https?:\/\//i.test(userAgent)) {
    confidence += 15;
    reasons.push("URL_IN_UA");
  }
  
  // Check for Google internal patterns in UA
  if (/google\.com|googleapis|gstatic/i.test(userAgent)) {
    isGoogle = true;
    confidence += 25;
    reasons.push("GOOGLE_INTERNAL_UA_REF");
  }
  
  // Chrome version analysis (Google bots use specific Chrome versions)
  const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
  if (chromeMatch) {
    const version = parseInt(chromeMatch[1]);
    // Google bots often use Chrome 119-122 (as of late 2024)
    if (version >= 119 && version <= 122 && isGoogle) {
      confidence += 5;
      reasons.push("GOOGLE_CHROME_VERSION");
    }
  }
  
  // === 7. REFERER ANALYSIS ===
  const referer = headers.get("referer") || "";
  if (/google\.com|google\.[a-z]{2,3}(\.[a-z]{2})?$/i.test(referer)) {
    // Referer from Google - could be legitimate click but also bot verification
    if (isGoogle) {
      confidence += 10;
      reasons.push("GOOGLE_REFERER");
    }
  }
  if (!referer && isGoogle) {
    // No referer + Google IP = likely bot
    confidence += 8;
    reasons.push("NO_REFERER");
  }
  
  // === 8. CONNECTION PATTERNS ===
  const connection = headers.get("connection") || "";
  if (connection.toLowerCase() === "close") {
    // Bots often use Connection: close
    confidence += 5;
    reasons.push("CONNECTION_CLOSE");
  }
  
  // === 9. STEALTH BOT DETECTION (Quality Raters) ===
  // Google Quality Raters use real browsers but from Google IPs
  if (isGoogleIP(ip) && !isDefinitive) {
    // Check if it looks like a real browser but from Google IP
    const looksLikeRealBrowser = 
      /mozilla.*chrome.*safari/i.test(ua) &&
      !GOOGLE_BOT_UA_PATTERNS.some(p => p.test(userAgent));
    
    if (looksLikeRealBrowser) {
      isGoogle = true;
      isAdsBot = true;
      confidence = Math.max(confidence, 90);
      botType = "Google Quality Rater";
      reasons.push("GOOGLE_QUALITY_RATER_SUSPECTED");
    }
  }
  
  // === 10. ASN CHECK ===
  const cfAsn = headers.get("cf-asn") || headers.get("x-asn") || "";
  if (cfAsn && GOOGLE_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) {
    isGoogle = true;
    confidence = Math.max(confidence, 92);
    reasons.push("GOOGLE_ASN");
  }
  
  // ISP name check
  const cfIsp = headers.get("cf-isp") || headers.get("x-isp") || "";
  if (/google/i.test(cfIsp)) {
    isGoogle = true;
    confidence = Math.max(confidence, 93);
    reasons.push("GOOGLE_ISP");
  }
  
  // Finalize
  if (confidence >= 90) isDefinitive = true;
  
  return {
    isGoogle,
    isAdsBot,
    isDefinitive,
    confidence: Math.min(100, confidence),
    reasons,
    botType,
  };
}

// ==================== COMPREHENSIVE BOT DETECTION ====================
interface BotDetectionResult {
  isBot: boolean;
  botType: string | null;
  confidence: number;
  reasons: string[];
  platform?: string;
  isGoogleAds?: boolean;
}

function detectBot(userAgent: string, ip: string, headers: Headers): BotDetectionResult {
  const reasons: string[] = [];
  let confidence = 0;
  let botType: string | null = null;
  const ua = userAgent.toLowerCase();
  
  // === 1. GOOGLE ADS DETECTION (Priority) ===
  const googleResult = detectGoogleAds(userAgent, ip, headers);
  if (googleResult.isGoogle) {
    return {
      isBot: true,
      botType: googleResult.botType || "Google",
      confidence: googleResult.confidence,
      reasons: googleResult.reasons,
      platform: "google",
      isGoogleAds: googleResult.isAdsBot,
    };
  }
  
  // === 2. FACEBOOK/META ===
  if (/facebookexternalhit|facebot|facebook|meta-external|instagram/i.test(userAgent)) {
    return {
      isBot: true,
      botType: "Facebook",
      confidence: 100,
      reasons: ["FACEBOOK_UA"],
      platform: "facebook",
    };
  }
  if (isFacebookIP(ip)) {
    return {
      isBot: true,
      botType: "Facebook",
      confidence: 95,
      reasons: ["FACEBOOK_IP"],
      platform: "facebook",
    };
  }
  
  // === 3. TIKTOK/BYTEDANCE ===
  if (/tiktok|bytedance|bytespider/i.test(userAgent)) {
    return {
      isBot: true,
      botType: "TikTok",
      confidence: 100,
      reasons: ["TIKTOK_UA"],
      platform: "tiktok",
    };
  }
  if (isTikTokIP(ip)) {
    return {
      isBot: true,
      botType: "TikTok",
      confidence: 90,
      reasons: ["TIKTOK_IP"],
      platform: "tiktok",
    };
  }
  
  // === 4. OTHER AD PLATFORMS ===
  if (/bingads|adidxbot|pinterest|twitterbot|linkedinbot|snapchat|slackbot|discordbot|telegrambot|whatsapp|applebot/i.test(userAgent)) {
    botType = "Ad Platform";
    confidence = 95;
    reasons.push("AD_PLATFORM_BOT");
  }
  
  // === 5. SEARCH ENGINES ===
  if (/bingbot|yandexbot|baiduspider|duckduckbot|sogou|exabot|ia_archiver/i.test(userAgent)) {
    botType = "Search Engine";
    confidence = 95;
    reasons.push("SEARCH_ENGINE_BOT");
  }
  
  // === 6. SEO/ANALYTICS TOOLS ===
  if (/semrush|ahrefsbot|mj12bot|dotbot|petalbot|screaming.frog|rogerbot|seokicks|sistrix|blexbot|dataforseo/i.test(userAgent)) {
    botType = "SEO Tool";
    confidence = 95;
    reasons.push("SEO_TOOL_BOT");
  }
  
  // === 7. AI CRAWLERS ===
  if (/gptbot|chatgpt|claude|anthropic|perplexity|cohere|ccbot|diffbot/i.test(userAgent)) {
    botType = "AI Crawler";
    confidence = 95;
    reasons.push("AI_CRAWLER");
  }
  
  // === 8. AUTOMATION FRAMEWORKS ===
  if (/headless|phantomjs|selenium|puppeteer|playwright|cypress|webdriver|nightmare|casperjs/i.test(userAgent)) {
    botType = "Automation";
    confidence = 100;
    reasons.push("AUTOMATION_FRAMEWORK");
  }
  
  // === 9. HTTP CLIENTS ===
  if (/curl|wget|python|java\/|axios|node-fetch|go-http|libwww|scrapy|httpx|okhttp|guzzle|urllib|aiohttp/i.test(userAgent)) {
    botType = "HTTP Client";
    confidence = 90;
    reasons.push("HTTP_CLIENT");
  }
  
  // === 10. DATACENTER IP ===
  if (!botType && isDatacenterIP(ip)) {
    confidence += 40;
    reasons.push("DATACENTER_IP");
  }
  
  // === 11. HEADER ANALYSIS ===
  const acceptLang = headers.get("accept-language") || "";
  const accept = headers.get("accept") || "";
  const secFetchDest = headers.get("sec-fetch-dest");
  const secFetchMode = headers.get("sec-fetch-mode");
  
  if (!acceptLang || acceptLang === "*") {
    confidence += 15;
    reasons.push("NO_ACCEPT_LANGUAGE");
  }
  
  if (accept === "*/*" || !accept.includes("text/html")) {
    confidence += 10;
    reasons.push("MINIMAL_ACCEPT");
  }
  
  if (!secFetchDest && !secFetchMode && !ua.includes("safari")) {
    confidence += 15;
    reasons.push("NO_SEC_FETCH");
  }
  
  const via = headers.get("via") || "";
  if (/google|facebook|meta|microsoft|amazon/i.test(via)) {
    confidence += 30;
    reasons.push("PLATFORM_VIA");
  }
  
  // === 12. UA ANOMALIES ===
  if (userAgent.length < 50) {
    confidence += 25;
    reasons.push("SHORT_UA");
  }
  
  if (/https?:\/\//i.test(userAgent)) {
    confidence += 20;
    reasons.push("URL_IN_UA");
  }
  
  if (/bot(?!tle)/i.test(ua) && !/about|cubot/i.test(ua)) {
    confidence += 40;
    reasons.push("CONTAINS_BOT");
    if (!botType) botType = "Generic Bot";
  }
  
  if (/crawler|spider|scraper|fetch/i.test(ua)) {
    confidence += 35;
    reasons.push("CRAWLER_PATTERN");
    if (!botType) botType = "Crawler";
  }
  
  const isBot = botType !== null || confidence >= 60;
  
  return {
    isBot,
    botType,
    confidence: Math.min(100, confidence),
    reasons,
    platform: botType?.toLowerCase().replace(/\s+/g, "_") || undefined,
  };
}

// ==================== ISP/ASN BLOCKING ====================
function checkIspBlock(isp: string, link: any): boolean {
  if (!link.blocked_isps?.length) return false;
  const ispLower = (isp || "").toLowerCase();
  return link.blocked_isps.some((blocked: string) => ispLower.includes(blocked.toLowerCase()));
}

function checkAsnBlock(asn: string, link: any): boolean {
  if (!link.blocked_asns?.length) return false;
  const asnUpper = (asn || "").toUpperCase();
  return link.blocked_asns.some((blocked: string) => asnUpper.includes(blocked.toUpperCase()));
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

function generateFingerprintHash(fp: any): string {
  const components = [
    fp.userAgent, fp.language, fp.timezone, fp.screenResolution,
    fp.colorDepth, fp.deviceMemory, fp.hardwareConcurrency, fp.platform,
    fp.webglVendor, fp.webglRenderer, fp.canvasHash, fp.fontsHash,
  ].filter(Boolean).join("|");
  return hashString(components);
}

// ==================== REDIRECT WITH DELAY ====================
async function createDelayedRedirect(url: string, delayMs: number): Promise<Response> {
  if (delayMs <= 0) return Response.redirect(url, 302);
  
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="${Math.ceil(delayMs / 1000)};url=${url}"><title>Redirecting...</title><style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f9f9f9}.loader{width:48px;height:48px;border:5px solid #e0e0e0;border-bottom-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="loader"></div><script>setTimeout(function(){window.location.href="${url}"},${delayMs})</script></body></html>`;
  
  return new Response(html, {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate" },
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

  // === GET: Fast redirect ===
  if (req.method === "GET") {
    const url = new URL(req.url);
    const slug = url.searchParams.get("s") || url.searchParams.get("slug");
    
    if (!slug) return new Response("Missing slug", { status: 400 });
    
    const userAgent = req.headers.get("user-agent") || "";
    const cfIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const cfCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || "";
    const cfIsp = req.headers.get("cf-isp") || req.headers.get("x-isp") || "";
    const referer = req.headers.get("referer") || "";
    
    let link = getCachedLink(slug);
    
    if (!link) {
      const { data, error } = await supabase.from("cloaked_links").select("*").eq("slug", slug).single();
      if (error || !data) {
        console.log(`[Cloaker] 404 ${slug} (${Date.now() - startTime}ms)`);
        return new Response("Not found", { status: 404 });
      }
      link = data;
      setCachedLink(slug, link);
    }
    
    if (!link.is_active) return Response.redirect(link.safe_url, 302);
    
    const utmParams = extractUtmParams(req);
    
    // === PRE-CHECKS ===
    const ipCheck = checkIPLists(cfIp, link);
    if (!ipCheck.allowed) {
      console.log(`[Cloaker] BLOCKED: ${ipCheck.reason}`);
      return Response.redirect(link.safe_url, 302);
    }
    
    const timeCheck = checkTimeRules(link);
    if (!timeCheck.allowed) {
      console.log(`[Cloaker] BLOCKED: ${timeCheck.reason}`);
      return Response.redirect(link.safe_url, 302);
    }
    
    const clickCheck = await checkClickLimits(link, supabase);
    if (!clickCheck.allowed) {
      console.log(`[Cloaker] BLOCKED: ${clickCheck.reason}`);
      return Response.redirect(link.safe_url, 302);
    }
    
    if (link.rate_limit_per_ip > 0) {
      const rateCheck = checkRateLimit(cfIp, link.rate_limit_per_ip, link.rate_limit_window_minutes || 60);
      if (!rateCheck.allowed) {
        console.log(`[Cloaker] BLOCKED: rate_limit`);
        return Response.redirect(link.safe_url, 302);
      }
    }
    
    // Country filters
    if (link.allowed_countries?.length > 0 && cfCountry && !link.allowed_countries.includes(cfCountry)) {
      console.log(`[Cloaker] BLOCKED: country_not_allowed ${cfCountry}`);
      return Response.redirect(link.safe_url, 302);
    }
    if (link.blocked_countries?.length > 0 && cfCountry && link.blocked_countries.includes(cfCountry)) {
      console.log(`[Cloaker] BLOCKED: country_blocked ${cfCountry}`);
      return Response.redirect(link.safe_url, 302);
    }
    
    // Device filter
    const deviceType = getDeviceType(userAgent);
    if (link.allowed_devices?.length > 0 && !link.allowed_devices.includes(deviceType)) {
      console.log(`[Cloaker] BLOCKED: device_filtered ${deviceType}`);
      return Response.redirect(link.safe_url, 302);
    }
    
    // ISP blocking
    if (checkIspBlock(cfIsp, link)) {
      console.log(`[Cloaker] BLOCKED: isp_blocked`);
      return Response.redirect(link.safe_url, 302);
    }
    
    // === BOT DETECTION (with emphasis on Google Ads) ===
    const botResult = detectBot(userAgent, cfIp, req.headers);
    
    const shouldBlock = link.block_bots && (
      botResult.isBot ||
      (link.block_vpn && isDatacenterIP(cfIp))
    );
    
    if (shouldBlock) {
      const processingTime = Date.now() - startTime;
      console.log(`[Cloaker] BLOCKED: ${botResult.botType || "bot"} conf=${botResult.confidence}% reasons=${botResult.reasons.slice(0,3).join(",")} (${processingTime}ms)`);
      
      queueMicrotask(() => {
        supabase.from("cloaker_visitors").insert({
          link_id: link.id,
          fingerprint_hash: "fast-block",
          score: 0,
          decision: "block",
          user_agent: userAgent.substring(0, 500),
          ip_address: cfIp,
          country_code: cfCountry,
          isp: cfIsp,
          is_bot: true,
          referer,
          ...utmParams,
          processing_time_ms: processingTime,
        });
        supabase.from("cloaked_links").update({ 
          clicks_count: (link.clicks_count || 0) + 1,
          clicks_today: (link.clicks_today || 0) + 1,
        }).eq("id", link.id);
      });
      
      return Response.redirect(link.safe_url, 302);
    }
    
    // === ALLOW ===
    let targetUrl = selectTargetUrl(link);
    if (link.passthrough_utm) targetUrl = applyUtmPassthrough(targetUrl, req);
    
    const processingTime = Date.now() - startTime;
    console.log(`[Cloaker] ALLOW (${processingTime}ms)`);
    
    queueMicrotask(() => {
      supabase.from("cloaker_visitors").insert({
        link_id: link.id,
        fingerprint_hash: "get-allow",
        score: 100,
        decision: "allow",
        user_agent: userAgent.substring(0, 500),
        ip_address: cfIp,
        country_code: cfCountry,
        isp: cfIsp,
        platform: deviceType,
        is_bot: false,
        referer,
        redirect_url: targetUrl,
        ...utmParams,
        processing_time_ms: processingTime,
      });
      supabase.from("cloaked_links").update({ 
        clicks_count: (link.clicks_count || 0) + 1,
        clicks_today: (link.clicks_today || 0) + 1,
      }).eq("id", link.id);
    });
    
    const delayMs = link.redirect_delay_ms || 0;
    if (delayMs > 0) return createDelayedRedirect(targetUrl, delayMs);
    
    return Response.redirect(targetUrl, 302);
  }

  // === POST: Fingerprint analysis ===
  try {
    const body = await req.json();
    const { slug, fingerprint } = body;
    
    const ua = req.headers.get("user-agent") || "";
    const cfIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const cfCountry = req.headers.get("cf-ipcountry") || "";
    const cfCity = req.headers.get("cf-city") || "";
    const cfIsp = req.headers.get("cf-isp") || "";
    const referer = req.headers.get("referer") || "";
    const utmParams = extractUtmParams(req);
    
    const { data: link, error } = await supabase.from("cloaked_links").select("*").eq("slug", slug).eq("is_active", true).single();
    if (error || !link) {
      return new Response(JSON.stringify({ error: "Link not found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 });
    }
    
    // Pre-checks
    const ipCheck = checkIPLists(cfIp, link);
    if (!ipCheck.allowed) {
      return new Response(JSON.stringify({ redirectUrl: link.safe_url, decision: ipCheck.reason }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    const timeCheck = checkTimeRules(link);
    if (!timeCheck.allowed) {
      return new Response(JSON.stringify({ redirectUrl: link.safe_url, decision: timeCheck.reason }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    const clickCheck = await checkClickLimits(link, supabase);
    if (!clickCheck.allowed) {
      return new Response(JSON.stringify({ redirectUrl: link.safe_url, decision: clickCheck.reason }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    if (link.rate_limit_per_ip > 0) {
      const rateCheck = checkRateLimit(cfIp, link.rate_limit_per_ip, link.rate_limit_window_minutes || 60);
      if (!rateCheck.allowed) {
        return new Response(JSON.stringify({ redirectUrl: link.safe_url, decision: "rate_limited" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    
    // Bot detection
    const botResult = detectBot(ua, cfIp, req.headers);
    
    if (link.block_bots && botResult.isBot && botResult.confidence >= 85) {
      console.log(`[Cloaker] POST BLOCKED: ${botResult.botType} conf=${botResult.confidence}%`);
      return new Response(JSON.stringify({ redirectUrl: link.safe_url, decision: `blocked_${botResult.botType?.toLowerCase().replace(/\s+/g, "_") || "bot"}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!fingerprint) {
      if (link.collect_fingerprint || (link.block_bots && botResult.isBot)) {
        return new Response(JSON.stringify({ redirectUrl: link.safe_url, decision: "blocked_no_fingerprint" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      let targetUrl = selectTargetUrl(link);
      if (link.passthrough_utm) targetUrl = applyUtmPassthrough(targetUrl, req);
      return new Response(JSON.stringify({ redirectUrl: targetUrl, decision: "allowed_basic" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Score with fingerprint
    const fingerprintHash = generateFingerprintHash(fingerprint);
    const deviceType = getDeviceType(fingerprint.userAgent || ua);
    const minScore = link.min_score || 35;
    
    // Simple scoring based on fingerprint
    let score = 100;
    const flags: string[] = [];
    
    // Automation detection
    if (fingerprint.hasWebdriver) { score = 0; flags.push("WEBDRIVER"); }
    if (fingerprint.hasPuppeteer) { score = 0; flags.push("PUPPETEER"); }
    if (fingerprint.hasSelenium) { score = 0; flags.push("SELENIUM"); }
    if (fingerprint.hasPhantom) { score = 0; flags.push("PHANTOM"); }
    if (fingerprint.isHeadless && fingerprint.isAutomated) { score = 0; flags.push("HEADLESS_AUTOMATED"); }
    if (fingerprint.isHeadless) { score -= 30; flags.push("headless"); }
    if (fingerprint.isAutomated) { score -= 30; flags.push("automated"); }
    
    // Behavioral
    if (fingerprint.mouseMovements === 0 && !fingerprint.touchSupport) { score -= 15; flags.push("no_mouse"); }
    if (fingerprint.timeOnPage < 500) { score -= 20; flags.push("fast_access"); }
    
    // Fingerprint quality
    if (!fingerprint.webglVendor && !fingerprint.webglRenderer) { score -= 10; flags.push("no_webgl"); }
    if (/swiftshader|llvmpipe/i.test(fingerprint.webglRenderer || "")) { score -= 20; flags.push("software_renderer"); }
    if (fingerprint.screenResolution === "800x600") { score -= 25; flags.push("headless_resolution"); }
    
    // Bot detection from fingerprint UA
    if (botResult.isBot) { score -= botResult.confidence / 2; flags.push(...botResult.reasons); }
    
    score = Math.max(0, Math.min(100, score));
    
    let decision: "allow" | "block";
    let targetUrl: string;

    // Filters
    if (link.allowed_devices?.length > 0 && !link.allowed_devices.includes(deviceType)) {
      decision = "block"; targetUrl = link.safe_url;
    } else if (link.allowed_countries?.length > 0 && cfCountry && !link.allowed_countries.includes(cfCountry)) {
      decision = "block"; targetUrl = link.safe_url;
    } else if (link.blocked_countries?.length > 0 && cfCountry && link.blocked_countries.includes(cfCountry)) {
      decision = "block"; targetUrl = link.safe_url;
    } else if (checkIspBlock(cfIsp, link)) {
      decision = "block"; targetUrl = link.safe_url;
    } else if (flags.includes("WEBDRIVER") || flags.includes("PUPPETEER") || flags.includes("SELENIUM") || flags.includes("HEADLESS_AUTOMATED")) {
      decision = "block"; targetUrl = link.safe_url;
    } else if (score >= minScore) {
      decision = "allow";
      targetUrl = selectTargetUrl(link);
      if (link.passthrough_utm) targetUrl = applyUtmPassthrough(targetUrl, req);
    } else {
      decision = "block"; targetUrl = link.safe_url;
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Cloaker] POST Decision=${decision} Score=${score}/${minScore} Flags=${flags.slice(0,3).join(",")} (${processingTime}ms)`);

    queueMicrotask(async () => {
      try {
        await supabase.from("cloaker_visitors").insert({
          link_id: link.id,
          fingerprint_hash: fingerprintHash,
          score,
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
          is_bot: flags.some(f => f.startsWith("GOOGLE") || f === "WEBDRIVER" || f === "PUPPETEER"),
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
          referer,
          redirect_url: targetUrl,
          ...utmParams,
          processing_time_ms: processingTime,
        });
        await supabase.from("cloaked_links").update({ 
          clicks_count: (link.clicks_count || 0) + 1,
          clicks_today: (link.clicks_today || 0) + 1,
        }).eq("id", link.id);
      } catch (e) {
        console.error("[Cloaker] Log error:", e);
      }
    });

    return new Response(JSON.stringify({ 
      redirectUrl: targetUrl, 
      decision,
      score,
      minScore,
      confidence: botResult.confidence,
      delayMs: decision === "allow" ? (link.redirect_delay_ms || 0) : 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[Cloaker] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
