/**
 * Advanced Fingerprint Analysis Module for Cloaker
 * Enterprise-level detection of artificial, spoofed, or repeated fingerprints
 */

// ================ TYPES ================

export interface FingerprintInput {
  // Canvas
  canvasHash: string;
  canvasNoise?: boolean;
  
  // WebGL
  webglVendor: string;
  webglRenderer: string;
  webglVersion?: string;
  webglExtensions?: number;
  webglHash?: string;
  hardwareAcceleration?: boolean;
  
  // Audio
  audioHash: string;
  audioNoise?: boolean;
  
  // Fonts
  fontsHash: string;
  fontsList?: string[];
  
  // Screen
  screenResolution: string;
  availableScreenResolution?: string;
  colorDepth: number;
  devicePixelRatio?: number;
  
  // Device
  platform: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  maxTouchPoints?: number;
  
  // Time/Location
  timezone: string;
  timezoneOffset?: number;
  language: string;
  languages?: string[];
  
  // Browser
  userAgent: string;
  pluginsCount?: number;
  pluginsHash?: string;
  
  // Computed
  masterHash?: string;
}

export interface FingerprintAnalysis {
  // Detection results
  isArtificial: boolean;
  isSpoofed: boolean;
  isHeadless: boolean;
  isEmulated: boolean;
  isInconsistent: boolean;
  
  // Individual scores
  canvasScore: number;
  webglScore: number;
  audioScore: number;
  fontsScore: number;
  screenScore: number;
  deviceScore: number;
  timezoneScore: number;
  
  // Pattern detection
  canvasPattern: 'normal' | 'noise_detected' | 'blank' | 'artificial' | 'common';
  webglPattern: 'hardware' | 'software' | 'headless' | 'spoofed' | 'unknown';
  audioPattern: 'normal' | 'noise_detected' | 'silent' | 'artificial';
  
  // Fingerprint uniqueness
  uniquenessScore: number; // 0-100, higher = more unique
  entropyScore: number;
  
  // Issues found
  issues: string[];
  positiveSignals: string[];
  
  // Final score
  score: number; // 0-100, higher = more legitimate
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Master fingerprint hash for tracking
  masterHash: string;
  
  // Details for logging
  details: string[];
}

// ================ KNOWN PATTERNS ================

// Headless browser WebGL signatures
const HEADLESS_WEBGL_PATTERNS = [
  // SwiftShader (Chrome headless)
  { vendor: 'Google Inc. (Google)', renderer: 'ANGLE (Google, Vulkan' },
  { vendor: 'Google Inc.', renderer: 'ANGLE (Google, Vulkan 1.3.0' },
  { vendor: 'Google Inc.', renderer: 'Google SwiftShader' },
  { vendor: 'Google Inc.', renderer: 'SwiftShader' },
  
  // Mesa (Linux headless)
  { vendor: 'Mesa', renderer: 'llvmpipe' },
  { vendor: 'Mesa/X.org', renderer: 'llvmpipe' },
  { vendor: 'VMware, Inc.', renderer: 'llvmpipe' },
  
  // Other software renderers
  { vendor: 'Microsoft', renderer: 'Microsoft Basic Render Driver' },
  { vendor: '', renderer: 'Software Rasterizer' },
  { vendor: 'Brian Paul', renderer: 'Mesa' },
];

// Common headless screen resolutions
const HEADLESS_RESOLUTIONS = [
  '800x600',
  '1024x768',
  '1280x720',
  '1280x800',
  '1366x768', // Common but also used by laptops
  '1920x1080', // Common but check with other signals
];

// Suspicious resolutions (very rare or impossible)
const SUSPICIOUS_RESOLUTIONS = [
  '0x0',
  '1x1',
  '100x100',
  '320x240',
  '640x480',
  '9999x9999',
];

// Known VM/emulator WebGL patterns
const VM_WEBGL_PATTERNS = [
  { vendor: 'VMware, Inc.', renderer: 'SVGA3D' },
  { vendor: 'InnoTek Systemberatung GmbH', renderer: 'VirtualBox' },
  { vendor: 'Parallels', renderer: '' },
  { vendor: 'Red Hat', renderer: 'Virtio' },
  { vendor: 'QEMU', renderer: '' },
  { vendor: 'Hyper-V', renderer: '' },
];

