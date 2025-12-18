import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface FingerprintData {
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
  webglVendor: string;
  webglRenderer: string;
  webglVersion: string;
  canvasHash: string;
  audioHash: string;
  fontsHash: string;
  pluginsCount: number;
  pluginsHash: string;
  touchSupport: boolean;
  maxTouchPoints: number;
  mouseMovements: number;
  mouseVelocities: number[];
  scrollEvents: number;
  scrollDepth: number;
  keypressEvents: number;
  clickEvents: number;
  timeOnPage: number;
  focusChanges: number;
  hasWebdriver: boolean;
  hasPhantom: boolean;
  hasSelenium: boolean;
  hasPuppeteer: boolean;
  hasPlaywright: boolean;
  hasCypress: boolean;
  isHeadless: boolean;
  isAutomated: boolean;
  doNotTrack: boolean;
  cookiesEnabled: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  addBehavior: boolean;
  openDatabase: boolean;
  cpuClass: string;
  navigatorPlatform: string;
  webglExtensions: number;
  performanceEntries: number;
  connectionType: string;
  connectionSpeed: string;
  batteryLevel: number;
  batteryCharging: boolean;
  mediaDevices: number;
  speechSynthesis: boolean;
  webRTC: boolean;
  permissions: string[];
  canvasNoise: boolean;
  audioNoise: boolean;
  screenOrientation: string;
  devicePixelRatio: number;
  hardwareAcceleration: boolean;
  pdfViewerEnabled: boolean;
  webglParams: Record<string, any>;
  fontsList: string[];
  timingAttack: number;
  mousePath: { x: number; y: number; t: number }[];
}

// Canvas fingerprint with noise detection
function getCanvasFingerprint(): { hash: string; hasNoise: boolean } {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { hash: "0", hasNoise: false };
    
    canvas.width = 280;
    canvas.height = 60;
    
    // Complex canvas drawing for unique fingerprint
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.font = "11pt Arial";
    ctx.fillText("Cwm fjordbank glyphs vext quiz, 😃", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.font = "18pt Arial";
    ctx.fillText("Cwm fjordbank glyphs vext quiz, 😃", 4, 45);
    
    // Add gradients and shadows
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "red");
    gradient.addColorStop(0.5, "green");
    gradient.addColorStop(1, "blue");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 50, canvas.width, 10);
    
    // Arc and curves
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    
    const dataUrl = canvas.toDataURL();
    
    // Check for canvas noise (anti-fingerprinting)
    const canvas2 = document.createElement("canvas");
    const ctx2 = canvas2.getContext("2d");
    if (ctx2) {
      canvas2.width = 280;
      canvas2.height = 60;
      ctx2.textBaseline = "alphabetic";
      ctx2.fillStyle = "#f60";
      ctx2.fillRect(125, 1, 62, 20);
      ctx2.fillStyle = "#069";
      ctx2.font = "11pt Arial";
      ctx2.fillText("Cwm fjordbank glyphs vext quiz, 😃", 2, 15);
    }
    const dataUrl2 = canvas2?.toDataURL() || "";
    const hasNoise = dataUrl !== dataUrl2;
    
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

