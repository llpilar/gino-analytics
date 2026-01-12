// Elite Detection Module - Device Consistency, WebRTC, Mouse Pattern, Keyboard, Session Replay

// ==================== DEVICE CONSISTENCY CHECK ====================
export interface DeviceConsistencyResult {
  score: number;
  isConsistent: boolean;
  inconsistencies: string[];
  confidence: number;
}

export function checkDeviceConsistency(fingerprint: {
  userAgent: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  screenResolution: string;
  maxTouchPoints: number;
  touchSupport: boolean;
  webglRenderer: string;
  webglVendor: string;
  colorDepth: number;
  languages: string[];
  timezone: string;
}): DeviceConsistencyResult {
  const inconsistencies: string[] = [];
  let score = 100;
  
  const ua = fingerprint.userAgent.toLowerCase();
  const platform = fingerprint.platform.toLowerCase();
  
  // 1. Platform vs User Agent check
  const uaWindows = /windows/i.test(ua);
  const uaMac = /mac os|macos|macintosh/i.test(ua);
  const uaLinux = /linux/i.test(ua) && !/android/i.test(ua);
  const uaAndroid = /android/i.test(ua);
  const uaIOS = /iphone|ipad|ipod/i.test(ua);
  
  const platWindows = /win/i.test(platform);
  const platMac = /mac/i.test(platform);
  const platLinux = /linux/i.test(platform) && !/android/i.test(platform);
  const platAndroid = /android/i.test(platform);
  const platIOS = /iphone|ipad|ipod/i.test(platform);
  
  if (uaWindows && !platWindows) {
    inconsistencies.push("ua_windows_platform_mismatch");
    score -= 30;
  }
  if (uaMac && !platMac) {
    inconsistencies.push("ua_mac_platform_mismatch");
    score -= 30;
  }
  if (uaAndroid && !platAndroid && !platLinux) {
    inconsistencies.push("ua_android_platform_mismatch");
    score -= 25;
  }
  if (uaIOS && !platIOS) {
    inconsistencies.push("ua_ios_platform_mismatch");
    score -= 30;
  }
  
  // 2. Touch support consistency
  const isMobileUA = /mobile|android|iphone|ipad|ipod|touch/i.test(ua);
  if (isMobileUA && !fingerprint.touchSupport && fingerprint.maxTouchPoints === 0) {
    inconsistencies.push("mobile_no_touch");
    score -= 25;
  }
  if (!isMobileUA && fingerprint.maxTouchPoints > 10) {
    // Desktop claiming mobile touch
    inconsistencies.push("desktop_high_touch");
    score -= 15;
  }
  
  // 3. Hardware consistency
  // Chrome pretending to be Safari
  const isChrome = /chrome/i.test(ua) && !/edge|edg/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome/i.test(ua);
  
  if (isChrome && /Apple GPU/i.test(fingerprint.webglRenderer) && !uaMac && !uaIOS) {
    inconsistencies.push("chrome_apple_gpu_non_apple");
    score -= 20;
  }
  
  // 4. Device memory inconsistency
  if (isMobileUA && fingerprint.deviceMemory > 16) {
    inconsistencies.push("mobile_too_much_memory");
    score -= 15;
  }
  if (!isMobileUA && fingerprint.deviceMemory === 0.25) {
    inconsistencies.push("desktop_minimal_memory");
    score -= 10;
  }
  
  // 5. Screen resolution consistency
  const [width, height] = fingerprint.screenResolution.split("x").map(Number);
  if (isMobileUA && width > 2560) {
    inconsistencies.push("mobile_desktop_resolution");
    score -= 20;
  }
  if (!isMobileUA && width < 800 && height < 600) {
    inconsistencies.push("desktop_tiny_resolution");
    score -= 15;
  }
  
  // 6. Headless/automation signatures
  if (fingerprint.webglRenderer.includes("SwiftShader") || 
      fingerprint.webglRenderer.includes("llvmpipe") ||
      fingerprint.webglRenderer.includes("Mesa")) {
    inconsistencies.push("software_renderer_headless");
    score -= 35;
  }
  
  // 7. Color depth consistency
  if (fingerprint.colorDepth !== 24 && fingerprint.colorDepth !== 32 && fingerprint.colorDepth !== 30) {
    inconsistencies.push("unusual_color_depth");
    score -= 10;
  }
  
  // 8. Timezone vs Language consistency
  const tzRegion = fingerprint.timezone.split("/")[0]?.toLowerCase();
  const primaryLang = fingerprint.languages[0]?.substring(0, 2)?.toLowerCase();
  
  const suspiciousCombos = [
    { tz: "asia", langs: ["en", "es", "pt", "fr", "de"] },
    { tz: "europe", langs: ["zh", "ja", "ko"] },
    { tz: "america", langs: ["zh", "ja", "ko", "ar"] },
  ];
  
  for (const combo of suspiciousCombos) {
    if (tzRegion === combo.tz && combo.langs.includes(primaryLang)) {
      // Could be legitimate (VPN, expat) but flag it
      inconsistencies.push(`timezone_language_mismatch_${tzRegion}_${primaryLang}`);
      score -= 5;
      break;
    }
  }
  
  // 9. CPU cores consistency
  if (isMobileUA && fingerprint.hardwareConcurrency > 16) {
    inconsistencies.push("mobile_too_many_cores");
    score -= 15;
  }
  
  const confidence = Math.min(100, 100 - (inconsistencies.length * 10));
  
  return {
    score: Math.max(0, score),
    isConsistent: score >= 70,
    inconsistencies,
    confidence,
  };
}