// Common fonts that should exist on most systems
const COMMON_FONTS = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Georgia',
  'Trebuchet MS',
  'Comic Sans MS',
];

// Fonts that indicate specific platforms
const PLATFORM_FONTS: Record<string, string[]> = {
  windows: ['Segoe UI', 'Calibri', 'Cambria', 'Consolas', 'Tahoma'],
  mac: ['Helvetica Neue', 'San Francisco', 'Lucida Grande', 'Monaco', 'Menlo'],
  linux: ['Ubuntu', 'DejaVu Sans', 'Liberation Sans', 'Noto Sans', 'Cantarell'],
  android: ['Roboto', 'Noto Sans', 'Droid Sans'],
  ios: ['San Francisco', 'Helvetica Neue', '.SF NS', '.Apple System'],
};

// Common timezone/language combinations
const TIMEZONE_LANGUAGE_MAP: Record<string, string[]> = {
  'America/New_York': ['en-US', 'en'],
  'America/Los_Angeles': ['en-US', 'en'],
  'America/Chicago': ['en-US', 'en'],
  'America/Sao_Paulo': ['pt-BR', 'pt'],
  'Europe/London': ['en-GB', 'en'],
  'Europe/Paris': ['fr-FR', 'fr'],
  'Europe/Berlin': ['de-DE', 'de'],
  'Europe/Madrid': ['es-ES', 'es'],
  'Europe/Rome': ['it-IT', 'it'],
  'Europe/Moscow': ['ru-RU', 'ru'],
  'Asia/Tokyo': ['ja-JP', 'ja'],
  'Asia/Shanghai': ['zh-CN', 'zh'],
  'Asia/Seoul': ['ko-KR', 'ko'],
  'Asia/Kolkata': ['hi-IN', 'en-IN', 'hi', 'en'],
  'Australia/Sydney': ['en-AU', 'en'],
};

// Known canvas fingerprint spoofing patterns
const SPOOFED_CANVAS_PATTERNS = [
  '0', // Blank canvas
  'ffffffff', // All white
  '00000000', // All black
  'undefined',
  'null',
  'error',
];

// ================ HELPER FUNCTIONS ================

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function calculateEntropy(values: (string | number)[]): number {
  const counts: Record<string, number> = {};
  for (const val of values) {
    const key = String(val);
    counts[key] = (counts[key] || 0) + 1;
  }
  
  const total = values.length;
  let entropy = 0;
  
  for (const count of Object.values(counts)) {
    const p = count / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}

function detectPlatformFromUA(userAgent: string): 'windows' | 'mac' | 'linux' | 'android' | 'ios' | 'unknown' {
  const ua = userAgent.toLowerCase();
  if (/windows/.test(ua)) return 'windows';
  if (/macintosh|mac os/.test(ua)) return 'mac';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/linux/.test(ua)) return 'linux';
  return 'unknown';
}

// ================ ANALYSIS FUNCTIONS ================

function analyzeCanvas(fp: FingerprintInput): {
  score: number;
  pattern: 'normal' | 'noise_detected' | 'blank' | 'artificial' | 'common';
  issues: string[];
  positives: string[];
  details: string[];
} {
  const issues: string[] = [];
  const positives: string[] = [];
  const details: string[] = [];
  let score = 50;
  
  // Check for blank/error canvas
  if (!fp.canvasHash || SPOOFED_CANVAS_PATTERNS.includes(fp.canvasHash.toLowerCase())) {
    issues.push('blank_or_spoofed_canvas');
    score -= 40;
    details.push('Canvas fingerprint vazio ou falsificado');
    return { score: Math.max(0, score), pattern: 'blank', issues, positives, details };
  }
  
  // Check for canvas noise (anti-fingerprinting extension)
  if (fp.canvasNoise) {
    issues.push('canvas_noise_detected');
    score -= 30;
    details.push('Ruído de canvas detectado (anti-fingerprinting)');
    return { score: Math.max(0, score), pattern: 'noise_detected', issues, positives, details };
  }
  
  // Valid canvas hash
  if (fp.canvasHash.length >= 6) {
    positives.push('valid_canvas_hash');
    score += 20;
    details.push(`Canvas hash válido: ${fp.canvasHash.substring(0, 8)}...`);
  }
  
  // Check entropy of canvas hash
  const entropy = calculateEntropy(fp.canvasHash.split(''));
  if (entropy < 1) {
    issues.push('low_canvas_entropy');
    score -= 20;
    details.push('Canvas com baixa entropia (artificial)');
    return { score: Math.max(0, score), pattern: 'artificial', issues, positives, details };
  }
  
  if (entropy > 3) {
    positives.push('high_canvas_entropy');
    score += 10;
  }
  
  return { score: Math.min(100, score), pattern: 'normal', issues, positives, details };
}

