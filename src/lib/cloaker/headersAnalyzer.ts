/**
 * Advanced Headers Analysis Module for Cloaker
 * Enterprise-level validation of HTTP headers for bot detection
 */

// ================ TYPES ================

export interface HeadersData {
  acceptLanguage?: string | null;
  accept?: string | null;
  acceptEncoding?: string | null;
  secChUa?: string | null;
  secChUaPlatform?: string | null;
  secChUaMobile?: string | null;
  secChUaFullVersionList?: string | null;
  secChUaArch?: string | null;
  secChUaBitness?: string | null;
  secChUaModel?: string | null;
  secFetchSite?: string | null;
  secFetchMode?: string | null;
  secFetchDest?: string | null;
  secFetchUser?: string | null;
  referer?: string | null;
  origin?: string | null;
  userAgent?: string | null;
  connection?: string | null;
  cacheControl?: string | null;
  pragma?: string | null;
  upgradeInsecureRequests?: string | null;
  dnt?: string | null;
  xForwardedFor?: string | null;
  xRealIp?: string | null;
  via?: string | null;
  forwarded?: string | null;
  cfConnectingIp?: string | null;
  trueClientIp?: string | null;
}

export interface HeadersAnalysis {
  // Validation results
  hasAcceptLanguage: boolean;
  hasSecChUa: boolean;
  hasSecFetchHeaders: boolean;
  hasReferer: boolean;
  
  // Detection flags
  isSuspicious: boolean;
  isBot: boolean;
  isProxy: boolean;
  isCrawler: boolean;
  isAutomation: boolean;
  
  // Parsed data
  languages: string[];
  primaryLanguage: string | null;
  browserBrand: string | null;
  browserVersion: string | null;
  platform: string | null;
  isMobile: boolean;
  refererDomain: string | null;
  
  // Issues found
  inconsistencies: string[];
  missingHeaders: string[];
  
  // Scoring
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Details for logging
  details: string[];
}

// ================ VALID VALUES ================

// Valid Accept-Language patterns
const VALID_LANGUAGE_CODES = [
  'aa', 'ab', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av', 'ay', 'az',
  'ba', 'be', 'bg', 'bh', 'bi', 'bm', 'bn', 'bo', 'br', 'bs',
  'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy',
  'da', 'de', 'dv', 'dz',
  'ee', 'el', 'en', 'eo', 'es', 'et', 'eu',
  'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy',
  'ga', 'gd', 'gl', 'gn', 'gu', 'gv',
  'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy', 'hz',
  'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io', 'is', 'it', 'iu',
  'ja', 'jv',
  'ka', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky',
  'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv',
  'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my',
  'na', 'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny',
  'oc', 'oj', 'om', 'or', 'os',
  'pa', 'pi', 'pl', 'ps', 'pt',
  'qu',
  'rm', 'rn', 'ro', 'ru', 'rw',
  'sa', 'sc', 'sd', 'se', 'sg', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw',
  'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty',
  'ug', 'uk', 'ur', 'uz',
  'vl', 'vi', 'vo',
  'wa', 'wo',
  'xh',
  'yi', 'yo',
  'za', 'zh', 'zu',
];

// Known browser brands in Sec-CH-UA
const KNOWN_BROWSER_BRANDS = [
  'Google Chrome',
  'Chromium',
  'Microsoft Edge',
  'Opera',
  'Brave',
  'Vivaldi',
  'Samsung Internet',
  'Firefox', // Usually not in Sec-CH-UA but some versions report it
  'Safari',
  'Not_A Brand',
  'Not A;Brand',
  'Not.A/Brand',
  'Not/A)Brand',
  'Not?A_Brand',
  '(Not(A:Brand',
  'Yandex',
  'Arc',
];

// Valid Sec-CH-UA-Platform values
const VALID_PLATFORMS = [
  'Android',
  'Chrome OS',
  'Chromium OS',
  'iOS',
  'Linux',
  'macOS',
  'Windows',
  'Unknown',
  '',
];

// Valid Sec-Fetch-Site values
const VALID_SEC_FETCH_SITE = [
  'cross-site',
  'same-origin',
  'same-site',
  'none',
];

// Valid Sec-Fetch-Mode values
const VALID_SEC_FETCH_MODE = [
  'cors',
  'navigate',
  'no-cors',
  'same-origin',
  'websocket',
];