// Audio fingerprint with noise detection
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
        
        // Calculate hash
        let hash = 0;
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = dataArray[i] || 0;
          hash = ((hash << 5) - hash) + val;
          hash = hash & hash;
          sum += Math.abs(val);
        }
        
        // Check for noise (anti-fingerprinting plugins modify audio)
        const hasNoise = sum === 0 || dataArray.every(v => v === dataArray[0]);
        
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
} {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || 
               canvas.getContext("webgl") || 
               canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
    
    if (!gl) return { vendor: "", renderer: "", version: "", extensions: 0, params: {}, hasAcceleration: false };
    
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "";
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "";
    const version = gl.getParameter(gl.VERSION) || "";
    const extensions = gl.getSupportedExtensions()?.length || 0;
    
    // Additional WebGL parameters for fingerprinting
    const params = {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
      aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
      maxCombinedTextureUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
    };
    
    // Hardware acceleration check
    const hasAcceleration = !renderer.includes("SwiftShader") && 
                           !renderer.includes("llvmpipe") && 
                           !renderer.includes("Software");
    
    return { vendor, renderer, version, extensions, params, hasAcceleration };
  } catch {
    return { vendor: "", renderer: "", version: "", extensions: 0, params: {}, hasAcceleration: false };
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
    "MS Mincho", "Segoe UI", "Calibri", "Cambria", "Consolas"
  ];
  
  const baseFonts = ["monospace", "sans-serif", "serif"];
  const testString = "mmmmmmmmmmlli";
  const testSize = "72px";
  
  const span = document.createElement("span");
  span.style.position = "absolute";
  span.style.left = "-9999px";
  span.style.fontSize = testSize;
  span.style.visibility = "hidden";
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

// Plugins fingerprint
function getPluginsFingerprint(): { count: number; hash: string } {
  const plugins = navigator.plugins;
  const pluginNames: string[] = [];
  
  for (let i = 0; i < plugins.length; i++) {
    pluginNames.push(plugins[i].name + plugins[i].description);
  }
  
  let hash = 0;
  const str = pluginNames.join("|");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  
  return { count: plugins.length, hash: Math.abs(hash).toString(16) };
}

// Advanced automation detection
function detectAutomation(): {
  hasWebdriver: boolean;
  hasPhantom: boolean;
  hasSelenium: boolean;
  hasPuppeteer: boolean;
  hasPlaywright: boolean;
  hasCypress: boolean;
  isHeadless: boolean;
  isAutomated: boolean;
} {
  const nav = navigator as any;
  const win = window as any;
  const doc = document as any;
  
  // Webdriver detection (multiple methods)
  const hasWebdriver = !!(
    nav.webdriver === true || 
    nav.webdriver === "true" ||
    win.document.$cdc_asdjflasutopfhvcZLmcfl_ ||
    win.document.$wdc_ ||
    win.__webdriver_evaluate ||
    win.__selenium_evaluate ||
    win.__webdriver_script_function ||
    win.__webdriver_script_func ||
    win.__webdriver_script_fn ||
    win.__fxdriver_evaluate ||
    win.__driver_unwrapped ||
    win.__webdriver_unwrapped ||
    win.__driver_evaluate ||
    win.__selenium_unwrapped ||
    win.__fxdriver_unwrapped ||
    doc.documentElement.hasAttribute("webdriver") ||
    doc.__webdriver_script_fn ||
    doc.$chrome_asyncScriptInfo
  );
  
  // Phantom detection
  const hasPhantom = !!(
    win.callPhantom || 
    win._phantom || 
    win.phantom ||
    win.__phantomas
  );
  
  // Selenium detection
  const hasSelenium = !!(
    win.__nightmare ||
    doc.documentElement.getAttribute("selenium") ||
    doc.documentElement.getAttribute("webdriver") ||
    doc.documentElement.getAttribute("driver") ||
    win._Selenium_IDE_Recorder ||
    win._selenium ||
    win.calledSelenium ||
    /[\s\S]*selenium[\s\S]*/i.test(Error().stack || "")
  );
  
  // Puppeteer detection
  const hasPuppeteer = !!(
    win.__puppeteer_evaluation_script__ ||
    nav.webdriver
  );
  
  // Playwright detection
  const hasPlaywright = !!(
    win.__playwright ||
    win._playwrightBinding
  );
  
  // Cypress detection
  const hasCypress = !!(
    win.Cypress ||
    win.cy ||
    win.__cypress
  );
  
  // Headless detection (comprehensive)
  const userAgent = nav.userAgent || "";
  const isHeadlessUA = /HeadlessChrome|PhantomJS|Headless/i.test(userAgent);
  
  // Check for missing browser features that indicate headless
  const hasNoPlugins = nav.plugins?.length === 0 && !/mobile|android|iphone/i.test(userAgent);
  const hasNoLanguages = !nav.languages || nav.languages.length === 0;
  const hasNoMimeTypes = !nav.mimeTypes || nav.mimeTypes.length === 0;
  
  // Chrome-specific checks
  const hasChrome = win.chrome;
  const hasChromeRuntime = hasChrome && win.chrome.runtime;
  const hasChromeLoadTimes = hasChrome && (win.chrome.loadTimes || win.chrome.csi);
  
  // Permissions API check (bots often lack this)
  const hasPermissions = nav.permissions && typeof nav.permissions.query === 'function';
  
  // Notification check
  const hasNotifications = 'Notification' in win && Notification.permission !== 'default';
  
  const isHeadless = isHeadlessUA || 
    (hasNoPlugins && !hasChromeLoadTimes) ||
    (hasNoLanguages && hasNoMimeTypes);
  
  // Combined automation signal
  const isAutomated = hasWebdriver || hasPhantom || hasSelenium || 
                      hasPuppeteer || hasPlaywright || hasCypress;
  
  return { 
    hasWebdriver, hasPhantom, hasSelenium, 
    hasPuppeteer, hasPlaywright, hasCypress,
    isHeadless, isAutomated 
  };
}