// ==================== WEBRTC LEAK DETECTION ====================
export interface WebRTCResult {
  score: number;
  localIPs: string[];
  publicIP: string | null;
  isVPNDetected: boolean;
  isMismatch: boolean;
  hasWebRTC: boolean;
}

export async function detectWebRTCLeak(declaredIP?: string): Promise<WebRTCResult> {
  const result: WebRTCResult = {
    score: 100,
    localIPs: [],
    publicIP: null,
    isVPNDetected: false,
    isMismatch: false,
    hasWebRTC: false,
  };
  
  if (typeof RTCPeerConnection === "undefined") {
    result.hasWebRTC = false;
    result.score = 80; // No WebRTC could be privacy browser or bot
    return result;
  }
  
  result.hasWebRTC = true;
  
  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    
    const ips: string[] = [];
    
    pc.createDataChannel("");
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 3000);
      
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          clearTimeout(timeout);
          resolve();
          return;
        }
        
        const candidate = e.candidate.candidate;
        const ipMatch = candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
        if (ipMatch) {
          const ip = ipMatch[0];
          if (!ips.includes(ip)) {
            ips.push(ip);
          }
        }
        
        // Check for IPv6
        const ipv6Match = candidate.match(/([a-f0-9]{1,4}:){7}[a-f0-9]{1,4}/i);
        if (ipv6Match && !ips.includes(ipv6Match[0])) {
          ips.push(ipv6Match[0]);
        }
      };
    });
    
    pc.close();
    
    // Categorize IPs
    for (const ip of ips) {
      if (ip.startsWith("10.") || 
          ip.startsWith("192.168.") || 
          ip.startsWith("172.16.") ||
          ip.startsWith("172.17.") ||
          ip.startsWith("172.18.") ||
          ip.startsWith("172.19.") ||
          ip.startsWith("172.2") ||
          ip.startsWith("172.30.") ||
          ip.startsWith("172.31.")) {
        result.localIPs.push(ip);
      } else if (!ip.includes(":")) {
        // Likely public IPv4
        result.publicIP = ip;
      }
    }
    
    // VPN Detection: If WebRTC reveals a different public IP than the declared one
    if (declaredIP && result.publicIP && result.publicIP !== declaredIP) {
      result.isMismatch = true;
      result.isVPNDetected = true;
      result.score = 40;
    }
    
    // No local IPs found could indicate privacy measures
    if (result.localIPs.length === 0 && ips.length === 0) {
      result.score = 85; // Slight penalty for no WebRTC data
    }
    
  } catch (err) {
    // WebRTC blocked or error
    result.score = 80;
  }
  
  return result;
}


