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
const sessionCache = new Map<string, { firstSeen: number; visits: number; scores: number[]; fingerprints: string[] }>();
const fingerprintReputation = new Map<string, { score: number; lastSeen: number; decisionHistory: string[] }>();

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

// Cleanup old cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitCache.entries()) {
    if (now - value.windowStart > 3600000) rateLimitCache.delete(key);
  }
  for (const [key, value] of sessionCache.entries()) {
    if (now - value.firstSeen > 86400000) sessionCache.delete(key);
  }
  for (const [key, value] of fingerprintReputation.entries()) {
    if (now - value.lastSeen > 604800000) fingerprintReputation.delete(key);
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

// ==================== SESSION TRACKING ====================
function trackSession(ip: string, fingerprintHash: string, score: number): { isReturning: boolean; visitCount: number; avgScore: number; isSuspicious: boolean } {
  const session = sessionCache.get(ip) || { firstSeen: Date.now(), visits: 0, scores: [], fingerprints: [] };
  session.visits++;
  session.scores.push(score);
  if (fingerprintHash && !session.fingerprints.includes(fingerprintHash)) {
    session.fingerprints.push(fingerprintHash);
  }
  sessionCache.set(ip, session);
  
  const avgScore = session.scores.reduce((a, b) => a + b, 0) / session.scores.length;
  // Suspicious: too many different fingerprints from same IP (fingerprint spoofing)
  const isSuspicious = session.fingerprints.length > 5;
  
  return { isReturning: session.visits > 1, visitCount: session.visits, avgScore, isSuspicious };
}

// ==================== FINGERPRINT REPUTATION ====================
function getFingerprintReputation(hash: string): { score: number; trustLevel: "new" | "trusted" | "suspicious" | "blocked" } {
  const rep = fingerprintReputation.get(hash);
  if (!rep) return { score: 50, trustLevel: "new" };
  
  const allowCount = rep.decisionHistory.filter(d => d === "allow").length;
  const blockCount = rep.decisionHistory.filter(d => d === "block").length;
  const ratio = allowCount / (allowCount + blockCount + 1);
  
  let trustLevel: "new" | "trusted" | "suspicious" | "blocked" = "new";
  if (rep.decisionHistory.length >= 5) {
    if (ratio > 0.8) trustLevel = "trusted";
    else if (ratio < 0.2) trustLevel = "blocked";
    else trustLevel = "suspicious";
  }
  
  return { score: rep.score, trustLevel };
}

function updateFingerprintReputation(hash: string, decision: "allow" | "block", score: number): void {
  const rep = fingerprintReputation.get(hash) || { score: 50, lastSeen: Date.now(), decisionHistory: [] };
  rep.lastSeen = Date.now();
  rep.score = (rep.score + score) / 2;
  rep.decisionHistory.push(decision);
  if (rep.decisionHistory.length > 20) rep.decisionHistory.shift();
  fingerprintReputation.set(hash, rep);
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
    const isWhitelisted = link.whitelist_ips.some((pattern: string) => matchIpPattern(ip, pattern));
    if (!isWhitelisted) return { allowed: false, reason: "ip_not_whitelisted" };
  }
  
  if (link.blacklist_ips?.length > 0) {
    const isBlacklisted = link.blacklist_ips.some((pattern: string) => matchIpPattern(ip, pattern));
    if (isBlacklisted) return { allowed: false, reason: "ip_blacklisted" };
  }
  
  return { allowed: true };
}

function matchIpPattern(ip: string, pattern: string): boolean {
  // Support CIDR notation
  if (pattern.includes("/")) {
    return isIpInCidr(ip, pattern);
  }
  // Support wildcards
  if (pattern.includes("*")) {
    const regex = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, "\\d+") + "$");
    return regex.test(ip);
  }
  return pattern === ip;
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const mask = parseInt(bits, 10);
  if (isNaN(mask) || mask < 0 || mask > 32) return false;
  
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  const maskNum = ~((1 << (32 - mask)) - 1) >>> 0;
  
  return (ipNum & maskNum) === (rangeNum & maskNum);
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

// ==================== UTM PASSTHROUGH (EXTENDED) ====================
const TRACKING_PARAMS = [
  // Standard UTM
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id",
  // Google Ads
  "gclid", "gbraid", "wbraid", "dclid", "gclsrc",
  // Facebook/Meta
  "fbclid", "fb_action_ids", "fb_action_types", "fb_source",
  // TikTok
  "ttclid", "tt_medium", "tt_content",
  // Microsoft/Bing
  "msclkid",
  // Pinterest
  "epik",
  // Snapchat
  "sccid", "scid",
  // Twitter/X
  "twclid",
  // LinkedIn
  "li_fat_id",
  // Taboola
  "tblci", "taboolaclickid",
  // Outbrain
  "obOrigUrl", "outbrain_click_id",
  // Yahoo/Native
  "yclid",
  // Others
  "mc_cid", "mc_eid", "ref", "source", "campaign", "medium"
];

