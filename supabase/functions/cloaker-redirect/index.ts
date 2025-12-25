import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== SESSION COOKIE CONFIG ====================
const SESSION_COOKIE_NAME = "clk_session";
const SESSION_COOKIE_MAX_AGE = 86400 * 7; // 7 days

function generateSessionId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map(c => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === SESSION_COOKIE_NAME) return value;
  }
  return null;
}

// ==================== IN-MEMORY CACHES ====================
const linkCache = new Map<string, { link: any; timestamp: number }>();
const CACHE_TTL = 60000;
const rateLimitCache = new Map<string, { count: number; windowStart: number }>();
const sessionCache = new Map<string, { firstSeen: number; visits: number; scores: number[]; fingerprints: string[]; approved: boolean }>();
const fingerprintReputation = new Map<string, { score: number; lastSeen: number; decisionHistory: string[] }>();
const approvedSessions = new Map<string, { ip: string; fingerprintHash: string; approvedAt: number; score: number }>();

// ==================== ML ADAPTIVE CACHES ====================
interface MLPattern {
  patternType: string;
  patternValue: string;
  blockCount: number;
  approveCount: number;
  confidenceScore: number;
  weightAdjustment: number;
  lastSeen: number;
}

interface MLThresholds {
  linkId: string;
  minScoreAdjusted: number;
  fingerprintWeight: number;
  behaviorWeight: number;
  networkWeight: number;
  automationWeight: number;
  learningRate: number;
  totalDecisions: number;
  blockRate: number;
  falsePositiveRate: number;
  lastAdjusted: number;
}

// In-memory ML caches (synced with DB periodically)
const mlPatternsCache = new Map<string, MLPattern>();
const mlThresholdsCache = new Map<string, MLThresholds>();
const ML_CACHE_TTL = 300000; // 5 minutes
let mlLastSync = 0;

// Learning constants
const LEARNING_RATE_DEFAULT = 0.1;
const MIN_SAMPLES_FOR_ADJUSTMENT = 10;
const PATTERN_CONFIDENCE_THRESHOLD = 0.7;
const WEIGHT_ADJUSTMENT_MIN = 0.5;
const WEIGHT_ADJUSTMENT_MAX = 2.0;

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
  for (const [key, value] of approvedSessions.entries()) {
    if (now - value.approvedAt > SESSION_COOKIE_MAX_AGE * 1000) approvedSessions.delete(key);
  }
}, 300000);

// ==================== ML ADAPTIVE LEARNING SYSTEM ====================

// Get pattern key for caching
function getPatternKey(type: string, value: string): string {
  return `${type}:${value}`;
}

// Sync ML data from database
async function syncMLData(supabase: any): Promise<void> {
  const now = Date.now();
  if (now - mlLastSync < ML_CACHE_TTL) return;
  
  try {
    // Load patterns
    const { data: patterns } = await supabase
      .from("cloaker_ml_patterns")
      .select("*")
      .order("confidence_score", { ascending: false })
      .limit(1000);
    
    if (patterns) {
      for (const p of patterns) {
        const key = getPatternKey(p.pattern_type, p.pattern_value);
        mlPatternsCache.set(key, {
          patternType: p.pattern_type,
          patternValue: p.pattern_value,
          blockCount: p.block_count,
          approveCount: p.approve_count,
          confidenceScore: p.confidence_score,
          weightAdjustment: p.weight_adjustment,
          lastSeen: new Date(p.last_seen_at).getTime(),
        });
      }
    }
    
    // Load thresholds
    const { data: thresholds } = await supabase
      .from("cloaker_ml_thresholds")
      .select("*");
    
    if (thresholds) {
      for (const t of thresholds) {
        mlThresholdsCache.set(t.link_id, {
          linkId: t.link_id,
          minScoreAdjusted: t.min_score_adjusted,
          fingerprintWeight: t.fingerprint_weight,
          behaviorWeight: t.behavior_weight,
          networkWeight: t.network_weight,
          automationWeight: t.automation_weight,
          learningRate: t.learning_rate,
          totalDecisions: t.total_decisions,
          blockRate: t.block_rate,
          falsePositiveRate: t.false_positive_rate,
          lastAdjusted: new Date(t.last_adjusted_at).getTime(),
        });
      }
    }
    
    mlLastSync = now;
    console.log(`[ML] Synced ${patterns?.length || 0} patterns, ${thresholds?.length || 0} thresholds`);
  } catch (e) {
    console.error("[ML] Sync error:", e);
  }
}

// Get or initialize ML thresholds for a link
function getMLThresholds(linkId: string, defaultMinScore: number): MLThresholds {
  const cached = mlThresholdsCache.get(linkId);
  if (cached) return cached;
  
  return {
    linkId,
    minScoreAdjusted: defaultMinScore,
    fingerprintWeight: 1.0,
    behaviorWeight: 1.0,
    networkWeight: 1.0,
    automationWeight: 1.0,
    learningRate: LEARNING_RATE_DEFAULT,
    totalDecisions: 0,
    blockRate: 0,
    falsePositiveRate: 0,
    lastAdjusted: Date.now(),
  };
}

// Get pattern weight adjustment based on ML learning
function getPatternWeight(type: string, value: string): number {
  const key = getPatternKey(type, value);
  const pattern = mlPatternsCache.get(key);
  if (!pattern) return 1.0;
  
  const totalSamples = pattern.blockCount + pattern.approveCount;
  if (totalSamples < MIN_SAMPLES_FOR_ADJUSTMENT) return 1.0;
  
  return pattern.weightAdjustment;
}

// Extract patterns from visitor data for ML learning
interface ExtractedPatterns {
  userAgentBrowser: string;
  userAgentOS: string;
  screenResolution: string;
  timezone: string;
  language: string;
  webglRenderer: string;
  ipPrefix: string;
  asnPattern: string;
  behaviorPattern: string;
}

