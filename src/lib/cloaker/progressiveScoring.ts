/**
 * Progressive Scoring System for Cloaker
 * Combines all analyzers and applies decision bands:
 * - 0-30: BLOCK (redirect to safe page)
 * - 31-60: CHALLENGE (neutral page with delay)
 * - 61-100: ALLOW (redirect to target page)
 */

import { type UserAgentAnalysis } from './userAgentAnalyzer';
import { type HeadersAnalysis } from './headersAnalyzer';
import { type BehaviorAnalysis } from './behaviorAnalyzer';
import { type FingerprintAnalysis } from './fingerprintAnalyzer';

// ================ TYPES ================

export type Decision = 'allow' | 'challenge' | 'block';

export interface ScoringInput {
  uaAnalysis: UserAgentAnalysis;
  headersAnalysis: HeadersAnalysis;
  behaviorAnalysis: BehaviorAnalysis;
  fingerprintAnalysis: FingerprintAnalysis;
  
  // Link configuration
  minScore?: number;
  blockBots?: boolean;
  requireBehavior?: boolean;
  behaviorTimeMs?: number;
}

export interface ScoringResult {
  // Final decision
  decision: Decision;
  
  // Overall score (0-100)
  finalScore: number;
  
  // Individual layer scores
  scores: {
    userAgent: number;
    headers: number;
    behavior: number;
    fingerprint: number;
    network: number; // Placeholder for network analysis from server
  };
  
  // Weighted contributions
  contributions: {
    userAgent: number;
    headers: number;
    behavior: number;
    fingerprint: number;
    network: number;
  };
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100, how confident we are in the decision
  
  // Flags
  isBot: boolean;
  isCrawler: boolean;
  isHeadless: boolean;
  isSpoofed: boolean;
  isAutomated: boolean;
  isHuman: boolean;
  
  // Action details
  redirectDelay: number; // ms to wait before redirect (for challenge)
  shouldShowChallenge: boolean;
  
  // All issues found
  allIssues: string[];
  allPositives: string[];
  
  // Summary
  summary: string;
  details: string[];
}

// ================ SCORING WEIGHTS ================

// Layer weights (must sum to 1.0)
const LAYER_WEIGHTS = {
  userAgent: 0.20,     // UA analysis
  headers: 0.15,       // Headers validation
  behavior: 0.30,      // Behavioral patterns (most important)
  fingerprint: 0.25,   // Device fingerprint
  network: 0.10,       // Network/IP analysis (done server-side)
};

// Decision thresholds
const THRESHOLDS = {
  block: 30,      // Score 0-30 = block
  challenge: 60,  // Score 31-60 = challenge
  allow: 100,     // Score 61-100 = allow
};

// Challenge delays based on score
const CHALLENGE_DELAYS: Record<number, number> = {
  31: 3000,  // Score 31-35: 3 second delay
  36: 2500,  // Score 36-40: 2.5 second delay
  41: 2000,  // Score 41-45: 2 second delay
  46: 1500,  // Score 46-50: 1.5 second delay
  51: 1000,  // Score 51-55: 1 second delay
  56: 500,   // Score 56-60: 0.5 second delay
};

// Critical flags that override scoring
const CRITICAL_FLAGS = {
  // These immediately result in block
  blockImmediately: [
    'crawler_detected',
    'known_bot',
    'headless_webgl',
    'ad_verification_bot',
    'http_library',
    'empty_ua',
  ],
  
  // These add significant penalty
  highRisk: [
    'bot_detected',
    'headless_ua',
    'software_renderer',
    'canvas_noise_detected',
    'audio_noise_detected',
    'robotic_mouse',
    'constant_velocity',
  ],
  
  // These are positive signals that boost score
  humanSignals: [
    'natural_velocity_variance',
    'natural_path_curvature',
    'natural_pauses',
    'scroll_direction_changes',
    'has_touch_events',
    'known_gpu',
    'hardware_acceleration',
    'platform_fonts_match',
  ],
};

// ================ HELPER FUNCTIONS ================

function getChallengeDelay(score: number): number {
  const thresholds = Object.keys(CHALLENGE_DELAYS)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const threshold of thresholds) {
    if (score >= threshold) {
      return CHALLENGE_DELAYS[threshold];
    }
  }
  
  return 3000; // Default max delay
}

function calculateConfidence(scores: ScoringResult['scores']): number {
  // Confidence is higher when all scores agree
  const values = Object.values(scores);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  
  // Lower variance = higher confidence
  const maxVariance = 2500; // Max possible variance
  const normalizedVariance = Math.min(variance, maxVariance) / maxVariance;
  
  return Math.round((1 - normalizedVariance) * 100);
}

function determineRiskLevel(score: number, flags: { isBot: boolean; isCrawler: boolean; isHeadless: boolean }): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 20 || flags.isCrawler || flags.isHeadless) {
    return 'critical';
  }
  if (score <= 40 || flags.isBot) {
    return 'high';
  }
  if (score <= 60) {
    return 'medium';
  }
  return 'low';
}

