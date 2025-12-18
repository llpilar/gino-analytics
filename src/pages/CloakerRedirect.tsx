import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface FingerprintData {
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  deviceMemory: number;
  hardwareConcurrency: number;
  platform: string;
  webglVendor: string;
  webglRenderer: string;
  canvasHash: string;
  audioHash: string;
  fontsHash: string;
  pluginsCount: number;
  touchSupport: boolean;
  mouseMovements: number;
  scrollEvents: number;
  keypressEvents: number;
  timeOnPage: number;
  focusChanges: number;
  hasWebdriver: boolean;
  hasPhantom: boolean;
  hasSelenium: boolean;
  hasPuppeteer: boolean;
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
}

// Canvas fingerprint
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "0";
    
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Cwm fjordbank glyphs vext quiz", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Cwm fjordbank glyphs vext quiz", 4, 17);
    
    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      hash = ((hash << 5) - hash) + dataUrl.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  } catch {
    return "0";
  }
}

// Audio fingerprint
function getAudioFingerprint(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        resolve("0");
        return;
      }
      
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
      
      gainNode.gain.value = 0;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(10000, context.currentTime);
      
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start(0);
      
      const dataArray = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(dataArray);
      
      let hash = 0;
      for (let i = 0; i < dataArray.length; i++) {
        hash = ((hash << 5) - hash) + (dataArray[i] || 0);
        hash = hash & hash;
      }
      
      oscillator.stop();
      context.close();
      
      resolve(Math.abs(hash).toString(16));
    } catch {
      resolve("0");
    }
  });
}

// WebGL fingerprint
function getWebGLInfo(): { vendor: string; renderer: string; extensions: number } {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
    
    if (!gl) return { vendor: "", renderer: "", extensions: 0 };
    
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "";
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "";
    const extensions = gl.getSupportedExtensions()?.length || 0;
    
    return { vendor, renderer, extensions };
  } catch {
    return { vendor: "", renderer: "", extensions: 0 };
  }
}

// Fonts fingerprint
function getFontsFingerprint(): string {
  const testFonts = [
    "Arial", "Verdana", "Times New Roman", "Courier New", "Georgia",
    "Comic Sans MS", "Impact", "Trebuchet MS", "Lucida Console",
    "Palatino Linotype", "Tahoma", "Century Gothic", "Garamond"
  ];
  
  const baseFonts = ["monospace", "sans-serif", "serif"];
  const testString = "mmmmmmmmmmlli";
  const testSize = "72px";
  
  const span = document.createElement("span");
  span.style.position = "absolute";
  span.style.left = "-9999px";
  span.style.fontSize = testSize;
  span.innerHTML = testString;
  document.body.appendChild(span);
  
  const baseWidths: { [key: string]: number } = {};
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
  return Math.abs(hash).toString(16);
}

// Automation detection
function detectAutomation(): {
  hasWebdriver: boolean;
  hasPhantom: boolean;
  hasSelenium: boolean;
  hasPuppeteer: boolean;
  isHeadless: boolean;
  isAutomated: boolean;
} {
  const nav = navigator as any;
  const win = window as any;
  
  const hasWebdriver = !!(nav.webdriver || win.document.$cdc_asdjflasutopfhvcZLmcfl_ || 
    win.$chrome_asyncScriptInfo || win.__webdriver_evaluate || win.__selenium_evaluate ||
    win.__webdriver_script_function || win.__webdriver_script_func || 
    win.__webdriver_script_fn || win.__fxdriver_evaluate || 
    win.__driver_unwrapped || win.__webdriver_unwrapped || win.__driver_evaluate ||
    win.__selenium_unwrapped || win.__fxdriver_unwrapped);
  
  const hasPhantom = !!(win.callPhantom || win._phantom || win.phantom);
  
  const hasSelenium = !!(win.__nightmare || win.emit || win.spawn || 
    document.documentElement.getAttribute("selenium") ||
    document.documentElement.getAttribute("webdriver") ||
    document.documentElement.getAttribute("driver"));
  
  const hasPuppeteer = !!(win.__puppeteer_evaluation_script__ || 
    win.puppeteer || nav.webdriver);
  
  const isHeadless = /HeadlessChrome/.test(nav.userAgent) || 
    nav.plugins?.length === 0 ||
    !win.chrome ||
    !win.chrome.runtime;
  
  const isAutomated = hasWebdriver || hasPhantom || hasSelenium || hasPuppeteer || isHeadless;
  
  return { hasWebdriver, hasPhantom, hasSelenium, hasPuppeteer, isHeadless, isAutomated };
}

export default function CloakerRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Verificando...");
  
  const startTime = useRef(Date.now());
  const mouseMovements = useRef(0);
  const scrollEvents = useRef(0);
  const keypressEvents = useRef(0);
  const focusChanges = useRef(0);
  const hasRedirected = useRef(false);

  // Track behavioral signals
  useEffect(() => {
    const handleMouseMove = () => mouseMovements.current++;
    const handleScroll = () => scrollEvents.current++;
    const handleKeypress = () => keypressEvents.current++;
    const handleFocus = () => focusChanges.current++;
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("scroll", handleScroll);
    document.addEventListener("keypress", handleKeypress);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleFocus);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("scroll", handleScroll);
      document.removeEventListener("keypress", handleKeypress);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleFocus);
    };
  }, []);

  const collectFingerprint = useCallback(async (): Promise<FingerprintData> => {
    const webgl = getWebGLInfo();
    const automation = detectAutomation();
    const audioHash = await getAudioFingerprint();
    
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      deviceMemory: (navigator as any).deviceMemory || 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      platform: navigator.platform,
      webglVendor: webgl.vendor,
      webglRenderer: webgl.renderer,
      canvasHash: getCanvasFingerprint(),
      audioHash,
      fontsHash: getFontsFingerprint(),
      pluginsCount: navigator.plugins?.length || 0,
      touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      mouseMovements: mouseMovements.current,
      scrollEvents: scrollEvents.current,
      keypressEvents: keypressEvents.current,
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
    };
  }, []);

  const handleRedirect = useCallback(async () => {
    if (!slug || hasRedirected.current) return;
    hasRedirected.current = true;

    try {
      setStatus("Coletando dados...");
      
      // Small delay to collect behavioral data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatus("Analisando...");
      const fingerprint = await collectFingerprint();

      const { data, error: fnError } = await supabase.functions.invoke("cloaker-redirect", {
        body: { slug, fingerprint },
      });

      if (fnError) throw fnError;

      if (data?.redirectUrl) {
        setStatus("Redirecionando...");
        // Use replace to avoid back button issues
        window.location.replace(data.redirectUrl);
      } else {
        setError("Link não encontrado");
      }
    } catch (err) {
      console.error("Redirect error:", err);
      setError("Erro ao processar");
    }
  }, [slug, collectFingerprint]);

  useEffect(() => {
    // Start redirect process after a brief moment
    const timer = setTimeout(handleRedirect, 500);
    return () => clearTimeout(timer);
  }, [handleRedirect]);

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">{error}</p>
      </div>
    );
  }

  // Minimal, non-suspicious loading page
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-neutral-500 text-sm">{status}</p>
      </div>
    </div>
  );
}