// Timing attack detection
async function measureTimingAttack(): Promise<number> {
  const iterations = 10;
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    // Simple operation
    Math.random();
    const end = performance.now();
    times.push(end - start);
  }
  
  // Calculate variance - bots often have very consistent timing
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / times.length;
  
  return variance;
}

// Get connection info
function getConnectionInfo(): { type: string; speed: string } {
  const conn = (navigator as any).connection || 
               (navigator as any).mozConnection || 
               (navigator as any).webkitConnection;
  
  if (!conn) return { type: "unknown", speed: "unknown" };
  
  return {
    type: conn.type || conn.effectiveType || "unknown",
    speed: conn.downlink ? `${conn.downlink}Mbps` : "unknown"
  };
}

// Get battery info
async function getBatteryInfo(): Promise<{ level: number; charging: boolean }> {
  try {
    const battery = await (navigator as any).getBattery?.();
    if (battery) {
      return { level: battery.level, charging: battery.charging };
    }
  } catch {}
  return { level: -1, charging: false };
}

// Get media devices count
async function getMediaDevicesCount(): Promise<number> {
  try {
    const devices = await navigator.mediaDevices?.enumerateDevices();
    return devices?.length || 0;
  } catch {
    return 0;
  }
}

// Check permissions
async function checkPermissions(): Promise<string[]> {
  const permissions: string[] = [];
  const toCheck = ['geolocation', 'notifications', 'camera', 'microphone'];
  
  for (const name of toCheck) {
    try {
      const result = await navigator.permissions.query({ name: name as PermissionName });
      permissions.push(`${name}:${result.state}`);
    } catch {}
  }
  
  return permissions;
}