function analyzeWebGL(fp: FingerprintInput): {
  score: number;
  pattern: 'hardware' | 'software' | 'headless' | 'spoofed' | 'unknown';
  issues: string[];
  positives: string[];
  details: string[];
} {
  const issues: string[] = [];
  const positives: string[] = [];
  const details: string[] = [];
  let score = 50;
  
  const vendor = (fp.webglVendor || '').toLowerCase();
  const renderer = (fp.webglRenderer || '').toLowerCase();
  
  // No WebGL
  if (!fp.webglVendor && !fp.webglRenderer) {
    issues.push('no_webgl');
    score -= 30;
    details.push('WebGL não disponível');
    return { score: Math.max(0, score), pattern: 'unknown', issues, positives, details };
  }
  
  // Check for headless patterns
  for (const pattern of HEADLESS_WEBGL_PATTERNS) {
    if (
      vendor.includes(pattern.vendor.toLowerCase()) &&
      renderer.includes(pattern.renderer.toLowerCase())
    ) {
      issues.push('headless_webgl');
      score -= 50;
      details.push(`WebGL headless detectado: ${pattern.renderer}`);
      return { score: Math.max(0, score), pattern: 'headless', issues, positives, details };
    }
  }
  
  // Check for software rendering
  const softwarePatterns = ['swiftshader', 'llvmpipe', 'mesa', 'software', 'basic render'];
  for (const pattern of softwarePatterns) {
    if (renderer.includes(pattern)) {
      issues.push('software_renderer');
      score -= 40;
      details.push(`Renderização por software: ${pattern}`);
      return { score: Math.max(0, score), pattern: 'software', issues, positives, details };
    }
  }
  
  // Check for VM patterns
  for (const pattern of VM_WEBGL_PATTERNS) {
    if (
      vendor.includes(pattern.vendor.toLowerCase()) ||
      renderer.includes(pattern.renderer.toLowerCase())
    ) {
      issues.push('vm_webgl');
      score -= 25;
      details.push(`VM/emulador detectado: ${pattern.vendor}`);
    }
  }
  
  // Hardware acceleration check
  if (fp.hardwareAcceleration === false) {
    issues.push('no_hardware_acceleration');
    score -= 20;
    details.push('Sem aceleração de hardware');
  } else if (fp.hardwareAcceleration === true) {
    positives.push('hardware_acceleration');
    score += 15;
    details.push('Aceleração de hardware ativa');
  }
  
  // Check for known GPU manufacturers (positive signal)
  const knownGPUs = ['nvidia', 'amd', 'intel', 'apple', 'qualcomm', 'arm', 'mali', 'adreno'];
  const hasKnownGPU = knownGPUs.some(gpu => 
    vendor.includes(gpu) || renderer.includes(gpu)
  );
  
  if (hasKnownGPU) {
    positives.push('known_gpu');
    score += 20;
    details.push('GPU conhecida detectada');
  }
  
  // Check extensions count (real browsers have many)
  if (fp.webglExtensions !== undefined) {
    if (fp.webglExtensions === 0) {
      issues.push('no_webgl_extensions');
      score -= 15;
    } else if (fp.webglExtensions > 20) {
      positives.push('many_webgl_extensions');
      score += 10;
    }
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    pattern: hasKnownGPU ? 'hardware' : 'unknown',
    issues,
    positives,
    details,
  };
}