// Valid Sec-Fetch-Dest values
const VALID_SEC_FETCH_DEST = [
  'audio',
  'audioworklet',
  'document',
  'embed',
  'empty',
  'font',
  'frame',
  'iframe',
  'image',
  'manifest',
  'object',
  'paintworklet',
  'report',
  'script',
  'serviceworker',
  'sharedworker',
  'style',
  'track',
  'video',
  'worker',
  'xslt',
];

// Suspicious referers (spy tools, ad analyzers)
const SUSPICIOUS_REFERERS = [
  'adspy.com',
  'anstrex.com',
  'bigspy.com',
  'dropispy.com',
  'pipiads.com',
  'adplexity.com',
  'spyfu.com',
  'semrush.com',
  'ahrefs.com',
  'similarweb.com',
  'moz.com',
  'majestic.com',
  'serpstat.com',
  'ubersuggest.com',
  'neilpatel.com',
  'builtwith.com',
  'wappalyzer.com',
  'whatruns.com',
  'ghostery.com',
  'facebook.com/ads/library',
  'powersuitech.com',
  'admobispy.com',
  'socialpeta.com',
  'appgrowing.cn',
  'mobidea.com',
  'spy.house',
  'idvert.com',
  'adflex.io',
  'affbank.com',
  'odigger.com',
  'stmforum.com',
  'affiliatefix.com',
];

// Bot/crawler referers
const BOT_REFERERS = [
  'googlebot.com',
  'google.com/bot',
  'bingbot.com',
  'baidu.com/search/spider',
  'yandex.com/bots',
  'facebook.com/externalhit',
  'crawler.com',
  'spider.com',
  'bot.com',
  'scraper',
  'archive.org',
  'wayback',
];

// Proxy/VPN detection headers
const PROXY_HEADERS = [
  'x-forwarded-for',
  'x-real-ip',
  'via',
  'forwarded',
  'x-forwarded-proto',
  'x-forwarded-host',
  'x-originating-ip',
  'x-remote-ip',
  'x-remote-addr',
  'x-client-ip',
  'client-ip',
  'x-host',
  'x-proxy-id',
  'proxy-connection',
  'true-client-ip',
  'cf-connecting-ip',
  'fastly-client-ip',
  'x-cluster-client-ip',
];

// ================ HELPER FUNCTIONS ================

function parseAcceptLanguage(header: string): { languages: string[]; primary: string | null; isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const languages: string[] = [];
  
  if (!header || header.trim() === '') {
    return { languages: [], primary: null, isValid: false, issues: ['empty_accept_language'] };
  }
  
  // Parse format: en-US,en;q=0.9,pt-BR;q=0.8
  const parts = header.split(',').map(p => p.trim());
  
  for (const part of parts) {
    const [lang, quality] = part.split(';');
    const langCode = lang.trim().toLowerCase();
    
    // Extract primary language code (before -)
    const primaryCode = langCode.split('-')[0];
    
    if (primaryCode && primaryCode.length >= 2) {
      languages.push(langCode);
      
      // Validate language code
      if (!VALID_LANGUAGE_CODES.includes(primaryCode)) {
        issues.push(`invalid_lang_code:${primaryCode}`);
      }
    }
    
    // Check quality factor format
    if (quality) {
      const qMatch = quality.match(/q=([\d.]+)/);
      if (qMatch) {
        const q = parseFloat(qMatch[1]);
        if (q < 0 || q > 1) {
          issues.push('invalid_quality_factor');
        }
      }
    }
  }
  
  // Check for suspicious patterns
  if (languages.length === 0) {
    issues.push('no_valid_languages');
  }
  
  if (languages.length === 1 && languages[0] === '*') {
    issues.push('wildcard_only_language');
  }
  
  // Too many languages is suspicious (bots often send many)
  if (languages.length > 10) {
    issues.push('too_many_languages');
  }
  
  return {
    languages,
    primary: languages[0] || null,
    isValid: issues.length === 0,
    issues,
  };
}