export default function CloakerRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Carregando...");
  
  const startTime = useRef(Date.now());
  const mouseMovements = useRef(0);
  const mouseVelocities = useRef<number[]>([]);
  const mousePath = useRef<{ x: number; y: number; t: number }[]>([]);
  const lastMousePos = useRef<{ x: number; y: number; t: number } | null>(null);
  const scrollEvents = useRef(0);
  const maxScrollDepth = useRef(0);
  const keypressEvents = useRef(0);
  const clickEvents = useRef(0);
  const focusChanges = useRef(0);
  const hasRedirected = useRef(false);

  // Track behavioral signals with advanced metrics
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseMovements.current++;
      
      const now = Date.now();
      const pos = { x: e.clientX, y: e.clientY, t: now };
      
      // Store path (limited to last 50 points)
      if (mousePath.current.length < 50) {
        mousePath.current.push(pos);
      }
      
      // Calculate velocity
      if (lastMousePos.current) {
        const dt = now - lastMousePos.current.t;
        if (dt > 0) {
          const dx = pos.x - lastMousePos.current.x;
          const dy = pos.y - lastMousePos.current.y;
          const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
          if (mouseVelocities.current.length < 100) {
            mouseVelocities.current.push(velocity);
          }
        }
      }
      lastMousePos.current = pos;
    };
    
    const handleScroll = () => {
      scrollEvents.current++;
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
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
    document.addEventListener("click", handleClick);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleFocus);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("scroll", handleScroll);
      document.removeEventListener("keypress", handleKeypress);
      document.removeEventListener("click", handleClick);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleFocus);
    };
  }, []);

  const collectFingerprint = useCallback(async (): Promise<FingerprintData> => {
    const webgl = getWebGLInfo();
    const automation = detectAutomation();
    const audioResult = await getAudioFingerprint();
    const canvasResult = getCanvasFingerprint();
    const fontsResult = getFontsFingerprint();
    const pluginsResult = getPluginsFingerprint();
    const connectionInfo = getConnectionInfo();
    const batteryInfo = await getBatteryInfo();
    const mediaDevices = await getMediaDevicesCount();
    const permissions = await checkPermissions();
    const timingVariance = await measureTimingAttack();
    
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
      canvasHash: canvasResult.hash,
      audioHash: audioResult.hash,
      fontsHash: fontsResult.hash,
      pluginsCount: pluginsResult.count,
      pluginsHash: pluginsResult.hash,
      touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      mouseMovements: mouseMovements.current,
      mouseVelocities: mouseVelocities.current.slice(-20),
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
      addBehavior: !!(document.body as any)?.addBehavior,
      openDatabase: !!(window as any).openDatabase,
      cpuClass: (navigator as any).cpuClass || "",
      navigatorPlatform: navigator.platform,
      webglExtensions: webgl.extensions,
      performanceEntries: performance.getEntries?.()?.length || 0,
      connectionType: connectionInfo.type,
      connectionSpeed: connectionInfo.speed,
      batteryLevel: batteryInfo.level,
      batteryCharging: batteryInfo.charging,
      mediaDevices,
      speechSynthesis: 'speechSynthesis' in window,
      webRTC: 'RTCPeerConnection' in window,
      permissions,
      canvasNoise: canvasResult.hasNoise,
      audioNoise: audioResult.hasNoise,
      screenOrientation: screen.orientation?.type || "unknown",
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareAcceleration: webgl.hasAcceleration,
      pdfViewerEnabled: (navigator as any).pdfViewerEnabled ?? false,
      webglParams: webgl.params,
      fontsList: fontsResult.fonts,
      timingAttack: timingVariance,
      mousePath: mousePath.current.slice(-30),
    };
  }, []);

  const handleRedirect = useCallback(async () => {
    if (!slug || hasRedirected.current) return;
    hasRedirected.current = true;

    try {
      setStatus("Verificando segurança...");
      
      // Longer delay to collect more behavioral data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatus("Analisando...");
      const fingerprint = await collectFingerprint();

      const { data, error: fnError } = await supabase.functions.invoke("cloaker-redirect", {
        body: { slug, fingerprint },
      });

      if (fnError) throw fnError;

      if (data?.redirectUrl) {
        setStatus("Redirecionando...");
        window.location.replace(data.redirectUrl);
      } else {
        setError("Página não encontrada");
      }
    } catch (err) {
      console.error("Redirect error:", err);
      setError("Erro ao carregar");
    }
  }, [slug, collectFingerprint]);

  useEffect(() => {
    const timer = setTimeout(handleRedirect, 500);
    return () => clearTimeout(timer);
  }, [handleRedirect]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-neutral-500 text-sm">{error}</p>
      </div>
    );
  }

  // Minimal, innocent-looking loading page
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-500 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-neutral-400 text-xs">{status}</p>
      </div>
    </div>
  );
}
