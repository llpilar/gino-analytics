/**
 * Advanced User-Agent Analysis Module for Cloaker
 * Enterprise-level detection of crawlers, bots, and inconsistencies
 */

// ================ KNOWN CRAWLERS & BOTS ================

// Meta/Facebook crawlers
const FACEBOOK_CRAWLERS = [
  'facebookexternalhit',
  'facebookcatalog',
  'facebookbot',
  'facebook.com/externalhit',
  'facebot',
  'meta-externalagent',
  'meta-externalfetcher',
  'fbbot',
  'fb_iab',
  'messenger',
  'instagram',
  'whatsapp',
];

// Google crawlers
const GOOGLE_CRAWLERS = [
  'googlebot',
  'google-inspectiontool',
  'google favicon',
  'google-site-verification',
  'google-adwords-instant',
  'google-read-aloud',
  'google-extended',
  'google-safety',
  'mediapartners-google',
  'adsbot-google',
  'adsbot-google-mobile',
  'feedfetcher-google',
  'google-inspectiontool',
  'googleweblight',
  'google-structured-data-testing-tool',
  'google-pagerenderer',
  'google-iab',
  'googlesecurityscanner',
  'google-apps-script',
  'google-http-java-client',
  'google-api-java-client',
  'google-cloud-sdk',
  'google-pubsub',
  'storebot-google',
  'google-xrawler',
  'lighthouse',
  'chrome-lighthouse',
];

// Bing/Microsoft crawlers
const BING_CRAWLERS = [
  'bingbot',
  'bingpreview',
  'msnbot',
  'msnbot-media',
  'msnbot-products',
  'adidxbot',
  'binglocalsearch',
];

// Other search engine crawlers
const SEARCH_ENGINE_CRAWLERS = [
  'yandexbot',
  'yandex.com/bots',
  'yandeximages',
  'yandexmetrika',
  'yandexdirect',
  'yandexvideo',
  'yandexmobilebot',
  'yandexaccessibilitybot',
  'yandexadnet',
  'baiduspider',
  'baiduspider-video',
  'baiduspider-image',
  'baiduspider-news',
  'duckduckbot',
  'duckduckgo-favicons-bot',
  'applebot',
  'slurp', // Yahoo
  'yahoo! slurp',
  'sogou',
  'sogou web spider',
  'exabot',
  'seznambot',
  'petal bot',
  'petalbot',
  'qwantify',
];

// Social media crawlers
const SOCIAL_CRAWLERS = [
  'twitterbot',
  'linkedinbot',
  'pinterest',
  'pinterestbot',
  'slackbot',
  'slackbot-linkexpanding',
  'discordbot',
  'telegrambot',
  'snapchat',
  'redditbot',
  'tumblr',
  'vkshare',
  'w3c_validator',
];

// SEO and marketing tools
const SEO_TOOL_CRAWLERS = [
  'ahrefs',
  'ahrefsbot',
  'semrushbot',
  'dotbot',
  'majestic',
  'mj12bot',
  'screaming frog',
  'screamingfrogseospider',
  'rogerbot',
  'gigabot',
  'searchmetricsbot',
  'seobilitybot',
  'deepcrawl',
  'oncrawl',
  'sistrix',
  'seokicks',
  'blexbot',
  'serpstatbot',
  'dataforseo',
  'spyfu',
  'linkdexbot',
];

// Security/compliance scanners
const SECURITY_SCANNERS = [
  'netsystemsresearch',
  'security',
  'scanner',
  'nikto',
  'nmap',
  'masscan',
  'zap',
  'burp',
  'acunetix',
  'nessus',
  'qualys',
  'sqlmap',
  'wpscan',
  'commoncrawl',
  'archive.org_bot',
  'ia_archiver',
  'ccbot',
];

// Generic bot patterns
const GENERIC_BOT_PATTERNS = [
  'bot',
  'crawl',
  'crawler',
  'spider',
  'spyder',
  'scraper',
  'scraping',
  'harvest',
  'fetcher',
  'fetch',
  'downloader',
  'extractor',
  'parser',
  'reader',
  'archiver',
  'indexer',
  'monitor',
  'checker',
  'validator',
  'verification',
  'probe',
  'analyzer',
  'inspector',
];

// Headless browser patterns
const HEADLESS_PATTERNS = [
  'headless',
  'headlesschrome',
  'chromeheadless',
  'puppeteer',
  'playwright',
  'selenium',
  'webdriver',
  'phantomjs',
  'nightmare',
  'cypress',
  'zombie',
  'jsdom',
  'htmlunit',
  'slimerjs',
  'casperjs',
  'splash',
];

// HTTP libraries/frameworks
const HTTP_LIBRARY_PATTERNS = [
  'curl',
  'wget',
  'libwww',
  'httpie',
  'python-requests',
  'python-urllib',
  'python-httpx',
  'aiohttp',
  'axios',
  'node-fetch',
  'got/',
  'undici',
  'java/',
  'apache-httpclient',
  'okhttp',
  'go-http-client',
  'ruby',
  'perl',
  'php/',
  'guzzle',
  'http_request',
  'httpunit',
  'lwp-',
  'mechanize',
  'scrapy',
  'colly',
  'httrack',
  'offline explorer',
];

