/**
 * Advanced Behavioral Analysis Module for Cloaker
 * Enterprise-level detection of human vs bot behavior patterns
 */

// ================ TYPES ================

export interface MousePath {
  x: number;
  y: number;
  t: number;
}

export interface BehaviorData {
  // Mouse data
  mouseMovements: number;
  mouseVelocities: number[];
  mouseAccelerations: number[];
  mousePath: MousePath[];
  
  // Scroll data
  scrollEvents: number;
  scrollDepth: number;
  scrollVelocities?: number[];
  scrollDirectionChanges?: number;
  
  // Interaction data
  keypressEvents: number;
  clickEvents: number;
  touchEvents?: number;
  focusChanges: number;
  
  // Time data
  timeOnPage: number;
  idleTime?: number;
  activeTime?: number;
  
  // Advanced metrics
  mousePauses?: number;
  mouseOutOfBounds?: number;
  copyPasteEvents?: number;
  rightClickEvents?: number;
  doubleClickEvents?: number;
  dragEvents?: number;
  
  // Device interaction
  deviceOrientation?: { alpha: number; beta: number; gamma: number }[];
  touchPressure?: number[];
}

export interface BehaviorAnalysis {
  // Detection results
  isHuman: boolean;
  isBot: boolean;
  isAutomated: boolean;
  isSuspicious: boolean;
  
  // Confidence levels
  humanConfidence: number; // 0-100
  botConfidence: number; // 0-100
  
  // Individual scores
  mouseScore: number;
  scrollScore: number;
  interactionScore: number;
  timingScore: number;
  
  // Pattern analysis
  mousePatternType: 'human' | 'linear' | 'robotic' | 'none' | 'suspicious';
  scrollPatternType: 'human' | 'programmatic' | 'none' | 'suspicious';
  interactionPatternType: 'human' | 'scripted' | 'none' | 'suspicious';
  
  // Issues found
  issues: string[];
  positiveSignals: string[];
  
  // Final score
  score: number; // 0-100, higher = more human-like
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Details for logging
  details: string[];
}

// ================ CONSTANTS ================

// Human mouse movement characteristics
const HUMAN_MOUSE = {
  // Velocity (pixels per ms)
  minVelocity: 0.01,
  maxVelocity: 15,
  avgVelocity: 0.3,
  velocityVariance: 0.1,
  
  // Acceleration
  maxAcceleration: 5,
  avgAccelerationVariance: 0.5,
  
  // Path characteristics
  minPathPoints: 5,
  optimalPathPoints: 20,
  maxStraightLineRatio: 0.7,
  minCurvature: 0.1,
  
  // Timing
  minMovementGap: 10, // ms
  maxMovementGap: 2000, // ms
  avgMovementGap: 50, // ms
};

// Human scroll characteristics
const HUMAN_SCROLL = {
  minEvents: 2,
  optimalEvents: 10,
  minDepth: 10, // percent
  optimalDepth: 50,
  maxVelocity: 500, // pixels per event
  minDirectionChanges: 0,
  maxDirectionChanges: 20,
};

// Time thresholds
const TIME_THRESHOLDS = {
  minTimeForHuman: 500, // 0.5 seconds - suspiciously fast
  optimalMinTime: 2000, // 2 seconds - reasonable minimum
  optimalMaxTime: 300000, // 5 minutes - typical page visit
  suspiciousMaxTime: 3600000, // 1 hour - unusually long
};

// Interaction thresholds
const INTERACTION_THRESHOLDS = {
  minClicksForHuman: 0,
  optimalClicks: 1,
  maxClicksPerSecond: 10,
  minKeypressesForHuman: 0,
  maxKeypressesPerSecond: 20,
  maxFocusChanges: 50,
};

// ================ ANALYSIS FUNCTIONS ================

