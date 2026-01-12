import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { analyzeUserAgent, type UserAgentAnalysis } from "@/lib/cloaker/userAgentAnalyzer";
import { analyzeHeaders, type HeadersAnalysis, type HeadersData } from "@/lib/cloaker/headersAnalyzer";
import { analyzeBehavior, type BehaviorAnalysis, type BehaviorData } from "@/lib/cloaker/behaviorAnalyzer";

interface FingerprintData {
  // Core fingerprint
  userAgent: string;
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;
  screenResolution: string;
  availableScreenResolution: string;
  colorDepth: number;
  deviceMemory: number;
  hardwareConcurrency: number;
  platform: string;
  
  // WebGL
  webglVendor: string;
  webglRenderer: string;
  webglVersion: string;
  webglExtensions: number;
  webglParams: Record<string, any>;
  webglHash: string;
  hardwareAcceleration: boolean;
  
  // Canvas/Audio
  canvasHash: string;
  canvasNoise: boolean;
  audioHash: string;
  audioNoise: boolean;
  
  // Fonts/Plugins
  fontsHash: string;
  fontsList: string[];
  pluginsCount: number;
  pluginsHash: string;
  
  // Touch
  touchSupport: boolean;
  maxTouchPoints: number;
  
  // Behavioral
  mouseMovements: number;
  mouseVelocities: number[];
  mouseAccelerations: number[];
  mousePath: { x: number; y: number; t: number }[];
  scrollEvents: number;
  scrollDepth: number;
  keypressEvents: number;
  clickEvents: number;
  timeOnPage: number;
  focusChanges: number;
  
  // Automation detection
  hasWebdriver: boolean;
  hasPhantom: boolean;
  hasSelenium: boolean;
  hasPuppeteer: boolean;
  hasPlaywright: boolean;
  hasCypress: boolean;
  hasNightmare: boolean;
  isHeadless: boolean;
  isAutomated: boolean;
  
  // Browser features
  doNotTrack: boolean;
  cookiesEnabled: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  openDatabase: boolean;
  cpuClass: string;
  navigatorPlatform: string;
  performanceEntries: number;
  
  // Network
  connectionType: string;
  connectionSpeed: string;
  connectionRtt: number;
  
  // Battery
  batteryLevel: number;
  batteryCharging: boolean;
  
  // Media
  mediaDevices: number;
  mediaDevicesHash: string;
  speechSynthesis: boolean;
  speechRecognition: boolean;
  webRTC: boolean;
  
  // Permissions
  permissions: string[];
  
  // Advanced
  screenOrientation: string;
  devicePixelRatio: number;
  pdfViewerEnabled: boolean;
  timingVariance: number;
  
  // NEW: Ultra-advanced detection
  mathConstants: string;
  dateTimestamp: number;
  errorStackPattern: string;
  proofOfWork: string;
  jsChallenge: number;
  domManipulationTime: number;
  memoryUsage: number;
  performanceTiming: Record<string, number>;
  intlFingerprint: string;
  cssMediaFingerprint: string;
  webWorkerSupport: boolean;
  sharedArrayBufferSupport: boolean;
  wasmSupport: boolean;
  serviceWorkerSupport: boolean;
  credentialsSupport: boolean;
  notificationPermission: string;
  clipboardSupport: boolean;
  gamepadsSupport: boolean;
  bluetoothSupport: boolean;
  usbSupport: boolean;
  serialSupport: boolean;
  hid: boolean;
  xr: boolean;
  
  // Browser consistency checks
  consistencyScore: number;
  inconsistencies: string[];
  
  // User-Agent analysis
  uaAnalysis: UserAgentAnalysis;
  
  // Headers analysis
  headersAnalysis: HeadersAnalysis;
  
  // Behavior analysis (NEW)
  behaviorAnalysis: BehaviorAnalysis;
}