function analyzeAudio(fp: FingerprintInput): {
  score: number;
  pattern: 'normal' | 'noise_detected' | 'silent' | 'artificial';
  issues: string[];
  positives: string[];
  details: string[];
} {
  const issues: string[] = [];
  const positives: string[] = [];
  const details: string[] = [];
  let score = 50;
  
  // Check for blank/error audio
  if (!fp.audioHash || fp.audioHash === '0' || fp.audioHash === 'error') {
    // Audio might be disabled - minor issue
    issues.push('no_audio_fingerprint');
    score -= 10;
    details.push('Audio fingerprint não disponível');
    return { score, pattern: 'silent', issues, positives, details };
  }
  
  // Check for audio noise (anti-fingerprinting)
  if (fp.audioNoise) {
    issues.push('audio_noise_detected');
    score -= 30;
    details.push('Ruído de audio detectado (anti-fingerprinting)');
    return { score: Math.max(0, score), pattern: 'noise_detected', issues, positives, details };
  }
  
  // Valid audio hash
  if (fp.audioHash.length >= 4) {
    positives.push('valid_audio_hash');
    score += 15;
  }
  
  return { score: Math.min(100, score), pattern: 'normal', issues, positives, details };
}

function analyzeFonts(fp: FingerprintInput): {
  score: number;
  issues: string[];
  positives: string[];
  details: string[];
} {
  const issues: string[] = [];
  const positives: string[] = [];
  const details: string[] = [];
  let score = 50;
  
  // No fonts data
  if (!fp.fontsHash && (!fp.fontsList || fp.fontsList.length === 0)) {
    issues.push('no_fonts_data');
    score -= 20;
    details.push('Dados de fontes não disponíveis');
    return { score, issues, positives, details };
  }
  
  const fonts = fp.fontsList || [];
  
  // Check for common fonts
  const commonFontsFound = COMMON_FONTS.filter(font => 
    fonts.some(f => f.toLowerCase().includes(font.toLowerCase()))
  );
  
  if (commonFontsFound.length >= 3) {
    positives.push('has_common_fonts');
    score += 15;
    details.push(`${commonFontsFound.length} fontes comuns detectadas`);
  } else if (commonFontsFound.length === 0 && fonts.length > 0) {
    issues.push('no_common_fonts');
    score -= 20;
    details.push('Nenhuma fonte comum detectada');
  }
  
  // Check font count
  if (fonts.length >= 10) {
    positives.push('good_font_count');
    score += 10;
    details.push(`${fonts.length} fontes instaladas`);
  } else if (fonts.length > 0 && fonts.length < 5) {
    issues.push('few_fonts');
    score -= 15;
    details.push('Poucas fontes instaladas');
  }
  
  // Check platform consistency
  const platform = detectPlatformFromUA(fp.userAgent);
  if (platform !== 'unknown' && PLATFORM_FONTS[platform]) {
    const platformFonts = PLATFORM_FONTS[platform];
    const platformFontsFound = platformFonts.filter(font =>
      fonts.some(f => f.toLowerCase().includes(font.toLowerCase()))
    );
    
    if (platformFontsFound.length > 0) {
      positives.push('platform_fonts_match');
      score += 10;
    } else if (fonts.length > 5) {
      // Has fonts but none from expected platform
      issues.push('platform_fonts_mismatch');
      score -= 15;
      details.push(`Fontes não correspondem à plataforma ${platform}`);
    }
  }
  
  return { score: Math.max(0, Math.min(100, score)), issues, positives, details };
}