function analyzeMouseMovements(data: BehaviorData): {
  score: number;
  patternType: 'human' | 'linear' | 'robotic' | 'none' | 'suspicious';
  issues: string[];
  positives: string[];
  details: string[];
} {
  const issues: string[] = [];
  const positives: string[] = [];
  const details: string[] = [];
  let score = 50; // Start neutral
  
  // No mouse movements
  if (data.mouseMovements === 0 || data.mousePath.length === 0) {
    // Could be mobile/touch device - not necessarily a bot
    if (data.touchEvents && data.touchEvents > 0) {
      positives.push('touch_device_detected');
      details.push('Dispositivo touch detectado, sem mouse esperado');
      return { score: 60, patternType: 'none', issues, positives, details };
    }
    
    // No mouse and no touch - suspicious but not definitive
    issues.push('no_mouse_movements');
    details.push('Nenhum movimento de mouse detectado');
    return { score: 30, patternType: 'none', issues, positives, details };
  }
  
  // Analyze path
  const path = data.mousePath;
  
  // Check for minimum path points
  if (path.length < HUMAN_MOUSE.minPathPoints) {
    issues.push('insufficient_mouse_data');
    score -= 10;
    details.push(`Poucos pontos de mouse: ${path.length}`);
  } else if (path.length >= HUMAN_MOUSE.optimalPathPoints) {
    positives.push('sufficient_mouse_data');
    score += 10;
    details.push(`Bom número de pontos de mouse: ${path.length}`);
  }
  
  // Analyze velocities
  const velocities = data.mouseVelocities;
  if (velocities.length > 0) {
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const velocityVariance = velocities.reduce((sum, v) => 
      sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length;
    
    // Check for robotic constant velocity (very low variance)
    if (velocityVariance < 0.001 && velocities.length > 10) {
      issues.push('constant_velocity');
      score -= 30;
      details.push('Velocidade constante (robótico)');
      return { score: Math.max(0, score), patternType: 'robotic', issues, positives, details };
    }
    
    // Check for human-like velocity variance
    if (velocityVariance > HUMAN_MOUSE.velocityVariance) {
      positives.push('natural_velocity_variance');
      score += 15;
      details.push('Variação natural de velocidade');
    }
    
    // Check for reasonable average velocity
    if (avgVelocity >= HUMAN_MOUSE.minVelocity && avgVelocity <= HUMAN_MOUSE.maxVelocity) {
      positives.push('reasonable_velocity');
      score += 10;
    } else if (avgVelocity > HUMAN_MOUSE.maxVelocity) {
      issues.push('superhuman_velocity');
      score -= 20;
      details.push(`Velocidade sobre-humana: ${avgVelocity.toFixed(2)}`);
    }
  }
  
  // Analyze accelerations
  const accelerations = data.mouseAccelerations;
  if (accelerations.length > 0) {
    const avgAccel = accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
    const accelVariance = accelerations.reduce((sum, a) => 
      sum + Math.pow(a - avgAccel, 2), 0) / accelerations.length;
    
    // Check for natural acceleration patterns
    if (accelVariance > HUMAN_MOUSE.avgAccelerationVariance) {
      positives.push('natural_acceleration');
      score += 10;
      details.push('Padrão natural de aceleração');
    }
    
    // Check for no acceleration changes (linear movement)
    if (accelVariance < 0.0001 && accelerations.length > 10) {
      issues.push('no_acceleration_variance');
      score -= 20;
      details.push('Sem variação de aceleração (linear)');
    }
  }
  
  // Analyze path curvature
  if (path.length >= 3) {
    let totalAngleChange = 0;
    let straightSegments = 0;
    let curvedSegments = 0;
    
    for (let i = 2; i < path.length; i++) {
      const p1 = path[i - 2];
      const p2 = path[i - 1];
      const p3 = path[i];
      
      // Calculate vectors
      const v1x = p2.x - p1.x;
      const v1y = p2.y - p1.y;
      const v2x = p3.x - p2.x;
      const v2y = p3.y - p2.y;
      
      // Calculate angle between vectors
      const dot = v1x * v2x + v1y * v2y;
      const cross = v1x * v2y - v1y * v2x;
      const angle = Math.abs(Math.atan2(cross, dot));
      
      totalAngleChange += angle;
      
      if (angle < 0.1) {
        straightSegments++;
      } else {
        curvedSegments++;
      }
    }
    
    const totalSegments = straightSegments + curvedSegments;
    const straightRatio = totalSegments > 0 ? straightSegments / totalSegments : 0;
    
    // Too many straight segments indicates robotic movement
    if (straightRatio > HUMAN_MOUSE.maxStraightLineRatio && totalSegments > 10) {
      issues.push('mostly_straight_path');
      score -= 25;
      details.push(`Caminho muito linear: ${(straightRatio * 100).toFixed(0)}% reto`);
      return { score: Math.max(0, score), patternType: 'linear', issues, positives, details };
    }
    
    // Good curvature indicates human
    if (straightRatio < 0.5 && totalSegments > 5) {
      positives.push('natural_path_curvature');
      score += 15;
      details.push('Curvatura natural no caminho');
    }
  }
  
  // Analyze timing between movements
  if (path.length >= 2) {
    const timeGaps: number[] = [];
    for (let i = 1; i < path.length; i++) {
      timeGaps.push(path[i].t - path[i - 1].t);
    }
    
    const avgGap = timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length;
    const gapVariance = timeGaps.reduce((sum, g) => 
      sum + Math.pow(g - avgGap, 2), 0) / timeGaps.length;
    
    // Constant timing is robotic
    if (gapVariance < 1 && timeGaps.length > 10) {
      issues.push('constant_timing');
      score -= 25;
      details.push('Timing constante entre movimentos (robótico)');
      return { score: Math.max(0, score), patternType: 'robotic', issues, positives, details };
    }
    
    // Natural timing variance
    if (gapVariance > 100) {
      positives.push('natural_timing_variance');
      score += 10;
      details.push('Variação natural de timing');
    }
    
    // Check for pauses (human behavior)
    const pauses = timeGaps.filter(g => g > 100 && g < 2000).length;
    if (pauses > 0) {
      positives.push('natural_pauses');
      score += 5 * Math.min(pauses, 5);
      details.push(`${pauses} pausas naturais detectadas`);
    }
  }
  
  // Determine pattern type based on score
  let patternType: 'human' | 'linear' | 'robotic' | 'none' | 'suspicious' = 'suspicious';
  if (score >= 70) {
    patternType = 'human';
  } else if (score >= 40) {
    patternType = 'suspicious';
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    patternType,
    issues,
    positives,
    details,
  };
}

function analyzeScrollBehavior(data: BehaviorData): {
  score: number;
  patternType: 'human' | 'programmatic' | 'none' | 'suspicious';
  issues: string[];
  positives: string[];
  details: string[];
} {
  const issues: string[] = [];
  const positives: string[] = [];
  const details: string[] = [];
  let score = 50;
  
  // No scroll events
  if (data.scrollEvents === 0) {
    // Page might be short - not necessarily a problem
    details.push('Nenhum scroll detectado');
    return { score: 40, patternType: 'none', issues, positives, details };
  }
  
  // Check scroll event count
  if (data.scrollEvents >= HUMAN_SCROLL.minEvents) {
    positives.push('has_scroll_events');
    score += 10;
    details.push(`${data.scrollEvents} eventos de scroll`);
  }
  
  if (data.scrollEvents >= HUMAN_SCROLL.optimalEvents) {
    positives.push('good_scroll_count');
    score += 10;
  }
  
  // Check scroll depth
  if (data.scrollDepth >= HUMAN_SCROLL.minDepth) {
    positives.push('meaningful_scroll_depth');
    score += 10;
    details.push(`Scroll depth: ${data.scrollDepth.toFixed(0)}%`);
  }
  
  if (data.scrollDepth >= HUMAN_SCROLL.optimalDepth) {
    positives.push('good_scroll_depth');
    score += 10;
  }
  
  // Check scroll velocities if available
  if (data.scrollVelocities && data.scrollVelocities.length > 0) {
    const velocities = data.scrollVelocities;
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const velocityVariance = velocities.reduce((sum, v) => 
      sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length;
    
    // Constant scroll velocity is suspicious
    if (velocityVariance < 10 && velocities.length > 5) {
      issues.push('constant_scroll_velocity');
      score -= 20;
      details.push('Velocidade de scroll constante (programático)');
      return { score: Math.max(0, score), patternType: 'programmatic', issues, positives, details };
    }
    
    // High variance indicates human
    if (velocityVariance > 100) {
      positives.push('natural_scroll_velocity');
      score += 10;
    }
  }
  
  // Check direction changes
  if (data.scrollDirectionChanges !== undefined) {
    if (data.scrollDirectionChanges > 0 && data.scrollDirectionChanges <= HUMAN_SCROLL.maxDirectionChanges) {
      positives.push('scroll_direction_changes');
      score += 10;
      details.push(`${data.scrollDirectionChanges} mudanças de direção`);
    }
  }
  
  // Determine pattern type
  let patternType: 'human' | 'programmatic' | 'none' | 'suspicious' = 'suspicious';
  if (score >= 70) {
    patternType = 'human';
  } else if (score >= 40) {
    patternType = 'suspicious';
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    patternType,
    issues,
    positives,
    details,
  };
}

function analyzeInteractions(data: BehaviorData): {
  score: number;
  patternType: 'human' | 'scripted' | 'none' | 'suspicious';
  issues: string[];
  positives: string[];
  details: string[];
} {
  const issues: string[] = [];
  const positives: string[] = [];
  const details: string[] = [];
  let score = 50;
  
  const timeSeconds = data.timeOnPage / 1000;
  
  // Analyze clicks
  if (data.clickEvents > 0) {
    positives.push('has_clicks');
    score += 10;
    details.push(`${data.clickEvents} cliques detectados`);
    
    // Check click rate
    const clicksPerSecond = timeSeconds > 0 ? data.clickEvents / timeSeconds : 0;
    if (clicksPerSecond > INTERACTION_THRESHOLDS.maxClicksPerSecond) {
      issues.push('excessive_click_rate');
      score -= 30;
      details.push(`Taxa de cliques suspeita: ${clicksPerSecond.toFixed(1)}/s`);
    } else if (clicksPerSecond > 0 && clicksPerSecond <= 2) {
      positives.push('natural_click_rate');
      score += 10;
    }
  }
  
  // Analyze keypresses
  if (data.keypressEvents > 0) {
    positives.push('has_keypresses');
    score += 10;
    details.push(`${data.keypressEvents} teclas pressionadas`);
    
    // Check keypress rate
    const keypressPerSecond = timeSeconds > 0 ? data.keypressEvents / timeSeconds : 0;
    if (keypressPerSecond > INTERACTION_THRESHOLDS.maxKeypressesPerSecond) {
      issues.push('excessive_keypress_rate');
      score -= 20;
      details.push(`Taxa de digitação suspeita: ${keypressPerSecond.toFixed(1)}/s`);
    } else if (keypressPerSecond > 0 && keypressPerSecond <= 5) {
      positives.push('natural_typing_rate');
      score += 10;
    }
  }
  
  // Analyze touch events
  if (data.touchEvents && data.touchEvents > 0) {
    positives.push('has_touch_events');
    score += 15;
    details.push(`${data.touchEvents} eventos touch`);
  }
  
  // Analyze focus changes
  if (data.focusChanges > 0) {
    if (data.focusChanges <= INTERACTION_THRESHOLDS.maxFocusChanges) {
      positives.push('natural_focus_changes');
      score += 5;
    } else {
      issues.push('excessive_focus_changes');
      score -= 10;
    }
  }
  
  // Analyze right clicks and double clicks (human behaviors)
  if (data.rightClickEvents && data.rightClickEvents > 0) {
    positives.push('has_right_clicks');
    score += 5;
  }
  
  if (data.doubleClickEvents && data.doubleClickEvents > 0) {
    positives.push('has_double_clicks');
    score += 5;
  }
  
  // Check for any interaction at all
  const totalInteractions = (
    data.clickEvents + 
    data.keypressEvents + 
    (data.touchEvents || 0) + 
    data.mouseMovements + 
    data.scrollEvents
  );
  
  if (totalInteractions === 0 && data.timeOnPage > 3000) {
    issues.push('no_interactions');
    score -= 30;
    details.push('Nenhuma interação detectada após 3s');
  } else if (totalInteractions >= 5) {
    positives.push('multiple_interaction_types');
    score += 10;
  }
  
  // Determine pattern type
  let patternType: 'human' | 'scripted' | 'none' | 'suspicious' = 'suspicious';
  if (score >= 70) {
    patternType = 'human';
  } else if (score <= 30) {
    patternType = 'scripted';
  } else if (totalInteractions === 0) {
    patternType = 'none';
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    patternType,
    issues,
    positives,
    details,
  };
}

function analyzeTimingBehavior(data: BehaviorData): {
  score: number;
  issues: string[];
  positives: string[];
  details: string[];
} {
  const issues: string[] = [];
  const positives: string[] = [];
  const details: string[] = [];
  let score = 50;
  
  const timeOnPage = data.timeOnPage;
  
  details.push(`Tempo na página: ${(timeOnPage / 1000).toFixed(1)}s`);
  
  // Too fast (bot-like)
  if (timeOnPage < TIME_THRESHOLDS.minTimeForHuman) {
    issues.push('too_fast');
    score -= 40;
    details.push('Tempo muito curto (< 0.5s)');
    return { score: Math.max(0, score), issues, positives, details };
  }
  
  // Reasonable minimum time
  if (timeOnPage >= TIME_THRESHOLDS.optimalMinTime) {
    positives.push('reasonable_time');
    score += 20;
  } else if (timeOnPage >= 1000) {
    // Between 1-2 seconds - acceptable
    score += 10;
  }
  
  // Good engagement time
  if (timeOnPage >= 5000 && timeOnPage <= TIME_THRESHOLDS.optimalMaxTime) {
    positives.push('good_engagement_time');
    score += 15;
    details.push('Tempo de engajamento saudável');
  }
  
  // Very long time (could be tab left open)
  if (timeOnPage > TIME_THRESHOLDS.suspiciousMaxTime) {
    issues.push('suspiciously_long_time');
    score -= 10;
    details.push('Tempo extremamente longo');
  }
  
  // Analyze active vs idle time if available
  if (data.activeTime !== undefined && data.idleTime !== undefined) {
    const totalTime = data.activeTime + data.idleTime;
    if (totalTime > 0) {
      const activeRatio = data.activeTime / totalTime;
      
      if (activeRatio > 0.3 && activeRatio < 0.9) {
        positives.push('natural_activity_pattern');
        score += 10;
        details.push(`Padrão de atividade natural (${(activeRatio * 100).toFixed(0)}% ativo)`);
      } else if (activeRatio >= 0.95) {
        issues.push('constantly_active');
        score -= 15;
        details.push('Constantemente ativo (suspeito)');
      }
    }
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    positives,
    details,
  };
}

// ================ MAIN ANALYSIS FUNCTION ================

export function analyzeBehavior(data: BehaviorData): BehaviorAnalysis {
  const result: BehaviorAnalysis = {
    isHuman: false,
    isBot: false,
    isAutomated: false,
    isSuspicious: false,
    humanConfidence: 0,
    botConfidence: 0,
    mouseScore: 0,
    scrollScore: 0,
    interactionScore: 0,
    timingScore: 0,
    mousePatternType: 'none',
    scrollPatternType: 'none',
    interactionPatternType: 'none',
    issues: [],
    positiveSignals: [],
    score: 50,
    riskLevel: 'medium',
    details: [],
  };
  
  // Run all analyses
  const mouseAnalysis = analyzeMouseMovements(data);
  const scrollAnalysis = analyzeScrollBehavior(data);
  const interactionAnalysis = analyzeInteractions(data);
  const timingAnalysis = analyzeTimingBehavior(data);
  
  // Collect results
  result.mouseScore = mouseAnalysis.score;
  result.scrollScore = scrollAnalysis.score;
  result.interactionScore = interactionAnalysis.score;
  result.timingScore = timingAnalysis.score;
  
  result.mousePatternType = mouseAnalysis.patternType;
  result.scrollPatternType = scrollAnalysis.patternType;
  result.interactionPatternType = interactionAnalysis.patternType;
  
  // Collect all issues and positives
  result.issues = [
    ...mouseAnalysis.issues,
    ...scrollAnalysis.issues,
    ...interactionAnalysis.issues,
    ...timingAnalysis.issues,
  ];
  
  result.positiveSignals = [
    ...mouseAnalysis.positives,
    ...scrollAnalysis.positives,
    ...interactionAnalysis.positives,
    ...timingAnalysis.positives,
  ];
  
  result.details = [
    ...mouseAnalysis.details,
    ...scrollAnalysis.details,
    ...interactionAnalysis.details,
    ...timingAnalysis.details,
  ];
  
  // Calculate weighted final score
  // Mouse is most important, then interactions, then scroll, then timing
  const weights = {
    mouse: 0.35,
    scroll: 0.15,
    interaction: 0.30,
    timing: 0.20,
  };
  
  result.score = Math.round(
    result.mouseScore * weights.mouse +
    result.scrollScore * weights.scroll +
    result.interactionScore * weights.interaction +
    result.timingScore * weights.timing
  );
  
  // Bonus for multiple positive signals
  const positiveBonus = Math.min(result.positiveSignals.length * 2, 15);
  result.score = Math.min(100, result.score + positiveBonus);
  
  // Penalty for multiple issues
  const issuePenalty = Math.min(result.issues.length * 3, 20);
  result.score = Math.max(0, result.score - issuePenalty);
  
  // Calculate confidence levels
  result.humanConfidence = result.score;
  result.botConfidence = 100 - result.score;
  
  // Determine flags
  if (result.score >= 70) {
    result.isHuman = true;
    result.riskLevel = 'low';
  } else if (result.score >= 50) {
    result.isSuspicious = true;
    result.riskLevel = 'medium';
  } else if (result.score >= 30) {
    result.isSuspicious = true;
    result.isBot = true;
    result.riskLevel = 'high';
  } else {
    result.isBot = true;
    result.isAutomated = true;
    result.riskLevel = 'critical';
  }
  
  // Check for definitive robotic patterns
  if (
    result.mousePatternType === 'robotic' ||
    result.mousePatternType === 'linear' ||
    result.scrollPatternType === 'programmatic' ||
    result.interactionPatternType === 'scripted'
  ) {
    result.isAutomated = true;
    result.isBot = true;
    result.isHuman = false;
    result.riskLevel = 'critical';
    result.score = Math.min(result.score, 25);
  }
  
  return result;
}

// ================ QUICK CHECK FUNCTIONS ================

export function isHumanBehavior(data: BehaviorData): boolean {
  const analysis = analyzeBehavior(data);
  return analysis.isHuman && !analysis.isBot;
}

export function getBehaviorScore(data: BehaviorData): number {
  return analyzeBehavior(data).score;
}

export function hasRoboticPatterns(data: BehaviorData): boolean {
  const analysis = analyzeBehavior(data);
  return (
    analysis.mousePatternType === 'robotic' ||
    analysis.mousePatternType === 'linear' ||
    analysis.scrollPatternType === 'programmatic' ||
    analysis.isAutomated
  );
}

// ================ REAL-TIME TRACKING HELPERS ================

export function createBehaviorTracker() {
  const data: BehaviorData = {
    mouseMovements: 0,
    mouseVelocities: [],
    mouseAccelerations: [],
    mousePath: [],
    scrollEvents: 0,
    scrollDepth: 0,
    scrollVelocities: [],
    scrollDirectionChanges: 0,
    keypressEvents: 0,
    clickEvents: 0,
    touchEvents: 0,
    focusChanges: 0,
    timeOnPage: 0,
    idleTime: 0,
    activeTime: 0,
    mousePauses: 0,
    rightClickEvents: 0,
    doubleClickEvents: 0,
    dragEvents: 0,
  };
  
  let lastMousePos: { x: number; y: number; t: number } | null = null;
  let lastVelocity = 0;
  let lastScrollY = 0;
  let lastScrollDir = 0;
  let lastActiveTime = Date.now();
  let startTime = Date.now();
  
  return {
    getData: () => ({
      ...data,
      timeOnPage: Date.now() - startTime,
    }),
    
    trackMouseMove: (e: MouseEvent) => {
      data.mouseMovements++;
      const now = Date.now();
      const pos = { x: e.clientX, y: e.clientY, t: now };
      
      if (data.mousePath.length < 200) {
        data.mousePath.push(pos);
      }
      
      if (lastMousePos) {
        const dt = now - lastMousePos.t;
        if (dt > 0) {
          const dx = pos.x - lastMousePos.x;
          const dy = pos.y - lastMousePos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const velocity = distance / dt;
          
          if (data.mouseVelocities.length < 300) {
            data.mouseVelocities.push(velocity);
          }
          
          const acceleration = Math.abs(velocity - lastVelocity) / dt;
          if (data.mouseAccelerations.length < 300) {
            data.mouseAccelerations.push(acceleration);
          }
          
          // Detect pause
          if (dt > 200) {
            data.mousePauses = (data.mousePauses || 0) + 1;
          }
          
          lastVelocity = velocity;
        }
      }
      
      lastMousePos = pos;
      lastActiveTime = now;
      data.activeTime = (data.activeTime || 0) + (now - lastActiveTime);
    },
    
    trackScroll: () => {
      data.scrollEvents++;
      const scrollY = window.scrollY;
      const maxScroll = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ) - window.innerHeight;
      
      const scrollPercent = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;
      if (scrollPercent > data.scrollDepth) {
        data.scrollDepth = scrollPercent;
      }
      
      // Track velocity
      const velocity = Math.abs(scrollY - lastScrollY);
      if (data.scrollVelocities && data.scrollVelocities.length < 100) {
        data.scrollVelocities.push(velocity);
      }
      
      // Track direction changes
      const dir = scrollY > lastScrollY ? 1 : (scrollY < lastScrollY ? -1 : 0);
      if (dir !== 0 && dir !== lastScrollDir) {
        data.scrollDirectionChanges = (data.scrollDirectionChanges || 0) + 1;
      }
      
      lastScrollY = scrollY;
      lastScrollDir = dir;
      lastActiveTime = Date.now();
    },
    
    trackClick: () => {
      data.clickEvents++;
      lastActiveTime = Date.now();
    },
    
    trackRightClick: () => {
      data.rightClickEvents = (data.rightClickEvents || 0) + 1;
      lastActiveTime = Date.now();
    },
    
    trackDoubleClick: () => {
      data.doubleClickEvents = (data.doubleClickEvents || 0) + 1;
      lastActiveTime = Date.now();
    },
    
    trackKeypress: () => {
      data.keypressEvents++;
      lastActiveTime = Date.now();
    },
    
    trackTouch: () => {
      data.touchEvents = (data.touchEvents || 0) + 1;
      lastActiveTime = Date.now();
    },
    
    trackFocusChange: () => {
      data.focusChanges++;
    },
    
    trackIdle: () => {
      const now = Date.now();
      const idleDuration = now - lastActiveTime;
      if (idleDuration > 1000) {
        data.idleTime = (data.idleTime || 0) + idleDuration;
      }
    },
    
    analyze: () => analyzeBehavior({
      ...data,
      timeOnPage: Date.now() - startTime,
    }),
  };
}