// ==================== MOUSE PATTERN ANALYSIS (ML-like) ====================
export interface MousePatternResult {
  score: number;
  isHuman: boolean;
  isRobotic: boolean;
  patterns: string[];
  velocityVariance: number;
  accelerationVariance: number;
  pathComplexity: number;
}

export function analyzeMousePattern(data: {
  movements: number;
  velocities: number[];
  accelerations: number[];
  path: { x: number; y: number; t: number }[];
  timeOnPage: number;
}): MousePatternResult {
  const result: MousePatternResult = {
    score: 100,
    isHuman: true,
    isRobotic: false,
    patterns: [],
    velocityVariance: 0,
    accelerationVariance: 0,
    pathComplexity: 0,
  };
  
  // Not enough data
  if (data.movements < 5 || data.path.length < 5) {
    result.score = 70;
    result.patterns.push("insufficient_data");
    return result;
  }
  
  // 1. Calculate velocity variance
  if (data.velocities.length > 3) {
    const avgVelocity = data.velocities.reduce((a, b) => a + b, 0) / data.velocities.length;
    result.velocityVariance = data.velocities.reduce((a, b) => a + Math.pow(b - avgVelocity, 2), 0) / data.velocities.length;
    
    // Bots have very low variance (constant speed)
    if (result.velocityVariance < 0.001) {
      result.patterns.push("constant_velocity");
      result.score -= 30;
      result.isRobotic = true;
    }
    
    // Very high variance could also be suspicious (erratic bot)
    if (result.velocityVariance > 100) {
      result.patterns.push("erratic_velocity");
      result.score -= 15;
    }
  }
  
  // 2. Calculate acceleration variance
  if (data.accelerations.length > 3) {
    const avgAccel = data.accelerations.reduce((a, b) => a + b, 0) / data.accelerations.length;
    result.accelerationVariance = data.accelerations.reduce((a, b) => a + Math.pow(b - avgAccel, 2), 0) / data.accelerations.length;
    
    // Humans have natural acceleration/deceleration patterns
    if (result.accelerationVariance < 0.0001) {
      result.patterns.push("constant_acceleration");
      result.score -= 25;
      result.isRobotic = true;
    }
  }
  
  // 3. Path complexity (humans have curved, natural paths)
  if (data.path.length > 10) {
    let totalAngleChange = 0;
    let straightLineSegments = 0;
    
    for (let i = 2; i < data.path.length; i++) {
      const p1 = data.path[i - 2];
      const p2 = data.path[i - 1];
      const p3 = data.path[i];
      
      // Calculate angle change
      const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
      let angleDiff = Math.abs(angle2 - angle1);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      totalAngleChange += angleDiff;
      
      // Check for perfectly straight segments
      if (angleDiff < 0.001) {
        straightLineSegments++;
      }
    }
    
    result.pathComplexity = totalAngleChange / (data.path.length - 2);
    
    // Bots often move in straight lines
    const straightRatio = straightLineSegments / (data.path.length - 2);
    if (straightRatio > 0.8) {
      result.patterns.push("straight_line_movement");
      result.score -= 25;
      result.isRobotic = true;
    }
    
    // Very low path complexity = robotic
    if (result.pathComplexity < 0.01) {
      result.patterns.push("simple_path");
      result.score -= 20;
    }
  }
  
  // 4. Movement timing analysis
  if (data.path.length > 5) {
    const timings: number[] = [];
    for (let i = 1; i < data.path.length; i++) {
      timings.push(data.path[i].t - data.path[i - 1].t);
    }
    
    const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
    const timingVariance = timings.reduce((a, b) => a + Math.pow(b - avgTiming, 2), 0) / timings.length;
    
    // Bots often have perfectly regular timing
    if (timingVariance < 0.5 && avgTiming > 0) {
      result.patterns.push("regular_timing");
      result.score -= 20;
      result.isRobotic = true;
    }
  }
  
  // 5. Movement rate analysis
  const movementRate = data.movements / (data.timeOnPage / 1000);
  if (movementRate > 50) {
    result.patterns.push("superhuman_movement_rate");
    result.score -= 25;
    result.isRobotic = true;
  }
  if (movementRate < 0.1 && data.timeOnPage > 3000) {
    result.patterns.push("no_movement");
    result.score -= 15;
  }
  
  result.isHuman = result.score >= 70;
  result.score = Math.max(0, result.score);
  
  return result;
}