function generateSummary(result: Partial<ScoringResult>): string {
  const decision = result.decision || 'unknown';
  const score = result.finalScore || 0;
  
  if (decision === 'allow') {
    return `✅ ALLOW (Score: ${score}) - Comportamento humano detectado`;
  }
  if (decision === 'challenge') {
    return `⚠️ CHALLENGE (Score: ${score}) - Verificação adicional necessária`;
  }
  return `🚫 BLOCK (Score: ${score}) - Bot/automação detectado`;
}

// ================ MAIN SCORING FUNCTION ================

export function calculateProgressiveScore(input: ScoringInput): ScoringResult {
  const {
    uaAnalysis,
    headersAnalysis,
    behaviorAnalysis,
    fingerprintAnalysis,
    minScore = 40,
    blockBots = true,
    requireBehavior = false,
    behaviorTimeMs = 0,
  } = input;
  
  // Initialize result
  const result: ScoringResult = {
    decision: 'allow',
    finalScore: 50,
    scores: {
      userAgent: uaAnalysis.score,
      headers: headersAnalysis.score,
      behavior: behaviorAnalysis.score,
      fingerprint: fingerprintAnalysis.score,
      network: 50, // Default, will be updated server-side
    },
    contributions: {
      userAgent: 0,
      headers: 0,
      behavior: 0,
      fingerprint: 0,
      network: 0,
    },
    riskLevel: 'medium',
    confidence: 0,
    isBot: false,
    isCrawler: false,
    isHeadless: false,
    isSpoofed: false,
    isAutomated: false,
    isHuman: false,
    redirectDelay: 0,
    shouldShowChallenge: false,
    allIssues: [],
    allPositives: [],
    summary: '',
    details: [],
  };
  
  // Collect all issues and positives
  result.allIssues = [
    ...uaAnalysis.details.filter(d => !d.includes('detectad') || d.includes('detectado')),
    ...headersAnalysis.inconsistencies,
    ...behaviorAnalysis.issues,
    ...fingerprintAnalysis.issues,
  ];
  
  result.allPositives = [
    ...behaviorAnalysis.positiveSignals,
    ...fingerprintAnalysis.positiveSignals,
  ];
  
  // Check for critical flags that result in immediate block
  const hasCriticalFlag = CRITICAL_FLAGS.blockImmediately.some(flag =>
    result.allIssues.some(issue => issue.toLowerCase().includes(flag.toLowerCase()))
  );
  
  if (hasCriticalFlag && blockBots) {
    result.finalScore = 0;
    result.decision = 'block';
    result.isBot = true;
    result.riskLevel = 'critical';
    result.details.push('Flag crítica detectada - bloqueio imediato');
    result.summary = generateSummary(result);
    return result;
  }
  
  // Set detection flags
  result.isCrawler = uaAnalysis.isCrawler;
  result.isBot = uaAnalysis.isBot || headersAnalysis.isBot || fingerprintAnalysis.isHeadless;
  result.isHeadless = fingerprintAnalysis.isHeadless || uaAnalysis.isHeadless;
  result.isSpoofed = fingerprintAnalysis.isSpoofed;
  result.isAutomated = behaviorAnalysis.isAutomated || uaAnalysis.isBot;
  result.isHuman = behaviorAnalysis.isHuman && !result.isBot;
  
  // Immediate block for crawlers if blockBots is enabled
  if ((result.isCrawler || result.isBot) && blockBots) {
    // Apply heavy penalty but allow some through if behavior is very human-like
    result.scores.userAgent = Math.min(result.scores.userAgent, 20);
  }
  
  // Calculate weighted contributions
  result.contributions.userAgent = result.scores.userAgent * LAYER_WEIGHTS.userAgent;
  result.contributions.headers = result.scores.headers * LAYER_WEIGHTS.headers;
  result.contributions.behavior = result.scores.behavior * LAYER_WEIGHTS.behavior;
  result.contributions.fingerprint = result.scores.fingerprint * LAYER_WEIGHTS.fingerprint;
  result.contributions.network = result.scores.network * LAYER_WEIGHTS.network;
  
  // Calculate base score
  let baseScore = 
    result.contributions.userAgent +
    result.contributions.headers +
    result.contributions.behavior +
    result.contributions.fingerprint +
    result.contributions.network;
  
  // Apply bonuses for positive signals
  const humanSignalCount = CRITICAL_FLAGS.humanSignals.filter(signal =>
    result.allPositives.some(pos => pos.toLowerCase().includes(signal.toLowerCase()))
  ).length;
  
  const humanBonus = Math.min(humanSignalCount * 3, 15);
  baseScore += humanBonus;
  
  if (humanBonus > 0) {
    result.details.push(`+${humanBonus} pontos por ${humanSignalCount} sinais humanos`);
  }
  
  // Apply penalties for high-risk flags
  const highRiskCount = CRITICAL_FLAGS.highRisk.filter(flag =>
    result.allIssues.some(issue => issue.toLowerCase().includes(flag.toLowerCase()))
  ).length;
  
  const riskPenalty = Math.min(highRiskCount * 5, 25);
  baseScore -= riskPenalty;
  
  if (riskPenalty > 0) {
    result.details.push(`-${riskPenalty} pontos por ${highRiskCount} flags de risco`);
  }
  
  // Behavior requirement check
  if (requireBehavior && behaviorTimeMs > 0) {
    const behaviorScore = behaviorAnalysis.score;
    if (behaviorScore < 50) {
      baseScore -= 15;
      result.details.push('Comportamento insuficiente detectado');
    }
  }
  
  // Apply min score from link configuration
  // If score is below minScore, it affects the decision
  
  // Normalize final score
  result.finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));
  
  // Determine decision based on score bands
  if (result.finalScore <= THRESHOLDS.block) {
    result.decision = 'block';
    result.details.push(`Score ${result.finalScore} ≤ ${THRESHOLDS.block}: BLOCK`);
  } else if (result.finalScore <= THRESHOLDS.challenge) {
    result.decision = 'challenge';
    result.redirectDelay = getChallengeDelay(result.finalScore);
    result.shouldShowChallenge = true;
    result.details.push(`Score ${result.finalScore} entre ${THRESHOLDS.block + 1}-${THRESHOLDS.challenge}: CHALLENGE`);
    result.details.push(`Delay de ${result.redirectDelay}ms antes do redirect`);
  } else {
    result.decision = 'allow';
    result.details.push(`Score ${result.finalScore} > ${THRESHOLDS.challenge}: ALLOW`);
  }
  
  // Check against minScore from link config
  if (result.finalScore < minScore && result.decision === 'allow') {
    result.decision = 'challenge';
    result.shouldShowChallenge = true;
    result.redirectDelay = 1000;
    result.details.push(`Score ${result.finalScore} < minScore ${minScore}: Downgrade para CHALLENGE`);
  }
  
  // Calculate confidence and risk level
  result.confidence = calculateConfidence(result.scores);
  result.riskLevel = determineRiskLevel(result.finalScore, {
    isBot: result.isBot,
    isCrawler: result.isCrawler,
    isHeadless: result.isHeadless,
  });
  
  // Generate summary
  result.summary = generateSummary(result);
  
  // Add layer details
  result.details.unshift(
    `UA Score: ${result.scores.userAgent} (contribuição: ${result.contributions.userAgent.toFixed(1)})`,
    `Headers Score: ${result.scores.headers} (contribuição: ${result.contributions.headers.toFixed(1)})`,
    `Behavior Score: ${result.scores.behavior} (contribuição: ${result.contributions.behavior.toFixed(1)})`,
    `Fingerprint Score: ${result.scores.fingerprint} (contribuição: ${result.contributions.fingerprint.toFixed(1)})`,
  );
  
  return result;
}

