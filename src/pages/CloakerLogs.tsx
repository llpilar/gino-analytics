import { useState, useMemo } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Eye, TrendingUp, Shield, AlertTriangle, Search, CalendarIcon, 
  Download, RefreshCw, Globe, Smartphone, Bot, ChevronLeft, ChevronRight,
  Megaphone, BarChart3, Filter, Monitor, Laptop, Tablet, ChevronsLeft, ChevronsRight,
  X
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCloakedLinks } from "@/hooks/useCloakedLinks";
import { cn } from "@/lib/utils";
import { VisitorDetailsDialog } from "@/components/cloaker/VisitorDetailsDialog";

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
  score_device_consistency: number | null;
  score_webrtc: number | null;
  score_mouse_pattern: number | null;
  score_keyboard: number | null;
  score_session_replay: number | null;
  detection_details: Record<string, unknown> | null;
  webrtc_local_ip: string | null;
  webrtc_public_ip: string | null;
  screen_resolution: string | null;
  created_at: string;
}

type ActionFilter = "all" | "allow" | "block" | "safe";
type PeriodFilter = "today" | "yesterday" | "week" | "month" | "custom";
type TabFilter = "campaign" | "requests" | "charts";

// Country flag emoji mapping
const countryFlags: Record<string, string> = {
  BR: "🇧🇷", US: "🇺🇸", CO: "🇨🇴", MX: "🇲🇽", AR: "🇦🇷", CL: "🇨🇱", PE: "🇵🇪", 
  EC: "🇪🇨", VE: "🇻🇪", UY: "🇺🇾", PY: "🇵🇾", BO: "🇧🇴", PT: "🇵🇹", ES: "🇪🇸",
  FR: "🇫🇷", DE: "🇩🇪", IT: "🇮🇹", GB: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺", JP: "🇯🇵",
  CN: "🇨🇳", IN: "🇮🇳", RU: "🇷🇺", ZA: "🇿🇦", NL: "🇳🇱", BE: "🇧🇪", CH: "🇨🇭",
  AT: "🇦🇹", PL: "🇵🇱", CZ: "🇨🇿", SE: "🇸🇪", NO: "🇳🇴", DK: "🇩🇰", FI: "🇫🇮",
  IE: "🇮🇪", NZ: "🇳🇿", SG: "🇸🇬", HK: "🇭🇰", KR: "🇰🇷", TW: "🇹🇼", TH: "🇹🇭",
  PH: "🇵🇭", ID: "🇮🇩", MY: "🇲🇾", VN: "🇻🇳", NG: "🇳🇬", EG: "🇪🇬", KE: "🇰🇪",
  MA: "🇲🇦", GH: "🇬🇭", AE: "🇦🇪", SA: "🇸🇦", IL: "🇮🇱", TR: "🇹🇷", GR: "🇬🇷",
  RO: "🇷🇴", HU: "🇭🇺", SK: "🇸🇰", BG: "🇧🇬", HR: "🇭🇷", UA: "🇺🇦", BY: "🇧🇾"
};

const getCountryFlag = (code: string | null) => {
  if (!code) return "🌍";
  return countryFlags[code.toUpperCase()] || "🏳️";
};

const getDeviceInfo = (ua: string | null): { type: "mobile" | "tablet" | "desktop"; label: string } => {
  if (!ua) return { type: "desktop", label: "Desktop" };
  const uaLower = ua.toLowerCase();
  
  if (/ipad|tablet|playbook|silk/i.test(uaLower)) {
    return { type: "tablet", label: "Tablet" };
  }
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(uaLower)) {
    return { type: "mobile", label: "Mobile" };
  }
  return { type: "desktop", label: "Desktop" };
};

const DeviceIcon = ({ type }: { type: "mobile" | "tablet" | "desktop" }) => {
  switch (type) {
    case "mobile": return <Smartphone className="h-4 w-4" />;
    case "tablet": return <Tablet className="h-4 w-4" />;
    default: return <Monitor className="h-4 w-4" />;
  }
};

