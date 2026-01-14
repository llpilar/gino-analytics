import { useState } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatsCard, SectionCard } from "@/components/ui/stats-card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Link2, Trash2, Copy, ExternalLink, Shield, Globe, Smartphone, Bot, 
  MousePointerClick, ToggleRight, Eye, Fingerprint, Activity, ChartBar,
  Users, AlertTriangle, CheckCircle, XCircle, Clock, Pencil, Timer, Zap,
  Ban, Server, Wifi, Network, Lock, Unlock, Languages, LinkIcon, Filter, Bell, Webhook,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { useCloakedLinks, useCloakerVisitors, useCloakerStats } from "@/hooks/useCloakedLinks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";

const COUNTRIES = [
  { code: "BR", name: "Brasil" },
  { code: "US", name: "Estados Unidos" },
  { code: "PT", name: "Portugal" },
  { code: "ES", name: "Espanha" },
  { code: "AR", name: "Argentina" },
  { code: "MX", name: "México" },
  { code: "CO", name: "Colômbia" },
  { code: "CL", name: "Chile" },
];

const DEVICES = [
  { value: "mobile", label: "Mobile" },
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
];

const LANGUAGES = [
  { code: "pt-BR", name: "Português (Brasil)" },
  { code: "pt-PT", name: "Português (Portugal)" },
  { code: "en-US", name: "Inglês (EUA)" },
  { code: "en-GB", name: "Inglês (Reino Unido)" },
  { code: "es-ES", name: "Espanhol (Espanha)" },
  { code: "es-MX", name: "Espanhol (México)" },
  { code: "es-CO", name: "Espanhol (Colômbia)" },
  { code: "fr-FR", name: "Francês" },
  { code: "de-DE", name: "Alemão" },
  { code: "it-IT", name: "Italiano" },
];

// Presets de configuração - OTIMIZADOS para cada plataforma
const PRESETS = {
  facebook: {
    name: "Facebook Ads",
    icon: "📘",
    description: "Otimizado para FB/Instagram Ads",
    config: {
      blockBots: true,
      allowSocialPreviews: true, // Permite WhatsApp, Messenger, etc
      minScore: 25, // Baixo - in-app browsers têm fingerprints estranhos
      collectFingerprint: true,
      requireBehavior: false, // NUNCA em mobile - mata conversão
      behaviorTimeMs: 2000,
      passthroughUtm: true,
      rateLimitPerIp: 20, // Alto - IPs compartilhados em mobile
      blockVpn: false, // CRÍTICO: muitos usuários BR usam VPN
      blockProxy: false, // Empresas usam proxy
      blockDatacenter: true, // Bots geralmente vêm de DC
      blockTor: true,
      redirectDelayMs: 0,
      allowedReferers: "", // Vazio = aceita tudo (FB manda de vários domínios)
      blockedReferers: "adspy.com\nanstrex.com\nbigspy.com\nspyfu.com\ndropispy.com\npipiads.com\nadplexity.com",
    }
  },
  google: {
    name: "Google Ads",
    icon: "🔍",
    description: "Otimizado para Google Ads",
    config: {
      blockBots: true,
      allowSocialPreviews: true,
      minScore: 35, // Médio - tráfego Google é mais "limpo"
      collectFingerprint: true,
      requireBehavior: false, // Desativado para não prejudicar conversão
      behaviorTimeMs: 2000,
      passthroughUtm: true,
      rateLimitPerIp: 15,
      blockVpn: false, // Melhor não bloquear - perde tráfego real
      blockProxy: false,
      blockDatacenter: true,
      blockTor: true,
      redirectDelayMs: 0,
      allowedReferers: "",
      blockedReferers: "adspy.com\nanstrex.com\nbigspy.com\nspyfu.com\nsemrush.com\nahrefs.com\nsimilarweb.com",
    }
  },
  tiktok: {
    name: "🔥 TikTok Ads PRO",
    icon: "🎵",
    description: "Otimizado para TikTok Ads com detecção avançada de crawlers e regras mobile",
    config: {
      // === CONFIGURAÇÃO CORE OTIMIZADA PARA TIKTOK ===
      blockBots: true, // Bloqueia crawlers TikTok automaticamente detectados
      allowSocialPreviews: true, // Permite previews do TikTok (bytedance_spider_preview)
      
      // === SCORE ULTRA PERMISSIVO ===
      // TikTok = público jovem, mobile-first, decisões impulsivas
      // Score alto demais = perda de conversões
      minScore: 15, // MUITO baixo - prioriza conversão sobre proteção
      
      // === FINGERPRINTING LEVE ===
      collectFingerprint: true, // Mantém para tracking
      requireBehavior: false, // CRÍTICO: NUNCA ativar - TikTok é 100% mobile
      behaviorTimeMs: 1000, // Mínimo se precisar ativar futuramente
      
      // === UTM E RASTREAMENTO ===
      passthroughUtm: true, // Mantém parâmetros ttclid, etc
      
      // === RATE LIMIT ALTO ===
      // TikTok gera picos virais de tráfego - limites baixos matam conversão
      rateLimitPerIp: 50, // MUITO alto - IPs compartilhados + picos virais
      
      // === PROTEÇÃO DE REDE PERMISSIVA ===
      // Público jovem = muitos usam VPN para privacidade
      blockVpn: false, // NUNCA bloquear - Gen Z usa VPN
      blockProxy: false, // Apps corporativos usam proxy
      blockDatacenter: true, // Bots vêm de DCs - manter ativo
      blockTor: true, // Manter para proteção básica
      
      // === REDIRECT INSTANTÂNEO ===
      // TikTok = atenção curta - qualquer delay = abandono
      redirectDelayMs: 0, // ZERO delay - conversão máxima
      
      // === FILTROS DE REFERER ===
      allowedReferers: "", // Vazio = aceita qualquer origem (TikTok usa vários domínios)
      // Bloqueia ferramentas de espionagem de ads
      blockedReferers: "adspy.com\nanstrex.com\nbigspy.com\npipiads.com\nadplexity.com\ndropispy.com\nsocialadscout.com\nforeplay.co\nminea.com\nad.tiktok.com/business",
      
      // === DISPOSITIVOS ===
      // TikTok é mobile-first - não restringir por device
      allowedDevices: [], // Vazio = todos os dispositivos
      
      // === PAÍSES ===
      // Deixar vazio para não restringir - configurar manualmente
      allowedCountries: [],
      blockedCountries: [],
      
      // === IDIOMAS ===
      // Não restringir - TikTok é global
      allowedLanguages: [],
      blockedLanguages: [],
    }
  },
  organic: {
    name: "Tráfego Orgânico",
    icon: "🌿",
    description: "SEO, direto, redes sociais",
    config: {
      blockBots: true, // Bloqueia crawlers maliciosos
      allowSocialPreviews: true, // Permite previews de redes sociais
      minScore: 15, // BEM permissivo
      collectFingerprint: true,
      requireBehavior: false,
      behaviorTimeMs: 1000,
      passthroughUtm: true,
      rateLimitPerIp: 50, // Muito permissivo
      blockVpn: false,
      blockProxy: false, // Empresas e universidades usam proxy
      blockDatacenter: false, // Pode ser usuário de VPS legítimo
      blockTor: true,
      redirectDelayMs: 0,
      allowedReferers: "",
      blockedReferers: "adspy.com\nanstrex.com\nbigspy.com",
    }
  },
  maximum: {
    name: "Proteção Máxima",
    icon: "🛡️",
    description: "Para ofertas sensíveis/blackhat",
    config: {
      blockBots: true,
      allowSocialPreviews: false, // NÃO permite - máxima proteção
      minScore: 45, // Alto - só passa quem for muito humano
      collectFingerprint: true,
      requireBehavior: true, // ATIVADO - filtra ao máximo
      behaviorTimeMs: 3000, // 3 segundos de análise
      passthroughUtm: true,
      rateLimitPerIp: 5, // Bem restritivo
      blockVpn: true, // Bloqueia tudo
      blockProxy: true,
      blockDatacenter: true,
      blockTor: true,
      redirectDelayMs: 500, // Pequeno delay anti-bot
      allowedReferers: "",
      blockedReferers: "adspy.com\nanstrex.com\nbigspy.com\nspyfu.com\nsemrush.com\nahrefs.com\ndropispy.com\npipiads.com\nadplexity.com\nsimilarweb.com",
    }
  }
};