function parseSecChUa(header: string): { brands: { brand: string; version: string }[]; isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const brands: { brand: string; version: string }[] = [];
  
  if (!header || header.trim() === '') {
    return { brands: [], isValid: false, issues: ['empty_sec_ch_ua'] };
  }
  
  // Parse format: "Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"
  const regex = /"([^"]+)";v="(\d+)"/g;
  let match;
  
  while ((match = regex.exec(header)) !== null) {
    brands.push({ brand: match[1], version: match[2] });
  }
  
  if (brands.length === 0) {
    issues.push('no_brands_found');
  }
  
  // Check for known brands
  let hasKnownBrand = false;
  for (const { brand } of brands) {
    if (KNOWN_BROWSER_BRANDS.some(known => brand.includes(known) || known.includes(brand))) {
      hasKnownBrand = true;
    }
  }
  
  if (!hasKnownBrand && brands.length > 0) {
    issues.push('no_known_browser_brand');
  }
  
  // Check for "Not A Brand" pattern (expected in valid Chrome UAs)
  const hasNotABrand = brands.some(b => /not.*brand/i.test(b.brand));
  if (!hasNotABrand && brands.length > 0) {
    // Minor issue - some older Chrome versions don't have this
    issues.push('missing_not_a_brand');
  }
  
  return {
    brands,
    isValid: issues.filter(i => i !== 'missing_not_a_brand').length === 0,
    issues,
  };
}

function parseReferer(referer: string): { domain: string | null; isSuspicious: boolean; isBot: boolean; issues: string[] } {
  const issues: string[] = [];
  let domain: string | null = null;
  let isSuspicious = false;
  let isBot = false;
  
  if (!referer || referer.trim() === '') {
    // Empty referer is normal for direct navigation
    return { domain: null, isSuspicious: false, isBot: false, issues: [] };
  }
  
  try {
    const url = new URL(referer);
    domain = url.hostname.toLowerCase();
    
    // Check for suspicious referers
    for (const suspicious of SUSPICIOUS_REFERERS) {
      if (domain.includes(suspicious) || referer.toLowerCase().includes(suspicious)) {
        isSuspicious = true;
        issues.push(`suspicious_referer:${suspicious}`);
        break;
      }
    }
    
    // Check for bot referers
    for (const bot of BOT_REFERERS) {
      if (domain.includes(bot) || referer.toLowerCase().includes(bot)) {
        isBot = true;
        issues.push(`bot_referer:${bot}`);
        break;
      }
    }
    
  } catch {
    issues.push('invalid_referer_url');
  }
  
  return { domain, isSuspicious, isBot, issues };
}

function validateSecFetchHeaders(
  site: string | null | undefined,
  mode: string | null | undefined,
  dest: string | null | undefined,
  user: string | null | undefined
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Validate Sec-Fetch-Site
  if (site) {
    if (!VALID_SEC_FETCH_SITE.includes(site.toLowerCase())) {
      issues.push(`invalid_sec_fetch_site:${site}`);
    }
  }
  
  // Validate Sec-Fetch-Mode
  if (mode) {
    if (!VALID_SEC_FETCH_MODE.includes(mode.toLowerCase())) {
      issues.push(`invalid_sec_fetch_mode:${mode}`);
    }
  }
  
  // Validate Sec-Fetch-Dest
  if (dest) {
    if (!VALID_SEC_FETCH_DEST.includes(dest.toLowerCase())) {
      issues.push(`invalid_sec_fetch_dest:${dest}`);
    }
  }
  
  // Check for impossible combinations
  
  // If mode is "navigate", dest should be "document" or "iframe"
  if (mode?.toLowerCase() === 'navigate') {
    if (dest && !['document', 'iframe', 'frame', 'empty'].includes(dest.toLowerCase())) {
      issues.push('navigate_mode_wrong_dest');
    }
  }
  
  // If dest is "document", mode should be "navigate"
  if (dest?.toLowerCase() === 'document') {
    if (mode && mode.toLowerCase() !== 'navigate') {
      issues.push('document_dest_wrong_mode');
    }
  }
  
  // If site is "none", it should be a user-initiated navigation
  if (site?.toLowerCase() === 'none') {
    if (!user || user !== '?1') {
      // This is actually valid for typed URLs, bookmarks, etc.
      // Only flag if other things are suspicious
    }
  }
  
  // Check for "same-origin" site with cross-origin referer (inconsistency)
  // This would need the actual referer to validate
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

function detectProxyHeaders(headers: HeadersData): { isProxy: boolean; proxyType: string | null; issues: string[] } {
  const issues: string[] = [];
  let isProxy = false;
  let proxyType: string | null = null;
  
  // Check for X-Forwarded-For
  if (headers.xForwardedFor) {
    const ips = headers.xForwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 1) {
      isProxy = true;
      proxyType = 'forwarded';
      issues.push(`multiple_forwarded_ips:${ips.length}`);
    }
  }
  
  // Check for Via header
  if (headers.via) {
    isProxy = true;
    proxyType = proxyType || 'via';
    issues.push('via_header_present');
  }
  
  // Check for Forwarded header
  if (headers.forwarded) {
    isProxy = true;
    proxyType = proxyType || 'forwarded';
    issues.push('forwarded_header_present');
  }
  
  // Check for Cloudflare
  if (headers.cfConnectingIp) {
    // Cloudflare is legitimate, but note it
    issues.push('cloudflare_proxy');
  }
  
  // Check for True-Client-IP (Akamai/CDN)
  if (headers.trueClientIp) {
    issues.push('cdn_proxy');
  }
  
  return { isProxy, proxyType, issues };
}