function analyzeScreen(fp: FingerprintInput): {
  score: number;
  issues: string[];
  positives: string[];
  details: string[];
} {
  const issues: string[] = [];
  const positives: string[] = [];
  const details: string[] = [];
  let score = 50;
  
  const resolution = fp.screenResolution;
  
  // Check for suspicious resolutions
  if (SUSPICIOUS_RESOLUTIONS.includes(resolution)) {
    issues.push('suspicious_resolution');
    score -= 50;
    details.push(`Resolução suspeita: ${resolution}`);
    return { score: Math.max(0, score), issues, positives, details };
  }
  
  // Check for headless-typical resolutions
  if (HEADLESS_RESOLUTIONS.slice(0, 3).includes(resolution)) {
    // Very common in headless
    issues.push('headless_resolution');
    score -= 25;
    details.push(`Resolução comum em headless: ${resolution}`);
  } else {
    positives.push('normal_resolution');
    score += 10;
  }
  
  // Parse resolution
  const [width, height] = resolution.split('x').map(Number);
  
  if (width && height) {
    // Check aspect ratio
    const aspectRatio = width / height;
    
    // Common aspect ratios
    const commonRatios = [
      { ratio: 16/9, name: '16:9' },
      { ratio: 16/10, name: '16:10' },
      { ratio: 4/3, name: '4:3' },
      { ratio: 21/9, name: '21:9' },
      { ratio: 3/2, name: '3:2' },
    ];
    
    const matchedRatio = commonRatios.find(r => 
      Math.abs(aspectRatio - r.ratio) < 0.05
    );
    
    if (matchedRatio) {
      positives.push('common_aspect_ratio');
      score += 5;
    }
    
    // Check for reasonable dimensions
    if (width >= 1280 && height >= 720) {
      positives.push('modern_resolution');
      score += 10;
    }
    
    // Check for ultra-high resolution (real device)
    if (width >= 2560 || (fp.devicePixelRatio && fp.devicePixelRatio >= 2)) {
      positives.push('high_dpi_display');
      score += 10;
    }
  }
  
  // Check color depth
  if (fp.colorDepth) {
    if (fp.colorDepth === 24 || fp.colorDepth === 32) {
      positives.push('normal_color_depth');
      score += 5;
    } else if (fp.colorDepth < 16) {
      issues.push('low_color_depth');
      score -= 15;
      details.push(`Color depth baixo: ${fp.colorDepth}`);
    }
  }
  
  // Check device pixel ratio
  if (fp.devicePixelRatio !== undefined) {
    if (fp.devicePixelRatio === 0) {
      issues.push('zero_pixel_ratio');
      score -= 20;
    } else if (fp.devicePixelRatio >= 1 && fp.devicePixelRatio <= 4) {
      positives.push('valid_pixel_ratio');
      score += 5;
    }
  }
  
  return { score: Math.max(0, Math.min(100, score)), issues, positives, details };
}

function analyzeDevice(fp: FingerprintInput): {
  score: number;
  issues: string[];
  positives: string[];
  details: string[];
} {
  const issues: string[] = [];
  const positives: string[] = [];
  const details: string[] = [];
  let score = 50;
  
  // Hardware concurrency
  if (fp.hardwareConcurrency !== undefined) {
    if (fp.hardwareConcurrency === 0) {
      issues.push('zero_cores');
      score -= 20;
    } else if (fp.hardwareConcurrency >= 2 && fp.hardwareConcurrency <= 128) {
      positives.push('valid_core_count');
      score += 10;
      details.push(`${fp.hardwareConcurrency} cores detectados`);
    } else if (fp.hardwareConcurrency > 128) {
      issues.push('impossible_core_count');
      score -= 30;
      details.push(`Número de cores impossível: ${fp.hardwareConcurrency}`);
    }
  }
  
  // Device memory
  if (fp.deviceMemory !== undefined) {
    if (fp.deviceMemory === 0) {
      // Might be unsupported
      issues.push('no_device_memory');
      score -= 5;
    } else if (fp.deviceMemory >= 1 && fp.deviceMemory <= 64) {
      positives.push('valid_memory');
      score += 10;
      details.push(`${fp.deviceMemory}GB memória`);
    } else if (fp.deviceMemory > 64) {
      issues.push('excessive_memory');
      score -= 15;
    }
  }
  
  // Touch support consistency
  const isMobileUA = /mobile|android|iphone|ipad/i.test(fp.userAgent);
  if (fp.maxTouchPoints !== undefined) {
    if (isMobileUA && fp.maxTouchPoints === 0) {
      issues.push('mobile_no_touch');
      score -= 20;
      details.push('Dispositivo mobile sem touch');
    } else if (!isMobileUA && fp.maxTouchPoints > 0) {
      // Could be touchscreen laptop - minor
      positives.push('desktop_with_touch');
    } else if (isMobileUA && fp.maxTouchPoints > 0) {
      positives.push('mobile_with_touch');
      score += 10;
    }
  }
  
  // Platform consistency
  const platform = fp.platform.toLowerCase();
  const detectedPlatform = detectPlatformFromUA(fp.userAgent);
  
  const platformMatches = (
    (detectedPlatform === 'windows' && platform.includes('win')) ||
    (detectedPlatform === 'mac' && platform.includes('mac')) ||
    (detectedPlatform === 'linux' && platform.includes('linux')) ||
    (detectedPlatform === 'android' && platform.includes('linux')) ||
    (detectedPlatform === 'ios' && (platform.includes('iphone') || platform.includes('ipad')))
  );
  
  if (platformMatches) {
    positives.push('platform_matches_ua');
    score += 10;
  } else if (detectedPlatform !== 'unknown') {
    issues.push('platform_mismatch');
    score -= 20;
    details.push(`Plataforma ${platform} não corresponde ao UA ${detectedPlatform}`);
  }
  
  return { score: Math.max(0, Math.min(100, score)), issues, positives, details };
}