function extractPatterns(fingerprint: any, ip: string, asn: string, userAgent: string): ExtractedPatterns {
  const ua = userAgent.toLowerCase();
  
  // Extract browser from UA
  let browser = "unknown";
  if (/chrome/i.test(ua) && !/edge|edg/i.test(ua)) browser = "chrome";
  else if (/firefox/i.test(ua)) browser = "firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "safari";
  else if (/edge|edg/i.test(ua)) browser = "edge";
  else if (/opera|opr/i.test(ua)) browser = "opera";
  
  // Extract OS from UA
  let os = "unknown";
  if (/windows/i.test(ua)) os = "windows";
  else if (/mac\s*os/i.test(ua)) os = "macos";
  else if (/linux/i.test(ua) && !/android/i.test(ua)) os = "linux";
  else if (/android/i.test(ua)) os = "android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "ios";
  
  // IP prefix (first 3 octets)
  const ipParts = ip.split(".");
  const ipPrefix = ipParts.length >= 3 ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}` : ip;
  
  // Behavior pattern (categorize)
  let behaviorPattern = "normal";
  const mouseMovements = fingerprint?.mouseMovements || 0;
  const timeOnPage = fingerprint?.timeOnPage || 0;
  if (mouseMovements === 0 && timeOnPage < 1000) behaviorPattern = "instant_no_mouse";
  else if (mouseMovements < 5 && timeOnPage < 2000) behaviorPattern = "minimal_interaction";
  else if (mouseMovements > 50 && timeOnPage > 5000) behaviorPattern = "high_engagement";
  
  return {
    userAgentBrowser: `browser:${browser}`,
    userAgentOS: `os:${os}`,
    screenResolution: `resolution:${fingerprint?.screenResolution || "unknown"}`,
    timezone: `timezone:${fingerprint?.timezone || "unknown"}`,
    language: `language:${fingerprint?.language || "unknown"}`,
    webglRenderer: `webgl:${(fingerprint?.webglRenderer || "unknown").substring(0, 50)}`,
    ipPrefix: `ip_prefix:${ipPrefix}`,
    asnPattern: `asn:${asn || "unknown"}`,
    behaviorPattern: `behavior:${behaviorPattern}`,
  };
}

// Calculate adaptive score using ML weights
function calculateAdaptiveScore(
  baseScore: number,
  fingerprint: any,
  patterns: ExtractedPatterns,
  thresholds: MLThresholds,
  botResult: any
): { score: number; adjustments: Record<string, number>; mlApplied: boolean } {
  let score = baseScore;
  const adjustments: Record<string, number> = {};
  let mlApplied = false;
  
  // Apply fingerprint-based adjustments with ML weights
  const fingerprintPatterns = [
    patterns.screenResolution,
    patterns.timezone,
    patterns.webglRenderer,
  ];
  
  for (const pattern of fingerprintPatterns) {
    const weight = getPatternWeight("fingerprint", pattern);
    if (weight !== 1.0) {
      const adjustment = (weight - 1.0) * 15 * thresholds.fingerprintWeight;
      score += adjustment;
      adjustments[pattern] = adjustment;
      mlApplied = true;
    }
  }
  
  // Apply behavior-based adjustments
  const behaviorWeight = getPatternWeight("behavior", patterns.behaviorPattern);
  if (behaviorWeight !== 1.0) {
    const adjustment = (behaviorWeight - 1.0) * 20 * thresholds.behaviorWeight;
    score += adjustment;
    adjustments[patterns.behaviorPattern] = adjustment;
    mlApplied = true;
  }
  
  // Apply network-based adjustments
  const networkPatterns = [patterns.ipPrefix, patterns.asnPattern];
  for (const pattern of networkPatterns) {
    const weight = getPatternWeight("network", pattern);
    if (weight !== 1.0) {
      const adjustment = (weight - 1.0) * 25 * thresholds.networkWeight;
      score += adjustment;
      adjustments[pattern] = adjustment;
      mlApplied = true;
    }
  }
  
  // Apply user agent adjustments
  const uaPatterns = [patterns.userAgentBrowser, patterns.userAgentOS];
  for (const pattern of uaPatterns) {
    const weight = getPatternWeight("user_agent", pattern);
    if (weight !== 1.0) {
      const adjustment = (weight - 1.0) * 10;
      score += adjustment;
      adjustments[pattern] = adjustment;
      mlApplied = true;
    }
  }
  
  // Apply automation detection weight
  if (botResult?.isBot && !botResult?.isAdPlatform) {
    const automationPenalty = -botResult.confidence * 0.5 * thresholds.automationWeight;
    score += automationPenalty;
    adjustments["automation_penalty"] = automationPenalty;
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    adjustments,
    mlApplied,
  };
}

// Learn from decision - update patterns in background
async function learnFromDecision(
  supabase: any,
  linkId: string,
  decision: "allow" | "block",
  patterns: ExtractedPatterns,
  score: number,
  fingerprint: any,
  visitorId?: string
): Promise<void> {
  const now = new Date().toISOString();
  const isBlock = decision === "block";
  
  // Update patterns in database
  const patternUpdates: { type: string; value: string }[] = [
    { type: "fingerprint", value: patterns.screenResolution },
    { type: "fingerprint", value: patterns.timezone },
    { type: "fingerprint", value: patterns.webglRenderer },
    { type: "behavior", value: patterns.behaviorPattern },
    { type: "network", value: patterns.ipPrefix },
    { type: "network", value: patterns.asnPattern },
    { type: "user_agent", value: patterns.userAgentBrowser },
    { type: "user_agent", value: patterns.userAgentOS },
  ];
  
  for (const { type, value } of patternUpdates) {
    if (!value || value.includes("unknown")) continue;
    
    // Upsert pattern with updated counts
    const { data: existing } = await supabase
      .from("cloaker_ml_patterns")
      .select("*")
      .eq("pattern_type", type)
      .eq("pattern_value", value)
      .maybeSingle();
    
    if (existing) {
      const newBlockCount = existing.block_count + (isBlock ? 1 : 0);
      const newApproveCount = existing.approve_count + (isBlock ? 0 : 1);
      const total = newBlockCount + newApproveCount;
      
      // Calculate new confidence and weight
      let newConfidence = 0.5;
      let newWeight = 1.0;
      
      if (total >= MIN_SAMPLES_FOR_ADJUSTMENT) {
        const blockRatio = newBlockCount / total;
        newConfidence = Math.abs(blockRatio - 0.5) * 2; // 0 to 1
        
        // Adjust weight based on block ratio
        if (blockRatio > 0.7) {
          // High block ratio = lower weight (penalize this pattern)
          newWeight = Math.max(WEIGHT_ADJUSTMENT_MIN, 1.0 - (blockRatio - 0.5) * 1.5);
        } else if (blockRatio < 0.3) {
          // Low block ratio = higher weight (trust this pattern)
          newWeight = Math.min(WEIGHT_ADJUSTMENT_MAX, 1.0 + (0.5 - blockRatio) * 1.5);
        }
      }
      
      await supabase
        .from("cloaker_ml_patterns")
        .update({
          block_count: newBlockCount,
          approve_count: newApproveCount,
          confidence_score: newConfidence,
          weight_adjustment: newWeight,
          last_seen_at: now,
          metadata: { lastScore: score },
        })
        .eq("id", existing.id);
      
      // Update cache
      const key = getPatternKey(type, value);
      mlPatternsCache.set(key, {
        patternType: type,
        patternValue: value,
        blockCount: newBlockCount,
        approveCount: newApproveCount,
        confidenceScore: newConfidence,
        weightAdjustment: newWeight,
        lastSeen: Date.now(),
      });
    } else {
      // Insert new pattern
      await supabase
        .from("cloaker_ml_patterns")
        .insert({
          pattern_type: type,
          pattern_value: value,
          block_count: isBlock ? 1 : 0,
          approve_count: isBlock ? 0 : 1,
          confidence_score: 0.5,
          weight_adjustment: 1.0,
          last_seen_at: now,
          metadata: { firstScore: score },
        });
    }
  }
  
  // Update link thresholds
  const { data: linkThresholds } = await supabase
    .from("cloaker_ml_thresholds")
    .select("*")
    .eq("link_id", linkId)
    .maybeSingle();
  
  if (linkThresholds) {
    const totalDecisions = linkThresholds.total_decisions + 1;
    const blockRate = (linkThresholds.block_rate * linkThresholds.total_decisions + (isBlock ? 1 : 0)) / totalDecisions;
    
    // Adaptive threshold adjustment
    let newMinScore = linkThresholds.min_score_adjusted;
    
    // If block rate is too high (>60%), lower the threshold slightly
    if (totalDecisions >= 50 && blockRate > 0.6) {
      newMinScore = Math.max(20, newMinScore - linkThresholds.learning_rate * 5);
    }
    // If block rate is too low (<20%), raise the threshold slightly
    else if (totalDecisions >= 50 && blockRate < 0.2) {
      newMinScore = Math.min(80, newMinScore + linkThresholds.learning_rate * 3);
    }
    
    await supabase
      .from("cloaker_ml_thresholds")
      .update({
        total_decisions: totalDecisions,
        block_rate: blockRate,
        min_score_adjusted: newMinScore,
        last_adjusted_at: now,
      })
      .eq("link_id", linkId);
    
    // Update cache
    mlThresholdsCache.set(linkId, {
      ...linkThresholds,
      totalDecisions,
      blockRate,
      minScoreAdjusted: newMinScore,
      lastAdjusted: Date.now(),
    });
  } else {
    // Create new threshold entry
    await supabase
      .from("cloaker_ml_thresholds")
      .insert({
        link_id: linkId,
        total_decisions: 1,
        block_rate: isBlock ? 1 : 0,
        last_adjusted_at: now,
      });
  }
  
  console.log(`[ML] Learned from ${decision}: ${Object.keys(patterns).length} patterns updated for link ${linkId.substring(0, 8)}`);
}

// Record feedback for false positives/negatives (can be called from admin)
async function recordFeedback(
  supabase: any,
  visitorId: string,
  linkId: string,
  originalDecision: string,
  correctedDecision: string
): Promise<void> {
  const feedbackType = originalDecision === "block" && correctedDecision === "allow" 
    ? "false_positive" 
    : "false_negative";
  
  await supabase
    .from("cloaker_ml_feedback")
    .insert({
      visitor_id: visitorId,
      link_id: linkId,
      original_decision: originalDecision,
      corrected_decision: correctedDecision,
      feedback_type: feedbackType,
    });
  
  // Update false positive rate for link
  if (feedbackType === "false_positive") {
    const { data: thresholds } = await supabase
      .from("cloaker_ml_thresholds")
      .select("*")
      .eq("link_id", linkId)
      .maybeSingle();
    
    if (thresholds) {
      const newFPRate = (thresholds.false_positive_rate * thresholds.total_decisions + 1) / (thresholds.total_decisions + 1);
      
      // If FP rate is high, adjust weights to be less aggressive
      let newAutomationWeight = thresholds.automation_weight;
      if (newFPRate > 0.1 && thresholds.total_decisions >= 20) {
        newAutomationWeight = Math.max(0.5, thresholds.automation_weight - 0.1);
      }
      
      await supabase
        .from("cloaker_ml_thresholds")
        .update({
          false_positive_rate: newFPRate,
          automation_weight: newAutomationWeight,
        })
        .eq("link_id", linkId);
    }
  }
  
  console.log(`[ML] Recorded ${feedbackType} feedback for visitor ${visitorId.substring(0, 8)}`);
}
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
  const session = sessionCache.get(ip) || { firstSeen: Date.now(), visits: 0, scores: [], fingerprints: [], approved: false };
  session.visits++;
  session.scores.push(score);
  if (fingerprintHash && !session.fingerprints.includes(fingerprintHash)) {
    session.fingerprints.push(fingerprintHash);
  }
  sessionCache.set(ip, session);
  
  const avgScore = session.scores.reduce((a, b) => a + b, 0) / session.scores.length;
  const isSuspicious = session.fingerprints.length > 5;
  
  return { isReturning: session.visits > 1, visitCount: session.visits, avgScore, isSuspicious };
}

// ==================== APPROVED SESSION MANAGEMENT ====================
function isSessionApproved(sessionId: string, ip: string): boolean {
  const session = approvedSessions.get(sessionId);
  if (!session) return false;
  // Session must be from same IP and not expired
  if (session.ip !== ip) return false;
  if (Date.now() - session.approvedAt > SESSION_COOKIE_MAX_AGE * 1000) {
    approvedSessions.delete(sessionId);
    return false;
  }
  return true;
}

function approveSession(sessionId: string, ip: string, fingerprintHash: string, score: number): void {
  approvedSessions.set(sessionId, { ip, fingerprintHash, approvedAt: Date.now(), score });
  // Limit cache size
  if (approvedSessions.size > 50000) {
    const oldest = approvedSessions.keys().next().value;
    if (oldest) approvedSessions.delete(oldest);
  }
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
  if (pattern.includes("/")) return isIpInCidr(ip, pattern);
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

// ==================== REFERER FILTERING (GOOGLE ADS - ULTRA COMPREHENSIVE) ====================
const GOOGLE_ADS_REFERER_PATTERNS = [
  // === GOOGLE ADS CLICK URLS ===
  /google\.com\/aclk/i,
  /google\.[a-z.]+\/aclk/i,
  /google\.com\/ads/i,
  /google\.[a-z.]+\/ads/i,
  
  // === DOUBLECLICK / DV360 ===
  /googleads\.g\.doubleclick\.net/i,
  /doubleclick\.net/i,
  /ad\.doubleclick\.net/i,
  /pubads\.g\.doubleclick\.net/i,
  /securepubads\.g\.doubleclick\.net/i,
  /pagead2\.googlesyndication\.com/i,
  /pagead\.googlesyndication\.com/i,
  
  // === GOOGLE AD SERVICES ===
  /googlesyndication\.com/i,
  /googleadservices\.com/i,
  /www\.googleadservices\.com/i,
  /partner\.googleadservices\.com/i,
  /adservice\.google\.[a-z.]+/i,
  /adservice\.google\.com/i,
  
  // === GOOGLE PAGEAD ===
  /google\.com\/pagead/i,
  /google\.[a-z.]+\/pagead/i,
  /pagead\.l\.doubleclick\.net/i,
  
  // === GOOGLE SEARCH (PPC LANDING) ===
  /www\.google\.[a-z.]+\/search/i,
  /www\.google\.[a-z.]+\/url/i,
  /google\.[a-z]{2,3}(\.[a-z]{2})?\/search/i,
  /google\.[a-z]{2,3}(\.[a-z]{2})?\/url/i,
  
  // === GOOGLE ADS PREVIEW ===
  /adspreview\.googleapis\.com/i,
  /adssettings\.google\.com/i,
  /ads\.google\.com/i,
  /adwords\.google\.com/i,
  
  // === YOUTUBE ADS ===
  /youtube\.com\/redirect/i,
  /youtube\.com\/ads/i,
  /youtube\.com\/watch.*[?&]ad_/i,
  /youtube\.com\/embed.*autoplay/i,
  
  // === GOOGLE SHOPPING ===
  /shopping\.google\.[a-z.]+/i,
  /google\.[a-z.]+\/shopping/i,
  
  // === GOOGLE MAPS ADS ===
  /maps\.google\.[a-z.]+\/maps.*ad/i,
  /google\.com\/maps.*promoted/i,
  
  // === GOOGLE DISPLAY NETWORK ===
  /googlevideo\.com/i,
  /gstatic\.com\/ads/i,
  
  // === GOOGLE ANALYTICS / TAG MANAGER (AD TRACKING) ===
  /googletagmanager\.com/i,
  /google-analytics\.com/i,
  /analytics\.google\.com/i,
];

const BING_ADS_REFERER_PATTERNS = [
  /bing\.com\/aclick/i,
  /bing\.com\/ads/i,
  /bingads\.microsoft\.com/i,
  /ads\.microsoft\.com/i,
  /msn\.com\/click/i,
];

const FACEBOOK_ADS_REFERER_PATTERNS = [
  /facebook\.com\/ads/i,
  /fb\.com\/ads/i,
  /l\.facebook\.com/i,
  /lm\.facebook\.com/i,
  /business\.facebook\.com/i,
  /adsmanager\.facebook\.com/i,
];

const TIKTOK_ADS_REFERER_PATTERNS = [
  /tiktok\.com\/redirect/i,
  /ads\.tiktok\.com/i,
  /business-api\.tiktok\.com/i,
];

interface RefererAnalysis {
  isAdPlatformReferer: boolean;
  platform: string | null;
  isSuspicious: boolean;
  reasons: string[];
}

function analyzeReferer(referer: string): RefererAnalysis {
  const reasons: string[] = [];
  let platform: string | null = null;
  let isSuspicious = false;

  if (!referer) {
    return { isAdPlatformReferer: false, platform: null, isSuspicious: false, reasons: [] };
  }

  // Google Ads
  for (const pattern of GOOGLE_ADS_REFERER_PATTERNS) {
    if (pattern.test(referer)) {
      platform = "google";
      reasons.push("GOOGLE_ADS_REFERER");
      break;
    }
  }

  // Bing Ads
  if (!platform) {
    for (const pattern of BING_ADS_REFERER_PATTERNS) {
      if (pattern.test(referer)) {
        platform = "microsoft";
        reasons.push("BING_ADS_REFERER");
        break;
      }
    }
  }

  // Facebook Ads
  if (!platform) {
    for (const pattern of FACEBOOK_ADS_REFERER_PATTERNS) {
      if (pattern.test(referer)) {
        platform = "facebook";
        reasons.push("FACEBOOK_ADS_REFERER");
        break;
      }
    }
  }

  // TikTok Ads
  if (!platform) {
    for (const pattern of TIKTOK_ADS_REFERER_PATTERNS) {
      if (pattern.test(referer)) {
        platform = "tiktok";
        reasons.push("TIKTOK_ADS_REFERER");
        break;
      }
    }
  }

  // Suspicious: No referer from ad click (usually has referer)
  // Or referer from review/policy pages
  if (/policy|review|support|help|about|terms|privacy/i.test(referer)) {
    isSuspicious = true;
    reasons.push("POLICY_PAGE_REFERER");
  }

  return { isAdPlatformReferer: platform !== null, platform, isSuspicious, reasons };
}

// ==================== SPY TOOLS DETECTION (EXPANDED) ====================
const SPY_TOOLS_UA_PATTERNS = [
  // Major Spy Tools
  /adplexity/i, /anstrex/i, /adspy/i, /poweradspy/i, /bigspy/i,
  /dropispy/i, /minea/i, /pipiads/i, /socialadscout/i, /adbeat/i,
  /whatrunswhere/i, /adsector/i, /spypush/i, /mobidea/i,
  // SEO Spy Tools
  /semrush/i, /ahrefsbot/i, /mj12bot/i, /majestic/i, /spyfu/i,
  /serpstat/i, /similarweb/i, /alexa/i, /builtwith/i,
  // Competitive Analysis
  /crazyegg/i, /hotjar/i, /fullstory/i, /inspectlet/i,
  /clicktale/i, /mouseflow/i, /luckyorange/i,
  // Data Scrapers
  /scrapy/i, /scrapebox/i, /gsa/i, /xrumer/i, /zennolab/i,
  /scrapingbee/i, /scraperapi/i, /proxycrawl/i, /scrapinghub/i,
  // Archive/Wayback
  /archive\.org/i, /wayback/i, /ccbot/i, /commoncrawl/i,
];

const SPY_TOOLS_IP_RANGES = [
  // AdPlexity
  { start: "185.220.101.0", end: "185.220.101.255" },
  // SimilarWeb
  { start: "54.208.0.0", end: "54.208.255.255" },
  // Semrush
  { start: "185.191.171.0", end: "185.191.171.255" },
  { start: "185.191.170.0", end: "185.191.170.255" },
];

const SPY_TOOLS_REFERER_PATTERNS = [
  /adplexity\.com/i, /anstrex\.com/i, /adspy\.com/i,
  /poweradspy\.com/i, /bigspy\.com/i, /dropispy\.com/i,
  /minea\.com/i, /pipiads\.com/i, /adbeat\.com/i,
  /spyfu\.com/i, /semrush\.com/i, /ahrefs\.com/i,
  /similarweb\.com/i, /builtwith\.com/i,
];

function isSpyToolReferer(referer: string): boolean {
  for (const pattern of SPY_TOOLS_REFERER_PATTERNS) {
    if (pattern.test(referer)) return true;
  }
  return false;
}

function isSpyToolIP(ip: string): boolean {
  return isInIpRanges(ip, SPY_TOOLS_IP_RANGES);
}

function isSpyToolUA(userAgent: string): boolean {
  for (const pattern of SPY_TOOLS_UA_PATTERNS) {
    if (pattern.test(userAgent)) return true;
  }
  return false;
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
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id",
  "gclid", "gbraid", "wbraid", "dclid", "gclsrc",
  "fbclid", "fb_action_ids", "fb_action_types", "fb_source",
  "ttclid", "tt_medium", "tt_content",
  "msclkid", "epik", "sccid", "scid", "twclid", "li_fat_id",
  "tblci", "taboolaclickid", "obOrigUrl", "outbrain_click_id", "yclid",
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
// All known Google bot patterns including internal tools, policy reviewers, crawlers
const GOOGLE_BOT_UA_PATTERNS = [
  // === CORE AD BOTS ===
  /AdsBot-Google/i,
  /AdsBot-Google-Mobile/i,
  /AdsBot-Google-Mobile-Apps/i,
  /Google-Ads-Creatives-Assistant/i,
  /Google-Ads-Quality/i,
  /Google-AdWords/i,
  /Googlebot-Image/i,
  /Googlebot-News/i,
  /Googlebot-Video/i,
  /Googlebot/i,
  /Google-Site-Verification/i,
  /Google-Structured-Data-Testing-Tool/i,
  /Google-AMPHTML/i,
  
  // === POLICY & REVIEW BOTS ===
  /Google-Safety/i,
  /Google-Read-Aloud/i,
  /Google-adtte/i,
  /Google-Adwords-Instant/i,
  /Google-Adwords-DisplayAds/i,
  /Google-Youtube-Links/i,
  /Google-Publisher-Plugin/i,
  /Google-PhishingChecker/i,
  /GoogleDocs/i,
  /GoogleSecurityScanner/i,
  /Google-InspectionTool/i,
  
  // === LIGHTHOUSE & PAGESPEED ===
  /Lighthouse/i,
  /Chrome-Lighthouse/i,
  /PageSpeed\s*Insights/i,
  /PSTS\/\d/i,
  /Speed\s*Insights/i,
  /Google\s*Page\s*Speed/i,
  /CrUX/i,
  /Chrome\s*User\s*Experience\s*Report/i,
  
  // === MEDIA & CONTENT BOTS ===
  /Mediapartners-Google/i,
  /Mediapartners/i,
  /Google-Read-Aloud/i,
  /FeedFetcher-Google/i,
  /Google-Podcast/i,
  /Google-StoreBot/i,
  /Storebot-Google/i,
  /Google-Shopping-Quality/i,
  /Google-Shopping/i,
  
  // === OTHER GOOGLE BOTS ===
  /APIs-Google/i,
  /DuplexWeb-Google/i,
  /GoogleProducer/i,
  /Google-Extended/i,
  /AppEngine-Google/i,
  /Googleweblight/i,
  /GoogleAssistant/i,
  /Google\s*Web\s*Preview/i,
  /Google-Transparency-Report/i,
  /Google-HotelAdsVerifier/i,
  /Google-LocalListingsVerifier/i,
];

// Extended Google IP ranges (all known Google datacenter ranges)
const GOOGLE_IP_RANGES = [
  // Primary Googlebot ranges
  { start: "66.249.64.0", end: "66.249.95.255" },
  { start: "66.249.0.0", end: "66.249.63.255" },
  // Google general
  { start: "64.233.160.0", end: "64.233.191.255" },
  { start: "64.233.0.0", end: "64.233.63.255" },
  { start: "64.68.80.0", end: "64.68.95.255" },
  // Google services
  { start: "72.14.192.0", end: "72.14.255.255" },
  { start: "74.125.0.0", end: "74.125.255.255" },
  // Google Cloud / modern infra
  { start: "142.250.0.0", end: "142.251.255.255" },
  { start: "142.250.0.0", end: "142.250.255.255" },
  { start: "172.217.0.0", end: "172.217.255.255" },
  { start: "172.253.0.0", end: "172.253.255.255" },
  { start: "173.194.0.0", end: "173.194.255.255" },
  // Google infrastructure
  { start: "209.85.128.0", end: "209.85.255.255" },
  { start: "216.58.192.0", end: "216.58.223.255" },
  { start: "216.239.32.0", end: "216.239.63.255" },
  // Google Cloud Platform
  { start: "34.64.0.0", end: "34.127.255.255" },
  { start: "34.128.0.0", end: "34.191.255.255" },
  { start: "35.184.0.0", end: "35.247.255.255" },
  { start: "35.192.0.0", end: "35.223.255.255" },
  // Additional GCP ranges
  { start: "104.196.0.0", end: "104.199.255.255" },
  { start: "104.154.0.0", end: "104.155.255.255" },
  { start: "130.211.0.0", end: "130.211.255.255" },
  { start: "146.148.0.0", end: "146.148.127.255" },
  // YouTube / Google Video
  { start: "199.223.232.0", end: "199.223.239.255" },
  { start: "207.223.160.0", end: "207.223.175.255" },
  // Modern Google ranges
  { start: "108.170.192.0", end: "108.170.255.255" },
  { start: "108.177.0.0", end: "108.177.127.255" },
  // Additional crawler IPs
  { start: "203.208.32.0", end: "203.208.63.255" },
  { start: "70.32.128.0", end: "70.32.143.255" },
];

// All Google ASNs (Autonomous System Numbers)
const GOOGLE_ASNS = [
  "AS15169",  // Google LLC
  "AS396982", // Google Cloud
  "AS36492",  // Google (alternate)
  "AS139070", // Google Asia Pacific
  "AS36040",  // YouTube
  "AS13949",  // Google Fiber
  "AS16591",  // Google Fiber 
  "AS395973", // Google Cloud Platform
  "AS36384",  // Google (alternate)
  "AS45566",  // Google Japan
  "AS16550",  // Google (cache servers)
  "AS26910",  // Google Cloud 2
  "AS41264",  // Google Switzerland
  "AS19527",  // Google
];

// ==================== MICROSOFT/BING ADS ====================
const MICROSOFT_BOT_UA_PATTERNS = [
  /bingbot/i, /msnbot/i, /BingPreview/i, /adidxbot/i,
  /Microsoft-Advertising/i, /MicrosoftPreview/i,
];

const MICROSOFT_IP_RANGES = [
  { start: "40.74.0.0", end: "40.125.255.255" },
  { start: "52.0.0.0", end: "52.255.255.255" },
  { start: "13.64.0.0", end: "13.107.255.255" },
  { start: "20.0.0.0", end: "20.255.255.255" },
  { start: "157.55.0.0", end: "157.56.255.255" },
  { start: "207.46.0.0", end: "207.46.255.255" },
];

const MICROSOFT_ASNS = ["AS8075", "AS3598", "AS8068"];

// ==================== FACEBOOK/META ====================
const FACEBOOK_BOT_UA_PATTERNS = [
  /facebookexternalhit/i, /Facebot/i, /facebookcatalog/i,
  /meta-external/i, /WhatsApp/i, /Instagram/i, /FBAV/i, /FBAN/i,
];

const FACEBOOK_IP_RANGES = [
  { start: "31.13.24.0", end: "31.13.127.255" },
  { start: "66.220.144.0", end: "66.220.159.255" },
  { start: "69.63.176.0", end: "69.171.255.255" },
  { start: "157.240.0.0", end: "157.240.255.255" },
  { start: "173.252.64.0", end: "173.252.127.255" },
  { start: "185.60.216.0", end: "185.60.223.255" },
];

const FACEBOOK_ASNS = ["AS32934", "AS63293"];

// ==================== TIKTOK/BYTEDANCE ====================
const TIKTOK_BOT_UA_PATTERNS = [
  /TikTok/i, /ByteDance/i, /Bytespider/i, /musical_ly/i, /Douyin/i,
];

const TIKTOK_IP_RANGES = [
  { start: "161.117.0.0", end: "161.117.255.255" },
  { start: "128.1.0.0", end: "128.1.255.255" },
  { start: "43.128.0.0", end: "43.175.255.255" },
];

const TIKTOK_ASNS = ["AS138699", "AS396986"];

// ==================== OTHER AD PLATFORMS ====================
const PINTEREST_BOT_UA_PATTERNS = [/Pinterest/i, /Pinterestbot/i];
const NATIVE_ADS_UA_PATTERNS = [/Taboola/i, /Outbrain/i, /Zemanta/i, /MGID/i];
const SNAPCHAT_BOT_UA_PATTERNS = [/Snapchat/i, /SnapBot/i];
const TWITTER_BOT_UA_PATTERNS = [/Twitterbot/i, /Twitter/i];
const LINKEDIN_BOT_UA_PATTERNS = [/LinkedInBot/i, /LinkedIn/i];

// ==================== DATACENTER/CLOUD IPs ====================
const DATACENTER_IP_RANGES = [
  // AWS
  { start: "3.0.0.0", end: "3.255.255.255" },
  { start: "52.0.0.0", end: "52.255.255.255" },
  { start: "54.0.0.0", end: "54.255.255.255" },
  { start: "18.0.0.0", end: "18.255.255.255" },
  // DigitalOcean
  { start: "159.89.0.0", end: "159.89.255.255" },
  { start: "167.99.0.0", end: "167.99.255.255" },
  { start: "206.189.0.0", end: "206.189.255.255" },
  // Vultr
  { start: "45.32.0.0", end: "45.77.255.255" },
  { start: "149.28.0.0", end: "149.28.255.255" },
  // Linode
  { start: "45.33.0.0", end: "45.79.255.255" },
  { start: "139.162.0.0", end: "139.162.255.255" },
  // Hetzner
  { start: "95.216.0.0", end: "95.217.255.255" },
  { start: "135.181.0.0", end: "135.181.255.255" },
  // OVH
  { start: "51.38.0.0", end: "51.91.255.255" },
  // Cloudflare Workers
  { start: "172.64.0.0", end: "172.71.255.255" },
  { start: "104.16.0.0", end: "104.31.255.255" },
];

// ==================== VPN/PROXY DETECTION ====================
const VPN_ASN_PATTERNS = [
  /express\s*vpn/i, /nord\s*vpn/i, /surfshark/i, /cyberghost/i,
  /private\s*internet\s*access/i, /mullvad/i, /proton\s*vpn/i,
  /ipvanish/i, /purevpn/i, /windscribe/i, /hide\.me/i,
];

const VPN_PROVIDER_IPS = [
  { start: "194.35.232.0", end: "194.35.239.255" },
  { start: "185.159.156.0", end: "185.159.159.255" },
  { start: "198.54.128.0", end: "198.54.135.255" },
];

const PROXY_ASNS = ["AS47846", "AS206264", "AS9009", "AS29073"];
const DATACENTER_ASNS = ["AS16509", "AS14618", "AS13335", "AS14061", "AS20473", "AS63949", "AS24940", "AS16276"];

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

function detectAdPlatform(userAgent: string, ip: string, headers: Headers, referer: string): AdPlatformResult {
  const reasons: string[] = [];
  let platform: string | null = null;
  let botType: string | null = null;
  let confidence = 0;
  let isDefinitive = false;

  // ===== REFERER CHECK (High Priority for Ad Traffic) =====
  const refererAnalysis = analyzeReferer(referer);
  if (refererAnalysis.isAdPlatformReferer) {
    platform = refererAnalysis.platform;
    confidence = 85;
    botType = `${refererAnalysis.platform} Ad Click`;
    reasons.push(...refererAnalysis.reasons);
  }

  // ===== GOOGLE DETECTION (COMPREHENSIVE) =====
  // 1. User Agent Detection
  for (const pattern of GOOGLE_BOT_UA_PATTERNS) {
    if (pattern.test(userAgent)) {
      platform = "google"; isDefinitive = true; confidence = 100;
      if (/adsbot/i.test(userAgent)) { botType = "AdsBot"; reasons.push("GOOGLE_ADSBOT_UA"); }
      else if (/mediapartners/i.test(userAgent)) { botType = "Mediapartners"; reasons.push("GOOGLE_MEDIAPARTNERS_UA"); }
      else if (/lighthouse|pagespeed|speed\s*insights|crux/i.test(userAgent)) { botType = "Lighthouse"; reasons.push("GOOGLE_LIGHTHOUSE_UA"); }
      else if (/googlebot/i.test(userAgent)) { botType = "Googlebot"; reasons.push("GOOGLE_GOOGLEBOT_UA"); }
      else if (/google-shopping|storebot|hotel/i.test(userAgent)) { botType = "Google Shopping"; reasons.push("GOOGLE_SHOPPING_UA"); }
      else if (/google-safety|security|phishing/i.test(userAgent)) { botType = "Google Safety"; reasons.push("GOOGLE_SAFETY_UA"); }
      else if (/google-ads|adwords|ad-quality/i.test(userAgent)) { botType = "Google Ads"; reasons.push("GOOGLE_ADS_UA"); }
      else { botType = "Google Bot"; reasons.push("GOOGLE_BOT_UA"); }
      break;
    }
  }
  
  // 2. IP Range Detection
  if (!platform && isGoogleIP(ip)) {
    platform = "google"; confidence = 95; botType = "Google IP"; reasons.push("GOOGLE_IP_RANGE"); isDefinitive = true;
  }
  
  // 3. Header-Based Google Detection
  if (!platform) {
    const xForwardedFor = headers.get("x-forwarded-for") || "";
    const via = headers.get("via") || "";
    const xGoogleCacheControl = headers.get("x-google-cache-control");
    const googleApis = headers.get("x-google-apis-url");
    const xCloud = headers.get("x-cloud-trace-context");
    const xGoogRequest = headers.get("x-goog-request-params");
    
    // Google-specific headers
    if (xGoogleCacheControl || googleApis || xGoogRequest) {
      platform = "google"; confidence = 90; botType = "Google Header"; 
      reasons.push("GOOGLE_SPECIFIC_HEADER"); isDefinitive = true;
    }
    
    // Via header with Google
    if (/google/i.test(via)) {
      platform = "google"; confidence = 88; botType = "Google Via"; reasons.push("GOOGLE_VIA_HEADER");
    }
    
    // GCP trace context (internal Google traffic)
    if (xCloud && /projects\/google/i.test(xCloud)) {
      platform = "google"; confidence = 92; botType = "Google Cloud"; 
      reasons.push("GOOGLE_CLOUD_TRACE"); isDefinitive = true;
    }
  }
  
  // 4. URL Parameters Detection (gclid = Google Click ID)
  if (!platform) {
    const gclidHeader = headers.get("x-original-url") || headers.get("x-forwarded-url") || "";
    if (/[?&]gclid=/i.test(gclidHeader) || /[?&]gbraid=/i.test(gclidHeader) || /[?&]wbraid=/i.test(gclidHeader)) {
      // This is likely Google Ads traffic destination, not the bot itself
      // Don't block, but note it
      reasons.push("GOOGLE_ADS_CLICK_ID_URL");
    }
  }

  // ===== MICROSOFT/BING =====
  if (!platform) {
    for (const pattern of MICROSOFT_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        platform = "microsoft"; isDefinitive = true; confidence = 100;
        if (/bingbot|msnbot/i.test(userAgent)) { botType = "Bingbot"; reasons.push("BING_BOT_UA"); }
        else if (/adidxbot/i.test(userAgent)) { botType = "Bing Ads"; reasons.push("BING_ADS_UA"); }
        else if (/bingpreview/i.test(userAgent)) { botType = "Bing Preview"; reasons.push("BING_PREVIEW_UA"); }
        else { botType = "Microsoft Bot"; reasons.push("MICROSOFT_BOT_UA"); }
        break;
      }
    }
    if (!platform && isMicrosoftIP(ip)) {
      platform = "microsoft"; confidence = 90; botType = "Microsoft IP"; reasons.push("MICROSOFT_IP_RANGE");
    }
  }

  // ===== FACEBOOK/META =====
  if (!platform) {
    for (const pattern of FACEBOOK_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        platform = "facebook"; isDefinitive = true; confidence = 100;
        if (/facebookexternalhit|facebot/i.test(userAgent)) { botType = "Facebook Crawler"; reasons.push("FACEBOOK_CRAWLER_UA"); }
        else if (/whatsapp/i.test(userAgent)) { botType = "WhatsApp"; reasons.push("WHATSAPP_UA"); }
        else if (/instagram/i.test(userAgent)) { botType = "Instagram"; reasons.push("INSTAGRAM_UA"); }
        else { botType = "Meta Bot"; reasons.push("META_BOT_UA"); }
        break;
      }
    }
    if (!platform && isFacebookIP(ip)) {
      platform = "facebook"; confidence = 95; botType = "Meta IP"; reasons.push("FACEBOOK_IP_RANGE"); isDefinitive = true;
    }
  }

  // ===== TIKTOK =====
  if (!platform) {
    for (const pattern of TIKTOK_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        platform = "tiktok"; isDefinitive = true; confidence = 100;
        botType = "TikTok Bot"; reasons.push("TIKTOK_BOT_UA"); break;
      }
    }
    if (!platform && isTikTokIP(ip)) {
      platform = "tiktok"; confidence = 90; botType = "TikTok IP"; reasons.push("TIKTOK_IP_RANGE");
    }
  }

  // ===== OTHER PLATFORMS =====
  if (!platform) {
    for (const pattern of PINTEREST_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) { platform = "pinterest"; isDefinitive = true; confidence = 100; botType = "Pinterest Bot"; reasons.push("PINTEREST_UA"); break; }
    }
  }
  if (!platform) {
    for (const pattern of NATIVE_ADS_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        platform = "native_ads"; isDefinitive = true; confidence = 100;
        if (/taboola/i.test(userAgent)) { botType = "Taboola"; reasons.push("TABOOLA_UA"); }
        else if (/outbrain/i.test(userAgent)) { botType = "Outbrain"; reasons.push("OUTBRAIN_UA"); }
        else { botType = "Native Ads"; reasons.push("NATIVE_ADS_UA"); }
        break;
      }
    }
  }
  if (!platform) {
    for (const pattern of SNAPCHAT_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) { platform = "snapchat"; isDefinitive = true; confidence = 100; botType = "Snapchat Bot"; reasons.push("SNAPCHAT_UA"); break; }
    }
  }
  if (!platform) {
    for (const pattern of TWITTER_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) { platform = "twitter"; isDefinitive = true; confidence = 100; botType = "Twitter Bot"; reasons.push("TWITTER_UA"); break; }
    }
  }
  if (!platform) {
    for (const pattern of LINKEDIN_BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) { platform = "linkedin"; isDefinitive = true; confidence = 100; botType = "LinkedIn Bot"; reasons.push("LINKEDIN_UA"); break; }
    }
  }

  // ===== ASN/ISP CHECKS =====
  const cfAsn = headers.get("cf-asn") || headers.get("x-asn") || "";
  const cfIsp = headers.get("cf-isp") || headers.get("x-isp") || "";
  
  if (!platform && cfAsn) {
    if (GOOGLE_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) { 
      platform = "google"; confidence = 94; botType = "Google ASN"; 
      reasons.push("GOOGLE_ASN"); isDefinitive = true; 
    }
    else if (MICROSOFT_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) { platform = "microsoft"; confidence = 88; botType = "Microsoft ASN"; reasons.push("MICROSOFT_ASN"); }
    else if (FACEBOOK_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) { platform = "facebook"; confidence = 92; botType = "Facebook ASN"; reasons.push("FACEBOOK_ASN"); }
    else if (TIKTOK_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) { platform = "tiktok"; confidence = 88; botType = "TikTok ASN"; reasons.push("TIKTOK_ASN"); }
  }

  // ISP name checks
  if (!platform && /google/i.test(cfIsp)) { 
    platform = "google"; confidence = 92; botType = "Google ISP"; 
    reasons.push("GOOGLE_ISP"); isDefinitive = true; 
  }
  else if (!platform && /microsoft|bing/i.test(cfIsp)) { platform = "microsoft"; confidence = 85; botType = "Microsoft ISP"; reasons.push("MICROSOFT_ISP"); }
  else if (!platform && /facebook|meta/i.test(cfIsp)) { platform = "facebook"; confidence = 90; botType = "Facebook ISP"; reasons.push("FACEBOOK_ISP"); }

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
  isSpyTool: boolean;
  threatLevel: "none" | "low" | "medium" | "high" | "critical";
}

function detectBot(userAgent: string, ip: string, headers: Headers, referer: string): BotDetectionResult {
  const reasons: string[] = [];
  let confidence = 0;
  let botType: string | null = null;
  const ua = userAgent.toLowerCase();
  
  // ===== SPY TOOLS (High Priority) =====
  if (isSpyToolUA(userAgent)) {
    return { isBot: true, botType: "Spy Tool", confidence: 100, reasons: ["SPY_TOOL_UA"], isAdPlatform: false, isSpyTool: true, threatLevel: "critical" };
  }
  if (isSpyToolIP(ip)) {
    return { isBot: true, botType: "Spy Tool", confidence: 95, reasons: ["SPY_TOOL_IP"], isAdPlatform: false, isSpyTool: true, threatLevel: "critical" };
  }
  if (isSpyToolReferer(referer)) {
    return { isBot: true, botType: "Spy Tool", confidence: 98, reasons: ["SPY_TOOL_REFERER"], isAdPlatform: false, isSpyTool: true, threatLevel: "critical" };
  }

  // ===== AD PLATFORM CHECK =====
  const adResult = detectAdPlatform(userAgent, ip, headers, referer);
  if (adResult.detected && adResult.isDefinitive) {
    return {
      isBot: true, botType: adResult.botType, confidence: adResult.confidence,
      reasons: adResult.reasons, platform: adResult.platform || undefined,
      isAdPlatform: true, isSpyTool: false, threatLevel: "none",
    };
  }

  // ===== SEO TOOLS =====
  if (/semrush|ahrefsbot|mj12bot|dotbot|petalbot|rogerbot|seokicks|sistrix|dataforseo|serpstat|spyfu/i.test(userAgent)) {
    return { isBot: true, botType: "SEO Tool", confidence: 95, reasons: ["SEO_TOOL_BOT"], isAdPlatform: false, isSpyTool: false, threatLevel: "low" };
  }

  // ===== AI CRAWLERS =====
  if (/gptbot|chatgpt|claude|anthropic|perplexity|cohere|ccbot|diffbot|openai/i.test(userAgent)) {
    return { isBot: true, botType: "AI Crawler", confidence: 95, reasons: ["AI_CRAWLER"], isAdPlatform: false, isSpyTool: false, threatLevel: "low" };
  }

  // ===== AUTOMATION FRAMEWORKS =====
  if (/headless|phantomjs|selenium|puppeteer|playwright|cypress|webdriver|nightmare|casperjs/i.test(userAgent)) {
    return { isBot: true, botType: "Automation", confidence: 100, reasons: ["AUTOMATION_FRAMEWORK"], isAdPlatform: false, isSpyTool: false, threatLevel: "critical" };
  }

  // ===== HTTP CLIENTS =====
  if (/curl|wget|python|java\/|axios|node-fetch|go-http|libwww|scrapy|httpx|okhttp|guzzle|urllib|aiohttp/i.test(userAgent)) {
    return { isBot: true, botType: "HTTP Client", confidence: 90, reasons: ["HTTP_CLIENT"], isAdPlatform: false, isSpyTool: false, threatLevel: "high" };
  }

  // ===== SEARCH ENGINES =====
  if (/yandexbot|baiduspider|duckduckbot|sogou|exabot|ia_archiver/i.test(userAgent)) {
    return { isBot: true, botType: "Search Engine", confidence: 95, reasons: ["SEARCH_ENGINE_BOT"], isAdPlatform: false, isSpyTool: false, threatLevel: "low" };
  }

  // ===== DATACENTER/VPN =====
  if (isDatacenterIP(ip)) { confidence += 45; reasons.push("DATACENTER_IP"); }
  if (isVpnProviderIP(ip)) { confidence += 50; reasons.push("VPN_PROVIDER_IP"); }
  
  const cfAsn = headers.get("cf-asn") || headers.get("x-asn") || "";
  const cfIsp = headers.get("cf-isp") || headers.get("x-isp") || "";
  
  for (const pattern of VPN_ASN_PATTERNS) {
    if (pattern.test(cfIsp) || pattern.test(cfAsn)) { confidence += 45; reasons.push("VPN_ASN_MATCH"); break; }
  }
  if (PROXY_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) { confidence += 50; reasons.push("PROXY_ASN"); }
  if (DATACENTER_ASNS.some(asn => cfAsn.toUpperCase().includes(asn))) { confidence += 35; reasons.push("DATACENTER_ASN"); }

  // ===== HEADER ANALYSIS =====
  const acceptLang = headers.get("accept-language") || "";
  const accept = headers.get("accept") || "";
  const secFetchDest = headers.get("sec-fetch-dest");
  
  if (!acceptLang || acceptLang === "*") { confidence += 18; reasons.push("NO_ACCEPT_LANGUAGE"); }
  if (accept === "*/*" || !accept.includes("text/html")) { confidence += 12; reasons.push("MINIMAL_ACCEPT"); }
  if (!secFetchDest && !/safari/i.test(ua)) { confidence += 15; reasons.push("NO_SEC_FETCH"); }

  // ===== UA ANOMALIES =====
  if (userAgent.length < 50) { confidence += 28; reasons.push("SHORT_UA"); }
  if (/https?:\/\//i.test(userAgent)) { confidence += 22; reasons.push("URL_IN_UA"); }
  if (/bot(?!tle)/i.test(ua) && !/about|cubot/i.test(ua)) { confidence += 45; reasons.push("CONTAINS_BOT"); if (!botType) botType = "Generic Bot"; }
  if (/crawler|spider|scraper|fetch|monitor/i.test(ua)) { confidence += 40; reasons.push("CRAWLER_PATTERN"); if (!botType) botType = "Crawler"; }
  if (!userAgent || userAgent.length < 10) { confidence += 60; reasons.push("EMPTY_UA"); if (!botType) botType = "Empty UA"; }

  let threatLevel: "none" | "low" | "medium" | "high" | "critical" = "none";
  if (confidence >= 80) threatLevel = "critical";
  else if (confidence >= 60) threatLevel = "high";
  else if (confidence >= 40) threatLevel = "medium";
  else if (confidence >= 20) threatLevel = "low";

  return { isBot: botType !== null || confidence >= 55, botType, confidence: Math.min(100, confidence), reasons, isAdPlatform: false, isSpyTool: false, threatLevel };
}

// ==================== UTILITY FUNCTIONS ====================
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

// ==================== ZERO-REDIRECT CLOAKING (ZRC) ====================
async function fetchAndProxy(targetUrl: string, request: Request): Promise<Response> {
  try {
    const targetHeaders = new Headers();
    // Forward relevant headers
    const forwardHeaders = ["accept", "accept-language", "accept-encoding", "user-agent"];
    for (const header of forwardHeaders) {
      const value = request.headers.get(header);
      if (value) targetHeaders.set(header, value);
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: targetHeaders,
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") || "text/html";
    let body = await response.text();

    // Rewrite relative URLs to absolute
    const targetUrlObj = new URL(targetUrl);
    const baseUrl = `${targetUrlObj.protocol}//${targetUrlObj.host}`;
    
    // Rewrite src and href attributes
    body = body.replace(/(src|href)=["']\/(?!\/)/gi, `$1="${baseUrl}/`);
    body = body.replace(/(src|href)=["'](?!https?:\/\/|\/\/|data:|javascript:|#)/gi, `$1="${baseUrl}/`);
    
    // Rewrite CSS url()
    body = body.replace(/url\(\s*['"]?\/(?!\/)/gi, `url("${baseUrl}/`);

    // Add base tag if not present
    if (!/<base\s/i.test(body)) {
      body = body.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}/">`);
    }

    const responseHeaders = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
    });

    // Copy some headers from origin
    const copyHeaders = ["content-language"];
    for (const header of copyHeaders) {
      const value = response.headers.get(header);
      if (value) responseHeaders.set(header, value);
    }

    return new Response(body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[Cloaker] ZRC Proxy error:", error);
    // Fallback to redirect
    return Response.redirect(targetUrl, 302);
  }
}

// ==================== CHALLENGE PAGE ====================
function generateChallengePage(slug: string, delayMs: number, functionUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
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
    <h1>Verificando seguranca</h1>
    <p>Por favor, aguarde...</p>
    <div class="progress"><div class="progress-bar"></div></div>
  </div>
  <script>
    (function(){
      var startTime = Date.now();
      var postUrl = "${functionUrl}/${slug}";
      var data = {
        slug: "${slug}",
        fingerprint: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          languages: navigator.languages ? navigator.languages.join(',') : '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timezoneOffset: new Date().getTimezoneOffset(),
          screenResolution: screen.width + 'x' + screen.height,
          colorDepth: screen.colorDepth,
          pixelRatio: window.devicePixelRatio || 1,
          deviceMemory: navigator.deviceMemory || null,
          hardwareConcurrency: navigator.hardwareConcurrency || null,
          platform: navigator.platform,
          maxTouchPoints: navigator.maxTouchPoints || 0,
          touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
          cookieEnabled: navigator.cookieEnabled,
          webglVendor: null,
          webglRenderer: null,
          canvasHash: null,
          pluginsCount: navigator.plugins ? navigator.plugins.length : 0,
          isHeadless: false,
          isAutomated: false,
          hasWebdriver: !!navigator.webdriver,
          hasPhantom: !!window._phantom || !!window.phantom,
          hasSelenium: !!window.__selenium_evaluate || !!document.__selenium_unwrapped,
          hasPuppeteer: !!window.__puppeteer_evaluation_script__,
          mouseMovements: 0, scrollEvents: 0, keypressEvents: 0, touchEvents: 0, focusChanges: 0, timeOnPage: 0
        }
      };
      try {
        var c = document.createElement('canvas');
        var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
        if (gl) {
          var d = gl.getExtension('WEBGL_debug_renderer_info');
          if (d) { data.fingerprint.webglVendor = gl.getParameter(d.UNMASKED_VENDOR_WEBGL); data.fingerprint.webglRenderer = gl.getParameter(d.UNMASKED_RENDERER_WEBGL); }
        }
      } catch(e) {}
      try {
        var c2 = document.createElement('canvas'); c2.width = 200; c2.height = 50;
        var ctx = c2.getContext('2d');
        ctx.textBaseline = 'top'; ctx.font = '14px Arial'; ctx.fillStyle = '#f60'; ctx.fillRect(0, 0, 100, 25);
        ctx.fillStyle = '#069'; ctx.fillText('Cwm fjord', 2, 15);
        data.fingerprint.canvasHash = c2.toDataURL().slice(-50);
      } catch(e) {}
      try {
        data.fingerprint.isHeadless = /HeadlessChrome/.test(navigator.userAgent) || navigator.webdriver === true || !window.chrome || window.outerWidth === 0 || window.outerHeight === 0;
        data.fingerprint.isAutomated = navigator.webdriver || !!window.callPhantom || !!window._phantom || !!window.__nightmare || !!document.__selenium_unwrapped;
      } catch(e) {}
      var events = { mouse: 0, scroll: 0, key: 0, touch: 0, focus: 0 };
      document.addEventListener('mousemove', function() { events.mouse++; }, { passive: true });
      document.addEventListener('scroll', function() { events.scroll++; }, { passive: true });
      document.addEventListener('keypress', function() { events.key++; }, { passive: true });
      document.addEventListener('touchstart', function() { events.touch++; }, { passive: true });
      window.addEventListener('focus', function() { events.focus++; });
      window.addEventListener('blur', function() { events.focus++; });
      setTimeout(function() {
        data.fingerprint.mouseMovements = events.mouse;
        data.fingerprint.scrollEvents = events.scroll;
        data.fingerprint.keypressEvents = events.key;
        data.fingerprint.touchEvents = events.touch;
        data.fingerprint.focusChanges = events.focus;
        data.fingerprint.timeOnPage = Date.now() - startTime;
        console.log('[Cloaker] Sending fingerprint to:', postUrl);
        fetch(postUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function(r) { 
          console.log('[Cloaker] Response status:', r.status);
          return r.json(); 
        })
        .then(function(result) { 
          console.log('[Cloaker] Result:', result);
          if (result.redirectUrl) { 
            if (result.delayMs && result.delayMs > 0) {
              setTimeout(function() { window.location.href = result.redirectUrl; }, result.delayMs);
            } else {
              window.location.href = result.redirectUrl; 
            }
          } else {
            console.error('[Cloaker] No redirectUrl in response');
          }
        })
        .catch(function(err) { 
          console.error('[Cloaker] Fetch error:', err);
          window.location.reload(); 
        });
      }, ${Math.max(delayMs, 1500)});
    })();
  </script>
</body>
</html>`;
}

// ==================== DELAYED REDIRECT ====================
async function createDelayedRedirect(url: string, delayMs: number): Promise<Response> {
  if (delayMs <= 0) return Response.redirect(url, 302);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="${Math.ceil(delayMs / 1000)};url=${url}"><title>Redirecting...</title><style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f9f9f9}.loader{width:48px;height:48px;border:5px solid #e0e0e0;border-bottom-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="loader"></div><script>setTimeout(function(){window.location.href="${url}"},${delayMs})</script></body></html>`;
  return new Response(html, { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate" } });
}

// ==================== FINGERPRINT SCORING ====================
function calculateFingerprintScore(fingerprint: any, botResult: BotDetectionResult): { score: number; flags: string[]; riskLevel: string } {
  let score = 100;
  const flags: string[] = [];

  if (fingerprint.hasWebdriver) { score = 0; flags.push("WEBDRIVER"); }
  if (fingerprint.hasPuppeteer) { score = 0; flags.push("PUPPETEER"); }
  if (fingerprint.hasSelenium) { score = 0; flags.push("SELENIUM"); }
  if (fingerprint.hasPhantom) { score = 0; flags.push("PHANTOM"); }
  if (fingerprint.isHeadless && fingerprint.isAutomated) { score = 0; flags.push("HEADLESS_AUTOMATED"); }
  
  if (fingerprint.isHeadless) { score -= 35; flags.push("headless"); }
  if (fingerprint.isAutomated) { score -= 35; flags.push("automated"); }
  if (/swiftshader|llvmpipe|mesa|software/i.test(fingerprint.webglRenderer || "")) { score -= 30; flags.push("software_renderer"); }
  if (fingerprint.screenResolution === "800x600" || fingerprint.screenResolution === "1024x768") { score -= 25; flags.push("headless_resolution"); }
  
  if (fingerprint.mouseMovements === 0 && !fingerprint.touchSupport) { score -= 20; flags.push("no_mouse"); }
  if (fingerprint.timeOnPage < 500) { score -= 22; flags.push("fast_access"); }
  if (fingerprint.timeOnPage < 1000 && fingerprint.mouseMovements < 5) { score -= 15; flags.push("bot_behavior"); }
  if (!fingerprint.webglVendor && !fingerprint.webglRenderer) { score -= 15; flags.push("no_webgl"); }
  if (fingerprint.pluginsCount === 0 && !/mobile|android|iphone/i.test(fingerprint.userAgent || "")) { score -= 12; flags.push("no_plugins"); }
  
  if (!fingerprint.cookieEnabled) { score -= 10; flags.push("no_cookies"); }
  if (fingerprint.colorDepth < 24) { score -= 8; flags.push("low_color_depth"); }
  
  if (fingerprint.mouseMovements > 20) { score += 10; }
  if (fingerprint.scrollEvents > 3) { score += 8; }
  if (fingerprint.touchEvents > 0 && fingerprint.touchSupport) { score += 10; }
  if (fingerprint.timeOnPage > 5000) { score += 8; }

  if (botResult.isBot && !botResult.isAdPlatform) { score -= botResult.confidence / 2; flags.push(...botResult.reasons); }

  score = Math.max(0, Math.min(100, score));
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
  
  // Sync ML data in background (non-blocking)
  queueMicrotask(() => syncMLData(supabase));

  // === GET: Fast redirect, ZRC, or challenge page ===
  if (req.method === "GET") {
    const url = new URL(req.url);
    // Support both path-based (/cloaker-redirect/slug) and query-based (?s=slug)
    const pathParts = url.pathname.split("/").filter(Boolean);
    const slugFromPath = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;
    const slug = slugFromPath || url.searchParams.get("s") || url.searchParams.get("slug");
    const zrcMode = url.searchParams.get("zrc") === "1";
    
    if (!slug) return new Response("Missing slug. Use: /cloaker-redirect/{slug} or ?s={slug}", { status: 400 });
    
    const userAgent = req.headers.get("user-agent") || "";
    const cfIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const cfCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || "";
    const cfIsp = req.headers.get("cf-isp") || req.headers.get("x-isp") || "";
    const cfAsn = req.headers.get("cf-asn") || req.headers.get("x-asn") || "";
    const referer = req.headers.get("referer") || "";
    const cookieHeader = req.headers.get("cookie");
    const existingSessionId = parseSessionCookie(cookieHeader);
    
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
    
    // === CHECK APPROVED SESSION COOKIE ===
    if (existingSessionId && isSessionApproved(existingSessionId, cfIp)) {
      let targetUrl = selectTargetUrl(link);
      if (link.passthrough_utm) targetUrl = applyUtmPassthrough(targetUrl, req);
      console.log(`[Cloaker] ALLOW (session cookie) ${existingSessionId.substring(0,8)}...`);
      
      if (zrcMode) return await fetchAndProxy(targetUrl, req);
      return Response.redirect(targetUrl, 302);
    }
    
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
    
    const deviceType = getDeviceType(userAgent);
    if (link.allowed_devices?.length > 0 && !link.allowed_devices.includes(deviceType)) {
      console.log(`[Cloaker] BLOCKED: device_filtered ${deviceType}`);
      return Response.redirect(link.safe_url, 302);
    }
    
    if (checkIspBlock(cfIsp, link)) {
      console.log(`[Cloaker] BLOCKED: isp_blocked ${cfIsp}`);
      return Response.redirect(link.safe_url, 302);
    }
    if (checkAsnBlock(cfAsn, link)) {
      console.log(`[Cloaker] BLOCKED: asn_blocked ${cfAsn}`);
      return Response.redirect(link.safe_url, 302);
    }
    
    // === REFERER ANALYSIS ===
    const refererAnalysis = analyzeReferer(referer);
    
    // === BOT DETECTION ===
    const botResult = detectBot(userAgent, cfIp, req.headers, referer);
    
    // Block bots and spy tools
    const shouldBlock = link.block_bots && (
      botResult.isBot ||
      botResult.isSpyTool ||
      (link.block_vpn && (isDatacenterIP(cfIp) || isVpnProviderIP(cfIp))) ||
      (link.block_datacenter && isDatacenterIP(cfIp)) ||
      (link.block_proxy && botResult.reasons.includes("PROXY_ASN")) ||
      (link.block_tor && botResult.reasons.includes("TOR_EXIT_SUSPECTED"))
    );
    
    if (shouldBlock) {
      const processingTime = Date.now() - startTime;
      console.log(`[Cloaker] BLOCKED: ${botResult.botType || "bot"} platform=${botResult.platform || "unknown"} spy=${botResult.isSpyTool} ref=${refererAnalysis.platform || "none"} conf=${botResult.confidence}% threat=${botResult.threatLevel} (${processingTime}ms)`);
      
      queueMicrotask(() => {
        supabase.from("cloaker_visitors").insert({
          link_id: link.id, fingerprint_hash: "fast-block", score: 0, decision: "block",
          user_agent: userAgent.substring(0, 500), ip_address: cfIp, country_code: cfCountry,
          isp: cfIsp, asn: cfAsn, is_bot: true, referer, ...utmParams, processing_time_ms: processingTime,
        }).then(() => {});
        supabase.from("cloaked_links").update({ clicks_count: (link.clicks_count || 0) + 1, clicks_today: (link.clicks_today || 0) + 1 }).eq("id", link.id).then(() => {});
      });
      
      // For ZRC mode, serve safe page content
      if (zrcMode) return await fetchAndProxy(link.safe_url, req);
      return Response.redirect(link.safe_url, 302);
    }
    
    // === FINGERPRINT COLLECTION MODE ===
    if (link.collect_fingerprint && link.require_behavior) {
      const behaviorTime = link.behavior_time_ms || 2000;
      const functionUrl = `https://eyevvanvdvcxdqyxzwfr.supabase.co/functions/v1/cloaker-redirect`;
      console.log(`[Cloaker] CHALLENGE: Serving JS challenge page for ${slug}`);
      return new Response(generateChallengePage(slug, behaviorTime, functionUrl), {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
    }
    
    // === ALLOW ===
    let targetUrl = selectTargetUrl(link);
    if (link.passthrough_utm) targetUrl = applyUtmPassthrough(targetUrl, req);
    
    const processingTime = Date.now() - startTime;
    console.log(`[Cloaker] ALLOW device=${deviceType} country=${cfCountry} referer_platform=${refererAnalysis.platform || "none"} (${processingTime}ms)`);
    
    // Generate session cookie
    const newSessionId = generateSessionId();
    approveSession(newSessionId, cfIp, "get-allow", 100);
    trackSession(cfIp, "get-allow", 100);
    
    queueMicrotask(() => {
      supabase.from("cloaker_visitors").insert({
        link_id: link.id, fingerprint_hash: "get-allow", score: 100, decision: "allow",
        user_agent: userAgent.substring(0, 500), ip_address: cfIp, country_code: cfCountry,
        isp: cfIsp, asn: cfAsn, platform: deviceType, is_bot: false, referer, redirect_url: targetUrl,
        ...utmParams, processing_time_ms: processingTime,
      }).then(() => {});
      supabase.from("cloaked_links").update({ clicks_count: (link.clicks_count || 0) + 1, clicks_today: (link.clicks_today || 0) + 1 }).eq("id", link.id).then(() => {});
    });
    
    const delayMs = link.redirect_delay_ms || 0;
    
    // ZRC Mode: Proxy content instead of redirect
    if (zrcMode) {
      const response = await fetchAndProxy(targetUrl, req);
      response.headers.set("Set-Cookie", `${SESSION_COOKIE_NAME}=${newSessionId}; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax`);
      return response;
    }
    
    // Regular redirect with session cookie
    if (delayMs > 0) {
      const response = await createDelayedRedirect(targetUrl, delayMs);
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Set-Cookie", `${SESSION_COOKIE_NAME}=${newSessionId}; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax`);
      return new Response(response.body, { status: response.status, headers: newHeaders });
    }
    
    return new Response(null, {
      status: 302,
      headers: {
        "Location": targetUrl,
        "Set-Cookie": `${SESSION_COOKIE_NAME}=${newSessionId}; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax`,
      },
    });
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
    
    const botResult = detectBot(ua, cfIp, req.headers, referer);
    
    // Block high-confidence bots and spy tools
    if (link.block_bots && ((botResult.isBot && botResult.confidence >= 85 && !botResult.isAdPlatform) || botResult.isSpyTool)) {
      console.log(`[Cloaker] POST BLOCKED: ${botResult.botType} spy=${botResult.isSpyTool} conf=${botResult.confidence}%`);
      return new Response(JSON.stringify({ redirectUrl: link.safe_url, decision: `blocked_${botResult.botType?.toLowerCase().replace(/\s+/g, "_") || "bot"}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
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

    const fingerprintHash = generateFingerprintHash(fingerprint);
    const deviceType = getDeviceType(fingerprint.userAgent || ua);
    
    // Get ML thresholds for this link (adaptive min_score)
    const mlThresholds = getMLThresholds(link.id, link.min_score || 35);
    const minScore = mlThresholds.minScoreAdjusted;
    
    // Extract patterns for ML learning
    const patterns = extractPatterns(fingerprint, cfIp, cfAsn, fingerprint.userAgent || ua);
    
    const reputation = getFingerprintReputation(fingerprintHash);
    const { score: baseScore, flags, riskLevel } = calculateFingerprintScore(fingerprint, botResult);
    const sessionInfo = trackSession(cfIp, fingerprintHash, baseScore);
    
    // Apply ML adaptive scoring
    const { score: adaptiveScore, adjustments, mlApplied } = calculateAdaptiveScore(
      baseScore,
      fingerprint,
      patterns,
      mlThresholds,
      botResult
    );
    
    let finalScore = adaptiveScore;
    
    // Apply reputation adjustments
    if (reputation.trustLevel === "trusted") finalScore = Math.min(100, finalScore + 15);
    else if (reputation.trustLevel === "suspicious") finalScore -= 10;
    else if (reputation.trustLevel === "blocked") finalScore -= 30;
    if (sessionInfo.isSuspicious) { finalScore -= 20; flags.push("fingerprint_spoofing"); }
    
    finalScore = Math.max(0, Math.min(100, finalScore));
    
    let decision: "allow" | "block";
    let targetUrl: string;

    if (link.allowed_devices?.length > 0 && !link.allowed_devices.includes(deviceType)) { decision = "block"; targetUrl = link.safe_url; }
    else if (link.allowed_countries?.length > 0 && cfCountry && !link.allowed_countries.includes(cfCountry)) { decision = "block"; targetUrl = link.safe_url; }
    else if (link.blocked_countries?.length > 0 && cfCountry && link.blocked_countries.includes(cfCountry)) { decision = "block"; targetUrl = link.safe_url; }
    else if (checkIspBlock(cfIsp, link)) { decision = "block"; targetUrl = link.safe_url; }
    else if (checkAsnBlock(cfAsn, link)) { decision = "block"; targetUrl = link.safe_url; }
    else if (flags.some(f => ["WEBDRIVER", "PUPPETEER", "SELENIUM", "PHANTOM", "HEADLESS_AUTOMATED"].includes(f))) { decision = "block"; targetUrl = link.safe_url; }
    else if (finalScore >= minScore) {
      decision = "allow";
      targetUrl = selectTargetUrl(link);
      if (link.passthrough_utm) targetUrl = applyUtmPassthrough(targetUrl, req);
    } else { decision = "block"; targetUrl = link.safe_url; }

    updateFingerprintReputation(fingerprintHash, decision, finalScore);
    
    // Approve session if allowed
    let sessionCookie = "";
    if (decision === "allow") {
      const newSessionId = generateSessionId();
      approveSession(newSessionId, cfIp, fingerprintHash, finalScore);
      sessionCookie = `${SESSION_COOKIE_NAME}=${newSessionId}; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax`;
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Cloaker] POST Decision=${decision} Score=${finalScore}/${minScore} Base=${baseScore} ML=${mlApplied} Risk=${riskLevel} Trust=${reputation.trustLevel} (${processingTime}ms)`);

    // Background: Log visitor and learn from decision
    queueMicrotask(async () => {
      try {
        // Insert visitor log
        const { data: visitorData } = await supabase.from("cloaker_visitors").insert({
          link_id: link.id, fingerprint_hash: fingerprintHash, score: finalScore, decision,
          user_agent: (fingerprint.userAgent || ua).substring(0, 500), language: fingerprint.language, timezone: fingerprint.timezone,
          screen_resolution: fingerprint.screenResolution, color_depth: fingerprint.colorDepth, device_memory: fingerprint.deviceMemory,
          hardware_concurrency: fingerprint.hardwareConcurrency, platform: fingerprint.platform, webgl_vendor: fingerprint.webglVendor,
          webgl_renderer: fingerprint.webglRenderer, canvas_hash: fingerprint.canvasHash, plugins_count: fingerprint.pluginsCount,
          touch_support: fingerprint.touchSupport, mouse_movements: fingerprint.mouseMovements, scroll_events: fingerprint.scrollEvents,
          keypress_events: fingerprint.keypressEvents, time_on_page: fingerprint.timeOnPage, focus_changes: fingerprint.focusChanges,
          is_bot: botResult.isBot, is_headless: fingerprint.isHeadless, is_automated: fingerprint.isAutomated,
          has_webdriver: fingerprint.hasWebdriver, has_phantom: fingerprint.hasPhantom, has_selenium: fingerprint.hasSelenium,
          has_puppeteer: fingerprint.hasPuppeteer, ip_address: cfIp, country_code: cfCountry, city: cfCity, isp: cfIsp, asn: cfAsn,
          referer, redirect_url: targetUrl, ...utmParams, processing_time_ms: processingTime,
        }).select("id").maybeSingle();
        
        // Update click counts
        await supabase.from("cloaked_links").update({ 
          clicks_count: (link.clicks_count || 0) + 1, 
          clicks_today: (link.clicks_today || 0) + 1 
        }).eq("id", link.id);
        
        // ML Learning: Update patterns and thresholds based on this decision
        await learnFromDecision(
          supabase,
          link.id,
          decision,
          patterns,
          finalScore,
          fingerprint,
          visitorData?.id
        );
        
      } catch (e) { console.error("[Cloaker] Log/ML error:", e); }
    });

    const responseHeaders: Record<string, string> = { ...corsHeaders, "Content-Type": "application/json" };
    if (sessionCookie) responseHeaders["Set-Cookie"] = sessionCookie;

    return new Response(JSON.stringify({ 
      redirectUrl: targetUrl, 
      decision, 
      score: finalScore, 
      minScore, 
      riskLevel,
      confidence: botResult.confidence, 
      delayMs: decision === "allow" ? (link.redirect_delay_ms || 0) : 0,
      mlApplied,
      adjustments: mlApplied ? adjustments : undefined,
    }), { headers: responseHeaders });

  } catch (error) {
    console.error("[Cloaker] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