// Ad verification & fraud detection
const AD_VERIFICATION_BOTS = [
  'adsverify',
  'confiant',
  'doubleverify',
  'integral ad science',
  'ias_crawler',
  'moatbot',
  'oracle-data-cloud',
  'pixalatebot',
  'human-sec',
  'fraudlogix',
  'whiteops',
  'cheq',
  'trafficguard',
  'appsflyer',
  'adjust',
  'singular',
  'kochava',
  'branch',
  'forensiq',
  'adcolony',
  'mopub',
  'unity ads',
  'ironsource',
];

// ByteDance/TikTok patterns - COMPREHENSIVE LIST
const BYTEDANCE_CRAWLERS = [
  // TikTok official crawlers
  'bytespider',
  'bytedance',
  'tiktokbot',
  'tiktok',
  'tiktok-discovery',
  'tiktok-crawler',
  'tiktok-external',
  // TikTok ad review bots
  'ttspider',
  'tiktok-ads',
  'tiktokadsbot',
  'tiktok-verification',
  'tiktok-preview',
  // TikTok in-app browsers (mark but don't block)
  'tiktok webview',
  'bytedancewebview',
  'bytelocale',
  // Petal (Huawei - often confused with TikTok)
  'petalbot',
  'petal bot',
  // Other ByteDance products
  'douyin', // Chinese TikTok
  'musically', // Old TikTok name
  'lark',
  'feishu',
  'bytedancewebview',
  // Chinese crawlers often used for ad verification
  'sogou',
  'yisou',
  '360spider',
  'haosou',
  'bingbot-china',
];

// TikTok in-app browser patterns (legitimate users from TikTok app)
const TIKTOK_INAPP_BROWSERS = [
  'musical_ly', 
  'tiktok', // Without "bot" suffix
  'bytedancewebview',
  'aweme', // Internal TikTok codename
  'android tiktok',
  'iphone tiktok',
];

// TikTok Ad Review IP patterns (known datacenter ranges used by TikTok)
const TIKTOK_REVIEW_ASN_PATTERNS = [
  'bytedance',
  'tiktok',
  'lark',
  'tt-net',
  'musical.ly',
];

// OpenAI patterns
const OPENAI_CRAWLERS = [
  'openai',
  'chatgpt',
  'gpt',
  'oai-searchbot',
  'chatgpt-user',
];

// Cloud provider user agents
const CLOUD_PROVIDER_UAS = [
  'amazonbot',
  'aws-sdk',
  'boto',
  'google-cloud',
  'gce',
  'azure',
  'alibaba',
  'tencentcloud',
];

// ================ OS VERSIONS ================

interface OSVersion {
  name: string;
  pattern: RegExp;
  minVersion: number;
  maxVersion: number;
  releaseYear: number;
  eolYear?: number;
}