export default function Cloaker() {
  const { links, isLoading, createLink, updateLink, deleteLink } = useCloakedLinks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<{
    id: string;
    name: string;
    slug: string;
    safeUrl: string;
    targetUrl: string;
    allowedCountries: string[];
    blockedCountries: string[];
    allowedDevices: string[];
    blockBots: boolean;
    minScore: number;
    collectFingerprint: boolean;
    requireBehavior: boolean;
    behaviorTimeMs: number;
    // Advanced fields
    maxClicksDaily: number | null;
    maxClicksTotal: number | null;
    allowedHoursStart: number | null;
    allowedHoursEnd: number | null;
    passthroughUtm: boolean;
    rateLimitPerIp: number | null;
    blockVpn: boolean;
    blockProxy: boolean;
    blockDatacenter: boolean;
    blockTor: boolean;
    redirectDelayMs: number;
    whitelistIps: string;
    blacklistIps: string;
    // New filter fields
    allowedReferers: string;
    blockedReferers: string;
    requiredUrlParams: string;
    blockedUrlParams: string;
    allowedLanguages: string[];
    blockedLanguages: string[];
    // Webhook fields
    webhookUrl: string;
    webhookEnabled: boolean;
    webhookEvents: string[];
  } | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  // Configurações pré-otimizadas para Facebook e Google Ads
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    safeUrl: "https://pagina.segu.online/",
    targetUrl: "https://bioboost.site/",
    allowedCountries: [] as string[],
    blockedCountries: [] as string[],
    allowedDevices: [] as string[],
    // === PROTEÇÃO ATIVADA POR PADRÃO ===
    blockBots: true,
    // Permitir previews de redes sociais (WhatsApp, Telegram, Facebook, etc)
    allowSocialPreviews: true,
    // Score 35 = balanceado (não muito agressivo, não muito permissivo)
    minScore: 35,
    // Fingerprint ativo = melhor detecção de bots/automação
    collectFingerprint: true,
    // Comportamento ativo = página de challenge para máxima proteção
    requireBehavior: true,
    // 2.5s = tempo suficiente para coletar dados sem irritar usuário
    behaviorTimeMs: 2500,
    // === CONFIGURAÇÕES AVANÇADAS OTIMIZADAS ===
    maxClicksDaily: null as number | null,
    maxClicksTotal: null as number | null,
    allowedHoursStart: null as number | null,
    allowedHoursEnd: null as number | null,
    // UTM passthrough = manter rastreamento de campanhas
    passthroughUtm: true,
    // Rate limit por IP = prevenir abuse
    rateLimitPerIp: 10 as number | null,
    // Bloquear todas as fontes suspeitas
    blockVpn: true,
    blockProxy: true,
    blockDatacenter: true,
    blockTor: true,
    // Delay 0 = redirect instantâneo após aprovação
    redirectDelayMs: 0,
    whitelistIps: "",
    blacklistIps: "",
    // === NOVOS FILTROS ===
    allowedReferers: "",
    blockedReferers: "",
    requiredUrlParams: "",
    blockedUrlParams: "",
    allowedLanguages: [] as string[],
    blockedLanguages: [] as string[],
  });

  const { data: visitors, isLoading: visitorsLoading, clearVisitors, isClearing } = useCloakerVisitors(selectedLinkId);
  const { data: stats } = useCloakerStats(selectedLinkId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Parse arrays from textarea strings
      const parseLines = (str: string): string[] => 
        str.split("\n").map(s => s.trim()).filter(Boolean);
      
      const parseUrlParams = (str: string): Record<string, string> | null => {
        const lines = str.split("\n").map(s => s.trim()).filter(Boolean);
        if (lines.length === 0) return null;
        const params: Record<string, string> = {};
        for (const line of lines) {
          const [key, ...valueParts] = line.split("=");
          if (key) params[key.trim()] = valueParts.join("=").trim();
        }
        return Object.keys(params).length > 0 ? params : null;
      };

      await createLink({
        name: formData.name,
        slug: formData.slug,
        safe_url: formData.safeUrl,
        target_url: formData.targetUrl,
        allowed_countries: formData.allowedCountries.length > 0 ? formData.allowedCountries : null,
        blocked_countries: formData.blockedCountries.length > 0 ? formData.blockedCountries : null,
        allowed_devices: formData.allowedDevices.length > 0 ? formData.allowedDevices : null,
        block_bots: formData.blockBots,
        allow_social_previews: formData.allowSocialPreviews,
        min_score: formData.minScore,
        collect_fingerprint: formData.collectFingerprint,
        require_behavior: formData.requireBehavior,
        behavior_time_ms: formData.behaviorTimeMs,
        // Configurações avançadas
        max_clicks_daily: formData.maxClicksDaily,
        max_clicks_total: formData.maxClicksTotal,
        allowed_hours_start: formData.allowedHoursStart,
        allowed_hours_end: formData.allowedHoursEnd,
        passthrough_utm: formData.passthroughUtm,
        rate_limit_per_ip: formData.rateLimitPerIp,
        block_vpn: formData.blockVpn,
        block_proxy: formData.blockProxy,
        block_datacenter: formData.blockDatacenter,
        block_tor: formData.blockTor,
        redirect_delay_ms: formData.redirectDelayMs,
        // IPs whitelist/blacklist
        whitelist_ips: parseLines(formData.whitelistIps).length > 0 ? parseLines(formData.whitelistIps) : null,
        blacklist_ips: parseLines(formData.blacklistIps).length > 0 ? parseLines(formData.blacklistIps) : null,
        // Referers e URL params
        allowed_referers: parseLines(formData.allowedReferers).length > 0 ? parseLines(formData.allowedReferers) : null,
        blocked_referers: parseLines(formData.blockedReferers).length > 0 ? parseLines(formData.blockedReferers) : null,
        required_url_params: parseUrlParams(formData.requiredUrlParams),
        blocked_url_params: parseUrlParams(formData.blockedUrlParams),
        // Idiomas
        allowed_languages: formData.allowedLanguages.length > 0 ? formData.allowedLanguages : null,
        blocked_languages: formData.blockedLanguages.length > 0 ? formData.blockedLanguages : null,
      });
      
      setIsDialogOpen(false);
      resetForm();
      toast.success("Link criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar link");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      safeUrl: "https://pagina.segu.online/",
      targetUrl: "https://bioboost.site/",
      allowedCountries: [],
      blockedCountries: [],
      allowedDevices: [],
      blockBots: true,
      allowSocialPreviews: true,
      minScore: 35,
      collectFingerprint: true,
      requireBehavior: true,
      behaviorTimeMs: 2500,
      maxClicksDaily: null,
      maxClicksTotal: null,
      allowedHoursStart: null,
      allowedHoursEnd: null,
      passthroughUtm: true,
      rateLimitPerIp: 10,
      blockVpn: true,
      blockProxy: true,
      blockDatacenter: true,
      blockTor: true,
      redirectDelayMs: 0,
      whitelistIps: "",
      blacklistIps: "",
      // New filter fields
      allowedReferers: "",
      blockedReferers: "",
      requiredUrlParams: "",
      blockedUrlParams: "",
      allowedLanguages: [],
      blockedLanguages: [],
    });
  };

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setFormData(prev => ({
      ...prev,
      ...preset.config,
    }));
    toast.success(`Preset "${preset.name}" aplicado!`);
  };

  const handleCopyLink = (slug: string) => {
    // Use edge function URL directly - hides lovable domain
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${supabaseUrl}/functions/v1/cloaker-redirect/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const handleTestLink = (slug: string) => {
    // Use frontend route for fingerprint collection
    const url = `${window.location.origin}/c/${slug}`;
    window.open(url, "_blank");
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateLink({ id, is_active: !isActive });
      toast.success(isActive ? "Link desativado" : "Link ativado");
    } catch (error) {
      toast.error("Erro ao atualizar link");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLink(id);
      if (selectedLinkId === id) setSelectedLinkId(null);
      toast.success("Link excluído");
    } catch (error) {
      toast.error("Erro ao excluir link");
    }
  };

  const handleClearVisitors = async () => {
    if (!selectedLinkId) return;
    
    try {
      await clearVisitors(selectedLinkId);
      toast.success("Histórico de visitantes limpo com sucesso");
    } catch (error) {
      toast.error("Erro ao limpar visitantes");
    }
  };

  const handleEditClick = (link: typeof links[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLink({
      id: link.id,
      name: link.name,
      slug: link.slug,
      safeUrl: link.safe_url,
      targetUrl: link.target_url,
      allowedCountries: link.allowed_countries || [],
      blockedCountries: link.blocked_countries || [],
      allowedDevices: link.allowed_devices || [],
      blockBots: link.block_bots,
      minScore: link.min_score ?? 40,
      collectFingerprint: link.collect_fingerprint ?? true,
      requireBehavior: link.require_behavior ?? false,
      behaviorTimeMs: link.behavior_time_ms ?? 2000,
      maxClicksDaily: link.max_clicks_daily ?? null,
      maxClicksTotal: link.max_clicks_total ?? null,
      allowedHoursStart: link.allowed_hours_start ?? null,
      allowedHoursEnd: link.allowed_hours_end ?? null,
      passthroughUtm: link.passthrough_utm ?? true,
      rateLimitPerIp: link.rate_limit_per_ip ?? null,
      blockVpn: link.block_vpn ?? true,
      blockProxy: link.block_proxy ?? true,
      blockDatacenter: link.block_datacenter ?? true,
      blockTor: link.block_tor ?? true,
      redirectDelayMs: link.redirect_delay_ms ?? 0,
      whitelistIps: (link.whitelist_ips || []).join("\n"),
      blacklistIps: (link.blacklist_ips || []).join("\n"),
      // New filter fields
      allowedReferers: (link.allowed_referers || []).join("\n"),
      blockedReferers: (link.blocked_referers || []).join("\n"),
      requiredUrlParams: link.required_url_params ? Object.entries(link.required_url_params).map(([k, v]) => `${k}=${v}`).join("\n") : "",
      blockedUrlParams: link.blocked_url_params ? Object.entries(link.blocked_url_params).map(([k, v]) => `${k}=${v}`).join("\n") : "",
      allowedLanguages: link.allowed_languages || [],
      blockedLanguages: link.blocked_languages || [],
      // Webhook fields
      webhookUrl: (link as any).webhook_url || "",
      webhookEnabled: (link as any).webhook_enabled ?? false,
      webhookEvents: (link as any).webhook_events || ["bot_blocked", "vpn_blocked", "suspicious_score"],
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLink) return;
    try {
      const whitelistArr = editingLink.whitelistIps.split("\n").map(s => s.trim()).filter(Boolean);
      const blacklistArr = editingLink.blacklistIps.split("\n").map(s => s.trim()).filter(Boolean);
      const allowedReferersArr = editingLink.allowedReferers.split("\n").map(s => s.trim()).filter(Boolean);
      const blockedReferersArr = editingLink.blockedReferers.split("\n").map(s => s.trim()).filter(Boolean);
      
      // Parse URL params from key=value format
      const parseUrlParams = (str: string): Record<string, string> | null => {
        const lines = str.split("\n").map(s => s.trim()).filter(Boolean);
        if (lines.length === 0) return null;
        const params: Record<string, string> = {};
        for (const line of lines) {
          const [key, ...valueParts] = line.split("=");
          if (key) params[key.trim()] = valueParts.join("=").trim();
        }
        return Object.keys(params).length > 0 ? params : null;
      };
      
      await updateLink({ 
        id: editingLink.id,
        name: editingLink.name,
        slug: editingLink.slug,
        target_url: editingLink.targetUrl,
        safe_url: editingLink.safeUrl,
        allowed_countries: editingLink.allowedCountries.length > 0 ? editingLink.allowedCountries : null,
        blocked_countries: editingLink.blockedCountries.length > 0 ? editingLink.blockedCountries : null,
        allowed_devices: editingLink.allowedDevices.length > 0 ? editingLink.allowedDevices : null,
        block_bots: editingLink.blockBots,
        min_score: editingLink.minScore,
        collect_fingerprint: editingLink.collectFingerprint,
        require_behavior: editingLink.requireBehavior,
        behavior_time_ms: editingLink.behaviorTimeMs,
        max_clicks_daily: editingLink.maxClicksDaily,
        max_clicks_total: editingLink.maxClicksTotal,
        allowed_hours_start: editingLink.allowedHoursStart,
        allowed_hours_end: editingLink.allowedHoursEnd,
        passthrough_utm: editingLink.passthroughUtm,
        rate_limit_per_ip: editingLink.rateLimitPerIp,
        block_vpn: editingLink.blockVpn,
        block_proxy: editingLink.blockProxy,
        block_datacenter: editingLink.blockDatacenter,
        block_tor: editingLink.blockTor,
        redirect_delay_ms: editingLink.redirectDelayMs,
        whitelist_ips: whitelistArr.length > 0 ? whitelistArr : null,
        blacklist_ips: blacklistArr.length > 0 ? blacklistArr : null,
        // New filter fields
        allowed_referers: allowedReferersArr.length > 0 ? allowedReferersArr : null,
        blocked_referers: blockedReferersArr.length > 0 ? blockedReferersArr : null,
        required_url_params: parseUrlParams(editingLink.requiredUrlParams),
        blocked_url_params: parseUrlParams(editingLink.blockedUrlParams),
        allowed_languages: editingLink.allowedLanguages.length > 0 ? editingLink.allowedLanguages : null,
        blocked_languages: editingLink.blockedLanguages.length > 0 ? editingLink.blockedLanguages : null,
        // Webhook fields
        webhook_url: editingLink.webhookUrl || null,
        webhook_enabled: editingLink.webhookEnabled,
        webhook_events: editingLink.webhookEvents.length > 0 ? editingLink.webhookEvents : null,
      });
      setIsEditDialogOpen(false);
      setEditingLink(null);
      toast.success("Link atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const toggleEditArrayValue = (field: 'allowedCountries' | 'blockedCountries' | 'allowedDevices' | 'allowedLanguages' | 'blockedLanguages', value: string) => {
    if (!editingLink) return;
    const array = editingLink[field];
    if (array.includes(value)) {
      setEditingLink({ ...editingLink, [field]: array.filter(v => v !== value) });
    } else {
      setEditingLink({ ...editingLink, [field]: [...array, value] });
    }
  };

  const toggleArrayValue = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(v => v !== value));
    } else {
      setter([...array, value]);
    }
  };

  // Calculate stats
  const totalLinks = links.length;
  const activeLinks = links.filter(l => l.is_active).length;
  const totalClicks = links.reduce((acc, l) => acc + l.clicks_count, 0);
  const linksWithBotBlock = links.filter(l => l.block_bots).length;

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "allow": return "text-chart-4";
      case "block": return "text-destructive";
      case "safe": return "text-yellow-500";
      default: return "text-muted-foreground";
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case "allow": return <CheckCircle className="h-4 w-4 text-chart-4" />;
      case "block": return <XCircle className="h-4 w-4 text-destructive" />;
      case "safe": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-chart-4";
    if (score >= 40) return "text-yellow-500";
    return "text-destructive";
  };

  return (
    <DashboardWrapper>
      <div className="w-full max-w-[2400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 md:py-6 lg:py-8 min-h-screen pb-24 md:pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-8">
          <PageHeader 
            title="Cloaker Avançado"
            subtitle="Fingerprinting, análise comportamental e scoring dinâmico"
          />
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Link
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Link Protegido</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Presets de Configuração Rápida */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Configuração Rápida</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(PRESETS).map(([key, preset]) => (
                      <Button
                        key={key}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto py-2 px-3 flex flex-col items-center gap-1 hover:bg-primary/10 hover:border-primary/50 transition-all"
                        onClick={() => applyPreset(key as keyof typeof PRESETS)}
                      >
                        <span className="text-lg">{preset.icon}</span>
                        <span className="text-xs font-medium">{preset.name}</span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique para aplicar configurações otimizadas para cada plataforma
                  </p>
                </div>

                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-7 text-xs">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="filters">Filtros</TabsTrigger>
                    <TabsTrigger value="referer">Referência</TabsTrigger>
                    <TabsTrigger value="security">Segurança</TabsTrigger>
                    <TabsTrigger value="limits">Limites</TabsTrigger>
                    <TabsTrigger value="webhook">Webhook</TabsTrigger>
                    <TabsTrigger value="advanced">Avançado</TabsTrigger>
                  </TabsList>

                  {/* TAB: Básico */}
                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Link</Label>
                        <Input
                          id="name"
                          placeholder="Ex: Campanha Black Friday"
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL curta)</Label>
                        <Input
                          id="slug"
                          placeholder="Ex: bf2024"
                          value={formData.slug}
                          onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="safeUrl">URL Segura (bots e bloqueados)</Label>
                      <Input
                        id="safeUrl"
                        type="url"
                        placeholder="https://seusite.com/blog"
                        value={formData.safeUrl}
                        onChange={e => setFormData(prev => ({ ...prev, safeUrl: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetUrl">URL de Destino (tráfego real)</Label>
                      <Input
                        id="targetUrl"
                        type="url"
                        placeholder="https://seusite.com/oferta"
                        value={formData.targetUrl}
                        onChange={e => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Passar UTM Parameters
                        </Label>
                        <p className="text-xs text-muted-foreground">Manter ?utm_source, etc na URL destino</p>
                      </div>
                      <Switch
                        checked={formData.passthroughUtm}
                        onCheckedChange={checked => setFormData(prev => ({ ...prev, passthroughUtm: checked }))}
                      />
                    </div>
                  </TabsContent>

                  {/* TAB: Filtros */}
                  <TabsContent value="filters" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Países Permitidos</Label>
                      <div className="flex flex-wrap gap-2">
                        {COUNTRIES.map(country => (
                          <Badge
                            key={country.code}
                            variant={formData.allowedCountries.includes(country.code) ? "default" : "outline"}
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleArrayValue(
                              formData.allowedCountries, 
                              country.code, 
                              arr => setFormData(prev => ({ ...prev, allowedCountries: arr }))
                            )}
                          >
                            {country.name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Deixe vazio para permitir todos</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Países Bloqueados</Label>
                      <div className="flex flex-wrap gap-2">
                        {COUNTRIES.map(country => (
                          <Badge
                            key={country.code}
                            variant={formData.blockedCountries.includes(country.code) ? "destructive" : "outline"}
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleArrayValue(
                              formData.blockedCountries, 
                              country.code, 
                              arr => setFormData(prev => ({ ...prev, blockedCountries: arr }))
                            )}
                          >
                            {country.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Dispositivos Permitidos</Label>
                      <div className="flex flex-wrap gap-2">
                        {DEVICES.map(device => (
                          <Badge
                            key={device.value}
                            variant={formData.allowedDevices.includes(device.value) ? "default" : "outline"}
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleArrayValue(
                              formData.allowedDevices, 
                              device.value, 
                              arr => setFormData(prev => ({ ...prev, allowedDevices: arr }))
                            )}
                          >
                            {device.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Bloquear Bots</Label>
                        <p className="text-xs text-muted-foreground">Facebook, Google, crawlers</p>
                      </div>
                      <Switch
                        checked={formData.blockBots}
                        onCheckedChange={checked => setFormData(prev => ({ ...prev, blockBots: checked }))}
                      />
                    </div>
                  </TabsContent>

                  {/* TAB: Referência */}
                  <TabsContent value="referer" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Referers Permitidos (1 por linha)
                      </Label>
                      <Textarea
                        placeholder="facebook.com&#10;google.com&#10;instagram.com"
                        value={formData.allowedReferers}
                        onChange={e => setFormData(prev => ({ ...prev, allowedReferers: e.target.value }))}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Aceitar apenas tráfego destes domínios (deixe vazio para todos)</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Referers Bloqueados (1 por linha)
                      </Label>
                      <Textarea
                        placeholder="adspy.com&#10;anstrex.com"
                        value={formData.blockedReferers}
                        onChange={e => setFormData(prev => ({ ...prev, blockedReferers: e.target.value }))}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Bloquear tráfego destes domínios</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Parâmetros URL Obrigatórios (1 por linha)
                      </Label>
                      <Textarea
                        placeholder="utm_source=facebook&#10;ref=campaign"
                        value={formData.requiredUrlParams}
                        onChange={e => setFormData(prev => ({ ...prev, requiredUrlParams: e.target.value }))}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Formato: chave=valor. Só permite se tiver esses parâmetros</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Parâmetros URL Bloqueados (1 por linha)
                      </Label>
                      <Textarea
                        placeholder="spy=true&#10;debug=1"
                        value={formData.blockedUrlParams}
                        onChange={e => setFormData(prev => ({ ...prev, blockedUrlParams: e.target.value }))}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Formato: chave=valor. Bloqueia se tiver esses parâmetros</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        Idiomas Permitidos
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map(lang => (
                          <Badge
                            key={lang.code}
                            variant={formData.allowedLanguages.includes(lang.code) ? "default" : "outline"}
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleArrayValue(
                              formData.allowedLanguages, 
                              lang.code, 
                              arr => setFormData(prev => ({ ...prev, allowedLanguages: arr }))
                            )}
                          >
                            {lang.name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Deixe vazio para permitir todos</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Idiomas Bloqueados
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map(lang => (
                          <Badge
                            key={lang.code}
                            variant={formData.blockedLanguages.includes(lang.code) ? "destructive" : "outline"}
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleArrayValue(
                              formData.blockedLanguages, 
                              lang.code, 
                              arr => setFormData(prev => ({ ...prev, blockedLanguages: arr }))
                            )}
                          >
                            {lang.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB: Segurança */}
                  <TabsContent value="security" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Wifi className="h-4 w-4" />
                            Bloquear VPN
                          </Label>
                        </div>
                        <Switch
                          checked={formData.blockVpn}
                          onCheckedChange={checked => setFormData(prev => ({ ...prev, blockVpn: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Network className="h-4 w-4" />
                            Bloquear Proxy
                          </Label>
                        </div>
                        <Switch
                          checked={formData.blockProxy}
                          onCheckedChange={checked => setFormData(prev => ({ ...prev, blockProxy: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            Bloquear Datacenter
                          </Label>
                        </div>
                        <Switch
                          checked={formData.blockDatacenter}
                          onCheckedChange={checked => setFormData(prev => ({ ...prev, blockDatacenter: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Ban className="h-4 w-4" />
                            Bloquear TOR
                          </Label>
                        </div>
                        <Switch
                          checked={formData.blockTor}
                          onCheckedChange={checked => setFormData(prev => ({ ...prev, blockTor: checked }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        IPs Whitelist (1 por linha)
                      </Label>
                      <Textarea
                        placeholder="192.168.1.1&#10;10.0.0.1"
                        value={formData.whitelistIps}
                        onChange={e => setFormData(prev => ({ ...prev, whitelistIps: e.target.value }))}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Sempre permitir esses IPs</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Unlock className="h-4 w-4" />
                        IPs Blacklist (1 por linha)
                      </Label>
                      <Textarea
                        placeholder="1.2.3.4&#10;5.6.7.8"
                        value={formData.blacklistIps}
                        onChange={e => setFormData(prev => ({ ...prev, blacklistIps: e.target.value }))}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Sempre bloquear esses IPs</p>
                    </div>
                  </TabsContent>

                  {/* TAB: Limites */}
                  <TabsContent value="limits" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxClicksDaily">Limite diário de cliques</Label>
                        <Input
                          id="maxClicksDaily"
                          type="number"
                          placeholder="Ilimitado"
                          value={formData.maxClicksDaily ?? ""}
                          onChange={e => setFormData(prev => ({ 
                            ...prev, 
                            maxClicksDaily: e.target.value ? parseInt(e.target.value) : null 
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxClicksTotal">Limite total de cliques</Label>
                        <Input
                          id="maxClicksTotal"
                          type="number"
                          placeholder="Ilimitado"
                          value={formData.maxClicksTotal ?? ""}
                          onChange={e => setFormData(prev => ({ 
                            ...prev, 
                            maxClicksTotal: e.target.value ? parseInt(e.target.value) : null 
                          }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Horário permitido</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="hoursStart" className="text-xs">Hora início (0-23)</Label>
                          <Input
                            id="hoursStart"
                            type="number"
                            min={0}
                            max={23}
                            placeholder="Qualquer"
                            value={formData.allowedHoursStart ?? ""}
                            onChange={e => setFormData(prev => ({ 
                              ...prev, 
                              allowedHoursStart: e.target.value ? parseInt(e.target.value) : null 
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hoursEnd" className="text-xs">Hora fim (0-23)</Label>
                          <Input
                            id="hoursEnd"
                            type="number"
                            min={0}
                            max={23}
                            placeholder="Qualquer"
                            value={formData.allowedHoursEnd ?? ""}
                            onChange={e => setFormData(prev => ({ 
                              ...prev, 
                              allowedHoursEnd: e.target.value ? parseInt(e.target.value) : null 
                            }))}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Fora deste horário, redireciona para URL segura</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rateLimit">Rate limit por IP (cliques/hora)</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        placeholder="Ilimitado"
                        value={formData.rateLimitPerIp ?? ""}
                        onChange={e => setFormData(prev => ({ 
                          ...prev, 
                          rateLimitPerIp: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">Limite de cliques por IP por hora</p>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Delay de redirecionamento: {formData.redirectDelayMs}ms
                      </Label>
                      <Slider
                        value={[formData.redirectDelayMs]}
                        onValueChange={([value]) => setFormData(prev => ({ ...prev, redirectDelayMs: value }))}
                        min={0}
                        max={5000}
                        step={100}
                      />
                      <p className="text-xs text-muted-foreground">Tempo antes de redirecionar (0 = instantâneo)</p>
                    </div>
                  </TabsContent>

                  {/* TAB: Webhook */}
                  <TabsContent value="webhook" className="space-y-4 mt-4">
                    <div className="p-4 rounded-lg border border-border bg-card/50">
                      <div className="flex items-center gap-3 mb-4">
                        <Webhook className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Notificações Webhook</h4>
                          <p className="text-xs text-muted-foreground">Receba alertas quando bots ou tráfego suspeito for detectado</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Configure webhooks após criar o link, na opção de editar.
                      </p>
                    </div>
                  </TabsContent>

                  {/* TAB: Avançado */}
                  <TabsContent value="advanced" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Score Mínimo: {formData.minScore}</Label>
                        <span className={`text-sm font-medium ${getScoreColor(formData.minScore)}`}>
                          {formData.minScore >= 70 ? "Alto" : formData.minScore >= 40 ? "Médio" : "Baixo"}
                        </span>
                      </div>
                      <Slider
                        value={[formData.minScore]}
                        onValueChange={([value]) => setFormData(prev => ({ ...prev, minScore: value }))}
                        min={0}
                        max={100}
                        step={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        Visitantes com score abaixo serão redirecionados para URL segura
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Fingerprint className="h-4 w-4" />
                          Coletar Fingerprint
                        </Label>
                        <p className="text-xs text-muted-foreground">Canvas, WebGL, áudio, fontes</p>
                      </div>
                      <Switch
                        checked={formData.collectFingerprint}
                        onCheckedChange={checked => setFormData(prev => ({ ...prev, collectFingerprint: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Análise Comportamental
                        </Label>
                        <p className="text-xs text-muted-foreground">Mouse, scroll, tempo na página</p>
                      </div>
                      <Switch
                        checked={formData.requireBehavior}
                        onCheckedChange={checked => setFormData(prev => ({ ...prev, requireBehavior: checked }))}
                      />
                    </div>

                    {formData.requireBehavior && (
                      <div className="space-y-3">
                        <Label>Tempo mínimo (ms): {formData.behaviorTimeMs}</Label>
                        <Slider
                          value={[formData.behaviorTimeMs]}
                          onValueChange={([value]) => setFormData(prev => ({ ...prev, behaviorTimeMs: value }))}
                          min={500}
                          max={5000}
                          step={250}
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <Button type="submit" className="w-full">
                  Criar Link
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Tooltip delayDuration={1000}>
            <TooltipTrigger asChild>
              <div>
                <StatsCard
                  title="Total Links"
                  value={totalLinks.toString()}
                  subtitle="criados"
                  icon={Link2}
                  color="cyan"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Links cloakados criados</p></TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={1000}>
            <TooltipTrigger asChild>
              <div>
                <StatsCard
                  title="Links Ativos"
                  value={activeLinks.toString()}
                  subtitle="funcionando"
                  subtitleColor="text-chart-4"
                  icon={ToggleRight}
                  color="green"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Links ativos agora</p></TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={1000}>
            <TooltipTrigger asChild>
              <div>
                <StatsCard
                  title="Total Cliques"
                  value={totalClicks.toLocaleString('pt-BR')}
                  subtitle="processados"
                  icon={MousePointerClick}
                  color="purple"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Cliques analisados</p></TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={1000}>
            <TooltipTrigger asChild>
              <div>
                <StatsCard
                  title="Proteção"
                  value={linksWithBotBlock.toString()}
                  subtitle="com anti-bot"
                  icon={Shield}
                  color="orange"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Links com proteção ativa</p></TooltipContent>
          </Tooltip>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Links List */}
          <div className="lg:col-span-2">
            <SectionCard title="Seus Links" icon={Shield} color="purple">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : links.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Fingerprint className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Sistema Avançado</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mb-6">
                    Crie links com fingerprinting, análise comportamental e scoring dinâmico.
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeiro Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.map(link => (
                    <div 
                      key={link.id} 
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedLinkId === link.id 
                          ? "bg-primary/5 border-primary/30" 
                          : "bg-card/50 border-border hover:border-primary/20"
                      } ${!link.is_active ? "opacity-50" : ""}`}
                      onClick={() => setSelectedLinkId(link.id === selectedLinkId ? null : link.id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground truncate">{link.name}</h3>
                            <Badge variant={link.is_active ? "default" : "secondary"} className="shrink-0">
                              {link.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                            {link.collect_fingerprint && (
                              <Badge variant="outline" className="gap-1 text-xs shrink-0">
                                <Fingerprint className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <code className="bg-muted px-2 py-0.5 rounded text-xs truncate">/go/{link.slug}</code>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0"
                              onClick={(e) => { e.stopPropagation(); handleCopyLink(link.slug); }}
                              title="Copiar link"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0 text-primary hover:text-primary"
                              onClick={(e) => { e.stopPropagation(); handleTestLink(link.slug); }}
                              title="Testar link"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="gap-1 text-xs">
                              Score ≥ {link.min_score}
                            </Badge>
                            {link.block_bots && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Bot className="h-3 w-3" />
                              </Badge>
                            )}
                            {link.allowed_countries && link.allowed_countries.length > 0 && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Globe className="h-3 w-3" />
                                {link.allowed_countries.length}
                              </Badge>
                            )}
                            <Badge variant="outline" className="gap-1 text-xs">
                              <MousePointerClick className="h-3 w-3" />
                              {link.clicks_count.toLocaleString('pt-BR')}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={link.is_active}
                            onCheckedChange={() => handleToggleActive(link.id, link.is_active)}
                            onClick={e => e.stopPropagation()}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleEditClick(link, e)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); window.open(link.target_url, '_blank'); }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(link.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Visitors Panel */}
          <div>
            <SectionCard title="Visitantes" icon={Users} color="cyan">
              {!selectedLinkId ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Eye className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Selecione um link para ver os visitantes
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stats for selected link */}
                  {stats && (
                    <div className="space-y-3">
                      {/* Main stats row */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-muted/80 to-muted/40 border border-border/50">
                          <div className="relative z-10">
                            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                            <div className="text-xs text-muted-foreground font-medium">Total</div>
                          </div>
                          <Users className="absolute -right-1 -bottom-1 h-10 w-10 text-muted-foreground/10" />
                        </div>
                        <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                          <div className="relative z-10">
                            <div className="text-2xl font-bold text-emerald-500">{stats.allowed}</div>
                            <div className="text-xs text-muted-foreground font-medium">Permitidos</div>
                          </div>
                          <CheckCircle className="absolute -right-1 -bottom-1 h-10 w-10 text-emerald-500/10" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20">
                          <div className="relative z-10">
                            <div className="text-2xl font-bold text-destructive">{stats.blocked}</div>
                            <div className="text-xs text-muted-foreground font-medium">Bloqueados</div>
                          </div>
                          <XCircle className="absolute -right-1 -bottom-1 h-10 w-10 text-destructive/10" />
                        </div>
                        <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                          <div className="relative z-10">
                            <div className="text-2xl font-bold text-amber-500">{stats.bots}</div>
                            <div className="text-xs text-muted-foreground font-medium">Bots</div>
                          </div>
                          <Bot className="absolute -right-1 -bottom-1 h-10 w-10 text-amber-500/10" />
                        </div>
                      </div>
                      
                      {/* Conversion rate bar */}
                      {stats.total > 0 && (
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Taxa de aprovação</span>
                            <span className="font-bold text-emerald-500">
                              {((stats.allowed / stats.total) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${(stats.allowed / stats.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visitors list header */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Últimos acessos
                    </span>
                    <div className="flex items-center gap-2">
                      {visitors && visitors.length > 0 && (
                        <>
                          <Badge variant="outline" className="text-[10px]">
                            {visitors.length} registros
                          </Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={handleClearVisitors}
                                disabled={isClearing}
                              >
                                <RotateCcw className={`h-3.5 w-3.5 ${isClearing ? "animate-spin" : ""}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>Limpar histórico e reiniciar contagem</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Visitors list */}
                  <ScrollArea className="h-[350px]">
                    {visitorsLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-20 rounded-xl" />
                        ))}
                      </div>
                    ) : visitors && visitors.length > 0 ? (
                      <div className="space-y-2 pr-4">
                        {visitors.map(visitor => (
                          <div 
                            key={visitor.id} 
                            className={`group relative p-3 rounded-xl border transition-all duration-200 hover:shadow-md ${
                              visitor.decision === "allow" 
                                ? "bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/20 hover:border-emerald-500/40" 
                                : visitor.decision === "safe"
                                ? "bg-gradient-to-r from-amber-500/5 to-transparent border-amber-500/20 hover:border-amber-500/40"
                                : "bg-gradient-to-r from-destructive/5 to-transparent border-destructive/20 hover:border-destructive/40"
                            }`}
                          >
                            {/* Header row */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${
                                  visitor.decision === "allow" 
                                    ? "bg-emerald-500/10" 
                                    : visitor.decision === "safe"
                                    ? "bg-amber-500/10"
                                    : "bg-destructive/10"
                                }`}>
                                  {getDecisionIcon(visitor.decision)}
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-sm font-semibold ${getDecisionColor(visitor.decision)}`}>
                                    {visitor.decision === "allow" ? "Permitido" : visitor.decision === "safe" ? "Safe" : "Bloqueado"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {format(new Date(visitor.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Score badge */}
                              <div className={`px-2.5 py-1 rounded-lg text-sm font-bold ${
                                visitor.score >= 70 
                                  ? "bg-emerald-500/10 text-emerald-500" 
                                  : visitor.score >= 40 
                                  ? "bg-amber-500/10 text-amber-500" 
                                  : "bg-destructive/10 text-destructive"
                              }`}>
                                {visitor.score}
                              </div>
                            </div>
                            
                            {/* Info row */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {visitor.country_code && (
                                <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-background/50">
                                  <Globe className="h-2.5 w-2.5" />
                                  {visitor.country_code}
                                  {visitor.city && ` • ${visitor.city}`}
                                </Badge>
                              )}
                              {visitor.is_bot && (
                                <Badge className="text-[10px] h-5 bg-amber-500/20 text-amber-500 border-amber-500/30">
                                  <Bot className="h-2.5 w-2.5 mr-0.5" />
                                  Bot
                                </Badge>
                              )}
                              {visitor.is_headless && (
                                <Badge variant="outline" className="text-[10px] h-5 border-amber-500/30 text-amber-500">
                                  Headless
                                </Badge>
                              )}
                              {visitor.is_vpn && (
                                <Badge variant="outline" className="text-[10px] h-5 gap-1 border-purple-500/30 text-purple-400">
                                  <Wifi className="h-2.5 w-2.5" />
                                  VPN
                                </Badge>
                              )}
                              {visitor.is_proxy && (
                                <Badge variant="outline" className="text-[10px] h-5 gap-1 border-orange-500/30 text-orange-400">
                                  <Network className="h-2.5 w-2.5" />
                                  Proxy
                                </Badge>
                              )}
                              {visitor.is_datacenter && (
                                <Badge variant="outline" className="text-[10px] h-5 gap-1 border-blue-500/30 text-blue-400">
                                  <Server className="h-2.5 w-2.5" />
                                  DC
                                </Badge>
                              )}
                              {visitor.is_tor && (
                                <Badge variant="outline" className="text-[10px] h-5 border-red-500/30 text-red-400">
                                  TOR
                                </Badge>
                              )}
                            </div>
                            
                            {/* Score breakdown - expandable on hover */}
                            {(visitor.score_network !== null || visitor.score_fingerprint !== null) && (
                              <div className="mt-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                  {visitor.score_network !== null && (
                                    <span className="flex items-center gap-1">
                                      <div className={`w-1.5 h-1.5 rounded-full ${visitor.score_network >= 20 ? "bg-emerald-500" : visitor.score_network >= 10 ? "bg-amber-500" : "bg-destructive"}`} />
                                      Rede: {visitor.score_network}
                                    </span>
                                  )}
                                  {visitor.score_fingerprint !== null && (
                                    <span className="flex items-center gap-1">
                                      <div className={`w-1.5 h-1.5 rounded-full ${visitor.score_fingerprint >= 20 ? "bg-emerald-500" : visitor.score_fingerprint >= 10 ? "bg-amber-500" : "bg-destructive"}`} />
                                      FP: {visitor.score_fingerprint}
                                    </span>
                                  )}
                                  {visitor.score_behavior !== null && (
                                    <span className="flex items-center gap-1">
                                      <div className={`w-1.5 h-1.5 rounded-full ${visitor.score_behavior >= 20 ? "bg-emerald-500" : visitor.score_behavior >= 10 ? "bg-amber-500" : "bg-destructive"}`} />
                                      Comp: {visitor.score_behavior}
                                    </span>
                                  )}
                                  {visitor.score_automation !== null && (
                                    <span className="flex items-center gap-1">
                                      <div className={`w-1.5 h-1.5 rounded-full ${visitor.score_automation >= 20 ? "bg-emerald-500" : visitor.score_automation >= 10 ? "bg-amber-500" : "bg-destructive"}`} />
                                      Auto: {visitor.score_automation}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                          <Activity className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-sm">Nenhum visitante ainda</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">Os visitantes aparecerão aqui em tempo real</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Link</DialogTitle>
            </DialogHeader>
            
            {editingLink && (
              <div className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="filters">Filtros</TabsTrigger>
                    <TabsTrigger value="referer">Referência</TabsTrigger>
                    <TabsTrigger value="security">Segurança</TabsTrigger>
                    <TabsTrigger value="limits">Limites</TabsTrigger>
                    <TabsTrigger value="webhook">Webhook</TabsTrigger>
                    <TabsTrigger value="advanced">Avançado</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editName">Nome do Link</Label>
                        <Input
                          id="editName"
                          placeholder="Ex: Campanha Black Friday"
                          value={editingLink.name}
                          onChange={e => setEditingLink(prev => prev ? { ...prev, name: e.target.value } : null)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="editSlug">Slug (URL curta)</Label>
                        <Input
                          id="editSlug"
                          placeholder="Ex: bf2024"
                          value={editingLink.slug}
                          onChange={e => setEditingLink(prev => prev ? { ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') } : null)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editSafeUrl">URL Segura (bots e bloqueados)</Label>
                      <Input
                        id="editSafeUrl"
                        type="url"
                        placeholder="https://seusite.com/blog"
                        value={editingLink.safeUrl}
                        onChange={e => setEditingLink(prev => prev ? { ...prev, safeUrl: e.target.value } : null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editTargetUrl">URL de Destino (tráfego real)</Label>
                      <Input
                        id="editTargetUrl"
                        type="url"
                        placeholder="https://seusite.com/oferta"
                        value={editingLink.targetUrl}
                        onChange={e => setEditingLink(prev => prev ? { ...prev, targetUrl: e.target.value } : null)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Passar UTM Parameters
                        </Label>
                        <p className="text-xs text-muted-foreground">Manter ?utm_source, etc na URL destino</p>
                      </div>
                      <Switch
                        checked={editingLink.passthroughUtm}
                        onCheckedChange={checked => setEditingLink(prev => prev ? { ...prev, passthroughUtm: checked } : null)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="filters" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Países Permitidos</Label>
                      <div className="flex flex-wrap gap-2">
                        {COUNTRIES.map(country => (
                          <Badge
                            key={country.code}
                            variant={editingLink.allowedCountries.includes(country.code) ? "default" : "outline"}
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleEditArrayValue('allowedCountries', country.code)}
                          >
                            {country.name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Deixe vazio para permitir todos</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Dispositivos Permitidos</Label>
                      <div className="flex flex-wrap gap-2">
                        {DEVICES.map(device => (
                          <Badge
                            key={device.value}
                            variant={editingLink.allowedDevices.includes(device.value) ? "default" : "outline"}
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleEditArrayValue('allowedDevices', device.value)}
                          >
                            {device.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Bloquear Bots</Label>
                        <p className="text-xs text-muted-foreground">Facebook, Google, crawlers</p>
                      </div>
                      <Switch
                        checked={editingLink.blockBots}
                        onCheckedChange={checked => setEditingLink(prev => prev ? { ...prev, blockBots: checked } : null)}
                      />
                    </div>
                  </TabsContent>

                  {/* NEW TAB: Referência, URL Params, Linguagem */}
                  <TabsContent value="referer" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Referers Permitidos (1 por linha)
                      </Label>
                      <Textarea
                        placeholder="facebook.com&#10;google.com&#10;instagram.com"
                        value={editingLink.allowedReferers}
                        onChange={e => setEditingLink(prev => prev ? { ...prev, allowedReferers: e.target.value } : null)}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Aceitar apenas tráfego destes domínios (deixe vazio para todos)</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Referers Bloqueados (1 por linha)
                      </Label>
                      <Textarea
                        placeholder="adspy.com&#10;anstrex.com"
                        value={editingLink.blockedReferers}
                        onChange={e => setEditingLink(prev => prev ? { ...prev, blockedReferers: e.target.value } : null)}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Bloquear tráfego destes domínios</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Parâmetros URL Obrigatórios (1 por linha)
                      </Label>
                      <Textarea
                        placeholder="utm_source=facebook&#10;ref=campaign"
                        value={editingLink.requiredUrlParams}
                        onChange={e => setEditingLink(prev => prev ? { ...prev, requiredUrlParams: e.target.value } : null)}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Formato: chave=valor. Só permite se tiver esses parâmetros</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Parâmetros URL Bloqueados (1 por linha)
                      </Label>
                      <Textarea
                        placeholder="spy=true&#10;debug=1"
                        value={editingLink.blockedUrlParams}
                        onChange={e => setEditingLink(prev => prev ? { ...prev, blockedUrlParams: e.target.value } : null)}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Formato: chave=valor. Bloqueia se tiver esses parâmetros</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        Idiomas Permitidos
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map(lang => (
                          <Badge
                            key={lang.code}
                            variant={editingLink.allowedLanguages.includes(lang.code) ? "default" : "outline"}
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleEditArrayValue('allowedLanguages', lang.code)}
                          >
                            {lang.name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Deixe vazio para permitir todos</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Idiomas Bloqueados
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map(lang => (
                          <Badge
                            key={lang.code}
                            variant={editingLink.blockedLanguages.includes(lang.code) ? "destructive" : "outline"}
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => toggleEditArrayValue('blockedLanguages', lang.code)}
                          >
                            {lang.name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Bloquear acessos com esses idiomas</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Wifi className="h-4 w-4" />
                            Bloquear VPN
                          </Label>
                        </div>
                        <Switch
                          checked={editingLink.blockVpn}
                          onCheckedChange={checked => setEditingLink(prev => prev ? { ...prev, blockVpn: checked } : null)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Network className="h-4 w-4" />
                            Bloquear Proxy
                          </Label>
                        </div>
                        <Switch
                          checked={editingLink.blockProxy}
                          onCheckedChange={checked => setEditingLink(prev => prev ? { ...prev, blockProxy: checked } : null)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            Bloquear Datacenter
                          </Label>
                        </div>
                        <Switch
                          checked={editingLink.blockDatacenter}
                          onCheckedChange={checked => setEditingLink(prev => prev ? { ...prev, blockDatacenter: checked } : null)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Ban className="h-4 w-4" />
                            Bloquear TOR
                          </Label>
                        </div>
                        <Switch
                          checked={editingLink.blockTor}
                          onCheckedChange={checked => setEditingLink(prev => prev ? { ...prev, blockTor: checked } : null)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        IPs Whitelist (1 por linha)
                      </Label>
                      <Textarea
                        placeholder="192.168.1.1&#10;10.0.0.1"
                        value={editingLink.whitelistIps}
                        onChange={e => setEditingLink(prev => prev ? { ...prev, whitelistIps: e.target.value } : null)}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Sempre permitir esses IPs</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Unlock className="h-4 w-4" />
                        IPs Blacklist (1 por linha)
                      </Label>
                      <Textarea
                        placeholder="1.2.3.4&#10;5.6.7.8"
                        value={editingLink.blacklistIps}
                        onChange={e => setEditingLink(prev => prev ? { ...prev, blacklistIps: e.target.value } : null)}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Sempre bloquear esses IPs</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="limits" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editMaxClicksDaily">Limite diário de cliques</Label>
                        <Input
                          id="editMaxClicksDaily"
                          type="number"
                          placeholder="Ilimitado"
                          value={editingLink.maxClicksDaily ?? ""}
                          onChange={e => setEditingLink(prev => prev ? { 
                            ...prev, 
                            maxClicksDaily: e.target.value ? parseInt(e.target.value) : null 
                          } : null)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editMaxClicksTotal">Limite total de cliques</Label>
                        <Input
                          id="editMaxClicksTotal"
                          type="number"
                          placeholder="Ilimitado"
                          value={editingLink.maxClicksTotal ?? ""}
                          onChange={e => setEditingLink(prev => prev ? { 
                            ...prev, 
                            maxClicksTotal: e.target.value ? parseInt(e.target.value) : null 
                          } : null)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Horário permitido</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editHoursStart" className="text-xs">Hora início (0-23)</Label>
                          <Input
                            id="editHoursStart"
                            type="number"
                            min={0}
                            max={23}
                            placeholder="Qualquer"
                            value={editingLink.allowedHoursStart ?? ""}
                            onChange={e => setEditingLink(prev => prev ? { 
                              ...prev, 
                              allowedHoursStart: e.target.value ? parseInt(e.target.value) : null 
                            } : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editHoursEnd" className="text-xs">Hora fim (0-23)</Label>
                          <Input
                            id="editHoursEnd"
                            type="number"
                            min={0}
                            max={23}
                            placeholder="Qualquer"
                            value={editingLink.allowedHoursEnd ?? ""}
                            onChange={e => setEditingLink(prev => prev ? { 
                              ...prev, 
                              allowedHoursEnd: e.target.value ? parseInt(e.target.value) : null 
                            } : null)}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Fora deste horário, redireciona para URL segura</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editRateLimit">Rate limit por IP (cliques/hora)</Label>
                      <Input
                        id="editRateLimit"
                        type="number"
                        placeholder="Ilimitado"
                        value={editingLink.rateLimitPerIp ?? ""}
                        onChange={e => setEditingLink(prev => prev ? { 
                          ...prev, 
                          rateLimitPerIp: e.target.value ? parseInt(e.target.value) : null 
                        } : null)}
                      />
                      <p className="text-xs text-muted-foreground">Limite de cliques por IP por hora</p>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Delay de redirecionamento: {editingLink.redirectDelayMs}ms
                      </Label>
                      <Slider
                        value={[editingLink.redirectDelayMs]}
                        onValueChange={([value]) => setEditingLink(prev => prev ? { ...prev, redirectDelayMs: value } : null)}
                        min={0}
                        max={5000}
                        step={100}
                      />
                    </div>
                  </TabsContent>

                  {/* WEBHOOK TAB */}
                  <TabsContent value="webhook" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Ativar Webhooks
                        </Label>
                        <p className="text-xs text-muted-foreground">Receba notificações quando bots ou tráfego suspeito for detectado</p>
                      </div>
                      <Switch
                        checked={editingLink.webhookEnabled}
                        onCheckedChange={checked => setEditingLink(prev => prev ? { ...prev, webhookEnabled: checked } : null)}
                      />
                    </div>

                    {editingLink.webhookEnabled && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="webhookUrl" className="flex items-center gap-2">
                            <Webhook className="h-4 w-4" />
                            URL do Webhook
                          </Label>
                          <Input
                            id="webhookUrl"
                            type="url"
                            placeholder="https://seu-servidor.com/webhook"
                            value={editingLink.webhookUrl}
                            onChange={e => setEditingLink(prev => prev ? { ...prev, webhookUrl: e.target.value } : null)}
                          />
                          <p className="text-xs text-muted-foreground">Endpoint que receberá os eventos via POST</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Eventos para notificar</Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: "bot_blocked", label: "Bot Bloqueado" },
                              { value: "vpn_blocked", label: "VPN Bloqueado" },
                              { value: "proxy_blocked", label: "Proxy Bloqueado" },
                              { value: "datacenter_blocked", label: "Datacenter Bloqueado" },
                              { value: "tor_blocked", label: "Tor Bloqueado" },
                              { value: "suspicious_score", label: "Score Suspeito" },
                              { value: "rate_limited", label: "Rate Limited" },
                              { value: "country_blocked", label: "País Bloqueado" },
                            ].map(event => (
                              <Badge
                                key={event.value}
                                variant={editingLink.webhookEvents.includes(event.value) ? "default" : "outline"}
                                className="cursor-pointer transition-all hover:scale-105"
                                onClick={() => {
                                  const events = editingLink.webhookEvents;
                                  if (events.includes(event.value)) {
                                    setEditingLink(prev => prev ? { ...prev, webhookEvents: events.filter(e => e !== event.value) } : null);
                                  } else {
                                    setEditingLink(prev => prev ? { ...prev, webhookEvents: [...events, event.value] } : null);
                                  }
                                }}
                              >
                                {event.label}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">Selecione quais eventos devem disparar o webhook</p>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/50 border border-border">
                          <Label className="text-sm font-medium mb-2 block">Exemplo de Payload</Label>
                          <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`{
  "event": "bot_blocked",
  "link_name": "${editingLink.name}",
  "link_slug": "${editingLink.slug}",
  "timestamp": "2024-01-09T12:00:00Z",
  "visitor": {
    "ip": "xxx.xxx.xxx.xxx",
    "country": "BR",
    "user_agent": "...",
    "score": 25,
    "is_bot": true,
    "is_vpn": false
  }
}`}
                          </pre>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Score Mínimo: {editingLink.minScore}</Label>
                        <span className={`text-sm font-medium ${getScoreColor(editingLink.minScore)}`}>
                          {editingLink.minScore >= 70 ? "Alto" : editingLink.minScore >= 40 ? "Médio" : "Baixo"}
                        </span>
                      </div>
                      <Slider
                        value={[editingLink.minScore]}
                        onValueChange={([value]) => setEditingLink(prev => prev ? { ...prev, minScore: value } : null)}
                        min={0}
                        max={100}
                        step={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        Visitantes com score abaixo serão redirecionados para URL segura
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Fingerprint className="h-4 w-4" />
                          Coletar Fingerprint
                        </Label>
                        <p className="text-xs text-muted-foreground">Canvas, WebGL, áudio, fontes</p>
                      </div>
                      <Switch
                        checked={editingLink.collectFingerprint}
                        onCheckedChange={checked => setEditingLink(prev => prev ? { ...prev, collectFingerprint: checked } : null)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Análise Comportamental
                        </Label>
                        <p className="text-xs text-muted-foreground">Mouse, scroll, tempo na página</p>
                      </div>
                      <Switch
                        checked={editingLink.requireBehavior}
                        onCheckedChange={checked => setEditingLink(prev => prev ? { ...prev, requireBehavior: checked } : null)}
                      />
                    </div>

                    {editingLink.requireBehavior && (
                      <div className="space-y-3">
                        <Label>Tempo mínimo (ms): {editingLink.behaviorTimeMs}</Label>
                        <Slider
                          value={[editingLink.behaviorTimeMs]}
                          onValueChange={([value]) => setEditingLink(prev => prev ? { ...prev, behaviorTimeMs: value } : null)}
                          min={500}
                          max={5000}
                          step={250}
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <Button onClick={handleSaveEdit} className="w-full">
                  Salvar Alterações
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardWrapper>
  );
}