function analyzeTimezone(fp: FingerprintInput): {
  score: number;
  issues: string[];
  positives: string[];
  details: string[];
} {
  const issues: string[] = [];
  const positives: string[] = [];
  const details: string[] = [];
  let score = 50;
  
  // Check timezone format
  if (!fp.timezone || fp.timezone === 'undefined') {
    issues.push('no_timezone');
    score -= 20;
    details.push('Timezone não disponível');
    return { score, issues, positives, details };
  }
  
  // Valid IANA timezone
  if (fp.timezone.includes('/')) {
    positives.push('valid_timezone_format');
    score += 10;
  }
  
  // Check timezone/language consistency
  const expectedLanguages = TIMEZONE_LANGUAGE_MAP[fp.timezone];
  if (expectedLanguages) {
    const primaryLang = fp.language.split('-')[0].toLowerCase();
    const languageMatches = expectedLanguages.some(lang => 
      lang.toLowerCase().startsWith(primaryLang)
    );
    
    if (languageMatches) {
      positives.push('timezone_language_match');
      score += 15;
    } else {
      // Not necessarily wrong, many people travel or use VPNs
      issues.push('timezone_language_mismatch');
      score -= 10;
      details.push(`Timezone ${fp.timezone} incomum para idioma ${fp.language}`);
    }
  }
  
  // Check timezone offset consistency
  if (fp.timezoneOffset !== undefined) {
    // Basic sanity check: offset should be between -12 and +14 hours
    const offsetHours = fp.timezoneOffset / 60;
    if (offsetHours < -14 || offsetHours > 14) {
      issues.push('invalid_timezone_offset');
      score -= 30;
      details.push(`Offset de timezone inválido: ${fp.timezoneOffset}`);
    }
  }
  
  // Check languages array
  if (fp.languages && fp.languages.length > 0) {
    positives.push('has_language_list');
    score += 5;
    
    // Primary language should be in languages list
    const primaryInList = fp.languages.some(l => 
      l.toLowerCase().startsWith(fp.language.split('-')[0].toLowerCase())
    );
    
    if (!primaryInList) {
      issues.push('language_not_in_list');
      score -= 10;
    }
  } else {
    issues.push('no_language_list');
    score -= 10;
  }
  
  return { score: Math.max(0, Math.min(100, score)), issues, positives, details };
}

// ================ MAIN ANALYSIS FUNCTION ================