const OS_VERSIONS: OSVersion[] = [
  // Windows
  { name: 'Windows 11', pattern: /Windows NT 10\.0.*Win64/i, minVersion: 10, maxVersion: 10, releaseYear: 2021 },
  { name: 'Windows 10', pattern: /Windows NT 10\.0/i, minVersion: 10, maxVersion: 10, releaseYear: 2015 },
  { name: 'Windows 8.1', pattern: /Windows NT 6\.3/i, minVersion: 6.3, maxVersion: 6.3, releaseYear: 2013, eolYear: 2023 },
  { name: 'Windows 8', pattern: /Windows NT 6\.2/i, minVersion: 6.2, maxVersion: 6.2, releaseYear: 2012, eolYear: 2016 },
  { name: 'Windows 7', pattern: /Windows NT 6\.1/i, minVersion: 6.1, maxVersion: 6.1, releaseYear: 2009, eolYear: 2020 },
  { name: 'Windows Vista', pattern: /Windows NT 6\.0/i, minVersion: 6.0, maxVersion: 6.0, releaseYear: 2007, eolYear: 2017 },
  { name: 'Windows XP', pattern: /Windows NT 5\.[12]/i, minVersion: 5.1, maxVersion: 5.2, releaseYear: 2001, eolYear: 2014 },
  
  // macOS
  { name: 'macOS 14', pattern: /Mac OS X 14[._]/i, minVersion: 14, maxVersion: 14, releaseYear: 2023 },
  { name: 'macOS 13', pattern: /Mac OS X 13[._]/i, minVersion: 13, maxVersion: 13, releaseYear: 2022 },
  { name: 'macOS 12', pattern: /Mac OS X 12[._]/i, minVersion: 12, maxVersion: 12, releaseYear: 2021 },
  { name: 'macOS 11', pattern: /Mac OS X 11[._]/i, minVersion: 11, maxVersion: 11, releaseYear: 2020 },
  { name: 'macOS 10.15', pattern: /Mac OS X 10[._]15/i, minVersion: 10.15, maxVersion: 10.15, releaseYear: 2019 },
  { name: 'macOS 10.14', pattern: /Mac OS X 10[._]14/i, minVersion: 10.14, maxVersion: 10.14, releaseYear: 2018, eolYear: 2021 },
  { name: 'macOS 10.13', pattern: /Mac OS X 10[._]13/i, minVersion: 10.13, maxVersion: 10.13, releaseYear: 2017, eolYear: 2020 },
  
  // iOS
  { name: 'iOS 17', pattern: /iPhone OS 17[._]/i, minVersion: 17, maxVersion: 17, releaseYear: 2023 },
  { name: 'iOS 16', pattern: /iPhone OS 16[._]/i, minVersion: 16, maxVersion: 16, releaseYear: 2022 },
  { name: 'iOS 15', pattern: /iPhone OS 15[._]/i, minVersion: 15, maxVersion: 15, releaseYear: 2021 },
  { name: 'iOS 14', pattern: /iPhone OS 14[._]/i, minVersion: 14, maxVersion: 14, releaseYear: 2020 },
  { name: 'iOS 13', pattern: /iPhone OS 13[._]/i, minVersion: 13, maxVersion: 13, releaseYear: 2019, eolYear: 2021 },
  { name: 'iOS 12', pattern: /iPhone OS 12[._]/i, minVersion: 12, maxVersion: 12, releaseYear: 2018, eolYear: 2020 },
  
  // Android
  { name: 'Android 14', pattern: /Android 14/i, minVersion: 14, maxVersion: 14, releaseYear: 2023 },
  { name: 'Android 13', pattern: /Android 13/i, minVersion: 13, maxVersion: 13, releaseYear: 2022 },
  { name: 'Android 12', pattern: /Android 12/i, minVersion: 12, maxVersion: 12, releaseYear: 2021 },
  { name: 'Android 11', pattern: /Android 11/i, minVersion: 11, maxVersion: 11, releaseYear: 2020 },
  { name: 'Android 10', pattern: /Android 10/i, minVersion: 10, maxVersion: 10, releaseYear: 2019 },
  { name: 'Android 9', pattern: /Android 9/i, minVersion: 9, maxVersion: 9, releaseYear: 2018 },
  { name: 'Android 8', pattern: /Android 8/i, minVersion: 8, maxVersion: 8, releaseYear: 2017, eolYear: 2021 },
  { name: 'Android 7', pattern: /Android 7/i, minVersion: 7, maxVersion: 7, releaseYear: 2016, eolYear: 2019 },
  { name: 'Android 6', pattern: /Android 6/i, minVersion: 6, maxVersion: 6, releaseYear: 2015, eolYear: 2018 },
  { name: 'Android 5', pattern: /Android 5/i, minVersion: 5, maxVersion: 5, releaseYear: 2014, eolYear: 2017 },
  { name: 'Android 4', pattern: /Android 4/i, minVersion: 4, maxVersion: 4, releaseYear: 2011, eolYear: 2016 },
  
  // Linux
  { name: 'Linux', pattern: /Linux(?!.*Android)/i, minVersion: 0, maxVersion: 999, releaseYear: 1991 },
  { name: 'Ubuntu', pattern: /Ubuntu/i, minVersion: 0, maxVersion: 999, releaseYear: 2004 },
  { name: 'Fedora', pattern: /Fedora/i, minVersion: 0, maxVersion: 999, releaseYear: 2003 },
  { name: 'CentOS', pattern: /CentOS/i, minVersion: 0, maxVersion: 999, releaseYear: 2004 },
];

// ================ BROWSER VERSIONS ================

interface BrowserVersion {
  name: string;
  pattern: RegExp;
  versionPattern: RegExp;
  releaseYear: number;
  minModernVersion: number;
  maxVersion: number;
}

const BROWSER_VERSIONS: BrowserVersion[] = [
  { 
    name: 'Chrome', 
    pattern: /Chrome\/(\d+)/i, 
    versionPattern: /Chrome\/(\d+)/i,
    releaseYear: 2008,
    minModernVersion: 90,
    maxVersion: 130,
  },
  { 
    name: 'Firefox', 
    pattern: /Firefox\/(\d+)/i, 
    versionPattern: /Firefox\/(\d+)/i,
    releaseYear: 2004,
    minModernVersion: 90,
    maxVersion: 130,
  },
  { 
    name: 'Safari', 
    pattern: /Version\/(\d+).*Safari/i, 
    versionPattern: /Version\/(\d+)/i,
    releaseYear: 2003,
    minModernVersion: 14,
    maxVersion: 18,
  },
  { 
    name: 'Edge', 
    pattern: /Edg\/(\d+)/i, 
    versionPattern: /Edg\/(\d+)/i,
    releaseYear: 2015,
    minModernVersion: 90,
    maxVersion: 130,
  },
  { 
    name: 'Opera', 
    pattern: /OPR\/(\d+)/i, 
    versionPattern: /OPR\/(\d+)/i,
    releaseYear: 1995,
    minModernVersion: 80,
    maxVersion: 110,
  },
  { 
    name: 'Samsung Internet', 
    pattern: /SamsungBrowser\/(\d+)/i, 
    versionPattern: /SamsungBrowser\/(\d+)/i,
    releaseYear: 2012,
    minModernVersion: 18,
    maxVersion: 25,
  },
  { 
    name: 'UC Browser', 
    pattern: /UCBrowser\/(\d+)/i, 
    versionPattern: /UCBrowser\/(\d+)/i,
    releaseYear: 2004,
    minModernVersion: 13,
    maxVersion: 15,
  },
];