export default function CloakerLogs() {
  const { user } = useAuth();
  const { links } = useCloakedLinks();
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabFilter>("requests");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<CloakerVisitorLog | null>(null);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("week");
  const [orderBy, setOrderBy] = useState<"newest" | "oldest">("newest");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  // Fetch all visitors for user's links
  const { data: allVisitors = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["cloaker-all-visitors", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: userLinks } = await supabase
        .from("cloaked_links")
        .select("id")
        .eq("user_id", user.id);
      
      if (!userLinks || userLinks.length === 0) return [];
      
      const linkIds = userLinks.map(l => l.id);
      
      const { data, error } = await supabase
        .from("cloaker_visitors")
        .select("*")
        .in("link_id", linkIds)
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw error;
      return data as unknown as CloakerVisitorLog[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Filter visitors
  const filteredVisitors = useMemo(() => {
    let filtered = [...allVisitors];

    if (selectedCampaign !== "all") {
      filtered = filtered.filter(v => v.link_id === selectedCampaign);
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter(v => {
        if (actionFilter === "allow") return v.decision === "allow";
        if (actionFilter === "block") return v.decision === "block";
        if (actionFilter === "safe") return v.decision === "safe";
        return true;
      });
    }

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

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.ip_address?.toLowerCase().includes(query) ||
        v.country_code?.toLowerCase().includes(query) ||
        v.city?.toLowerCase().includes(query) ||
        v.isp?.toLowerCase().includes(query) ||
        v.utm_campaign?.toLowerCase().includes(query) ||
        v.utm_source?.toLowerCase().includes(query) ||
        v.fingerprint_hash?.toLowerCase().includes(query) ||
        links.find(l => l.id === v.link_id)?.name.toLowerCase().includes(query)
      );
    }

    if (orderBy === "oldest") {
      filtered.reverse();
    }

    return filtered;
  }, [allVisitors, selectedCampaign, actionFilter, periodFilter, startDate, endDate, searchQuery, orderBy, links]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredVisitors.length;
    const allowed = filteredVisitors.filter(v => v.decision === "allow").length;
    const safe = filteredVisitors.filter(v => v.decision === "safe").length;
    const bots = filteredVisitors.filter(v => v.is_bot || v.decision === "block").length;
    
    return { total, allowed, safe, bots };
  }, [filteredVisitors]);

  // Pagination
  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);
  const paginatedVisitors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVisitors.slice(start, start + itemsPerPage);
  }, [filteredVisitors, currentPage, itemsPerPage]);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredVisitors.length);

  // Export to CSV
  const exportCSV = () => {
    const headers = ["Data", "Campanha", "Hash", "País", "IP", "Device", "Score", "Decisão"];
    const rows = filteredVisitors.map(v => [
      format(parseISO(v.created_at), "EEE, dd MMM yyyy HH:mm:ss 'GMT'", { locale: ptBR }),
      links.find(l => l.id === v.link_id)?.name || "-",
      v.fingerprint_hash?.slice(0, 10) || "-",
      v.country_code || "-",
      v.ip_address || "-",
      getDeviceInfo(v.user_agent).label,
      v.score.toString(),
      v.decision
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cloaker-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <DashboardWrapper>
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Logs de Visitantes</h1>
            <p className="text-muted-foreground">Monitore o tráfego das suas campanhas em tempo real</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-primary/10 border-primary" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Requests</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.total.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-card border-border hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Offer Pages</p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">{stats.allowed.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-card border-border hover:border-yellow-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Safe Pages</p>
                <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.safe.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-card border-border hover:border-red-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Bloqueados</p>
                <p className="text-2xl font-bold text-red-500 mt-1">{stats.bots.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabFilter)} className="w-full">
          <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-full justify-start">
            <TabsTrigger 
              value="campaign" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Megaphone className="h-4 w-4 mr-2" />
              CAMPAIGN
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              REQUESTS
            </TabsTrigger>
            <TabsTrigger 
              value="charts" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              CHARTS
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="p-4 bg-card border-border animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="IP, país, campanha, hash..." 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-10 bg-background"
                  />
                  {searchQuery && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Period */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Período</label>
                <Select value={periodFilter} onValueChange={(v) => { setPeriodFilter(v as PeriodFilter); setCurrentPage(1); }}>
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
                <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v as ActionFilter); setCurrentPage(1); }}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="allow">Aprovado</SelectItem>
                    <SelectItem value="safe">Safe Page</SelectItem>
                    <SelectItem value="block">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campaign */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Campanha</label>
                <Select value={selectedCampaign} onValueChange={(v) => { setSelectedCampaign(v); setCurrentPage(1); }}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {links.map(link => (
                      <SelectItem key={link.id} value={link.id}>{link.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom date range */}
            {periodFilter === "custom" && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
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
                        onSelect={(date) => { if (date) setStartDate(date); setIsStartDateOpen(false); setCurrentPage(1); }}
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
                        onSelect={(date) => { if (date) setEndDate(date); setIsEndDateOpen(false); setCurrentPage(1); }}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Data Table */}
        <Card className="bg-card border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Eye className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Nenhum log encontrado</h3>
              <p className="text-muted-foreground mt-1">Tente ajustar os filtros ou selecione outro período.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-muted-foreground font-medium">Created in</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Campaign Name</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Hash</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Country</TableHead>
                      <TableHead className="text-muted-foreground font-medium">IP</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Score</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-right">Device</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVisitors.map((visitor) => {
                      const linkName = links.find(l => l.id === visitor.link_id)?.name || "Link removido";
                      const deviceInfo = getDeviceInfo(visitor.user_agent);
                      const flag = getCountryFlag(visitor.country_code);
                      
                      return (
                        <Dialog key={visitor.id}>
                          <DialogTrigger asChild>
                            <TableRow 
                              className="cursor-pointer hover:bg-muted/50 border-border transition-colors group"
                              onClick={() => setSelectedVisitor(visitor)}
                            >
                              <TableCell className="font-medium text-foreground whitespace-nowrap">
                                {format(parseISO(visitor.created_at), "EEE, dd MMM yyyy HH:mm:ss 'GMT'", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-foreground font-medium truncate max-w-[200px]">{linkName}</span>
                                  {visitor.is_blacklisted && (
                                    <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/30">
                                      Blacklist
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-sm text-muted-foreground font-mono">
                                  {visitor.fingerprint_hash?.slice(0, 10) || "—"}
                                </code>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{flag}</span>
                                  <span className="text-muted-foreground text-sm">{visitor.country_code || "??"}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-sm text-muted-foreground font-mono">
                                  {visitor.ip_address || "—"}
                                </code>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  className={cn(
                                    "font-bold",
                                    visitor.score >= 70 ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" :
                                    visitor.score >= 40 ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" :
                                    "bg-red-500/20 text-red-500 border-red-500/30"
                                  )}
                                >
                                  {visitor.score}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                  <DeviceIcon type={deviceInfo.type} />
                                  <span className="text-sm">{deviceInfo.label}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3">
                                <span className="text-2xl">{flag}</span>
                                <span>Detalhes do Visitante</span>
                                <Badge 
                                  className={cn(
                                    visitor.decision === "allow" ? "bg-emerald-500/20 text-emerald-500" :
                                    visitor.decision === "safe" ? "bg-yellow-500/20 text-yellow-500" :
                                    "bg-red-500/20 text-red-500"
                                  )}
                                >
                                  {visitor.decision === "allow" ? "Aprovado" : visitor.decision === "safe" ? "Safe Page" : "Bloqueado"}
                                </Badge>
                              </DialogTitle>
                            </DialogHeader>
                            <VisitorDetailsDialog visitor={visitor as any} />
                          </DialogContent>
                        </Dialog>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Items per page:</span>
                  <Select 
                    value={itemsPerPage.toString()} 
                    onValueChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}
                  >
                    <SelectTrigger className="w-[70px] h-8 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {startItem}-{endItem} of {filteredVisitors.length.toLocaleString()}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardWrapper>
  );
}