export function analyzeFingerprint(fp: FingerprintInput): FingerprintAnalysis {
  const result: FingerprintAnalysis = {
    isArtificial: false,
    isSpoofed: false,
    isHeadless: false,
    isEmulated: false,
    isInconsistent: false,
    canvasScore: 0,
    webglScore: 0,
    audioScore: 0,
    fontsScore: 0,
    screenScore: 0,
    deviceScore: 0,
    timezoneScore: 0,
    canvasPattern: 'normal',
    webglPattern: 'unknown',
    audioPattern: 'normal',
    uniquenessScore: 50,
    entropyScore: 0,
    issues: [],
    positiveSignals: [],
    score: 50,
    riskLevel: 'medium',
    masterHash: '',
    details: [],
  };
  
  // Run all analyses
  const canvasAnalysis = analyzeCanvas(fp);
  const webglAnalysis = analyzeWebGL(fp);
  const audioAnalysis = analyzeAudio(fp);
  const fontsAnalysis = analyzeFonts(fp);
  const screenAnalysis = analyzeScreen(fp);
  const deviceAnalysis = analyzeDevice(fp);
  const timezoneAnalysis = analyzeTimezone(fp);
  
  // Collect results
  result.canvasScore = canvasAnalysis.score;
  result.webglScore = webglAnalysis.score;
  result.audioScore = audioAnalysis.score;
  result.fontsScore = fontsAnalysis.score;
  result.screenScore = screenAnalysis.score;
  result.deviceScore = deviceAnalysis.score;
  result.timezoneScore = timezoneAnalysis.score;
  
  result.canvasPattern = canvasAnalysis.pattern;
  result.webglPattern = webglAnalysis.pattern;
  result.audioPattern = audioAnalysis.pattern;
  
  // Collect all issues and positives
  result.issues = [
    ...canvasAnalysis.issues,
    ...webglAnalysis.issues,
    ...audioAnalysis.issues,
    ...fontsAnalysis.issues,
    ...screenAnalysis.issues,
    ...deviceAnalysis.issues,
    ...timezoneAnalysis.issues,
  ];
  
  result.positiveSignals = [
    ...canvasAnalysis.positives,
    ...webglAnalysis.positives,
    ...audioAnalysis.positives,
    ...fontsAnalysis.positives,
    ...screenAnalysis.positives,
    ...deviceAnalysis.positives,
    ...timezoneAnalysis.positives,
  ];
  
  result.details = [
    ...canvasAnalysis.details,
    ...webglAnalysis.details,
    ...audioAnalysis.details,
    ...fontsAnalysis.details,
    ...screenAnalysis.details,
    ...deviceAnalysis.details,
    ...timezoneAnalysis.details,
  ];
  
  // Generate master fingerprint hash
  const fingerprintComponents = [
    fp.canvasHash,
    fp.webglRenderer,
    fp.webglVendor,
    fp.audioHash,
    fp.fontsHash,
    fp.screenResolution,
    fp.timezone,
    fp.platform,
    String(fp.hardwareConcurrency),
    String(fp.colorDepth),
  ];
  result.masterHash = hashString(fingerprintComponents.join('|'));
  
  // Calculate uniqueness/entropy
  const entropyValues = fingerprintComponents.filter(Boolean);
  result.entropyScore = calculateEntropy(entropyValues);
  result.uniquenessScore = Math.min(100, result.entropyScore * 25);
  
  // Calculate weighted final score
  const weights = {
    canvas: 0.20,
    webgl: 0.25,
    audio: 0.10,
    fonts: 0.10,
    screen: 0.15,
    device: 0.10,
    timezone: 0.10,
  };
  
  result.score = Math.round(
    result.canvasScore * weights.canvas +
    result.webglScore * weights.webgl +
    result.audioScore * weights.audio +
    result.fontsScore * weights.fonts +
    result.screenScore * weights.screen +
    result.deviceScore * weights.device +
    result.timezoneScore * weights.timezone
  );
  
  // Bonus/penalty adjustments
  const positiveBonus = Math.min(result.positiveSignals.length * 2, 15);
  result.score = Math.min(100, result.score + positiveBonus);
  
  const issuePenalty = Math.min(result.issues.length * 3, 20);
  result.score = Math.max(0, result.score - issuePenalty);
  
  // Determine flags
  if (result.canvasPattern === 'noise_detected' || result.audioPattern === 'noise_detected') {
    result.isSpoofed = true;
  }
  
  if (result.webglPattern === 'headless' || result.webglPattern === 'software') {
    result.isHeadless = true;
  }
  
  if (result.canvasPattern === 'artificial' || result.canvasPattern === 'blank') {
    result.isArtificial = true;
  }
  
  if (result.issues.filter(i => i.includes('mismatch')).length >= 2) {
    result.isInconsistent = true;
  }
  
  // Determine risk level
  if (result.score <= 25 || result.isHeadless || result.isSpoofed) {
    result.riskLevel = 'critical';
  } else if (result.score <= 45 || result.isArtificial || result.isInconsistent) {
    result.riskLevel = 'high';
  } else if (result.score <= 65) {
    result.riskLevel = 'medium';
  } else {
    result.riskLevel = 'low';
  }
  
  return result;
}

// ================ QUICK CHECK FUNCTIONS ================

export function isLegitimateFingerprint(fp: FingerprintInput): boolean {
  const analysis = analyzeFingerprint(fp);
  return analysis.score >= 60 && !analysis.isHeadless && !analysis.isSpoofed;
}

export function getFingerprintScore(fp: FingerprintInput): number {
  return analyzeFingerprint(fp).score;
}

export function getMasterFingerprintHash(fp: FingerprintInput): string {
  return analyzeFingerprint(fp).masterHash;
}

export function isHeadlessFingerprint(fp: FingerprintInput): boolean {
  const analysis = analyzeFingerprint(fp);
  return analysis.isHeadless || analysis.webglPattern === 'software';
}

export function isSpoofedFingerprint(fp: FingerprintInput): boolean {
  const analysis = analyzeFingerprint(fp);
  return analysis.isSpoofed || analysis.canvasPattern === 'noise_detected';
}
