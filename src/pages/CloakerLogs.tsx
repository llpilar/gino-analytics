import { useState, useMemo } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Eye, TrendingUp, Shield, AlertTriangle, Search, CalendarIcon, 
  Download, RefreshCw, Globe, Smartphone, Bot, User, Clock, 
  MapPin, Wifi, Server, Lock, FileText, CheckCircle, XCircle,
  ChevronDown, Filter, Zap, Monitor, Mouse, Keyboard, Video, 
  Network, Fingerprint, Activity, Ban
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCloakedLinks } from "@/hooks/useCloakedLinks";
import { cn } from "@/lib/utils";

interface CloakerVisitorLog {
  id: string;
  link_id: string;
  fingerprint_hash: string;
  score: number;
  decision: string;
  user_agent: string | null;
  country_code: string | null;
  city: string | null;
  ip_address: string | null;
  is_bot: boolean | null;
  is_headless: boolean | null;
  is_vpn: boolean | null;
  is_proxy: boolean | null;
  is_datacenter: boolean | null;
  is_tor: boolean | null;
  is_automated: boolean | null;
  is_blacklisted: boolean | null;
  isp: string | null;
  asn: string | null;
  platform: string | null;
  language: string | null;
  referer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  redirect_url: string | null;
  processing_time_ms: number | null;
  score_fingerprint: number | null;
  score_behavior: number | null;
  score_network: number | null;
  score_automation: number | null;
  // Elite detection scores
  score_device_consistency: number | null;
  score_webrtc: number | null;
  score_mouse_pattern: number | null;
  score_keyboard: number | null;
  score_session_replay: number | null;
  detection_details: Record<string, unknown> | null;
  webrtc_local_ip: string | null;
  webrtc_public_ip: string | null;
  created_at: string;
}

type ActionFilter = "all" | "allow" | "block" | "safe";
type PeriodFilter = "today" | "yesterday" | "week" | "month" | "custom";