// ================ ANALYSIS RESULT ================

export interface UserAgentAnalysis {
  // Detection results
  isCrawler: boolean;
  isBot: boolean;
  isHeadless: boolean;
  isHttpLibrary: boolean;
  isAdVerification: boolean;
  isEmpty: boolean;
  isGeneric: boolean;
  isSuspicious: boolean;
  
  // TikTok specific
  isTikTokCrawler: boolean;
  isTikTokInApp: boolean;
  isTikTokAdReview: boolean;
  tikTokTrafficType: 'crawler' | 'in-app' | 'ad-review' | 'organic' | 'none';
  
  // Detected entities
  detectedCrawler: string | null;
  detectedBrowser: string | null;
  detectedBrowserVersion: number | null;
  detectedOS: string | null;
  detectedOSVersion: string | null;
  
  // Platform info
  isMobile: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  
  // Consistency issues
  inconsistencies: string[];
  
  // Scoring
  score: number; // 0-100, higher = more human-like
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Details for logging
  details: string[];
}

// ================ MAIN ANALYSIS FUNCTION ================

export function analyzeUserAgent(userAgent: string | null | undefined): UserAgentAnalysis {
  const result: UserAgentAnalysis = {
    isCrawler: false,
    isBot: false,
    isHeadless: false,
    isHttpLibrary: false,
    isAdVerification: false,
    isEmpty: false,
    isGeneric: false,
    isSuspicious: false,
    isTikTokCrawler: false,
    isTikTokInApp: false,
    isTikTokAdReview: false,
    tikTokTrafficType: 'none',
    detectedCrawler: null,
    detectedBrowser: null,
    detectedBrowserVersion: null,
    detectedOS: null,
    detectedOSVersion: null,
    isMobile: false,
    isDesktop: false,
    isTablet: false,
    inconsistencies: [],
    score: 100,
    riskLevel: 'low',
    details: [],
  };
  
  // Check empty/missing UA
  if (!userAgent || userAgent.trim() === '') {
    result.isEmpty = true;
    result.isBot = true;
    result.score = 0;
    result.riskLevel = 'critical';
    result.details.push('User-Agent vazio ou ausente');
    return result;
  }
  
  const ua = userAgent.toLowerCase();
  const originalUA = userAgent;
  
  // ================ CRAWLER DETECTION ================
  
  // Facebook crawlers
  for (const crawler of FACEBOOK_CRAWLERS) {
    if (ua.includes(crawler.toLowerCase())) {
      result.isCrawler = true;
      result.isBot = true;
      result.detectedCrawler = `Facebook: ${crawler}`;
      result.score -= 80;
      result.details.push(`Crawler Meta/Facebook detectado: ${crawler}`);
      break;
    }
  }
  
  // Google crawlers
  if (!result.isCrawler) {
    for (const crawler of GOOGLE_CRAWLERS) {
      if (ua.includes(crawler.toLowerCase())) {
        result.isCrawler = true;
        result.isBot = true;
        result.detectedCrawler = `Google: ${crawler}`;
        result.score -= 80;
        result.details.push(`Crawler Google detectado: ${crawler}`);
        break;
      }
    }
  }
  
  // Bing crawlers
  if (!result.isCrawler) {
    for (const crawler of BING_CRAWLERS) {
      if (ua.includes(crawler.toLowerCase())) {
        result.isCrawler = true;
        result.isBot = true;
        result.detectedCrawler = `Bing: ${crawler}`;
        result.score -= 75;
        result.details.push(`Crawler Bing detectado: ${crawler}`);
        break;
      }
    }
  }
  
  // Other search engines
  if (!result.isCrawler) {
    for (const crawler of SEARCH_ENGINE_CRAWLERS) {
      if (ua.includes(crawler.toLowerCase())) {
        result.isCrawler = true;
        result.isBot = true;
        result.detectedCrawler = `Search Engine: ${crawler}`;
        result.score -= 70;
        result.details.push(`Crawler de busca detectado: ${crawler}`);
        break;
      }
    }
  }
  
  // Social crawlers
  if (!result.isCrawler) {
    for (const crawler of SOCIAL_CRAWLERS) {
      if (ua.includes(crawler.toLowerCase())) {
        result.isCrawler = true;
        result.isBot = true;
        result.detectedCrawler = `Social: ${crawler}`;
        result.score -= 70;
        result.details.push(`Crawler social detectado: ${crawler}`);
        break;
      }
    }
  }
  
  // SEO tools
  if (!result.isCrawler) {
    for (const crawler of SEO_TOOL_CRAWLERS) {
      if (ua.includes(crawler.toLowerCase())) {
        result.isCrawler = true;
        result.isBot = true;
        result.detectedCrawler = `SEO Tool: ${crawler}`;
        result.score -= 80;
        result.details.push(`Ferramenta SEO detectada: ${crawler}`);
        break;
      }
    }
  }
  
  // Security scanners
  if (!result.isCrawler) {
    for (const crawler of SECURITY_SCANNERS) {
      if (ua.includes(crawler.toLowerCase())) {
        result.isCrawler = true;
        result.isBot = true;
        result.detectedCrawler = `Security Scanner: ${crawler}`;
        result.score -= 85;
        result.details.push(`Scanner de segurança detectado: ${crawler}`);
        break;
      }
    }
  }
  
  // ================ TIKTOK SPECIFIC DETECTION ================
  
  // 1. TikTok In-App Browser (LEGITIMATE USERS - don't block!)
  const isTikTokApp = TIKTOK_INAPP_BROWSERS.some(pattern => 
    ua.includes(pattern.toLowerCase()) && !ua.includes('bot') && !ua.includes('spider')
  );
  
  if (isTikTokApp && !result.isCrawler) {
    result.isTikTokInApp = true;
    result.tikTokTrafficType = 'in-app';
    result.isMobile = true; // TikTok is always mobile
    result.details.push('Tráfego legítimo do app TikTok detectado');
    // Don't penalize - these are real users from TikTok!
  }
  
  // 2. TikTok Crawlers/Bots (BLOCK)
  if (!result.isCrawler) {
    for (const crawler of BYTEDANCE_CRAWLERS) {
      if (ua.includes(crawler.toLowerCase())) {
        // Check if it's specifically TikTok
        const isTikTokSpecific = crawler.toLowerCase().includes('tiktok') || 
                                  crawler.toLowerCase().includes('bytespider') ||
                                  crawler.toLowerCase().includes('ttspider');
        
        result.isCrawler = true;
        result.isBot = true;
        result.isTikTokCrawler = isTikTokSpecific;
        result.tikTokTrafficType = 'crawler';
        result.detectedCrawler = `ByteDance/TikTok: ${crawler}`;
        result.score -= 85; // Higher penalty for ad platforms
        result.details.push(`Crawler TikTok/ByteDance detectado: ${crawler}`);
        
        // Check if it looks like ad review
        if (crawler.toLowerCase().includes('ads') || 
            crawler.toLowerCase().includes('verification') ||
            crawler.toLowerCase().includes('preview')) {
          result.isTikTokAdReview = true;
          result.tikTokTrafficType = 'ad-review';
          result.score -= 10; // Extra penalty for ad reviewers
          result.details.push('Bot de revisão de anúncios TikTok detectado');
        }
        break;
      }
    }
  }
  
  // 3. Detect TikTok organic traffic (came from TikTok but regular browser)
  if (!result.isTikTokInApp && !result.isTikTokCrawler && result.isMobile) {
    // Will be detected later via referer, but mark as potential organic
    result.tikTokTrafficType = 'organic';
  }
  
  // OpenAI crawlers
  if (!result.isCrawler) {
    for (const crawler of OPENAI_CRAWLERS) {
      if (ua.includes(crawler.toLowerCase())) {
        result.isCrawler = true;
        result.isBot = true;
        result.detectedCrawler = `OpenAI: ${crawler}`;
        result.score -= 75;
        result.details.push(`Crawler OpenAI detectado: ${crawler}`);
        break;
      }
    }
  }
  
  // Ad verification bots
  if (!result.isCrawler) {
    for (const crawler of AD_VERIFICATION_BOTS) {
      if (ua.includes(crawler.toLowerCase())) {
        result.isAdVerification = true;
        result.isBot = true;
        result.detectedCrawler = `Ad Verification: ${crawler}`;
        result.score -= 90;
        result.details.push(`Bot de verificação de ads detectado: ${crawler}`);
        break;
      }
    }
  }
  
  // Cloud provider UAs
  if (!result.isCrawler) {
    for (const crawler of CLOUD_PROVIDER_UAS) {
      if (ua.includes(crawler.toLowerCase())) {
        result.isCrawler = true;
        result.isBot = true;
        result.detectedCrawler = `Cloud Provider: ${crawler}`;
        result.score -= 70;
        result.details.push(`User-Agent de cloud provider: ${crawler}`);
        break;
      }
    }
  }
  
  // Generic bot patterns
  if (!result.isCrawler && !result.isBot) {
    for (const pattern of GENERIC_BOT_PATTERNS) {
      // Check for word boundaries to avoid false positives
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      if (regex.test(ua)) {
        // Some patterns need extra context
        if (pattern === 'bot' && /robot|about|robots\.txt/i.test(ua)) continue;
        if (pattern === 'fetch' && /javascript/i.test(ua)) continue;
        
        result.isBot = true;
        result.detectedCrawler = `Generic: ${pattern}`;
        result.score -= 50;
        result.details.push(`Padrão genérico de bot detectado: ${pattern}`);
        break;
      }
    }
  }
  
  // ================ HEADLESS DETECTION ================
  
  for (const pattern of HEADLESS_PATTERNS) {
    if (ua.includes(pattern.toLowerCase())) {
      result.isHeadless = true;
      result.isBot = true;
      result.score -= 70;
      result.details.push(`Navegador headless detectado: ${pattern}`);
      break;
    }
  }
  
  // ================ HTTP LIBRARY DETECTION ================
  
  for (const pattern of HTTP_LIBRARY_PATTERNS) {
    if (ua.includes(pattern.toLowerCase())) {
      result.isHttpLibrary = true;
      result.isBot = true;
      result.score -= 80;
      result.details.push(`Biblioteca HTTP detectada: ${pattern}`);
      break;
    }
  }
  
  // ================ GENERIC/SUSPICIOUS UA DETECTION ================
  
  // Very short UA
  if (originalUA.length < 20) {
    result.isGeneric = true;
    result.isSuspicious = true;
    result.score -= 30;
    result.details.push(`User-Agent muito curto (${originalUA.length} chars)`);
    result.inconsistencies.push('ua_too_short');
  }
  
  // Very long UA (potential padding)
  if (originalUA.length > 500) {
    result.isSuspicious = true;
    result.score -= 20;
    result.details.push(`User-Agent muito longo (${originalUA.length} chars)`);
    result.inconsistencies.push('ua_too_long');
  }
  
  // Generic patterns
  const genericPatterns = [
    /^mozilla\/5\.0$/i,
    /^mozilla\/4\.0$/i,
    /^java\//i,
    /^python/i,
    /^okhttp/i,
    /^go-http-client/i,
    /^ruby/i,
    /^perl/i,
    /^node/i,
    /^postman/i,
    /^insomnia/i,
    /^httpie/i,
  ];
  
  for (const pattern of genericPatterns) {
    if (pattern.test(originalUA)) {
      result.isGeneric = true;
      result.isBot = true;
      result.score -= 60;
      result.details.push('User-Agent genérico detectado');
      result.inconsistencies.push('generic_ua');
      break;
    }
  }
  
  // ================ BROWSER & OS EXTRACTION ================
  
  // Detect OS
  for (const os of OS_VERSIONS) {
    if (os.pattern.test(originalUA)) {
      result.detectedOS = os.name;
      result.detectedOSVersion = os.name;
      
      // Check for EOL OS
      if (os.eolYear && os.eolYear < new Date().getFullYear()) {
        result.score -= 15;
        result.details.push(`SO obsoleto detectado: ${os.name} (EOL: ${os.eolYear})`);
        result.inconsistencies.push('eol_os');
      }
      break;
    }
  }
  
  // Detect browser
  for (const browser of BROWSER_VERSIONS) {
    const match = originalUA.match(browser.versionPattern);
    if (match) {
      result.detectedBrowser = browser.name;
      result.detectedBrowserVersion = parseInt(match[1], 10);
      
      // Very old browser version
      if (result.detectedBrowserVersion < browser.minModernVersion - 20) {
        result.score -= 20;
        result.details.push(`Versão de navegador muito antiga: ${browser.name} ${result.detectedBrowserVersion}`);
        result.inconsistencies.push('very_old_browser');
      }
      
      // Impossible future version
      if (result.detectedBrowserVersion > browser.maxVersion + 10) {
        result.score -= 30;
        result.details.push(`Versão de navegador impossível: ${browser.name} ${result.detectedBrowserVersion}`);
        result.inconsistencies.push('impossible_browser_version');
        result.isSuspicious = true;
      }
      break;
    }
  }
  
  // ================ PLATFORM DETECTION ================
  
  result.isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini|opera mobi/i.test(ua);
  result.isTablet = /tablet|ipad|playbook|silk/i.test(ua) && !/mobile/i.test(ua);
  result.isDesktop = !result.isMobile && !result.isTablet && /windows|macintosh|linux/i.test(ua);
  
  // ================ CONSISTENCY CHECKS ================
  
  // iOS with Chrome version > Safari version check
  if (/iphone|ipad|ipod/i.test(ua)) {
    const chromeMatch = originalUA.match(/Chrome\/(\d+)/i);
    const safariMatch = originalUA.match(/Version\/(\d+)/i);
    
    // On iOS, Chrome should report CriOS, not Chrome
    if (chromeMatch && !/CriOS/i.test(ua)) {
      result.score -= 20;
      result.details.push('Chrome no iOS deveria usar CriOS');
      result.inconsistencies.push('ios_chrome_invalid');
      result.isSuspicious = true;
    }
  }
  
  // Old iOS with modern Chrome
  const iosMatch = originalUA.match(/iPhone OS (\d+)/i);
  const chromeVersionMatch = originalUA.match(/Chrome\/(\d+)/i);
  if (iosMatch && chromeVersionMatch) {
    const iosVersion = parseInt(iosMatch[1], 10);
    const chromeVersion = parseInt(chromeVersionMatch[1], 10);
    
    // Chrome 90+ can't run on iOS 11 or older
    if (iosVersion <= 11 && chromeVersion >= 90) {
      result.score -= 25;
      result.details.push(`iOS ${iosVersion} incompatível com Chrome ${chromeVersion}`);
      result.inconsistencies.push('ios_chrome_mismatch');
      result.isSuspicious = true;
    }
  }
  
  // Android version vs Chrome version
  const androidMatch = originalUA.match(/Android (\d+)/i);
  if (androidMatch && chromeVersionMatch) {
    const androidVersion = parseInt(androidMatch[1], 10);
    const chromeVersion = parseInt(chromeVersionMatch[1], 10);
    
    // Chrome 90+ requires Android 7+
    if (androidVersion < 7 && chromeVersion >= 90) {
      result.score -= 25;
      result.details.push(`Android ${androidVersion} incompatível com Chrome ${chromeVersion}`);
      result.inconsistencies.push('android_chrome_mismatch');
      result.isSuspicious = true;
    }
  }
  
  // Windows XP/Vista with modern browsers
  if (/Windows NT (5\.[12]|6\.0)/i.test(ua)) {
    if (chromeVersionMatch) {
      const chromeVersion = parseInt(chromeVersionMatch[1], 10);
      if (chromeVersion >= 50) {
        result.score -= 30;
        result.details.push('Windows XP/Vista com Chrome moderno é impossível');
        result.inconsistencies.push('old_windows_modern_chrome');
        result.isSuspicious = true;
      }
    }
  }
  
  // Linux with Safari (should be rare/suspicious)
  if (/Linux/i.test(ua) && !/Android/i.test(ua) && /Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    result.score -= 15;
    result.details.push('Safari puro no Linux é suspeito');
    result.inconsistencies.push('linux_safari');
    result.isSuspicious = true;
  }
  
  // Mobile UA but no touch device
  if (result.isMobile && /Windows NT/i.test(ua) && !/Touch|Tablet/i.test(ua)) {
    result.score -= 10;
    result.details.push('UA mobile com identificador Windows NT');
    result.inconsistencies.push('mobile_windows_mismatch');
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    { pattern: /compatible;\s*MSIE.*Windows.*Trident/i, name: 'ie_trident_mismatch', penalty: 15 },
    { pattern: /Mozilla\/5\.0.*Gecko.*Firefox.*Chrome/i, name: 'firefox_chrome_mix', penalty: 25 },
    { pattern: /Opera\/9\.80.*Version\/\d+/i, name: 'old_opera_format', penalty: 10 },
    { pattern: /\(\s*\)/i, name: 'empty_parentheses', penalty: 20 },
    { pattern: /^.*;\s*$/i, name: 'trailing_semicolon', penalty: 10 },
  ];
  
  for (const { pattern, name, penalty } of suspiciousPatterns) {
    if (pattern.test(originalUA)) {
      result.score -= penalty;
      result.isSuspicious = true;
      result.inconsistencies.push(name);
      result.details.push(`Padrão suspeito: ${name}`);
    }
  }
  
  // ================ RARE OS DETECTION ================
  
  const rareOS = [
    /FreeBSD/i, /OpenBSD/i, /NetBSD/i, /SunOS/i, /HP-UX/i,
    /AIX/i, /IRIX/i, /OS\/2/i, /BeOS/i, /Haiku/i,
    /Symbian/i, /Series60/i, /Palm/i, /webOS/i,
    /BlackBerry/i, /BB10/i, /PlayBook/i,
    /Kindle/i, /Silk/i,
    /Nintendo/i, /PlayStation/i, /Xbox/i,
  ];
  
  for (const os of rareOS) {
    if (os.test(ua)) {
      // Not necessarily bad, but rare
      result.score -= 5;
      result.details.push(`SO raro detectado: ${os.source}`);
      break;
    }
  }
  
  // ================ FINAL SCORE CALCULATION ================
  
  // Ensure score is within bounds
  result.score = Math.max(0, Math.min(100, result.score));
  
  // Determine risk level
  if (result.score <= 20 || result.isCrawler || result.isAdVerification) {
    result.riskLevel = 'critical';
  } else if (result.score <= 40 || result.isBot || result.isHeadless) {
    result.riskLevel = 'high';
  } else if (result.score <= 60 || result.isSuspicious || result.inconsistencies.length >= 2) {
    result.riskLevel = 'medium';
  } else {
    result.riskLevel = 'low';
  }
  
  return result;
}