function applyUtmPassthrough(targetUrl: string, request: Request): string {
  const incomingUrl = new URL(request.url);
  const targetUrlObj = new URL(targetUrl);
  
  for (const param of TRACKING_PARAMS) {
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

// ==================== GOOGLE ADS - ULTRA COMPREHENSIVE ====================
const GOOGLE_BOT_UA_PATTERNS = [
  // AdsBot
  /AdsBot-Google/i, /AdsBot-Google-Mobile/i, /AdsBot-Google-Mobile-Apps/i,
  /Mozilla\/5\.0.*AdsBot-Google/i, /Mozilla\/5\.0 \(compatible; AdsBot-Google/i,
  // Googlebot
  /Googlebot\/2\.1/i, /Googlebot-Image/i, /Googlebot-Video/i, /Googlebot-News/i,
  /Googlebot-Mobile/i, /Mozilla\/5\.0.*compatible.*Googlebot/i,
  // Mediapartners
  /Mediapartners-Google/i, /Mediapartners/i,
  // Storebot
  /Storebot-Google/i,
  // Google-Extended
  /Google-Extended/i,
  // Google Ads Tools
  /Google-Adwords/i, /Google-Adwords-Instant/i, /Google-Shopping/i,
  /Google-Product-Search/i, /Google-Merchant/i, /Google-InspectionTool/i,
  /Google-Site-Verification/i, /Google-Structured-Data/i,
  // Lighthouse/PageSpeed
  /Lighthouse/i, /Chrome-Lighthouse/i, /PageSpeed/i, /PSTS\/\d/i,
  // Quality Raters
  /Google-Read-Aloud/i, /DuplexWeb-Google/i, /GoogleProducer/i,
  /GoogleSecurityScanner/i, /Google-Test/i, /GCE-Agent/i,
  // APIs
  /APIs-Google/i, /FeedFetcher-Google/i, /googleweblight/i,
];

const GOOGLE_IP_RANGES = [
  { start: "66.249.64.0", end: "66.249.95.255" },
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
  { start: "34.64.0.0", end: "34.127.255.255" },
  { start: "35.184.0.0", end: "35.247.255.255" },
  { start: "104.154.0.0", end: "104.155.255.255" },
  { start: "130.211.0.0", end: "130.211.255.255" },
  { start: "8.8.4.0", end: "8.8.8.255" },
  { start: "172.253.0.0", end: "172.253.255.255" },
];

const GOOGLE_ASNS = ["AS15169", "AS396982", "AS36492", "AS139070", "AS36040", "AS43515", "AS41264"];

// ==================== MICROSOFT/BING ADS ====================
const MICROSOFT_BOT_UA_PATTERNS = [
  /bingbot/i, /msnbot/i, /BingPreview/i, /adidxbot/i,
  /Applebot/i, /bingbot\/2\.0/i, /msnbot-media/i,
  /Microsoft-Advertising/i, /MicrosoftPreview/i,
  /bingbot.*compatible.*MSIE/i, /Microsoft.*Edge.*Chromium/i,
];

const MICROSOFT_IP_RANGES = [
  { start: "40.74.0.0", end: "40.125.255.255" },
  { start: "52.0.0.0", end: "52.255.255.255" },
  { start: "104.40.0.0", end: "104.47.255.255" },
  { start: "13.64.0.0", end: "13.107.255.255" },
  { start: "20.0.0.0", end: "20.255.255.255" },
  { start: "157.55.0.0", end: "157.55.255.255" },
  { start: "157.56.0.0", end: "157.56.255.255" },
  { start: "65.52.0.0", end: "65.55.255.255" },
  { start: "131.107.0.0", end: "131.107.255.255" },
  { start: "199.30.16.0", end: "199.30.31.255" },
  { start: "207.46.0.0", end: "207.46.255.255" },
];

const MICROSOFT_ASNS = ["AS8075", "AS3598", "AS8068", "AS8069", "AS6584"];

// ==================== FACEBOOK/META ADS ====================
const FACEBOOK_BOT_UA_PATTERNS = [
  /facebookexternalhit/i, /Facebot/i, /facebookcatalog/i,
  /meta-external/i, /FacebookBot/i, /WhatsApp/i,
  /Instagram/i, /fb_iab/i, /FBAV/i, /FBAN/i,
  /MessengerLite/i, /FB4A/i, /FBSV/i,
];

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

const FACEBOOK_ASNS = ["AS32934", "AS63293", "AS54115"];

// ==================== TIKTOK/BYTEDANCE ADS ====================
const TIKTOK_BOT_UA_PATTERNS = [
  /TikTok/i, /ByteDance/i, /Bytespider/i, /musical_ly/i,
  /TikTokBot/i, /ByteSpider/i, /toutiao/i, /Douyin/i,
  /BDBot/i, /Toutiaospider/i, /NewsArticleBot/i,
];

const TIKTOK_IP_RANGES = [
  { start: "161.117.0.0", end: "161.117.255.255" },
  { start: "128.1.0.0", end: "128.1.255.255" },
  { start: "152.32.128.0", end: "152.32.255.255" },
  { start: "111.225.0.0", end: "111.225.255.255" },
  { start: "122.224.0.0", end: "122.227.255.255" },
  { start: "101.32.0.0", end: "101.47.255.255" },
  { start: "43.128.0.0", end: "43.175.255.255" },
];

const TIKTOK_ASNS = ["AS138699", "AS396986", "AS137718", "AS45090"];

// ==================== PINTEREST ADS ====================
const PINTEREST_BOT_UA_PATTERNS = [
  /Pinterest/i, /Pinterestbot/i, /Pinterest.*proxy/i,
];

const PINTEREST_IP_RANGES = [
  { start: "54.236.1.0", end: "54.236.1.255" },
  { start: "52.89.0.0", end: "52.89.255.255" },
];

// ==================== TABOOLA/OUTBRAIN (Native Ads) ====================
const NATIVE_ADS_UA_PATTERNS = [
  /Taboola/i, /TaboolaBot/i, /tblbot/i,
  /Outbrain/i, /OutbrainBot/i, /outbrainbot/i,
  /Zemanta/i, /Revcontent/i, /MGID/i, /ContentGems/i,
];

// ==================== SNAPCHAT ADS ====================
const SNAPCHAT_BOT_UA_PATTERNS = [
  /Snapchat/i, /SnapBot/i, /Snapcode/i,
];

// ==================== TWITTER/X ADS ====================
const TWITTER_BOT_UA_PATTERNS = [
  /Twitterbot/i, /TwitterBot/i, /Twitter/i,
];

// ==================== LINKEDIN ADS ====================
const LINKEDIN_BOT_UA_PATTERNS = [
  /LinkedInBot/i, /LinkedIn/i,
];

// ==================== DATACENTER/CLOUD IPs ====================
const DATACENTER_IP_RANGES = [
  // AWS
  { start: "3.0.0.0", end: "3.255.255.255" },
  { start: "52.0.0.0", end: "52.255.255.255" },
  { start: "54.0.0.0", end: "54.255.255.255" },
  { start: "18.0.0.0", end: "18.255.255.255" },
  { start: "13.0.0.0", end: "13.255.255.255" },
  { start: "15.0.0.0", end: "15.255.255.255" },
  { start: "16.0.0.0", end: "16.255.255.255" },
  // Azure (non-Bing)
  { start: "40.0.0.0", end: "40.73.255.255" },
  { start: "40.126.0.0", end: "40.255.255.255" },
  // DigitalOcean
  { start: "159.89.0.0", end: "159.89.255.255" },
  { start: "167.99.0.0", end: "167.99.255.255" },
  { start: "206.189.0.0", end: "206.189.255.255" },
  { start: "64.225.0.0", end: "64.225.255.255" },
  { start: "134.209.0.0", end: "134.209.255.255" },
  { start: "138.68.0.0", end: "138.68.255.255" },
  { start: "139.59.0.0", end: "139.59.255.255" },
  { start: "142.93.0.0", end: "142.93.255.255" },
  { start: "157.245.0.0", end: "157.245.255.255" },
  { start: "161.35.0.0", end: "161.35.255.255" },
  { start: "165.227.0.0", end: "165.227.255.255" },
  { start: "167.172.0.0", end: "167.172.255.255" },
  { start: "174.138.0.0", end: "174.138.255.255" },
  { start: "178.128.0.0", end: "178.128.255.255" },
  { start: "188.166.0.0", end: "188.166.255.255" },
  // Vultr
  { start: "45.32.0.0", end: "45.32.255.255" },
  { start: "45.63.0.0", end: "45.63.255.255" },
  { start: "45.76.0.0", end: "45.76.255.255" },
  { start: "45.77.0.0", end: "45.77.255.255" },
  { start: "66.42.0.0", end: "66.42.255.255" },
  { start: "78.141.0.0", end: "78.141.255.255" },
  { start: "95.179.0.0", end: "95.179.255.255" },
  { start: "104.156.0.0", end: "104.156.255.255" },
  { start: "108.61.0.0", end: "108.61.255.255" },
  { start: "136.244.0.0", end: "136.244.255.255" },
  { start: "140.82.0.0", end: "140.82.255.255" },
  { start: "144.202.0.0", end: "144.202.255.255" },
  { start: "149.28.0.0", end: "149.28.255.255" },
  { start: "155.138.0.0", end: "155.138.255.255" },
  { start: "207.246.0.0", end: "207.246.255.255" },
  { start: "209.222.0.0", end: "209.222.255.255" },
  { start: "217.69.0.0", end: "217.69.255.255" },
  // Linode
  { start: "45.33.0.0", end: "45.33.255.255" },
  { start: "45.56.0.0", end: "45.56.255.255" },
  { start: "45.79.0.0", end: "45.79.255.255" },
  { start: "50.116.0.0", end: "50.116.255.255" },
  { start: "66.175.208.0", end: "66.175.223.255" },
  { start: "72.14.176.0", end: "72.14.191.255" },
  { start: "74.207.224.0", end: "74.207.255.255" },
  { start: "85.159.208.0", end: "85.159.215.255" },
  { start: "96.126.96.0", end: "96.126.127.255" },
  { start: "139.162.0.0", end: "139.162.255.255" },
  { start: "172.104.0.0", end: "172.105.255.255" },
  { start: "173.230.128.0", end: "173.230.159.255" },
  { start: "173.255.192.0", end: "173.255.255.255" },
  { start: "178.79.128.0", end: "178.79.191.255" },
  { start: "192.155.80.0", end: "192.155.95.255" },
  { start: "198.58.96.0", end: "198.58.127.255" },
  // Hetzner
  { start: "116.202.0.0", end: "116.203.255.255" },
  { start: "49.12.0.0", end: "49.13.255.255" },
  { start: "95.216.0.0", end: "95.217.255.255" },
  { start: "135.181.0.0", end: "135.181.255.255" },
  { start: "136.243.0.0", end: "136.243.255.255" },
  { start: "138.201.0.0", end: "138.201.255.255" },
  { start: "144.76.0.0", end: "144.76.255.255" },
  { start: "148.251.0.0", end: "148.251.255.255" },
  { start: "159.69.0.0", end: "159.69.255.255" },
  { start: "167.235.0.0", end: "167.235.255.255" },
  { start: "176.9.0.0", end: "176.9.255.255" },
  { start: "178.63.0.0", end: "178.63.255.255" },
  { start: "188.40.0.0", end: "188.40.255.255" },
  { start: "195.201.0.0", end: "195.201.255.255" },
  // OVH
  { start: "51.38.0.0", end: "51.39.255.255" },
  { start: "51.68.0.0", end: "51.79.255.255" },
  { start: "51.83.0.0", end: "51.91.255.255" },
  { start: "51.161.0.0", end: "51.161.255.255" },
  { start: "51.195.0.0", end: "51.195.255.255" },
  { start: "51.254.0.0", end: "51.255.255.255" },
  { start: "54.36.0.0", end: "54.39.255.255" },
  { start: "54.37.0.0", end: "54.37.255.255" },
  { start: "91.121.0.0", end: "91.121.255.255" },
  { start: "92.222.0.0", end: "92.223.255.255" },
  { start: "135.125.0.0", end: "135.125.255.255" },
  { start: "137.74.0.0", end: "137.74.255.255" },
  { start: "139.99.0.0", end: "139.99.255.255" },
  { start: "141.94.0.0", end: "141.95.255.255" },
  { start: "142.44.0.0", end: "142.44.255.255" },
  { start: "144.217.0.0", end: "144.217.255.255" },
  { start: "145.239.0.0", end: "145.239.255.255" },
  { start: "147.135.0.0", end: "147.135.255.255" },
  { start: "149.56.0.0", end: "149.56.255.255" },
  { start: "151.80.0.0", end: "151.80.255.255" },
  { start: "158.69.0.0", end: "158.69.255.255" },
  { start: "164.132.0.0", end: "164.132.255.255" },
  { start: "176.31.0.0", end: "176.31.255.255" },
  { start: "178.32.0.0", end: "178.33.255.255" },
  { start: "185.157.0.0", end: "185.157.255.255" },
  { start: "188.165.0.0", end: "188.165.255.255" },
  { start: "192.95.0.0", end: "192.95.255.255" },
  { start: "198.27.64.0", end: "198.27.127.255" },
  { start: "198.50.128.0", end: "198.50.255.255" },
  { start: "198.245.48.0", end: "198.245.63.255" },
  // Cloudflare Workers/Pages
  { start: "172.64.0.0", end: "172.71.255.255" },
  { start: "104.16.0.0", end: "104.31.255.255" },
  { start: "162.158.0.0", end: "162.159.255.255" },
  { start: "173.245.48.0", end: "173.245.63.255" },
  { start: "188.114.96.0", end: "188.114.111.255" },
  { start: "190.93.240.0", end: "190.93.255.255" },
  { start: "197.234.240.0", end: "197.234.243.255" },
  { start: "198.41.128.0", end: "198.41.255.255" },
  // Scaleway
  { start: "51.15.0.0", end: "51.15.255.255" },
  { start: "163.172.0.0", end: "163.172.255.255" },
  { start: "212.47.224.0", end: "212.47.255.255" },
  // Upcloud
  { start: "185.70.196.0", end: "185.70.199.255" },
  { start: "94.237.0.0", end: "94.237.127.255" },
  // Contabo
  { start: "91.107.128.0", end: "91.107.255.255" },
  { start: "62.171.128.0", end: "62.171.191.255" },
];

const DATACENTER_ASNS = [
  "AS16509", "AS14618", // AWS
  "AS13335", // Cloudflare
  "AS14061", // DigitalOcean
  "AS20473", // Vultr
  "AS63949", // Linode/Akamai
  "AS24940", // Hetzner
  "AS16276", // OVH
  "AS12876", // Scaleway
  "AS200019", // Scaleway
  "AS51167", // Contabo
  "AS202053", // Upcloud
  "AS197540", // Netcup
  "AS208091", // PostHog
];

// ==================== VPN/PROXY DETECTION ====================
const VPN_ASN_PATTERNS = [
  /express\s*vpn/i, /nord\s*vpn/i, /surfshark/i, /cyberghost/i,
  /private\s*internet\s*access/i, /pia/i, /mullvad/i, /proton\s*vpn/i,
  /ipvanish/i, /purevpn/i, /vypr/i, /tunnel\s*bear/i, /windscribe/i,
  /hide\.me/i, /hotspot\s*shield/i, /vpn\s*unlimited/i, /strong\s*vpn/i,
  /zenmate/i, /perfect\s*privacy/i, /air\s*vpn/i, /ovpn/i,
];

const VPN_PROVIDER_IPS = [
  // NordVPN sample ranges
  { start: "194.35.232.0", end: "194.35.239.255" },
  { start: "185.159.156.0", end: "185.159.159.255" },
  // ExpressVPN sample ranges
  { start: "209.205.192.0", end: "209.205.223.255" },
  // Mullvad sample ranges
  { start: "198.54.128.0", end: "198.54.135.255" },
  // ProtonVPN sample ranges
  { start: "185.107.56.0", end: "185.107.63.255" },
];

const PROXY_ASNS = [
  "AS47846", // SEDO GmbH (proxies)
  "AS206264", // Amarutu Technology Ltd
  "AS9009", // M247 (commonly used for proxies)
  "AS201011", // NETERRA
  "AS50673", // ServerChoice
  "AS62240", // Clouvider
  "AS25369", // HYDRA Communications
  "AS34665", // Petersburg Internet Network
  "AS29073", // Quasi Networks (proxies)
  "AS31400", // Accelerated IT Services
  "AS50304", // Blix Solutions
];

// TOR Exit Nodes (sample - real implementation would fetch from TOR project)
const TOR_EXIT_CHARACTERISTICS = [
  "tor", "exit", "relay", "onion"
];

// ==================== IP UTILITY FUNCTIONS ====================
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

function isGoogleIP(ip: string): boolean { return isInIpRanges(ip, GOOGLE_IP_RANGES); }
function isMicrosoftIP(ip: string): boolean { return isInIpRanges(ip, MICROSOFT_IP_RANGES); }
function isFacebookIP(ip: string): boolean { return isInIpRanges(ip, FACEBOOK_IP_RANGES); }
function isTikTokIP(ip: string): boolean { return isInIpRanges(ip, TIKTOK_IP_RANGES); }
function isDatacenterIP(ip: string): boolean { return isInIpRanges(ip, DATACENTER_IP_RANGES); }
function isVpnProviderIP(ip: string): boolean { return isInIpRanges(ip, VPN_PROVIDER_IPS); }

// ==================== AD PLATFORM DETECTION ====================
interface AdPlatformResult {
  detected: boolean;
  platform: string | null;
  botType: string | null;
  confidence: number;
  reasons: string[];
  isDefinitive: boolean;
}

function detectAdPlatform(userAgent: string, ip: string, headers: Headers): AdPlatformResult {
  const reasons: string[] = [];
  let platform: string | null = null;
  let botType: string | null = null;
  let confidence = 0;
  let isDefinitive = false;

  // ===== GOOGLE =====
  for (const pattern of GOOGLE_BOT_UA_PATTERNS) {
    if (pattern.test(userAgent)) {
      platform = "google";
      isDefinitive = true;
      confidence = 100;
      if (/adsbot/i.test(userAgent)) { botType = "AdsBot"; reasons.push("GOOGLE_ADSBOT_UA"); }
      else if (/mediapartners/i.test(userAgent)) { botType = "Mediapartners"; reasons.push("GOOGLE_MEDIAPARTNERS_UA"); }
      else if (/storebot/i.test(userAgent)) { botType = "Storebot"; reasons.push("GOOGLE_STOREBOT_UA"); }
      else if (/lighthouse|pagespeed/i.test(userAgent)) { botType = "Lighthouse"; reasons.push("GOOGLE_LIGHTHOUSE_UA"); }
      else if (/googlebot/i.test(userAgent)) { botType = "Googlebot"; reasons.push("GOOGLE_GOOGLEBOT_UA"); }
      else { botType = "Google Bot"; reasons.push("GOOGLE_BOT_UA"); }
      break;
    }
  }
  if (!platform && isGoogleIP(ip)) {
    platform = "google";
    confidence = 95;
    botType = "Google IP";
    reasons.push("GOOGLE_IP_RANGE");
    isDefinitive = true;
  }

  // ===== MICROSOFT/BING =====
  if (!platform) {
    for (const pattern of MICROSOFT_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        platform = "microsoft";
        isDefinitive = true;
        confidence = 100;
        if (/bingbot|msnbot/i.test(userAgent)) { botType = "Bingbot"; reasons.push("BING_BOT_UA"); }
        else if (/adidxbot/i.test(userAgent)) { botType = "Bing Ads"; reasons.push("BING_ADS_UA"); }
        else if (/bingpreview/i.test(userAgent)) { botType = "Bing Preview"; reasons.push("BING_PREVIEW_UA"); }
        else { botType = "Microsoft Bot"; reasons.push("MICROSOFT_BOT_UA"); }
        break;
      }
    }
    if (!platform && isMicrosoftIP(ip)) {
      platform = "microsoft";
      confidence = 90;
      botType = "Microsoft IP";
      reasons.push("MICROSOFT_IP_RANGE");
    }
  }

  // ===== FACEBOOK/META =====
  if (!platform) {
    for (const pattern of FACEBOOK_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        platform = "facebook";
        isDefinitive = true;
        confidence = 100;
        if (/facebookexternalhit|facebot/i.test(userAgent)) { botType = "Facebook Crawler"; reasons.push("FACEBOOK_CRAWLER_UA"); }
        else if (/whatsapp/i.test(userAgent)) { botType = "WhatsApp"; reasons.push("WHATSAPP_UA"); }
        else if (/instagram/i.test(userAgent)) { botType = "Instagram"; reasons.push("INSTAGRAM_UA"); }
        else { botType = "Meta Bot"; reasons.push("META_BOT_UA"); }
        break;
      }
    }
    if (!platform && isFacebookIP(ip)) {
      platform = "facebook";
      confidence = 95;
      botType = "Meta IP";
      reasons.push("FACEBOOK_IP_RANGE");
      isDefinitive = true;
    }
  }

  // ===== TIKTOK =====
  if (!platform) {
    for (const pattern of TIKTOK_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        platform = "tiktok";
        isDefinitive = true;
        confidence = 100;
        botType = "TikTok Bot";
        reasons.push("TIKTOK_BOT_UA");
        break;
      }
    }
    if (!platform && isTikTokIP(ip)) {
      platform = "tiktok";
      confidence = 90;
      botType = "TikTok IP";
      reasons.push("TIKTOK_IP_RANGE");
    }
  }

  // ===== PINTEREST =====
  if (!platform) {
    for (const pattern of PINTEREST_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        platform = "pinterest";
        isDefinitive = true;
        confidence = 100;
        botType = "Pinterest Bot";
        reasons.push("PINTEREST_BOT_UA");
        break;
      }
    }
  }

  // ===== TABOOLA/OUTBRAIN =====
  if (!platform) {
    for (const pattern of NATIVE_ADS_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        platform = "native_ads";
        isDefinitive = true;
        confidence = 100;
        if (/taboola/i.test(userAgent)) { botType = "Taboola"; reasons.push("TABOOLA_UA"); }
        else if (/outbrain/i.test(userAgent)) { botType = "Outbrain"; reasons.push("OUTBRAIN_UA"); }
        else { botType = "Native Ads"; reasons.push("NATIVE_ADS_UA"); }
        break;
      }
    }
  }

  // ===== SNAPCHAT =====
  if (!platform) {
    for (const pattern of SNAPCHAT_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        platform = "snapchat";
        isDefinitive = true;
        confidence = 100;
        botType = "Snapchat Bot";
        reasons.push("SNAPCHAT_UA");
        break;
      }
    }
  }

  // ===== TWITTER/X =====
  if (!platform) {
    for (const pattern of TWITTER_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        platform = "twitter";
        isDefinitive = true;
        confidence = 100;
        botType = "Twitter Bot";
        reasons.push("TWITTER_UA");
        break;
      }
    }
  }

  // ===== LINKEDIN =====
  if (!platform) {
    for (const pattern of LINKEDIN_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        platform = "linkedin";
        isDefinitive = true;
        confidence = 100;
        botType = "LinkedIn Bot";
        reasons.push("LINKEDIN_UA");
        break;
      }
    }
  }

  // ===== HEADER CHECKS =====
  const cfAsn = headers.get("cf-asn") || headers.get("x-asn") || "";
  const cfIsp = headers.get("cf-isp") || headers.get("x-isp") || "";
  
  if (!platform && cfAsn) {
    if (GOOGLE_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) {
      platform = "google"; confidence = 92; botType = "Google ASN"; reasons.push("GOOGLE_ASN");
    } else if (MICROSOFT_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) {
      platform = "microsoft"; confidence = 88; botType = "Microsoft ASN"; reasons.push("MICROSOFT_ASN");
    } else if (FACEBOOK_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) {
      platform = "facebook"; confidence = 92; botType = "Facebook ASN"; reasons.push("FACEBOOK_ASN");
    } else if (TIKTOK_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) {
      platform = "tiktok"; confidence = 88; botType = "TikTok ASN"; reasons.push("TIKTOK_ASN");
    }
  }

  if (!platform && /google/i.test(cfIsp)) {
    platform = "google"; confidence = 90; botType = "Google ISP"; reasons.push("GOOGLE_ISP");
  } else if (!platform && /microsoft|bing/i.test(cfIsp)) {
    platform = "microsoft"; confidence = 85; botType = "Microsoft ISP"; reasons.push("MICROSOFT_ISP");
  } else if (!platform && /facebook|meta/i.test(cfIsp)) {
    platform = "facebook"; confidence = 90; botType = "Facebook ISP"; reasons.push("FACEBOOK_ISP");
  }

  return { detected: platform !== null, platform, botType, confidence: Math.min(100, confidence), reasons, isDefinitive };
}