export default function CloakerLogs() {
  const { user } = useAuth();
  const { links } = useCloakedLinks();
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("today");
  const [orderBy, setOrderBy] = useState<"newest" | "oldest">("newest");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState<string>("any");
  const [endHour, setEndHour] = useState<string>("any");
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  // Fetch all visitors for user's links
  const { data: allVisitors = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["cloaker-all-visitors", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get all user's link IDs
      const { data: userLinks } = await supabase
        .from("cloaked_links")
        .select("id")
        .eq("user_id", user.id);
      
      if (!userLinks || userLinks.length === 0) return [];
      
      const linkIds = userLinks.map(l => l.id);
      
      // Then get visitors for those links
      const { data, error } = await supabase
        .from("cloaker_visitors")
        .select("*")
        .in("link_id", linkIds)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as unknown as CloakerVisitorLog[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter visitors based on filters
  const filteredVisitors = useMemo(() => {
    let filtered = [...allVisitors];

    // Campaign filter
    if (selectedCampaign !== "all") {
      filtered = filtered.filter(v => v.link_id === selectedCampaign);
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter(v => {
        if (actionFilter === "allow") return v.decision === "allow";
        if (actionFilter === "block") return v.decision === "block";
        if (actionFilter === "safe") return v.decision === "safe";
        return true;
      });
    }

    // Period filter
    const now = new Date();
    let dateStart: Date;
    let dateEnd: Date = endOfDay(now);

    switch (periodFilter) {
      case "today":
        dateStart = startOfDay(now);
        break;
      case "yesterday":
        dateStart = startOfDay(subDays(now, 1));
        dateEnd = endOfDay(subDays(now, 1));
        break;
      case "week":
        dateStart = startOfDay(subDays(now, 7));
        break;
      case "month":
        dateStart = startOfDay(subDays(now, 30));
        break;
      case "custom":
        dateStart = startOfDay(startDate);
        dateEnd = endOfDay(endDate);
        break;
      default:
        dateStart = startOfDay(now);
    }

    filtered = filtered.filter(v => {
      const visitorDate = parseISO(v.created_at);
      return isWithinInterval(visitorDate, { start: dateStart, end: dateEnd });
    });

    // Hour filter
    if (startHour !== "any" || endHour !== "any") {
      filtered = filtered.filter(v => {
        const hour = parseISO(v.created_at).getHours();
        const start = startHour !== "any" ? parseInt(startHour) : 0;
        const end = endHour !== "any" ? parseInt(endHour) : 23;
        return hour >= start && hour <= end;
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.ip_address?.toLowerCase().includes(query) ||
        v.country_code?.toLowerCase().includes(query) ||
        v.city?.toLowerCase().includes(query) ||
        v.isp?.toLowerCase().includes(query) ||
        v.utm_campaign?.toLowerCase().includes(query) ||
        v.utm_source?.toLowerCase().includes(query) ||
        v.referer?.toLowerCase().includes(query)
      );
    }

    // Order
    if (orderBy === "oldest") {
      filtered.reverse();
    }

    return filtered;
  }, [allVisitors, selectedCampaign, actionFilter, periodFilter, startDate, endDate, startHour, endHour, searchQuery, orderBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredVisitors.length;
    const allowed = filteredVisitors.filter(v => v.decision === "allow").length;
    const safe = filteredVisitors.filter(v => v.decision === "safe").length;
    const bots = filteredVisitors.filter(v => v.is_bot || v.decision === "block").length;
    
    return { total, allowed, safe, bots };
  }, [filteredVisitors]);

  // Export to CSV
  const exportCSV = () => {
    const headers = ["Data", "IP", "País", "Cidade", "Decisão", "Score", "Bot", "VPN", "ISP", "UTM Source", "UTM Campaign"];
    const rows = filteredVisitors.map(v => [
      format(parseISO(v.created_at), "dd/MM/yyyy HH:mm:ss"),
      v.ip_address || "-",
      v.country_code || "-",
      v.city || "-",
      v.decision,
      v.score.toString(),
      v.is_bot ? "Sim" : "Não",
      v.is_vpn ? "Sim" : "Não",
      v.isp || "-",
      v.utm_source || "-",
      v.utm_campaign || "-"
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cloaker-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0") + ":00");

  return (
    <DashboardWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Logs</h1>
            <p className="text-muted-foreground">Monitore o tráfego das suas campanhas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Requests</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Offer Pages</p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">{stats.allowed}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Safe Pages</p>
                <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.safe}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Bots Detectados</p>
                <p className="text-2xl font-bold text-red-500 mt-1">{stats.bots}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-card border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="IP, campanha, país..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>

            {/* Period */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Período</label>
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Últimos 30 dias</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ação</label>
              <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as ActionFilter)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="allow">Aprovado</SelectItem>
                  <SelectItem value="safe">Safe Page</SelectItem>
                  <SelectItem value="block">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ordenar</label>
              <Select value={orderBy} onValueChange={(v) => setOrderBy(v as "newest" | "oldest")}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaign */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Campanha</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as campanhas</SelectItem>
                  {links.map(link => (
                    <SelectItem key={link.id} value={link.id}>{link.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom date range */}
          {periodFilter === "custom" && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data Inicial</label>
                <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-background">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => { if (date) setStartDate(date); setIsStartDateOpen(false); }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data Final</label>
                <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-background">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => { if (date) setEndDate(date); setIsEndDateOpen(false); }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Hora inicial</label>
                <Select value={startHour} onValueChange={setStartHour}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Qualquer hora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer hora</SelectItem>
                    {hours.map(h => (
                      <SelectItem key={h} value={h.split(":")[0]}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Hora final</label>
                <Select value={endHour} onValueChange={setEndHour}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Qualquer hora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer hora</SelectItem>
                    {hours.map(h => (
                      <SelectItem key={h} value={h.split(":")[0]}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button className="w-full" onClick={() => refetch()}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Logs Table */}
        <Card className="bg-card border-border overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Nenhum log encontrado</h3>
              <p className="text-muted-foreground mt-1">Tente ajustar os filtros ou selecione outro período.</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-border">
                {filteredVisitors.map((visitor) => (
                  <LogRow key={visitor.id} visitor={visitor} links={links} />
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>
    </DashboardWrapper>
  );
}

// Analyze User Agent to detect bot type
function analyzeUserAgent(ua: string | null): { 
  type: string; 
  name: string; 
  isBot: boolean; 
  isLegitimateBot: boolean;
  description: string;
  icon: string;
} {
  if (!ua) return { type: "unknown", name: "Desconhecido", isBot: false, isLegitimateBot: false, description: "User Agent não fornecido", icon: "❓" };
  
  const uaLower = ua.toLowerCase();
  
  // WhatsApp/Telegram/Messenger link previews
  if (/whatsapp/i.test(ua)) {
    return { type: "link-preview", name: "WhatsApp Preview", isBot: true, isLegitimateBot: true, description: "Bot de preview de link do WhatsApp. É seguro - gera a prévia quando alguém compartilha seu link.", icon: "💬" };
  }
  if (/telegram/i.test(ua)) {
    return { type: "link-preview", name: "Telegram Preview", isBot: true, isLegitimateBot: true, description: "Bot de preview de link do Telegram. É seguro.", icon: "📱" };
  }
  if (/facebookexternalhit|facebot/i.test(ua)) {
    return { type: "link-preview", name: "Facebook Crawler", isBot: true, isLegitimateBot: true, description: "Bot do Facebook/Meta para gerar previews de links. É seguro.", icon: "📘" };
  }
  if (/twitterbot/i.test(ua)) {
    return { type: "link-preview", name: "Twitter/X Preview", isBot: true, isLegitimateBot: true, description: "Bot do Twitter/X para gerar cards de links. É seguro.", icon: "🐦" };
  }
  if (/linkedinbot/i.test(ua)) {
    return { type: "link-preview", name: "LinkedIn Preview", isBot: true, isLegitimateBot: true, description: "Bot do LinkedIn para gerar previews de links. É seguro.", icon: "💼" };
  }
  if (/slackbot/i.test(ua)) {
    return { type: "link-preview", name: "Slack Preview", isBot: true, isLegitimateBot: true, description: "Bot do Slack para gerar previews de links. É seguro.", icon: "💼" };
  }
  if (/discordbot/i.test(ua)) {
    return { type: "link-preview", name: "Discord Preview", isBot: true, isLegitimateBot: true, description: "Bot do Discord para gerar previews de links. É seguro.", icon: "🎮" };
  }
  
  // Search engines
  if (/googlebot/i.test(ua)) {
    return { type: "search-engine", name: "Googlebot", isBot: true, isLegitimateBot: true, description: "Crawler do Google para indexação. Bom para SEO.", icon: "🔍" };
  }
  if (/bingbot/i.test(ua)) {
    return { type: "search-engine", name: "Bingbot", isBot: true, isLegitimateBot: true, description: "Crawler do Bing para indexação.", icon: "🔎" };
  }
  
  // Ad platform bots (should be blocked)
  if (/adsbot/i.test(ua)) {
    return { type: "ad-bot", name: "Google AdsBot", isBot: true, isLegitimateBot: false, description: "Bot do Google Ads verificando sua página. BLOQUEAR - pode reprovar seus anúncios.", icon: "🤖" };
  }
  if (/lighthouse|pagespeed/i.test(ua)) {
    return { type: "ad-bot", name: "Google Lighthouse", isBot: true, isLegitimateBot: false, description: "Ferramenta de análise do Google. Pode ser revisão de anúncios.", icon: "🔦" };
  }
  
  // Spy tools (definitely block)
  if (/adspy|anstrex|bigspy|dropispy|pipiads|semrush|ahrefs|similarweb/i.test(ua)) {
    return { type: "spy-tool", name: "Spy Tool", isBot: true, isLegitimateBot: false, description: "Ferramenta de espionagem de anúncios! Concorrentes monitorando sua campanha.", icon: "🕵️" };
  }
  
  // Automation tools (definitely block)
  if (/headlesschrome|phantomjs|selenium|puppeteer|playwright/i.test(ua)) {
    return { type: "automation", name: "Browser Automatizado", isBot: true, isLegitimateBot: false, description: "Browser automatizado para scraping ou testes. Provavelmente malicioso.", icon: "⚠️" };
  }
  
  // Generic bots
  if (/bot|crawler|spider|scraper|curl|wget|python|java|http|axios|fetch/i.test(ua)) {
    return { type: "generic-bot", name: "Bot Genérico", isBot: true, isLegitimateBot: false, description: "Bot ou script automatizado.", icon: "🤖" };
  }
  
  // In-app browsers (legitimate users!)
  if (/fbav|fban|instagram|fb_iab/i.test(ua)) {
    return { type: "in-app", name: "Facebook/Instagram App", isBot: false, isLegitimateBot: false, description: "Usuário real navegando dentro do app do Facebook/Instagram. Tráfego legítimo!", icon: "✅" };
  }
  if (/tiktok/i.test(ua) && !/bytespider/i.test(ua)) {
    return { type: "in-app", name: "TikTok App", isBot: false, isLegitimateBot: false, description: "Usuário real navegando dentro do app do TikTok. Tráfego legítimo!", icon: "✅" };
  }
  
  // Regular browsers
  if (/chrome|safari|firefox|edge|opera/i.test(ua)) {
    if (/mobile|android|iphone|ipad/i.test(ua)) {
      return { type: "mobile-browser", name: "Browser Mobile", isBot: false, isLegitimateBot: false, description: "Usuário real em dispositivo móvel.", icon: "📱" };
    }
    return { type: "desktop-browser", name: "Browser Desktop", isBot: false, isLegitimateBot: false, description: "Usuário real em computador.", icon: "💻" };
  }
  
  return { type: "unknown", name: "Desconhecido", isBot: false, isLegitimateBot: false, description: "User Agent não reconhecido.", icon: "❓" };
}

// Get blocking reason in Portuguese
function getBlockReason(visitor: CloakerVisitorLog): { reason: string; severity: "low" | "medium" | "high"; details: string } {
  const reasons: string[] = [];
  const details: string[] = [];
  let severity: "low" | "medium" | "high" = "low";
  
  if (visitor.is_bot) {
    reasons.push("Bot detectado");
    severity = "high";
    details.push("User Agent identificado como bot");
  }
  if (visitor.is_vpn) {
    reasons.push("VPN");
    severity = "medium";
    details.push("IP de provedor de VPN conhecido");
  }
  if (visitor.is_proxy) {
    reasons.push("Proxy");
    severity = "medium";
    details.push("IP de serviço de proxy");
  }
  if (visitor.is_datacenter) {
    reasons.push("Datacenter");
    severity = "medium";
    details.push("IP de datacenter/hosting (AWS, Google Cloud, etc)");
  }
  if (visitor.is_tor) {
    reasons.push("TOR");
    severity = "high";
    details.push("IP de nó de saída TOR");
  }
  if (visitor.is_headless) {
    reasons.push("Headless");
    severity = "high";
    details.push("Browser sem interface gráfica (automação)");
  }
  if (visitor.is_automated) {
    reasons.push("Automatizado");
    severity = "high";
    details.push("Comportamento automatizado detectado");
  }
  if (visitor.fingerprint_hash === "fast-block") {
    reasons.push("Bloqueio rápido");
    details.push("Bloqueado antes da coleta de fingerprint (detecção por UA/IP)");
  }
  if (visitor.score === 0 && visitor.decision === "block") {
    details.push("Score zero indica detecção definitiva de bot/automação");
  }
  
  if (reasons.length === 0) {
    reasons.push("Score baixo");
    details.push(`Score ${visitor.score} abaixo do mínimo configurado`);
  }
  
  return { 
    reason: reasons.join(" + "), 
    severity, 
    details: details.join(". ") + "."
  };
}

// Individual log row component
function LogRow({ visitor, links }: { visitor: CloakerVisitorLog; links: { id: string; name: string }[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const linkName = links.find(l => l.id === visitor.link_id)?.name || "Link removido";
  
  const uaAnalysis = analyzeUserAgent(visitor.user_agent);
  const blockReason = visitor.decision === "block" ? getBlockReason(visitor) : null;

  const getDecisionBadge = () => {
    switch (visitor.decision) {
      case "allow":
        return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Aprovado</Badge>;
      case "safe":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Safe Page</Badge>;
      case "block":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Bloqueado</Badge>;
      default:
        return <Badge variant="outline">{visitor.decision}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getDeviceIcon = () => {
    const ua = visitor.user_agent?.toLowerCase() || "";
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Globe className="h-4 w-4" />;
  };

  return (
    <div className="hover:bg-muted/30 transition-colors">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* Time */}
          <div className="w-24 shrink-0">
            <p className="text-sm font-medium text-foreground">
              {format(parseISO(visitor.created_at), "HH:mm:ss")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(visitor.created_at), "dd/MM/yyyy")}
            </p>
          </div>

          {/* IP & Location */}
          <div className="w-40 shrink-0">
            <p className="text-sm font-medium text-foreground font-mono">
              {visitor.ip_address || "IP oculto"}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {visitor.country_code || "??"} {visitor.city && `• ${visitor.city}`}
            </div>
          </div>

          {/* Device & Campaign */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {getDeviceIcon()}
              <span className="text-sm font-medium text-foreground truncate">{linkName}</span>
            </div>
            {visitor.utm_source && (
              <p className="text-xs text-muted-foreground truncate">
                {visitor.utm_source} {visitor.utm_campaign && `• ${visitor.utm_campaign}`}
              </p>
            )}
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-2">
            {visitor.is_bot && (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                <Bot className="h-3 w-3 mr-1" /> Bot
              </Badge>
            )}
            {visitor.is_vpn && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                <Lock className="h-3 w-3 mr-1" /> VPN
              </Badge>
            )}
            {visitor.is_datacenter && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">
                <Server className="h-3 w-3 mr-1" /> DC
              </Badge>
            )}
            {visitor.is_proxy && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                <Wifi className="h-3 w-3 mr-1" /> Proxy
              </Badge>
            )}
          </div>

          {/* Score */}
          <div className="w-16 text-center">
            <span className={cn("text-lg font-bold", getScoreColor(visitor.score))}>
              {visitor.score}
            </span>
          </div>

          {/* Decision */}
          <div className="w-28">
            {getDecisionBadge()}
          </div>

          {/* Expand */}
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} />
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border">
          {/* User Agent Analysis - Most Important */}
          <div className="mt-4 p-4 rounded-lg border border-border bg-background">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{uaAnalysis.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{uaAnalysis.name}</h4>
                  {uaAnalysis.isBot && (
                    <Badge className={uaAnalysis.isLegitimateBot ? "bg-blue-500/20 text-blue-500" : "bg-red-500/20 text-red-500"}>
                      {uaAnalysis.isLegitimateBot ? "Bot Legítimo" : "Bot Malicioso"}
                    </Badge>
                  )}
                  {!uaAnalysis.isBot && (
                    <Badge className="bg-emerald-500/20 text-emerald-500">Usuário Real</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{uaAnalysis.description}</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 p-2 rounded truncate">
                  {visitor.user_agent || "Sem User Agent"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Block Reason - If blocked */}
          {blockReason && (
            <div className={cn(
              "mt-3 p-4 rounded-lg border",
              blockReason.severity === "high" ? "bg-red-500/10 border-red-500/30" : 
              blockReason.severity === "medium" ? "bg-orange-500/10 border-orange-500/30" : 
              "bg-yellow-500/10 border-yellow-500/30"
            )}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={cn(
                  "h-5 w-5 mt-0.5",
                  blockReason.severity === "high" ? "text-red-500" : 
                  blockReason.severity === "medium" ? "text-orange-500" : "text-yellow-500"
                )} />
                <div>
                  <h4 className="font-semibold text-foreground">Motivo do Bloqueio: {blockReason.reason}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{blockReason.details}</p>
                  {uaAnalysis.isLegitimateBot && (
                    <p className="text-sm text-blue-500 mt-2">
                      💡 <strong>Dica:</strong> Este é um bot legítimo (preview de link). Se não quiser bloquear previews, 
                      desative "Bloquear Bots" ou reduza o score mínimo para esta campanha.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Elite Detection Scores */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Fingerprint className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-foreground text-sm">Scores de Detecção Elite</h4>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              <EliteScoreItem 
                label="Device Consistency" 
                score={visitor.score_device_consistency} 
                icon={Monitor}
                tooltip="Validação de consistência de hardware/software"
              />
              <EliteScoreItem 
                label="WebRTC Leak" 
                score={visitor.score_webrtc} 
                icon={Network}
                tooltip="Detecção de VPN/Proxy via WebRTC"
              />
              <EliteScoreItem 
                label="Mouse Pattern" 
                score={visitor.score_mouse_pattern} 
                icon={Mouse}
                tooltip="Análise de padrões de movimento do mouse"
              />
              <EliteScoreItem 
                label="Keyboard" 
                score={visitor.score_keyboard} 
                icon={Keyboard}
                tooltip="Análise de padrões de digitação"
              />
              <EliteScoreItem 
                label="Session Replay" 
                score={visitor.score_session_replay} 
                icon={Video}
                tooltip="Detecção de gravadores de sessão"
              />
            </div>
          </div>

          {/* Basic Scores */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-foreground text-sm">Scores Básicos</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <EliteScoreItem 
                label="Fingerprint" 
                score={visitor.score_fingerprint} 
                icon={Fingerprint}
              />
              <EliteScoreItem 
                label="Behavior" 
                score={visitor.score_behavior} 
                icon={Activity}
              />
              <EliteScoreItem 
                label="Network" 
                score={visitor.score_network} 
                icon={Wifi}
              />
              <EliteScoreItem 
                label="Automation" 
                score={visitor.score_automation} 
                icon={Bot}
              />
            </div>
          </div>

          {/* WebRTC Details */}
          {(visitor.webrtc_local_ip || visitor.webrtc_public_ip) && (
            <div className="mt-3 p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Network className="h-4 w-4 text-purple-400" />
                <h4 className="font-semibold text-purple-400 text-sm">WebRTC Leak Detection</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">IP Local (WebRTC)</p>
                  <p className="font-mono text-sm">{visitor.webrtc_local_ip || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IP Público (WebRTC)</p>
                  <p className="font-mono text-sm">{visitor.webrtc_public_ip || "N/A"}</p>
                </div>
              </div>
              {visitor.webrtc_public_ip && visitor.ip_address && visitor.webrtc_public_ip !== visitor.ip_address && (
                <div className="mt-2 p-2 rounded bg-red-500/20 border border-red-500/30">
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    IP Real vazado via WebRTC! O usuário provavelmente está usando VPN.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Detection Details JSON */}
          {visitor.detection_details && Object.keys(visitor.detection_details).length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Ver detalhes da detecção (JSON)
              </summary>
              <pre className="mt-2 p-3 bg-muted/50 rounded-lg text-xs font-mono overflow-auto max-h-48">
                {JSON.stringify(visitor.detection_details, null, 2)}
              </pre>
            </details>
          )}
          
          {/* Network Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 bg-muted/30 rounded-lg p-4">
            <div>
              <p className="text-xs text-muted-foreground">ISP (Provedor)</p>
              <p className="font-medium text-sm truncate">{visitor.isp || "Não disponível"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ASN</p>
              <p className="font-medium text-sm">{visitor.asn || "Não disponível"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tempo de Processamento</p>
              <p className="font-medium text-sm">{visitor.processing_time_ms ?? 0}ms</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fingerprint Hash</p>
              <p className="font-medium font-mono text-xs truncate">{visitor.fingerprint_hash}</p>
            </div>
          </div>
          
          {/* Detection Flags */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground mr-2">Detecções:</span>
            {visitor.is_bot && <Badge variant="outline" className="text-xs">🤖 Bot</Badge>}
            {visitor.is_headless && <Badge variant="outline" className="text-xs">👻 Headless</Badge>}
            {visitor.is_automated && <Badge variant="outline" className="text-xs">⚙️ Automatizado</Badge>}
            {visitor.is_vpn && <Badge variant="outline" className="text-xs">🔒 VPN</Badge>}
            {visitor.is_proxy && <Badge variant="outline" className="text-xs">🌐 Proxy</Badge>}
            {visitor.is_datacenter && <Badge variant="outline" className="text-xs">🖥️ Datacenter</Badge>}
            {visitor.is_tor && <Badge variant="outline" className="text-xs">🧅 TOR</Badge>}
            {visitor.is_blacklisted && <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500">🚫 Blacklisted</Badge>}
            {!visitor.is_bot && !visitor.is_vpn && !visitor.is_proxy && !visitor.is_datacenter && !visitor.is_tor && !visitor.is_headless && !visitor.is_automated && !visitor.is_blacklisted && (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500">✅ Nenhuma flag</Badge>
            )}
          </div>
          
          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-muted/30 rounded-lg p-4">
            <div>
              <p className="text-xs text-muted-foreground">Referer</p>
              <p className="font-medium text-xs truncate">{visitor.referer || "Acesso Direto"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Idioma</p>
              <p className="font-medium text-xs">{visitor.language || "Não informado"}</p>
            </div>
            {visitor.redirect_url && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Redirecionado para</p>
                <p className="font-medium text-xs truncate text-primary">{visitor.redirect_url}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Elite Score Item Component
function EliteScoreItem({ 
  label, 
  score, 
  icon: Icon,
  tooltip 
}: { 
  label: string; 
  score: number | null; 
  icon: React.ComponentType<{ className?: string }>;
  tooltip?: string;
}) {
  const displayScore = score ?? 0;
  
  const getScoreColor = (s: number) => {
    if (s >= 70) return "text-emerald-500";
    if (s >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getBgColor = (s: number) => {
    if (s >= 70) return "bg-emerald-500/10 border-emerald-500/30";
    if (s >= 40) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-all hover:scale-105",
        score !== null ? getBgColor(displayScore) : "bg-muted/50 border-border"
      )}
      title={tooltip}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className={cn("text-xl font-bold", score !== null ? getScoreColor(displayScore) : "text-muted-foreground")}>
        {score !== null ? displayScore : "—"}
      </div>
    </div>
  );
}