// ================ QUICK CHECK FUNCTIONS ================

export function isCrawlerUA(userAgent: string | null | undefined): boolean {
  const analysis = analyzeUserAgent(userAgent);
  return analysis.isCrawler || analysis.isBot;
}

export function isEmptyOrGenericUA(userAgent: string | null | undefined): boolean {
  const analysis = analyzeUserAgent(userAgent);
  return analysis.isEmpty || analysis.isGeneric;
}

export function hasUAInconsistencies(userAgent: string | null | undefined): boolean {
  const analysis = analyzeUserAgent(userAgent);
  return analysis.inconsistencies.length > 0;
}

export function getUAScore(userAgent: string | null | undefined): number {
  const analysis = analyzeUserAgent(userAgent);
  return analysis.score;
}

// ================ TIKTOK SPECIFIC FUNCTIONS ================

/**
 * Check if traffic is from TikTok in-app browser (legitimate user)
 */
export function isTikTokInAppBrowser(userAgent: string | null | undefined): boolean {
  const analysis = analyzeUserAgent(userAgent);
  return analysis.isTikTokInApp;
}

/**
 * Check if traffic is from TikTok crawler/bot (should be blocked)
 */
export function isTikTokCrawler(userAgent: string | null | undefined): boolean {
  const analysis = analyzeUserAgent(userAgent);
  return analysis.isTikTokCrawler;
}