// ==================== GENERIC BOT DETECTION ====================
interface BotDetectionResult {
  isBot: boolean;
  botType: string | null;
  confidence: number;
  reasons: string[];
  platform?: string;
  isAdPlatform: boolean;
  threatLevel: "none" | "low" | "medium" | "high" | "critical";
}

function detectBot(userAgent: string, ip: string, headers: Headers): BotDetectionResult {
  const reasons: string[] = [];
  let confidence = 0;
  let botType: string | null = null;
  const ua = userAgent.toLowerCase();
  
  // ===== AD PLATFORM CHECK (Priority) =====
  const adResult = detectAdPlatform(userAgent, ip, headers);
  if (adResult.detected) {
    return {
      isBot: true,
      botType: adResult.botType,
      confidence: adResult.confidence,
      reasons: adResult.reasons,
      platform: adResult.platform || undefined,
      isAdPlatform: true,
      threatLevel: "none", // Ad platforms are not threats
    };
  }

  // ===== SEO TOOLS =====
  if (/semrush|ahrefsbot|mj12bot|dotbot|petalbot|rogerbot|seokicks|sistrix|blexbot|dataforseo|serpstat|spyfu/i.test(userAgent)) {
    return { isBot: true, botType: "SEO Tool", confidence: 95, reasons: ["SEO_TOOL_BOT"], isAdPlatform: false, threatLevel: "low" };
  }

  // ===== AI CRAWLERS =====
  if (/gptbot|chatgpt|claude|anthropic|perplexity|cohere|ccbot|diffbot|openai|bard/i.test(userAgent)) {
    return { isBot: true, botType: "AI Crawler", confidence: 95, reasons: ["AI_CRAWLER"], isAdPlatform: false, threatLevel: "low" };
  }

  // ===== AUTOMATION FRAMEWORKS (High Threat) =====
  if (/headless|phantomjs|selenium|puppeteer|playwright|cypress|webdriver|nightmare|casperjs|zombie/i.test(userAgent)) {
    return { isBot: true, botType: "Automation", confidence: 100, reasons: ["AUTOMATION_FRAMEWORK"], isAdPlatform: false, threatLevel: "critical" };
  }

  // ===== HTTP CLIENTS (High Threat) =====
  if (/curl|wget|python|java\/|axios|node-fetch|go-http|libwww|scrapy|httpx|okhttp|guzzle|urllib|aiohttp|requests|got\//i.test(userAgent)) {
    return { isBot: true, botType: "HTTP Client", confidence: 90, reasons: ["HTTP_CLIENT"], isAdPlatform: false, threatLevel: "high" };
  }

  // ===== SEARCH ENGINES (Low Threat) =====
  if (/yandexbot|baiduspider|duckduckbot|sogou|exabot|ia_archiver|qwantify/i.test(userAgent)) {
    return { isBot: true, botType: "Search Engine", confidence: 95, reasons: ["SEARCH_ENGINE_BOT"], isAdPlatform: false, threatLevel: "low" };
  }

  // ===== DATACENTER IP =====
  if (isDatacenterIP(ip)) {
    confidence += 45;
    reasons.push("DATACENTER_IP");
  }

  // ===== VPN DETECTION =====
  const cfAsn = headers.get("cf-asn") || headers.get("x-asn") || "";
  const cfIsp = headers.get("cf-isp") || headers.get("x-isp") || "";
  
  if (isVpnProviderIP(ip)) {
    confidence += 50;
    reasons.push("VPN_PROVIDER_IP");
  }
  
  for (const pattern of VPN_ASN_PATTERNS) {
    if (pattern.test(cfIsp) || pattern.test(cfAsn)) {
      confidence += 45;
      reasons.push("VPN_ASN_MATCH");
      break;
    }
  }

  // ===== PROXY DETECTION =====
  if (PROXY_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) {
    confidence += 50;
    reasons.push("PROXY_ASN");
  }

  // ===== TOR DETECTION =====
  for (const keyword of TOR_EXIT_CHARACTERISTICS) {
    if (cfIsp.toLowerCase().includes(keyword) || cfAsn.toLowerCase().includes(keyword)) {
      confidence += 60;
      reasons.push("TOR_EXIT_SUSPECTED");
      break;
    }
  }

  // ===== DATACENTER ASN =====
  if (DATACENTER_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) {
    confidence += 35;
    reasons.push("DATACENTER_ASN");
  }

  // ===== HEADER ANALYSIS =====
  const acceptLang = headers.get("accept-language") || "";
  const accept = headers.get("accept") || "";
  const secFetchDest = headers.get("sec-fetch-dest");
  const secFetchMode = headers.get("sec-fetch-mode");
  const secFetchSite = headers.get("sec-fetch-site");
  const secFetchUser = headers.get("sec-fetch-user");
  const secChUa = headers.get("sec-ch-ua");
  const secChUaMobile = headers.get("sec-ch-ua-mobile");
  const secChUaPlatform = headers.get("sec-ch-ua-platform");
  
  // Missing Accept-Language
  if (!acceptLang || acceptLang === "*") {
    confidence += 18;
    reasons.push("NO_ACCEPT_LANGUAGE");
  }
  
  // Minimal Accept header
  if (accept === "*/*" || !accept.includes("text/html")) {
    confidence += 12;
    reasons.push("MINIMAL_ACCEPT");
  }
  
  // Missing Sec-Fetch headers (modern browsers always send these)
  if (!secFetchDest && !secFetchMode && !secFetchSite && !secFetchUser) {
    if (!/safari/i.test(ua) || /chrome/i.test(ua)) {
      confidence += 20;
      reasons.push("NO_SEC_FETCH_HEADERS");
    }
  }

  // Missing Client Hints (Chrome 89+)
  if (/chrome\/(\d+)/i.test(userAgent)) {
    const chromeVersion = parseInt(userAgent.match(/chrome\/(\d+)/i)?.[1] || "0");
    if (chromeVersion >= 89 && !secChUa) {
      confidence += 15;
      reasons.push("NO_CLIENT_HINTS");
    }
  }

  // ===== UA ANOMALIES =====
  if (userAgent.length < 50) {
    confidence += 28;
    reasons.push("SHORT_UA");
  }
  
  if (/https?:\/\//i.test(userAgent)) {
    confidence += 22;
    reasons.push("URL_IN_UA");
  }
  
  if (/bot(?!tle)/i.test(ua) && !/about|cubot/i.test(ua)) {
    confidence += 45;
    reasons.push("CONTAINS_BOT");
    if (!botType) botType = "Generic Bot";
  }
  
  if (/crawler|spider|scraper|fetch|monitor|check|scan|probe/i.test(ua)) {
    confidence += 40;
    reasons.push("CRAWLER_PATTERN");
    if (!botType) botType = "Crawler";
  }

  // Empty or missing UA
  if (!userAgent || userAgent.length < 10) {
    confidence += 60;
    reasons.push("EMPTY_UA");
    if (!botType) botType = "Empty UA";
  }

  // ===== BROWSER INCONSISTENCIES =====
  // Chrome without WebGL (suspicious)
  if (/chrome/i.test(ua) && !/mobile/i.test(ua)) {
    // Real Chrome always has WebGL support
    // This will be checked in fingerprint analysis
  }

  // IE/Edge on Linux (impossible)
  if ((/trident|msie|edge/i.test(ua)) && /linux/i.test(ua) && !/android/i.test(ua)) {
    confidence += 50;
    reasons.push("IMPOSSIBLE_BROWSER_OS_COMBO");
  }

  // Safari on Windows (very rare, likely spoofed)
  if (/safari/i.test(ua) && /windows/i.test(ua) && !/chrome/i.test(ua)) {
    confidence += 25;
    reasons.push("SUSPICIOUS_BROWSER_OS_COMBO");
  }

  // ===== CONNECTION PATTERNS =====
  const connection = headers.get("connection") || "";
  if (connection.toLowerCase() === "close") {
    confidence += 8;
    reasons.push("CONNECTION_CLOSE");
  }

  // Via header patterns
  const via = headers.get("via") || "";
  if (via && !/cloudflare|cloudfront|akamai|fastly/i.test(via)) {
    confidence += 10;
    reasons.push("SUSPICIOUS_VIA_HEADER");
  }

  // ===== DETERMINE THREAT LEVEL =====
  let threatLevel: "none" | "low" | "medium" | "high" | "critical" = "none";
  if (confidence >= 80) threatLevel = "critical";
  else if (confidence >= 60) threatLevel = "high";
  else if (confidence >= 40) threatLevel = "medium";
  else if (confidence >= 20) threatLevel = "low";

  const isBot = botType !== null || confidence >= 55;
  
  return {
    isBot,
    botType,
    confidence: Math.min(100, confidence),
    reasons,
    isAdPlatform: false,
    threatLevel,
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
  if (/tablet|ipad|playbook|silk|kindle/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android(?!.*tablet)|blackberry|opera mini|iemobile|windows phone/i.test(ua)) return "mobile";
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

// ==================== JAVASCRIPT CHALLENGE PAGE ====================
function generateChallengePage(slug: string, delayMs: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Verificando...</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}
    .container{text-align:center;color:white;padding:2rem}
    .spinner{width:50px;height:50px;border:3px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1.5rem}
    @keyframes spin{to{transform:rotate(360deg)}}
    h1{font-size:1.5rem;font-weight:500;margin-bottom:0.5rem}
    p{opacity:0.8;font-size:0.9rem}
    .progress{width:200px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;margin:1rem auto 0;overflow:hidden}
    .progress-bar{width:0%;height:100%;background:white;animation:progress ${delayMs}ms linear forwards}
    @keyframes progress{to{width:100%}}
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Verificando segurança</h1>
    <p>Por favor, aguarde...</p>
    <div class="progress"><div class="progress-bar"></div></div>
  </div>
  <script>
    (function(){
      var startTime = Date.now();
      var data = {
        slug: "${slug}",
        fingerprint: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          languages: navigator.languages ? navigator.languages.join(',') : '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timezoneOffset: new Date().getTimezoneOffset(),
          screenResolution: screen.width + 'x' + screen.height,
          availScreenResolution: screen.availWidth + 'x' + screen.availHeight,
          colorDepth: screen.colorDepth,
          pixelRatio: window.devicePixelRatio || 1,
          deviceMemory: navigator.deviceMemory || null,
          hardwareConcurrency: navigator.hardwareConcurrency || null,
          platform: navigator.platform,
          maxTouchPoints: navigator.maxTouchPoints || 0,
          touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
          cookieEnabled: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack,
          webglVendor: null,
          webglRenderer: null,
          canvasHash: null,
          audioHash: null,
          fontsHash: null,
          pluginsCount: navigator.plugins ? navigator.plugins.length : 0,
          plugins: [],
          isHeadless: false,
          isAutomated: false,
          hasWebdriver: !!navigator.webdriver,
          hasPhantom: !!window._phantom || !!window.phantom,
          hasSelenium: !!window.__selenium_evaluate || !!document.__selenium_unwrapped || !!window.__webdriver_script_fn,
          hasPuppeteer: !!window.__puppeteer_evaluation_script__,
          mouseMovements: 0,
          scrollEvents: 0,
          keypressEvents: 0,
          touchEvents: 0,
          clickEvents: 0,
          focusChanges: 0,
          timeOnPage: 0,
          performanceData: null,
          connectionType: null,
          batteryLevel: null
        }
      };

      // WebGL fingerprint
      try {
        var canvas = document.createElement('canvas');
        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            data.fingerprint.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            data.fingerprint.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
      } catch(e) {}

      // Canvas fingerprint
      try {
        var canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        var ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 100, 25);
        ctx.fillStyle = '#069';
        ctx.fillText('Cwm fjord', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Cwm fjord', 4, 17);
        data.fingerprint.canvasHash = canvas.toDataURL().slice(-50);
      } catch(e) {}

      // Headless detection
      try {
        data.fingerprint.isHeadless = (
          /HeadlessChrome/.test(navigator.userAgent) ||
          navigator.webdriver === true ||
          !window.chrome ||
          (window.chrome && !window.chrome.runtime) ||
          window.outerWidth === 0 ||
          window.outerHeight === 0 ||
          navigator.plugins.length === 0 ||
          /PhantomJS|Nightmare|Selenium|WebDriver/.test(navigator.userAgent)
        );
        data.fingerprint.isAutomated = (
          navigator.webdriver ||
          !!window.callPhantom ||
          !!window._phantom ||
          !!window.__nightmare ||
          !!document.__selenium_unwrapped ||
          !!document.__webdriver_evaluate ||
          !!document.__driver_evaluate
        );
      } catch(e) {}

      // Plugins
      try {
        var plugins = [];
        for (var i = 0; i < navigator.plugins.length && i < 10; i++) {
          plugins.push(navigator.plugins[i].name);
        }
        data.fingerprint.plugins = plugins;
      } catch(e) {}

      // Performance
      try {
        if (window.performance && performance.timing) {
          data.fingerprint.performanceData = {
            navigationStart: performance.timing.navigationStart,
            domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
          };
        }
      } catch(e) {}

      // Connection
      try {
        if (navigator.connection) {
          data.fingerprint.connectionType = navigator.connection.effectiveType || navigator.connection.type;
        }
      } catch(e) {}

      // Battery
      try {
        if (navigator.getBattery) {
          navigator.getBattery().then(function(battery) {
            data.fingerprint.batteryLevel = battery.level;
          });
        }
      } catch(e) {}

      // Event tracking
      var events = { mouse: 0, scroll: 0, key: 0, touch: 0, click: 0, focus: 0 };
      document.addEventListener('mousemove', function() { events.mouse++; }, { passive: true });
      document.addEventListener('scroll', function() { events.scroll++; }, { passive: true });
      document.addEventListener('keypress', function() { events.key++; }, { passive: true });
      document.addEventListener('touchstart', function() { events.touch++; }, { passive: true });
      document.addEventListener('click', function() { events.click++; }, { passive: true });
      window.addEventListener('focus', function() { events.focus++; });
      window.addEventListener('blur', function() { events.focus++; });

      // Submit after delay
      setTimeout(function() {
        data.fingerprint.mouseMovements = events.mouse;
        data.fingerprint.scrollEvents = events.scroll;
        data.fingerprint.keypressEvents = events.key;
        data.fingerprint.touchEvents = events.touch;
        data.fingerprint.clickEvents = events.click;
        data.fingerprint.focusChanges = events.focus;
        data.fingerprint.timeOnPage = Date.now() - startTime;

        fetch(window.location.origin + window.location.pathname, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        .then(function(r) { return r.json(); })
        .then(function(result) {
          if (result.redirectUrl) {
            if (result.delayMs && result.delayMs > 0) {
              setTimeout(function() { window.location.href = result.redirectUrl; }, result.delayMs);
            } else {
              window.location.href = result.redirectUrl;
            }
          }
        })
        .catch(function() {
          window.location.reload();
        });
      }, ${Math.max(delayMs, 1500)});
    })();
  </script>
</body>
</html>`;
}

// ==================== REDIRECT WITH DELAY ====================
async function createDelayedRedirect(url: string, delayMs: number): Promise<Response> {
  if (delayMs <= 0) return Response.redirect(url, 302);
  
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="${Math.ceil(delayMs / 1000)};url=${url}"><title>Redirecting...</title><style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f9f9f9}.loader{width:48px;height:48px;border:5px solid #e0e0e0;border-bottom-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="loader"></div><script>setTimeout(function(){window.location.href="${url}"},${delayMs})</script></body></html>`;
  
  return new Response(html, {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate" },
  });
}

// ==================== FINGERPRINT SCORING ====================
function calculateFingerprintScore(fingerprint: any, botResult: BotDetectionResult): { score: number; flags: string[]; riskLevel: string } {
  let score = 100;
  const flags: string[] = [];

  // === CRITICAL: Automation Detection ===
  if (fingerprint.hasWebdriver) { score = 0; flags.push("WEBDRIVER"); }
  if (fingerprint.hasPuppeteer) { score = 0; flags.push("PUPPETEER"); }
  if (fingerprint.hasSelenium) { score = 0; flags.push("SELENIUM"); }
  if (fingerprint.hasPhantom) { score = 0; flags.push("PHANTOM"); }
  if (fingerprint.isHeadless && fingerprint.isAutomated) { score = 0; flags.push("HEADLESS_AUTOMATED"); }
  
  // === HIGH RISK ===
  if (fingerprint.isHeadless) { score -= 35; flags.push("headless"); }
  if (fingerprint.isAutomated) { score -= 35; flags.push("automated"); }
  if (/swiftshader|llvmpipe|mesa|software/i.test(fingerprint.webglRenderer || "")) { score -= 30; flags.push("software_renderer"); }
  if (fingerprint.screenResolution === "800x600" || fingerprint.screenResolution === "1024x768") { score -= 25; flags.push("headless_resolution"); }
  
  // === MEDIUM RISK ===
  if (fingerprint.mouseMovements === 0 && !fingerprint.touchSupport) { score -= 20; flags.push("no_mouse"); }
  if (fingerprint.timeOnPage < 500) { score -= 22; flags.push("fast_access"); }
  if (fingerprint.timeOnPage < 1000 && fingerprint.mouseMovements < 5) { score -= 15; flags.push("bot_behavior"); }
  if (!fingerprint.webglVendor && !fingerprint.webglRenderer) { score -= 15; flags.push("no_webgl"); }
  if (fingerprint.pluginsCount === 0 && !/mobile|android|iphone/i.test(fingerprint.userAgent || "")) { score -= 12; flags.push("no_plugins"); }
  
  // === LOW RISK ===
  if (!fingerprint.cookieEnabled) { score -= 10; flags.push("no_cookies"); }
  if (fingerprint.colorDepth < 24) { score -= 8; flags.push("low_color_depth"); }
  if (!fingerprint.language) { score -= 8; flags.push("no_language"); }
  if (!fingerprint.timezone) { score -= 5; flags.push("no_timezone"); }
  
  // === BEHAVIORAL BONUSES ===
  if (fingerprint.mouseMovements > 20) { score += 10; }
  if (fingerprint.scrollEvents > 3) { score += 8; }
  if (fingerprint.touchEvents > 0 && fingerprint.touchSupport) { score += 10; }
  if (fingerprint.timeOnPage > 5000) { score += 8; }
  if (fingerprint.focusChanges > 0) { score += 5; }

  // === BOT DETECTION PENALTY ===
  if (botResult.isBot && !botResult.isAdPlatform) {
    score -= botResult.confidence / 2;
    flags.push(...botResult.reasons);
  }

  score = Math.max(0, Math.min(100, score));

  // Determine risk level
  let riskLevel: string;
  if (score >= 80) riskLevel = "low";
  else if (score >= 60) riskLevel = "medium";
  else if (score >= 40) riskLevel = "high";
  else riskLevel = "critical";

  return { score, flags, riskLevel };
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

  // === GET: Fast redirect or challenge page ===
  if (req.method === "GET") {
    const url = new URL(req.url);
    const slug = url.searchParams.get("s") || url.searchParams.get("slug");
    
    if (!slug) return new Response("Missing slug", { status: 400 });
    
    const userAgent = req.headers.get("user-agent") || "";
    const cfIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const cfCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || "";
    const cfIsp = req.headers.get("cf-isp") || req.headers.get("x-isp") || "";
    const cfAsn = req.headers.get("cf-asn") || req.headers.get("x-asn") || "";
    const referer = req.headers.get("referer") || "";
    
    let link = getCachedLink(slug);
    
    if (!link) {
      const { data, error } = await supabase.from("cloaked_links").select("*").eq("slug", slug).maybeSingle();
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
      console.log(`[Cloaker] BLOCKED: ${ipCheck.reason} IP=${cfIp}`);
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
        console.log(`[Cloaker] BLOCKED: rate_limit IP=${cfIp}`);
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
    
    // ISP/ASN blocking
    if (checkIspBlock(cfIsp, link)) {
      console.log(`[Cloaker] BLOCKED: isp_blocked ${cfIsp}`);
      return Response.redirect(link.safe_url, 302);
    }
    if (checkAsnBlock(cfAsn, link)) {
      console.log(`[Cloaker] BLOCKED: asn_blocked ${cfAsn}`);
      return Response.redirect(link.safe_url, 302);
    }
    
    // === BOT DETECTION ===
    const botResult = detectBot(userAgent, cfIp, req.headers);
    
    // Block bots (except ad platforms which we always block to safe page)
    const shouldBlock = link.block_bots && (
      botResult.isBot ||
      (link.block_vpn && (isDatacenterIP(cfIp) || isVpnProviderIP(cfIp))) ||
      (link.block_datacenter && isDatacenterIP(cfIp)) ||
      (link.block_proxy && botResult.reasons.includes("PROXY_ASN")) ||
      (link.block_tor && botResult.reasons.includes("TOR_EXIT_SUSPECTED"))
    );
    
    if (shouldBlock) {
      const processingTime = Date.now() - startTime;
      console.log(`[Cloaker] BLOCKED: ${botResult.botType || "bot"} platform=${botResult.platform || "unknown"} conf=${botResult.confidence}% threat=${botResult.threatLevel} reasons=${botResult.reasons.slice(0,4).join(",")} (${processingTime}ms)`);
      
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
          asn: cfAsn,
          is_bot: true,
          referer,
          ...utmParams,
          processing_time_ms: processingTime,
        }).then(() => {});
        supabase.from("cloaked_links").update({ 
          clicks_count: (link.clicks_count || 0) + 1,
          clicks_today: (link.clicks_today || 0) + 1,
        }).eq("id", link.id).then(() => {});
      });
      
      return Response.redirect(link.safe_url, 302);
    }
    
    // === FINGERPRINT COLLECTION MODE ===
    if (link.collect_fingerprint && link.require_behavior) {
      // Return challenge page for fingerprint collection
      const behaviorTime = link.behavior_time_ms || 2000;
      console.log(`[Cloaker] CHALLENGE: Serving JS challenge page for ${slug}`);
      return new Response(generateChallengePage(slug, behaviorTime), {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
    }
    
    // === ALLOW (Direct Redirect) ===
    let targetUrl = selectTargetUrl(link);
    if (link.passthrough_utm) targetUrl = applyUtmPassthrough(targetUrl, req);
    
    const processingTime = Date.now() - startTime;
    console.log(`[Cloaker] ALLOW device=${deviceType} country=${cfCountry} (${processingTime}ms)`);
    
    // Track session
    trackSession(cfIp, "get-allow", 100);
    
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
        asn: cfAsn,
        platform: deviceType,
        is_bot: false,
        referer,
        redirect_url: targetUrl,
        ...utmParams,
        processing_time_ms: processingTime,
      }).then(() => {});
      supabase.from("cloaked_links").update({ 
        clicks_count: (link.clicks_count || 0) + 1,
        clicks_today: (link.clicks_today || 0) + 1,
      }).eq("id", link.id).then(() => {});
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
    const cfAsn = req.headers.get("cf-asn") || "";
    const referer = req.headers.get("referer") || "";
    const utmParams = extractUtmParams(req);
    
    const { data: link, error } = await supabase.from("cloaked_links").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
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
    
    // Block high-confidence bots immediately
    if (link.block_bots && botResult.isBot && botResult.confidence >= 85 && !botResult.isAdPlatform) {
      console.log(`[Cloaker] POST BLOCKED: ${botResult.botType} conf=${botResult.confidence}% threat=${botResult.threatLevel}`);
      return new Response(JSON.stringify({ redirectUrl: link.safe_url, decision: `blocked_${botResult.botType?.toLowerCase().replace(/\s+/g, "_") || "bot"}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    // Ad platform detection (always block to safe page)
    if (botResult.isAdPlatform) {
      console.log(`[Cloaker] POST BLOCKED: Ad Platform ${botResult.platform} ${botResult.botType}`);
      return new Response(JSON.stringify({ redirectUrl: link.safe_url, decision: `blocked_${botResult.platform}_bot` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!fingerprint) {
      if (link.collect_fingerprint) {
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
    
    // Get fingerprint reputation
    const reputation = getFingerprintReputation(fingerprintHash);
    
    // Calculate score
    const { score, flags, riskLevel } = calculateFingerprintScore(fingerprint, botResult);
    
    // Track session
    const sessionInfo = trackSession(cfIp, fingerprintHash, score);
    
    let finalScore = score;
    
    // Reputation adjustments
    if (reputation.trustLevel === "trusted") finalScore = Math.min(100, finalScore + 15);
    else if (reputation.trustLevel === "suspicious") finalScore -= 10;
    else if (reputation.trustLevel === "blocked") finalScore -= 30;
    
    // Session adjustments
    if (sessionInfo.isSuspicious) { finalScore -= 20; flags.push("fingerprint_spoofing"); }
    if (sessionInfo.visitCount > 10 && sessionInfo.avgScore < 50) { finalScore -= 15; flags.push("repeated_low_score"); }
    
    finalScore = Math.max(0, Math.min(100, finalScore));
    
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
    } else if (checkAsnBlock(cfAsn, link)) {
      decision = "block"; targetUrl = link.safe_url;
    } else if (flags.some(f => ["WEBDRIVER", "PUPPETEER", "SELENIUM", "PHANTOM", "HEADLESS_AUTOMATED"].includes(f))) {
      decision = "block"; targetUrl = link.safe_url;
    } else if (finalScore >= minScore) {
      decision = "allow";
      targetUrl = selectTargetUrl(link);
      if (link.passthrough_utm) targetUrl = applyUtmPassthrough(targetUrl, req);
    } else {
      decision = "block"; targetUrl = link.safe_url;
    }

    // Update fingerprint reputation
    updateFingerprintReputation(fingerprintHash, decision, finalScore);

    const processingTime = Date.now() - startTime;
    console.log(`[Cloaker] POST Decision=${decision} Score=${finalScore}/${minScore} Risk=${riskLevel} Trust=${reputation.trustLevel} Flags=${flags.slice(0,4).join(",")} (${processingTime}ms)`);

    queueMicrotask(async () => {
      try {
        await supabase.from("cloaker_visitors").insert({
          link_id: link.id,
          fingerprint_hash: fingerprintHash,
          score: finalScore,
          decision,
          user_agent: (fingerprint.userAgent || ua).substring(0, 500),
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
          is_bot: botResult.isBot,
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
          asn: cfAsn,
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
      score: finalScore,
      minScore,
      riskLevel,
      confidence: botResult.confidence,
      delayMs: decision === "allow" ? (link.redirect_delay_ms || 0) : 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[Cloaker] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