// ================ SERVER-SIDE SCORE UPDATE ================

export function updateWithNetworkScore(
  result: ScoringResult,
  networkScore: number,
  networkIssues: string[] = []
): ScoringResult {
  // Update network score
  result.scores.network = networkScore;
  result.contributions.network = networkScore * LAYER_WEIGHTS.network;
  
  // Add network issues
  result.allIssues.push(...networkIssues);
  
  // Recalculate final score
  const newBaseScore = 
    result.contributions.userAgent +
    result.contributions.headers +
    result.contributions.behavior +
    result.contributions.fingerprint +
    result.contributions.network;
  
  result.finalScore = Math.max(0, Math.min(100, Math.round(newBaseScore)));
  
  // Re-determine decision
  if (result.finalScore <= THRESHOLDS.block) {
    result.decision = 'block';
  } else if (result.finalScore <= THRESHOLDS.challenge) {
    result.decision = 'challenge';
    result.redirectDelay = getChallengeDelay(result.finalScore);
    result.shouldShowChallenge = true;
  } else {
    result.decision = 'allow';
    result.shouldShowChallenge = false;
    result.redirectDelay = 0;
  }
  
  // Update summary
  result.summary = generateSummary(result);
  
  return result;
}

// ================ QUICK DECISION FUNCTIONS ================

export function shouldBlock(input: ScoringInput): boolean {
  const result = calculateProgressiveScore(input);
  return result.decision === 'block';
}

export function shouldChallenge(input: ScoringInput): boolean {
  const result = calculateProgressiveScore(input);
  return result.decision === 'challenge';
}

export function shouldAllow(input: ScoringInput): boolean {
  const result = calculateProgressiveScore(input);
  return result.decision === 'allow';
}

export function getQuickDecision(input: ScoringInput): Decision {
  return calculateProgressiveScore(input).decision;
}

// ================ DECISION TO URL MAPPING ================

export function getRedirectUrl(
  decision: Decision,
  targetUrl: string,
  safeUrl: string,
  challengeUrl?: string
): string {
  switch (decision) {
    case 'allow':
      return targetUrl;
    case 'challenge':
      return challengeUrl || safeUrl; // Use challenge URL if provided, else safe URL
    case 'block':
      return safeUrl;
    default:
      return safeUrl;
  }
}

// ================ EXPORT THRESHOLDS FOR UI ================

export const DECISION_THRESHOLDS = THRESHOLDS;
export const SCORING_WEIGHTS = LAYER_WEIGHTS;