/**
 * Check if traffic is from TikTok ad review system (should be blocked)
 */
export function isTikTokAdReview(userAgent: string | null | undefined): boolean {
  const analysis = analyzeUserAgent(userAgent);
  return analysis.isTikTokAdReview;
}

/**
 * Get the type of TikTok traffic
 */
export function getTikTokTrafficType(userAgent: string | null | undefined): 'crawler' | 'in-app' | 'ad-review' | 'organic' | 'none' {
  const analysis = analyzeUserAgent(userAgent);
  return analysis.tikTokTrafficType;
}

/**
 * Check if this is valid mobile traffic (important for TikTok since it's mobile-first)
 */
export function isValidMobileTraffic(userAgent: string | null | undefined): boolean {
  const analysis = analyzeUserAgent(userAgent);
  
  // Must be mobile
  if (!analysis.isMobile) return false;
  
  // Must not be a bot
  if (analysis.isBot || analysis.isCrawler) return false;
  
  // Must have a reasonable score
  if (analysis.score < 50) return false;
  
  // Must not have critical inconsistencies
  if (analysis.inconsistencies.length > 2) return false;
  
  return true;
}

/**
 * Check if traffic should be allowed for TikTok Ads campaigns
 * This is optimized for TikTok's predominantly mobile traffic
 */