// ==================== KEYBOARD DYNAMICS ANALYSIS ====================
export interface KeyboardDynamicsResult {
  score: number;
  isHuman: boolean;
  patterns: string[];
  avgKeypressInterval: number;
  intervalVariance: number;
}

export function analyzeKeyboardDynamics(data: {
  keypressEvents: number;
  keypressTimes?: number[];
  timeOnPage: number;
}): KeyboardDynamicsResult {
  const result: KeyboardDynamicsResult = {
    score: 100,
    isHuman: true,
    patterns: [],
    avgKeypressInterval: 0,
    intervalVariance: 0,
  };
  
  // No keyboard interaction is fine for most pages
  if (data.keypressEvents === 0) {
    result.score = 90;
    return result;
  }
  
  // If we have timing data
  if (data.keypressTimes && data.keypressTimes.length > 3) {
    const intervals: number[] = [];
    for (let i = 1; i < data.keypressTimes.length; i++) {
      intervals.push(data.keypressTimes[i] - data.keypressTimes[i - 1]);
    }
    
    result.avgKeypressInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    result.intervalVariance = intervals.reduce((a, b) => a + Math.pow(b - result.avgKeypressInterval, 2), 0) / intervals.length;
    
    // Bots type at constant speed
    if (result.intervalVariance < 5 && result.avgKeypressInterval < 100) {
      result.patterns.push("robotic_typing");
      result.score -= 35;
      result.isHuman = false;
    }
    
    // Superhuman typing speed
    if (result.avgKeypressInterval < 30) {
      result.patterns.push("superhuman_typing_speed");
      result.score -= 40;
      result.isHuman = false;
    }
  }
  
  // Calculate typing rate
  const typingRate = data.keypressEvents / (data.timeOnPage / 1000);
  
  // More than 20 keys per second is impossible for humans
  if (typingRate > 20) {
    result.patterns.push("impossible_typing_rate");
    result.score -= 50;
    result.isHuman = false;
  }
  
  result.score = Math.max(0, result.score);
  return result;
}


// ==================== SESSION REPLAY DETECTION ====================
export interface SessionReplayResult {
  score: number;
  isRecording: boolean;
  detectedTools: string[];
}

export function detectSessionReplay(): SessionReplayResult {
  const result: SessionReplayResult = {
    score: 100,
    isRecording: false,
    detectedTools: [],
  };
  
  const win = window as any;
  
  // Hotjar detection
  if (win.hj || win._hjSettings || win._hjid || win._hj) {
    result.detectedTools.push("hotjar");
  }
  
  // FullStory detection
  if (win.FS || win._fs_debug_mode || win.FSInitialized || win._fs_namespace) {
    result.detectedTools.push("fullstory");
  }
  
  // Heap Analytics
  if (win.heap || win.heapReadyCb) {
    result.detectedTools.push("heap");
  }
  
  // LogRocket
  if (win._lr_loaded || win.LogRocket) {
    result.detectedTools.push("logrocket");
  }
  
  // Mouseflow
  if (win.mouseflow || win._mfq) {
    result.detectedTools.push("mouseflow");
  }
  
  // Lucky Orange
  if (win.__lo_site_id || win.__lo_js_loaded) {
    result.detectedTools.push("luckyorange");
  }
  
  // Crazy Egg
  if (win.CE2 || win.CE_API) {
    result.detectedTools.push("crazyegg");
  }
  
  // Smartlook
  if (win.smartlook || win._smartlook) {
    result.detectedTools.push("smartlook");
  }
  
  // Inspectlet
  if (win.__insp || win.__inspld) {
    result.detectedTools.push("inspectlet");
  }
  
  // rrweb (open source)
  if (win.__rrweb || win.__rrMutationObserver) {
    result.detectedTools.push("rrweb");
  }
  
  // Sentry Replay
  if (win.__SENTRY_REPLAY__) {
    result.detectedTools.push("sentry_replay");
  }
  
  // Check for MutationObserver hooks (common in replay tools)
  try {
    const originalMO = win.MutationObserver?.toString() || "";
    if (originalMO.includes("native code") === false) {
      result.detectedTools.push("mutationobserver_hooked");
    }
  } catch {}
  
  if (result.detectedTools.length > 0) {
    result.isRecording = true;
    // Session replay could be legitimate (analytics) or ad reviewer
    // Apply moderate penalty
    result.score = 70 - (result.detectedTools.length * 5);
  }
  
  result.score = Math.max(0, result.score);
  return result;
}