// Proof of work - computational challenge
async function proofOfWork(): Promise<string> {
  const start = Date.now();
  let nonce = 0;
  const target = "000"; // Must find hash starting with this
  
  while (nonce < 100000) {
    const data = `lovable-${nonce}-${start}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash;
    }
    const hexHash = Math.abs(hash).toString(16).padStart(8, "0");
    if (hexHash.startsWith(target)) {
      return `${nonce}:${hexHash}:${Date.now() - start}ms`;
    }
    nonce++;
  }
  return `failed:${Date.now() - start}ms`;
}

// JavaScript challenge - timing-based
async function jsChallenge(): Promise<number> {
  const results: number[] = [];
  
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    
    // Complex operations that take different times on different environments
    let x = 0;
    for (let j = 0; j < 10000; j++) {
      x += Math.sin(j) * Math.cos(j);
    }
    
    const end = performance.now();
    results.push(end - start);
  }
  
  // Calculate variance
  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  const variance = results.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / results.length;
  
  return variance;
}

// DOM manipulation timing test
async function testDOMManipulation(): Promise<number> {
  const start = performance.now();
  
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.left = "-9999px";
  div.id = "test-" + Math.random();
  
  for (let i = 0; i < 100; i++) {
    const child = document.createElement("span");
    child.textContent = "test";
    div.appendChild(child);
  }
  
  document.body.appendChild(div);
  
  // Force reflow
  void div.offsetHeight;
  
  document.body.removeChild(div);
  
  return performance.now() - start;
}

// Math constants fingerprint
function getMathConstants(): string {
  const values = [
    Math.E,
    Math.LN2,
    Math.LN10,
    Math.LOG2E,
    Math.LOG10E,
    Math.PI,
    Math.SQRT1_2,
    Math.SQRT2,
    Math.sin(1),
    Math.cos(1),
    Math.tan(1),
    Math.asin(0.5),
    Math.acos(0.5),
    Math.atan(1),
    Math.exp(1),
    Math.expm1(1),
    Math.log(2),
    Math.log1p(1),
  ];
  
  let hash = 0;
  const str = values.map(v => v.toString()).join("|");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Error stack analysis
function getErrorStackPattern(): string {
  try {
    throw new Error("test");
  } catch (e) {
    const stack = (e as Error).stack || "";
    // Check for suspicious patterns in stack traces
    const patterns = [
      /puppeteer/i, /playwright/i, /selenium/i, /webdriver/i,
      /phantomjs/i, /headless/i, /zombie/i, /nightmare/i,
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(stack)) {
        return "automation_detected";
      }
    }
    
    // Return simplified pattern
    const lines = stack.split("\n").length;
    return `lines:${lines}`;
  }
}

// Intl API fingerprint
function getIntlFingerprint(): string {
  try {
    const dateFormat = new Intl.DateTimeFormat().resolvedOptions();
    const numberFormat = new Intl.NumberFormat().resolvedOptions();
    const collator = new Intl.Collator().resolvedOptions();
    
    const data = [
      dateFormat.locale,
      dateFormat.timeZone,
      dateFormat.calendar,
      numberFormat.locale,
      numberFormat.numberingSystem,
      collator.locale,
      collator.usage,
    ].join("|");
    
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  } catch {
    return "error";
  }
}

// CSS media query fingerprint
function getCSSMediaFingerprint(): string {
  const queries = [
    "(prefers-color-scheme: dark)",
    "(prefers-color-scheme: light)",
    "(prefers-reduced-motion: reduce)",
    "(prefers-contrast: high)",
    "(inverted-colors: inverted)",
    "(hover: hover)",
    "(pointer: fine)",
    "(pointer: coarse)",
    "(any-hover: hover)",
    "(any-pointer: fine)",
    "(display-mode: browser)",
    "(orientation: portrait)",
    "(orientation: landscape)",
  ];
  
  const results = queries.map(q => {
    try {
      return window.matchMedia(q).matches ? "1" : "0";
    } catch {
      return "e";
    }
  }).join("");
  
  return results;
}

// Performance timing analysis
function getPerformanceTiming(): Record<string, number> {
  try {
    const entries = performance.getEntriesByType("navigation");
    if (entries.length === 0) return {};
    
    const nav = entries[0] as PerformanceNavigationTiming;
    return {
      dns: nav.domainLookupEnd - nav.domainLookupStart,
      tcp: nav.connectEnd - nav.connectStart,
      ttfb: nav.responseStart - nav.requestStart,
      download: nav.responseEnd - nav.responseStart,
      domInteractive: nav.domInteractive - nav.responseEnd,
      domComplete: nav.domComplete - nav.domInteractive,
      load: nav.loadEventEnd - nav.loadEventStart,
    };
  } catch {
    return {};
  }
}

// Memory usage
function getMemoryUsage(): number {
  try {
    const memory = (performance as any).memory;
    if (memory) {
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
  } catch {}
  return -1;
}

// Browser consistency checker - now uses advanced UA analysis
function checkBrowserConsistency(fp: Partial<FingerprintData>): { score: number; issues: string[]; uaAnalysis: UserAgentAnalysis } {
  const issues: string[] = [];
  let score = 100;
  
  const ua = fp.userAgent || "";
  
  // Run advanced User-Agent analysis
  const uaAnalysis = analyzeUserAgent(ua);
  
  // Apply UA analysis penalties
  if (uaAnalysis.isCrawler) {
    issues.push("crawler_detected");
    score -= 50;
  }
  
  if (uaAnalysis.isBot) {
    issues.push("bot_detected");
    score -= 40;
  }
  
  if (uaAnalysis.isHeadless) {
    issues.push("headless_ua");
    score -= 35;
  }
  
  if (uaAnalysis.isHttpLibrary) {
    issues.push("http_library");
    score -= 50;
  }
  
  if (uaAnalysis.isAdVerification) {
    issues.push("ad_verification_bot");
    score -= 60;
  }
  
  if (uaAnalysis.isEmpty) {
    issues.push("empty_ua");
    score -= 50;
  }
  
  if (uaAnalysis.isGeneric) {
    issues.push("generic_ua");
    score -= 30;
  }
  
  // Add UA inconsistencies
  for (const inconsistency of uaAnalysis.inconsistencies) {
    issues.push(`ua_${inconsistency}`);
    score -= 10;
  }
  
  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edge|edg/i.test(ua);
  const isFirefox = /firefox/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome/i.test(ua);
  
  // Touch consistency
  if (isMobile && !fp.touchSupport) {
    issues.push("mobile_no_touch");
    score -= 15;
  }
  
  // Plugins - Chrome on desktop should have plugins
  if (isChrome && !isMobile && fp.pluginsCount === 0) {
    issues.push("chrome_no_plugins");
    score -= 10;
  }
  
  // WebGL - Should exist on modern browsers
  if (!fp.webglRenderer && !fp.webglVendor) {
    issues.push("no_webgl");
    score -= 15;
  }
  
  // Software rendering indicates headless
  if (fp.webglRenderer && /swiftshader|llvmpipe|mesa|software/i.test(fp.webglRenderer)) {
    issues.push("software_renderer");
    score -= 20;
  }
  
  // Hardware acceleration
  if (fp.hardwareAcceleration === false) {
    issues.push("no_hw_accel");
    score -= 10;
  }
  
  // Languages should exist
  if (!fp.languages || fp.languages.length === 0) {
    issues.push("no_languages");
    score -= 10;
  }
  
  // Platform mismatch
  if (fp.platform) {
    const platformMobile = /android|iphone|ipad|mobile/i.test(fp.platform);
    if (isMobile !== platformMobile) {
      issues.push("platform_mismatch");
      score -= 15;
    }
  }
  
  // Device memory should exist on Chrome
  if (isChrome && !fp.deviceMemory) {
    issues.push("chrome_no_device_memory");
    score -= 5;
  }
  
  // Common headless resolution
  if (fp.screenResolution === "800x600" || fp.screenResolution === "1024x768") {
    issues.push("headless_resolution");
    score -= 10;
  }
  
  // Timezone vs language consistency
  if (fp.timezone && fp.language) {
    const tzEurope = /europe/i.test(fp.timezone);
    const tzAsia = /asia/i.test(fp.timezone);
    const tzAmerica = /america/i.test(fp.timezone);
    const langZh = /zh/i.test(fp.language);
    const langJa = /ja/i.test(fp.language);
    const langEn = /en/i.test(fp.language);
    const langEs = /es/i.test(fp.language);
    const langPt = /pt/i.test(fp.language);
    
    // Suspicious combinations
    if (tzAsia && (langEn || langEs || langPt) && !langZh && !langJa) {
      // Could be legitimate, minor flag
    }
  }
  
  return { score: Math.max(0, score), issues, uaAnalysis };
}

// Canvas fingerprint with advanced detection
function getCanvasFingerprint(): { hash: string; hasNoise: boolean } {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { hash: "0", hasNoise: false };
    
    canvas.width = 300;
    canvas.height = 80;
    
    // Complex drawing
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    
    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, 300, 0);
    gradient.addColorStop(0, "red");
    gradient.addColorStop(0.5, "green");
    gradient.addColorStop(1, "blue");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 60, 300, 20);
    
    // Text with emoji and special chars
    ctx.fillStyle = "#069";
    ctx.font = "14px Arial, sans-serif";
    ctx.fillText("Cwm fjordbank 😃 glyphs vext quiz", 2, 17);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.font = "18px Times New Roman, serif";
    ctx.fillText("Cwm fjordbank glyphs vext quiz", 4, 45);
    
    // Curves and arcs
    ctx.beginPath();
    ctx.arc(250, 40, 30, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 0, 255, 0.5)";
    ctx.fill();
    
    // Bezier curve
    ctx.beginPath();
    ctx.moveTo(0, 70);
    ctx.bezierCurveTo(50, 20, 100, 80, 150, 40);
    ctx.strokeStyle = "#333";
    ctx.stroke();
    
    const dataUrl = canvas.toDataURL("image/png");
    
    // Noise detection - render twice and compare
    const canvas2 = document.createElement("canvas");
    const ctx2 = canvas2.getContext("2d");
    if (ctx2) {
      canvas2.width = 300;
      canvas2.height = 80;
      ctx2.textBaseline = "alphabetic";
      ctx2.fillStyle = "#f60";
      ctx2.fillRect(125, 1, 62, 20);
      ctx2.fillStyle = "#069";
      ctx2.font = "14px Arial, sans-serif";
      ctx2.fillText("Cwm fjordbank 😃 glyphs vext quiz", 2, 17);
    }
    const dataUrl2 = canvas2?.toDataURL("image/png") || "";
    
    // If they're different, anti-fingerprinting is active
    const hasNoise = dataUrl.substring(0, 500) !== dataUrl2.substring(0, 500);
    
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      hash = ((hash << 5) - hash) + dataUrl.charCodeAt(i);
      hash = hash & hash;
    }
    
    return { hash: Math.abs(hash).toString(16), hasNoise };
  } catch {
    return { hash: "0", hasNoise: false };
  }
}

// Advanced audio fingerprint
async function getAudioFingerprint(): Promise<{ hash: string; hasNoise: boolean }> {
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        resolve({ hash: "0", hasNoise: false });
        return;
      }
      
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const compressor = context.createDynamicsCompressor();
      
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;
      
      gainNode.gain.value = 0;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(10000, context.currentTime);
      
      oscillator.connect(compressor);
      compressor.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start(0);
      
      setTimeout(() => {
        const dataArray = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(dataArray);
        
        let hash = 0;
        let sum = 0;
        let uniqueValues = new Set<number>();
        
        for (let i = 0; i < dataArray.length; i++) {
          const val = dataArray[i] || 0;
          hash = ((hash << 5) - hash) + val;
          hash = hash & hash;
          sum += Math.abs(val);
          uniqueValues.add(Math.round(val * 100));
        }
        
        // Noise detection - all same values or zero indicates spoofing
        const hasNoise = sum === 0 || uniqueValues.size < 10;
        
        oscillator.stop();
        context.close();
        
        resolve({ hash: Math.abs(hash).toString(16), hasNoise });
      }, 100);
    } catch {
      resolve({ hash: "0", hasNoise: false });
    }
  });
}

// Advanced WebGL fingerprint
function getWebGLInfo(): { 
  vendor: string; 
  renderer: string; 
  version: string;
  extensions: number; 
  params: Record<string, any>;
  hasAcceleration: boolean;
  hash: string;
} {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || 
               canvas.getContext("webgl") || 
               canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
    
    if (!gl) return { vendor: "", renderer: "", version: "", extensions: 0, params: {}, hasAcceleration: false, hash: "0" };
    
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const version = gl.getParameter(gl.VERSION) || "";
    const extensions = gl.getSupportedExtensions()?.length || 0;
    
    const params: Record<string, any> = {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxViewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS) || []),
      aliasedLineWidthRange: Array.from(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE) || []),
      aliasedPointSizeRange: Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) || []),
      maxCombinedTextureUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      stencilBits: gl.getParameter(gl.STENCIL_BITS),
      depthBits: gl.getParameter(gl.DEPTH_BITS),
    };
    
    const hasAcceleration = !renderer.includes("SwiftShader") && 
                           !renderer.includes("llvmpipe") && 
                           !renderer.includes("Software") &&
                           !renderer.includes("Mesa");
    
    // Create hash of all params
    const hashData = [vendor, renderer, version, ...Object.values(params).map(String)].join("|");
    let hash = 0;
    for (let i = 0; i < hashData.length; i++) {
      hash = ((hash << 5) - hash) + hashData.charCodeAt(i);
      hash = hash & hash;
    }
    
    return { vendor, renderer, version, extensions, params, hasAcceleration, hash: Math.abs(hash).toString(16) };
  } catch {
    return { vendor: "", renderer: "", version: "", extensions: 0, params: {}, hasAcceleration: false, hash: "0" };
  }
}

// Font detection
function getFontsFingerprint(): { hash: string; fonts: string[] } {
  const testFonts = [
    "Arial", "Verdana", "Times New Roman", "Courier New", "Georgia",
    "Comic Sans MS", "Impact", "Trebuchet MS", "Lucida Console",
    "Palatino Linotype", "Tahoma", "Century Gothic", "Garamond",
    "Bookman Old Style", "Arial Black", "Arial Narrow", "Brush Script MT",
    "Copperplate", "Papyrus", "Lucida Sans Unicode", "MS Gothic",
    "MS Mincho", "Segoe UI", "Calibri", "Cambria", "Consolas",
    "Helvetica", "Monaco", "Menlo", "Fira Code", "Source Code Pro",
  ];
  
  const baseFonts = ["monospace", "sans-serif", "serif"];
  const testString = "mmmmmmmmmmlli";
  const testSize = "72px";
  
  const span = document.createElement("span");
  span.style.cssText = "position:absolute;left:-9999px;visibility:hidden;";
  span.style.fontSize = testSize;
  span.innerHTML = testString;
  document.body.appendChild(span);
  
  const baseWidths: Record<string, number> = {};
  baseFonts.forEach(font => {
    span.style.fontFamily = font;
    baseWidths[font] = span.offsetWidth;
  });
  
  const detectedFonts: string[] = [];
  testFonts.forEach(font => {
    for (const baseFont of baseFonts) {
      span.style.fontFamily = `'${font}', ${baseFont}`;
      if (span.offsetWidth !== baseWidths[baseFont]) {
        detectedFonts.push(font);
        break;
      }
    }
  });
  
  document.body.removeChild(span);
  
  let hash = 0;
  const str = detectedFonts.join(",");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  
  return { hash: Math.abs(hash).toString(16), fonts: detectedFonts };
}

// Plugin fingerprint
function getPluginsFingerprint(): { count: number; hash: string } {
  const plugins = navigator.plugins;
  const pluginData: string[] = [];
  
  for (let i = 0; i < plugins.length; i++) {
    const p = plugins[i];
    pluginData.push(`${p.name}|${p.description}|${p.filename}`);
  }
  
  let hash = 0;
  const str = pluginData.join("||");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  
  return { count: plugins.length, hash: Math.abs(hash).toString(16) };
}

// Media devices fingerprint
async function getMediaDevicesFingerprint(): Promise<{ count: number; hash: string }> {
  try {
    const devices = await navigator.mediaDevices?.enumerateDevices();
    if (!devices) return { count: 0, hash: "0" };
    
    const deviceData = devices.map(d => `${d.kind}|${d.groupId}`).join("||");
    let hash = 0;
    for (let i = 0; i < deviceData.length; i++) {
      hash = ((hash << 5) - hash) + deviceData.charCodeAt(i);
      hash = hash & hash;
    }
    
    return { count: devices.length, hash: Math.abs(hash).toString(16) };
  } catch {
    return { count: 0, hash: "0" };
  }
}

// Ultra-advanced automation detection
function detectAutomation(): {
  hasWebdriver: boolean;
  hasPhantom: boolean;
  hasSelenium: boolean;
  hasPuppeteer: boolean;
  hasPlaywright: boolean;
  hasCypress: boolean;
  hasNightmare: boolean;
  isHeadless: boolean;
  isAutomated: boolean;
} {
  const nav = navigator as any;
  const win = window as any;
  const doc = document as any;
  
  // Comprehensive webdriver detection
  const webdriverChecks = [
    nav.webdriver === true,
    nav.webdriver === "true",
    !!win.document.$cdc_asdjflasutopfhvcZLmcfl_,
    !!win.document.$wdc_,
    !!win.document.$chrome_asyncScriptInfo,
    !!win.__webdriver_evaluate,
    !!win.__selenium_evaluate,
    !!win.__webdriver_script_function,
    !!win.__webdriver_script_func,
    !!win.__webdriver_script_fn,
    !!win.__fxdriver_evaluate,
    !!win.__driver_unwrapped,
    !!win.__webdriver_unwrapped,
    !!win.__driver_evaluate,
    !!win.__selenium_unwrapped,
    !!win.__fxdriver_unwrapped,
    doc.documentElement?.hasAttribute?.("webdriver"),
    doc.documentElement?.hasAttribute?.("driver"),
    !!doc.__webdriver_script_fn,
    !!doc.$chrome_asyncScriptInfo,
    !!doc.__driver_evaluate,
    !!doc.__webdriver_evaluate,
    !!doc.__selenium_evaluate,
    !!doc.__fxdriver_evaluate,
    !!doc.__driver_unwrapped,
    !!doc.__webdriver_unwrapped,
    !!doc.__selenium_unwrapped,
    !!doc.__fxdriver_unwrapped,
    /webdriver|driver/i.test(Object.keys(doc).join("")),
  ];
  const hasWebdriver = webdriverChecks.some(Boolean);
  
  // Phantom detection - more strict, only check for definitive PhantomJS signatures
  const hasPhantom = !!(
    typeof win.callPhantom === 'function' || // Only function, not just property
    win._phantom?.version || // Only if it has version property
    /PhantomJS/i.test(nav.userAgent) // Exact match in UA
  );
  
  // Selenium detection
  const hasSelenium = !!(
    win.__nightmare ||
    win._Selenium_IDE_Recorder ||
    win._selenium ||
    win.calledSelenium ||
    doc.documentElement?.getAttribute?.("selenium") ||
    /selenium/i.test(Error().stack || "")
  );
  
  // Puppeteer detection
  const hasPuppeteer = !!(
    win.__puppeteer_evaluation_script__ ||
    /puppeteer/i.test(Error().stack || "")
  );
  
  // Playwright detection
  const hasPlaywright = !!(
    win.__playwright ||
    win._playwrightBinding ||
    /playwright/i.test(Error().stack || "")
  );
  
  // Cypress detection
  const hasCypress = !!(
    win.Cypress ||
    win.cy ||
    win.__cypress ||
    win.parent?.Cypress
  );
  
  // Nightmare detection
  const hasNightmare = !!(win.__nightmare);
  
  // Headless detection - require more signals for certainty
  const ua = nav.userAgent || "";
  const headlessChecks = [
    /HeadlessChrome/i.test(ua),
    /PhantomJS/i.test(ua),
    /Headless/i.test(ua),
    nav.webdriver === true,
    typeof win.outerWidth === "undefined" || win.outerWidth === 0,
    typeof win.outerHeight === "undefined" || win.outerHeight === 0,
  ];
  // Require at least 2 definitive signals, not soft signals like plugins
  const isHeadless = headlessChecks.filter(Boolean).length >= 2;
  
  // Only mark as automated if we have definitive webdriver or explicit automation tool
  const isAutomated = hasWebdriver || hasPuppeteer || hasPlaywright || hasCypress;
  
  return { 
    hasWebdriver, hasPhantom, hasSelenium, 
    hasPuppeteer, hasPlaywright, hasCypress, hasNightmare,
    isHeadless, isAutomated 
  };
}

// Check for various browser APIs
async function checkBrowserAPIs(): Promise<{
  webWorkerSupport: boolean;
  sharedArrayBufferSupport: boolean;
  wasmSupport: boolean;
  serviceWorkerSupport: boolean;
  credentialsSupport: boolean;
  notificationPermission: string;
  clipboardSupport: boolean;
  gamepadsSupport: boolean;
  bluetoothSupport: boolean;
  usbSupport: boolean;
  serialSupport: boolean;
  hid: boolean;
  xr: boolean;
}> {
  return {
    webWorkerSupport: typeof Worker !== "undefined",
    sharedArrayBufferSupport: typeof SharedArrayBuffer !== "undefined",
    wasmSupport: typeof WebAssembly !== "undefined",
    serviceWorkerSupport: "serviceWorker" in navigator,
    credentialsSupport: "credentials" in navigator,
    notificationPermission: (Notification as any)?.permission || "default",
    clipboardSupport: "clipboard" in navigator,
    gamepadsSupport: "getGamepads" in navigator,
    bluetoothSupport: "bluetooth" in navigator,
    usbSupport: "usb" in navigator,
    serialSupport: "serial" in navigator,
    hid: "hid" in navigator,
    xr: "xr" in navigator,
  };
}

// Connection info
function getConnectionInfo(): { type: string; speed: string; rtt: number } {
  const conn = (navigator as any).connection || 
               (navigator as any).mozConnection || 
               (navigator as any).webkitConnection;
  
  if (!conn) return { type: "unknown", speed: "unknown", rtt: -1 };
  
  return {
    type: conn.type || conn.effectiveType || "unknown",
    speed: conn.downlink ? `${conn.downlink}Mbps` : "unknown",
    rtt: conn.rtt || -1,
  };
}

// Battery info
async function getBatteryInfo(): Promise<{ level: number; charging: boolean }> {
  try {
    const battery = await (navigator as any).getBattery?.();
    if (battery) {
      return { level: battery.level, charging: battery.charging };
    }
  } catch {}
  return { level: -1, charging: false };
}

// Permissions check
async function checkPermissions(): Promise<string[]> {
  const permissions: string[] = [];
  const toCheck = ["geolocation", "notifications", "camera", "microphone", "push"];
  
  for (const name of toCheck) {
    try {
      const result = await navigator.permissions.query({ name: name as PermissionName });
      permissions.push(`${name}:${result.state}`);
    } catch {}
  }
  
  return permissions;
}

// Timing variance measurement
async function measureTimingVariance(): Promise<number> {
  const iterations = 10;
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    Math.random();
    const end = performance.now();
    times.push(end - start);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / times.length;
  
  return variance;
}

export default function CloakerRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Carregando...");
  
  const startTime = useRef(Date.now());
  const mouseMovements = useRef(0);
  const mouseVelocities = useRef<number[]>([]);
  const mouseAccelerations = useRef<number[]>([]);
  const mousePath = useRef<{ x: number; y: number; t: number }[]>([]);
  const lastMousePos = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastVelocity = useRef(0);
  const scrollEvents = useRef(0);
  const maxScrollDepth = useRef(0);
  const keypressEvents = useRef(0);
  const clickEvents = useRef(0);
  const focusChanges = useRef(0);
  const hasRedirected = useRef(false);

  // Behavioral tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseMovements.current++;
      
      const now = Date.now();
      const pos = { x: e.clientX, y: e.clientY, t: now };
      
      if (mousePath.current.length < 100) {
        mousePath.current.push(pos);
      }
      
      if (lastMousePos.current) {
        const dt = now - lastMousePos.current.t;
        if (dt > 0) {
          const dx = pos.x - lastMousePos.current.x;
          const dy = pos.y - lastMousePos.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const velocity = distance / dt;
          
          if (mouseVelocities.current.length < 200) {
            mouseVelocities.current.push(velocity);
          }
          
          // Calculate acceleration
          const acceleration = (velocity - lastVelocity.current) / dt;
          if (mouseAccelerations.current.length < 200) {
            mouseAccelerations.current.push(Math.abs(acceleration));
          }
          
          lastVelocity.current = velocity;
        }
      }
      lastMousePos.current = pos;
    };
    
    const handleScroll = () => {
      scrollEvents.current++;
      const maxScroll = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ) - window.innerHeight;
      const scrollPercent = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
      if (scrollPercent > maxScrollDepth.current) {
        maxScrollDepth.current = scrollPercent;
      }
    };
    
    const handleKeypress = () => keypressEvents.current++;
    const handleClick = () => clickEvents.current++;
    const handleFocus = () => focusChanges.current++;
    
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("keypress", handleKeypress);
    document.addEventListener("keydown", handleKeypress);
    document.addEventListener("click", handleClick);
    document.addEventListener("touchstart", handleClick, { passive: true });
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleFocus);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("scroll", handleScroll);
      document.removeEventListener("keypress", handleKeypress);
      document.removeEventListener("keydown", handleKeypress);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("touchstart", handleClick);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleFocus);
    };
  }, []);

  const collectFingerprint = useCallback(async (): Promise<FingerprintData> => {
    // Ultra-fast timeout (50ms max for any async operation)
    const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
      ]);
    };

    // ALL synchronous operations - instant
    const automation = detectAutomation();
    const connectionInfo = getConnectionInfo();
    const memoryUsage = getMemoryUsage();
    const mathConstants = getMathConstants();
    const errorStackPattern = getErrorStackPattern();
    const intlFingerprint = getIntlFingerprint();
    const cssMediaFingerprint = getCSSMediaFingerprint();
    const webgl = getWebGLInfo();
    const canvasResult = getCanvasFingerprint();
    const fontsResult = getFontsFingerprint();
    const pluginsResult = getPluginsFingerprint();
    const performanceTiming = getPerformanceTiming();
    
    // Fast browser API check (sync version)
    const browserAPIs = {
      webWorkerSupport: typeof Worker !== "undefined",
      sharedArrayBufferSupport: typeof SharedArrayBuffer !== "undefined",
      wasmSupport: typeof WebAssembly !== "undefined",
      serviceWorkerSupport: "serviceWorker" in navigator,
      credentialsSupport: "credentials" in navigator,
      notificationPermission: (Notification as any)?.permission || "default",
      clipboardSupport: "clipboard" in navigator,
      gamepadsSupport: "getGamepads" in navigator,
      bluetoothSupport: "bluetooth" in navigator,
      usbSupport: "usb" in navigator,
      serialSupport: "serial" in navigator,
      hid: "hid" in navigator,
      xr: "xr" in navigator,
    };
    
    // Only critical async ops with 50ms timeout max
    const [audioResult, mediaDevices, batteryInfo] = await Promise.all([
      withTimeout(getAudioFingerprint(), 50, { hash: "", hasNoise: false }),
      withTimeout(getMediaDevicesFingerprint(), 50, { count: 0, hash: "" }),
      withTimeout(getBatteryInfo(), 30, { level: 0, charging: false }),
    ]);
    
    const partialFp: Partial<FingerprintData> = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: Array.from(navigator.languages || []),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
      webglRenderer: webgl.renderer,
      webglVendor: webgl.vendor,
      pluginsCount: pluginsResult.count,
      touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      screenResolution: `${screen.width}x${screen.height}`,
      hardwareAcceleration: webgl.hasAcceleration,
      deviceMemory: (navigator as any).deviceMemory || 0,
    };
    
    const consistency = checkBrowserConsistency(partialFp);
    
    // Collect headers analysis (browser-side can't access request headers,
    // but we can simulate/prepare the data structure)
    // The actual headers analysis will be done server-side in the edge function
    const headersData: HeadersData = {
      acceptLanguage: navigator.language,
      userAgent: navigator.userAgent,
    };
    const headersResult = analyzeHeaders(headersData, navigator.userAgent);
    
    // Collect behavior analysis
    const behaviorData: BehaviorData = {
      mouseMovements: mouseMovements.current,
      mouseVelocities: mouseVelocities.current.slice(-100),
      mouseAccelerations: mouseAccelerations.current.slice(-100),
      mousePath: mousePath.current.slice(-100),
      scrollEvents: scrollEvents.current,
      scrollDepth: maxScrollDepth.current,
      keypressEvents: keypressEvents.current,
      clickEvents: clickEvents.current,
      focusChanges: focusChanges.current,
      timeOnPage: Date.now() - startTime.current,
    };
    const behaviorResult = analyzeBehavior(behaviorData);
    
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: Array.from(navigator.languages || []),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      screenResolution: `${screen.width}x${screen.height}`,
      availableScreenResolution: `${screen.availWidth}x${screen.availHeight}`,
      colorDepth: screen.colorDepth,
      deviceMemory: (navigator as any).deviceMemory || 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      platform: navigator.platform,
      
      webglVendor: webgl.vendor,
      webglRenderer: webgl.renderer,
      webglVersion: webgl.version,
      webglExtensions: webgl.extensions,
      webglParams: webgl.params,
      webglHash: webgl.hash,
      hardwareAcceleration: webgl.hasAcceleration,
      
      canvasHash: canvasResult.hash,
      canvasNoise: canvasResult.hasNoise,
      audioHash: audioResult.hash,
      audioNoise: audioResult.hasNoise,
      
      fontsHash: fontsResult.hash,
      fontsList: fontsResult.fonts,
      pluginsCount: pluginsResult.count,
      pluginsHash: pluginsResult.hash,
      
      touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      
      mouseMovements: mouseMovements.current,
      mouseVelocities: mouseVelocities.current.slice(-50),
      mouseAccelerations: mouseAccelerations.current.slice(-50),
      mousePath: mousePath.current.slice(-50),
      scrollEvents: scrollEvents.current,
      scrollDepth: maxScrollDepth.current,
      keypressEvents: keypressEvents.current,
      clickEvents: clickEvents.current,
      timeOnPage: Date.now() - startTime.current,
      focusChanges: focusChanges.current,
      
      ...automation,
      
      doNotTrack: navigator.doNotTrack === "1",
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      indexedDB: !!window.indexedDB,
      openDatabase: !!(window as any).openDatabase,
      cpuClass: (navigator as any).cpuClass || "",
      navigatorPlatform: navigator.platform,
      performanceEntries: performance.getEntries?.()?.length || 0,
      
      connectionType: connectionInfo.type,
      connectionSpeed: connectionInfo.speed,
      connectionRtt: connectionInfo.rtt,
      
      batteryLevel: batteryInfo.level,
      batteryCharging: batteryInfo.charging,
      
      mediaDevices: mediaDevices.count,
      mediaDevicesHash: mediaDevices.hash,
      speechSynthesis: "speechSynthesis" in window,
      speechRecognition: "webkitSpeechRecognition" in window || "SpeechRecognition" in window,
      webRTC: "RTCPeerConnection" in window,
      
      permissions: [],
      
      screenOrientation: screen.orientation?.type || "unknown",
      devicePixelRatio: window.devicePixelRatio || 1,
      pdfViewerEnabled: (navigator as any).pdfViewerEnabled ?? false,
      timingVariance: 0,
      
      mathConstants,
      dateTimestamp: Date.now(),
      errorStackPattern,
      proofOfWork: "skipped",
      jsChallenge: 0,
      domManipulationTime: 0,
      memoryUsage,
      performanceTiming,
      intlFingerprint,
      cssMediaFingerprint,
      ...browserAPIs,
      
      consistencyScore: consistency.score,
      inconsistencies: consistency.issues,
      uaAnalysis: consistency.uaAnalysis,
      headersAnalysis: headersResult,
      behaviorAnalysis: behaviorResult,
    };
  }, []);

  const handleRedirect = useCallback(async () => {
    if (!slug || hasRedirected.current) return;
    hasRedirected.current = true;

    try {
      setStatus("Verificando...");
      
      // Ultra-fast fingerprint collection - no delay
      const fingerprint = await collectFingerprint();

      const { data, error: fnError } = await supabase.functions.invoke("cloaker-redirect", {
        body: { slug, fingerprint },
      });

      if (fnError) throw fnError;

      if (data?.redirectUrl) {
        window.location.replace(data.redirectUrl);
      } else {
        setError("Página não encontrada");
      }
    } catch (err) {
      console.error("Redirect error:", err);
      setError("Erro ao carregar");
    }
  }, [slug, collectFingerprint]);

  // Start immediately, no delay
  useEffect(() => {
    handleRedirect();
  }, [handleRedirect]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-neutral-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-500 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-neutral-400 text-xs">{status}</p>
      </div>
    </div>
  );
}