export function shouldAllowTikTokTraffic(userAgent: string | null | undefined): {
  allow: boolean;
  reason: string;
  trafficType: string;
  confidence: number;
} {
  const analysis = analyzeUserAgent(userAgent);
  
  // Block TikTok crawlers
  if (analysis.isTikTokCrawler) {
    return {
      allow: false,
      reason: 'TikTok crawler/bot detectado',
      trafficType: analysis.tikTokTrafficType,
      confidence: 95,
    };
  }
  
  // Block TikTok ad reviewers
  if (analysis.isTikTokAdReview) {
    return {
      allow: false,
      reason: 'Bot de revisão de anúncios TikTok detectado',
      trafficType: analysis.tikTokTrafficType,
      confidence: 98,
    };
  }
  
  // Allow TikTok in-app browser (legitimate users)
  if (analysis.isTikTokInApp) {
    return {
      allow: true,
      reason: 'Usuário legítimo do app TikTok',
      trafficType: analysis.tikTokTrafficType,
      confidence: 90,
    };
  }
  
  // For mobile traffic, be more lenient (TikTok is mobile-first)
  if (analysis.isMobile && analysis.score >= 40) {
    return {
      allow: true,
      reason: 'Tráfego mobile válido',
      trafficType: 'mobile',
      confidence: analysis.score,
    };
  }
  
  // Block any other bot/crawler
  if (analysis.isBot || analysis.isCrawler) {
    return {
      allow: false,
      reason: `Bot detectado: ${analysis.detectedCrawler || 'genérico'}`,
      trafficType: 'bot',
      confidence: 85,
    };
  }
  
  // Default: allow with moderate confidence
  return {
    allow: analysis.score >= 50,
    reason: analysis.score >= 50 ? 'Tráfego válido' : 'Score baixo',
    trafficType: analysis.isMobile ? 'mobile' : 'desktop',
    confidence: analysis.score,
  };
}

// Export ASN patterns for TikTok review detection
export const TIKTOK_ASN_PATTERNS = TIKTOK_REVIEW_ASN_PATTERNS;