// ==================== COMBINED ELITE ANALYSIS ====================
export interface EliteDetectionResult {
  score: number;
  deviceConsistency: DeviceConsistencyResult;
  webrtc: WebRTCResult;
  mousePattern: MousePatternResult;
  keyboard: KeyboardDynamicsResult;
  sessionReplay: SessionReplayResult;
  isBot: boolean;
  isSuspicious: boolean;
  reasons: string[];
}

export async function performEliteDetection(fingerprint: {
  userAgent: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  screenResolution: string;
  maxTouchPoints: number;
  touchSupport: boolean;
  webglRenderer: string;
  webglVendor: string;
  colorDepth: number;
  languages: string[];
  timezone: string;
  mouseMovements: number;
  mouseVelocities: number[];
  mouseAccelerations: number[];
  mousePath: { x: number; y: number; t: number }[];
  keypressEvents: number;
  timeOnPage: number;
}, declaredIP?: string): Promise<EliteDetectionResult> {
  
  // Run all analyses
  const deviceConsistency = checkDeviceConsistency({
    userAgent: fingerprint.userAgent,
    platform: fingerprint.platform,
    hardwareConcurrency: fingerprint.hardwareConcurrency,
    deviceMemory: fingerprint.deviceMemory,
    screenResolution: fingerprint.screenResolution,
    maxTouchPoints: fingerprint.maxTouchPoints,
    touchSupport: fingerprint.touchSupport,
    webglRenderer: fingerprint.webglRenderer,
    webglVendor: fingerprint.webglVendor,
    colorDepth: fingerprint.colorDepth,
    languages: fingerprint.languages,
    timezone: fingerprint.timezone,
  });
  
  const webrtc = await detectWebRTCLeak(declaredIP);
  
  const mousePattern = analyzeMousePattern({
    movements: fingerprint.mouseMovements,
    velocities: fingerprint.mouseVelocities,
    accelerations: fingerprint.mouseAccelerations,
    path: fingerprint.mousePath,
    timeOnPage: fingerprint.timeOnPage,
  });
  
  const keyboard = analyzeKeyboardDynamics({
    keypressEvents: fingerprint.keypressEvents,
    timeOnPage: fingerprint.timeOnPage,
  });
  
  const sessionReplay = detectSessionReplay();
  
  // Calculate combined score with weights
  const weights = {
    deviceConsistency: 0.25,
    webrtc: 0.15,
    mousePattern: 0.30,
    keyboard: 0.10,
    sessionReplay: 0.20,
  };
  
  const combinedScore = 
    deviceConsistency.score * weights.deviceConsistency +
    webrtc.score * weights.webrtc +
    mousePattern.score * weights.mousePattern +
    keyboard.score * weights.keyboard +
    sessionReplay.score * weights.sessionReplay;
  
  // Collect reasons
  const reasons: string[] = [
    ...deviceConsistency.inconsistencies,
    ...mousePattern.patterns,
    ...keyboard.patterns,
    ...sessionReplay.detectedTools.map(t => `session_replay_${t}`),
  ];
  
  if (webrtc.isVPNDetected) reasons.push("webrtc_vpn_detected");
  if (webrtc.isMismatch) reasons.push("webrtc_ip_mismatch");
  
  const isBot = 
    mousePattern.isRobotic || 
    !keyboard.isHuman || 
    !deviceConsistency.isConsistent ||
    combinedScore < 50;
  
  const isSuspicious = 
    sessionReplay.isRecording || 
    webrtc.isVPNDetected ||
    combinedScore < 70;
  
  return {
    score: Math.round(combinedScore),
    deviceConsistency,
    webrtc,
    mousePattern,
    keyboard,
    sessionReplay,
    isBot,
    isSuspicious,
    reasons,
  };
}