// ================ MAIN ANALYSIS FUNCTION ================

export function analyzeHeaders(headers: HeadersData, userAgent?: string): HeadersAnalysis {
  const result: HeadersAnalysis = {
    hasAcceptLanguage: false,
    hasSecChUa: false,
    hasSecFetchHeaders: false,
    hasReferer: false,
    isSuspicious: false,
    isBot: false,
    isProxy: false,
    isCrawler: false,
    isAutomation: false,
    languages: [],
    primaryLanguage: null,
    browserBrand: null,
    browserVersion: null,
    platform: null,
    isMobile: false,
    refererDomain: null,
    inconsistencies: [],
    missingHeaders: [],
    score: 100,
    riskLevel: 'low',
    details: [],
  };
  
  const ua = userAgent?.toLowerCase() || headers.userAgent?.toLowerCase() || '';
  const isChromeBased = /chrome|chromium|edg|opera|opr|brave|vivaldi|samsung/i.test(ua);
  const isFirefox = /firefox/i.test(ua) && !/seamonkey/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|chromium/i.test(ua);
  const isMobileUA = /mobile|android|iphone|ipad|ipod/i.test(ua);
  
  // ================ ACCEPT-LANGUAGE VALIDATION ================
  
  if (headers.acceptLanguage) {
    result.hasAcceptLanguage = true;
    const langAnalysis = parseAcceptLanguage(headers.acceptLanguage);
    result.languages = langAnalysis.languages;
    result.primaryLanguage = langAnalysis.primary;
    
    for (const issue of langAnalysis.issues) {
      result.inconsistencies.push(issue);
      result.score -= 10;
      result.details.push(`Accept-Language: ${issue}`);
    }
  } else {
    result.missingHeaders.push('Accept-Language');
    result.score -= 15;
    result.details.push('Accept-Language ausente');
    
    // Real browsers always send Accept-Language
    if (isChromeBased || isFirefox || isSafari) {
      result.isBot = true;
      result.score -= 20;
      result.details.push('Navegador real deveria ter Accept-Language');
    }
  }
  
  // ================ SEC-CH-UA VALIDATION (Chrome-based only) ================
  
  if (isChromeBased) {
    if (headers.secChUa) {
      result.hasSecChUa = true;
      const secChUaAnalysis = parseSecChUa(headers.secChUa);
      
      if (secChUaAnalysis.brands.length > 0) {
        // Get the main browser brand (not "Not A Brand")
        const mainBrand = secChUaAnalysis.brands.find(b => !/not.*brand/i.test(b.brand));
        if (mainBrand) {
          result.browserBrand = mainBrand.brand;
          result.browserVersion = mainBrand.version;
        }
      }
      
      for (const issue of secChUaAnalysis.issues) {
        if (issue !== 'missing_not_a_brand') { // Minor issue
          result.inconsistencies.push(issue);
          result.score -= 10;
        }
        result.details.push(`Sec-CH-UA: ${issue}`);
      }
    } else {
      // Chrome 89+ should always send Sec-CH-UA
      const chromeMatch = ua.match(/chrome\/(\d+)/i);
      if (chromeMatch) {
        const chromeVersion = parseInt(chromeMatch[1], 10);
        if (chromeVersion >= 89) {
          result.missingHeaders.push('Sec-CH-UA');
          result.score -= 20;
          result.details.push(`Chrome ${chromeVersion} deveria enviar Sec-CH-UA`);
          result.isBot = true;
        }
      }
    }
    
    // Validate Sec-CH-UA-Platform
    if (headers.secChUaPlatform) {
      const platform = headers.secChUaPlatform.replace(/"/g, '');
      result.platform = platform;
      
      if (!VALID_PLATFORMS.includes(platform)) {
        result.inconsistencies.push(`invalid_platform:${platform}`);
        result.score -= 15;
        result.details.push(`Plataforma inválida: ${platform}`);
      }
      
      // Check consistency with UA
      if (platform === 'Windows' && /mac|iphone|android|linux/i.test(ua)) {
        result.inconsistencies.push('platform_ua_mismatch');
        result.score -= 25;
        result.isSuspicious = true;
        result.details.push('Sec-CH-UA-Platform inconsistente com User-Agent');
      }
      
      if (platform === 'macOS' && /windows|android/i.test(ua)) {
        result.inconsistencies.push('platform_ua_mismatch');
        result.score -= 25;
        result.isSuspicious = true;
        result.details.push('Sec-CH-UA-Platform inconsistente com User-Agent');
      }
      
      if (platform === 'Android' && /windows|mac os|iphone/i.test(ua)) {
        result.inconsistencies.push('platform_ua_mismatch');
        result.score -= 25;
        result.isSuspicious = true;
        result.details.push('Sec-CH-UA-Platform inconsistente com User-Agent');
      }
    }
    
    // Validate Sec-CH-UA-Mobile
    if (headers.secChUaMobile) {
      const mobileValue = headers.secChUaMobile.replace(/"/g, '').trim();
      result.isMobile = mobileValue === '?1';
      
      // Check consistency with UA
      if (result.isMobile !== isMobileUA) {
        result.inconsistencies.push('mobile_ua_mismatch');
        result.score -= 20;
        result.isSuspicious = true;
        result.details.push('Sec-CH-UA-Mobile inconsistente com User-Agent');
      }
    }
  }
  
  // ================ SEC-FETCH-* VALIDATION ================
  
  const hasAnySecFetch = headers.secFetchSite || headers.secFetchMode || headers.secFetchDest;
  
  if (hasAnySecFetch) {
    result.hasSecFetchHeaders = true;
    
    const secFetchValidation = validateSecFetchHeaders(
      headers.secFetchSite,
      headers.secFetchMode,
      headers.secFetchDest,
      headers.secFetchUser
    );
    
    for (const issue of secFetchValidation.issues) {
      result.inconsistencies.push(issue);
      result.score -= 15;
      result.details.push(`Sec-Fetch: ${issue}`);
    }
    
    // Check for partial Sec-Fetch headers (suspicious)
    if (headers.secFetchSite && !headers.secFetchMode) {
      result.inconsistencies.push('partial_sec_fetch');
      result.score -= 10;
      result.details.push('Sec-Fetch headers parciais');
    }
  } else if (isChromeBased) {
    // Chrome should send Sec-Fetch headers
    const chromeMatch = ua.match(/chrome\/(\d+)/i);
    if (chromeMatch) {
      const chromeVersion = parseInt(chromeMatch[1], 10);
      if (chromeVersion >= 80) {
        result.missingHeaders.push('Sec-Fetch-*');
        result.score -= 15;
        result.details.push('Chrome moderno deveria enviar Sec-Fetch headers');
      }
    }
  }
  
  // ================ REFERER VALIDATION ================
  
  if (headers.referer) {
    result.hasReferer = true;
    const refererAnalysis = parseReferer(headers.referer);
    result.refererDomain = refererAnalysis.domain;
    
    if (refererAnalysis.isSuspicious) {
      result.isSuspicious = true;
      result.score -= 40;
      result.details.push('Referer de ferramenta spy/análise detectado');
    }
    
    if (refererAnalysis.isBot) {
      result.isBot = true;
      result.score -= 50;
      result.details.push('Referer de bot/crawler detectado');
    }
    
    for (const issue of refererAnalysis.issues) {
      result.inconsistencies.push(issue);
      if (!issue.startsWith('suspicious_referer') && !issue.startsWith('bot_referer')) {
        result.score -= 10;
      }
      result.details.push(`Referer: ${issue}`);
    }
    
    // Check Referer vs Sec-Fetch-Site consistency
    if (headers.secFetchSite === 'same-origin' && result.refererDomain) {
      // This would need the current domain to fully validate
      // For now, just note it
    }
  }
  
  // ================ ACCEPT HEADER VALIDATION ================
  
  if (!headers.accept) {
    result.missingHeaders.push('Accept');
    result.score -= 10;
    result.details.push('Accept header ausente');
  } else {
    // Check for suspicious Accept patterns
    if (headers.accept === '*/*' && !ua.includes('curl') && !ua.includes('wget')) {
      // Generic accept from what claims to be a browser
      if (isChromeBased || isFirefox || isSafari) {
        result.inconsistencies.push('generic_accept_browser');
        result.score -= 10;
        result.details.push('Navegador com Accept genérico é suspeito');
      }
    }
  }
  
  // ================ ACCEPT-ENCODING VALIDATION ================
  
  if (!headers.acceptEncoding) {
    result.missingHeaders.push('Accept-Encoding');
    result.score -= 5;
    result.details.push('Accept-Encoding ausente');
  } else {
    // Modern browsers support gzip and br (brotli)
    const encoding = headers.acceptEncoding.toLowerCase();
    if (isChromeBased && !encoding.includes('br')) {
      // Chrome should support brotli
      result.inconsistencies.push('chrome_no_brotli');
      result.score -= 5;
      result.details.push('Chrome deveria suportar brotli');
    }
  }
  
  // ================ PROXY DETECTION ================
  
  const proxyAnalysis = detectProxyHeaders(headers);
  result.isProxy = proxyAnalysis.isProxy;
  
  for (const issue of proxyAnalysis.issues) {
    result.inconsistencies.push(issue);
    if (!issue.includes('cloudflare') && !issue.includes('cdn')) {
      result.score -= 10;
    }
    result.details.push(`Proxy: ${issue}`);
  }
  
  // ================ AUTOMATION/BOT PATTERNS ================
  
  // Check for missing Connection header
  if (!headers.connection) {
    result.missingHeaders.push('Connection');
    // Not a major issue by itself
  }
  
  // Check for suspicious Upgrade-Insecure-Requests
  if (headers.upgradeInsecureRequests && headers.upgradeInsecureRequests !== '1') {
    result.inconsistencies.push('invalid_upgrade_insecure_requests');
    result.score -= 10;
    result.details.push('Upgrade-Insecure-Requests inválido');
  }
  
  // ================ IMPOSSIBLE COMBINATIONS ================
  
  // Firefox doesn't send Sec-CH-UA
  if (isFirefox && headers.secChUa) {
    result.inconsistencies.push('firefox_with_sec_ch_ua');
    result.score -= 30;
    result.isSuspicious = true;
    result.isBot = true;
    result.details.push('Firefox não deveria enviar Sec-CH-UA');
  }
  
  // Safari doesn't send Sec-CH-UA either
  if (isSafari && headers.secChUa) {
    result.inconsistencies.push('safari_with_sec_ch_ua');
    result.score -= 30;
    result.isSuspicious = true;
    result.isBot = true;
    result.details.push('Safari não deveria enviar Sec-CH-UA');
  }
  
  // Check for too many missing headers (likely bot)
  if (result.missingHeaders.length >= 3) {
    result.isBot = true;
    result.score -= 20;
    result.details.push(`Muitos headers ausentes (${result.missingHeaders.length})`);
  }
  
  // Check for too many inconsistencies
  if (result.inconsistencies.length >= 3) {
    result.isSuspicious = true;
    result.score -= 15;
    result.details.push(`Muitas inconsistências (${result.inconsistencies.length})`);
  }
  
  // ================ FINAL SCORE CALCULATION ================
  
  result.score = Math.max(0, Math.min(100, result.score));
  
  // Determine risk level
  if (result.score <= 20 || result.isBot || result.isCrawler) {
    result.riskLevel = 'critical';
  } else if (result.score <= 40 || result.isSuspicious) {
    result.riskLevel = 'high';
  } else if (result.score <= 60 || result.inconsistencies.length >= 2) {
    result.riskLevel = 'medium';
  } else {
    result.riskLevel = 'low';
  }
  
  return result;
}

// ================ QUICK CHECK FUNCTIONS ================

export function hasValidHeaders(headers: HeadersData): boolean {
  const analysis = analyzeHeaders(headers);
  return analysis.score >= 60 && !analysis.isBot;
}

export function getHeadersScore(headers: HeadersData): number {
  return analyzeHeaders(headers).score;
}

export function hasSuspiciousReferer(referer: string | null | undefined): boolean {
  if (!referer) return false;
  const analysis = parseReferer(referer);
  return analysis.isSuspicious || analysis.isBot;
}

export function isProxyDetected(headers: HeadersData): boolean {
  return analyzeHeaders(headers).isProxy;
}
