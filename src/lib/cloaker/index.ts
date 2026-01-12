/**
 * Cloaker Module Exports
 * Enterprise-level cloaking system for ad campaign protection
 */

// User-Agent Analysis
export { 
  analyzeUserAgent, 
  isCrawlerUA, 
  isEmptyOrGenericUA, 
  hasUAInconsistencies, 
  getUAScore,
  type UserAgentAnalysis 
} from './userAgentAnalyzer';

// Headers Analysis
export { 
  analyzeHeaders, 
  hasValidHeaders, 
  getHeadersScore, 
  hasSuspiciousReferer, 
  isProxyDetected,
  type HeadersAnalysis,
  type HeadersData 
} from './headersAnalyzer';

// Behavior Analysis
export { 
  analyzeBehavior, 
  isHumanBehavior, 
  getBehaviorScore, 
  hasRoboticPatterns, 
  createBehaviorTracker,
  type BehaviorAnalysis,
  type BehaviorData,
  type MousePath 
} from './behaviorAnalyzer';

// Fingerprint Analysis
export { 
  analyzeFingerprint, 
  isLegitimateFingerprint, 
  getFingerprintScore, 
  getMasterFingerprintHash, 
  isHeadlessFingerprint, 
  isSpoofedFingerprint,
  type FingerprintAnalysis,
  type FingerprintInput 
} from './fingerprintAnalyzer';

// Progressive Scoring System
export { 
  calculateProgressiveScore, 
  updateWithNetworkScore, 
  shouldBlock, 
  shouldChallenge, 
  shouldAllow, 
  getQuickDecision, 
  getRedirectUrl,
  DECISION_THRESHOLDS,
  SCORING_WEIGHTS,
  type ScoringInput,
  type ScoringResult,
  type Decision 
} from './progressiveScoring';
