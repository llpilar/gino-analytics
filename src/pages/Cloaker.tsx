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
  Users, AlertTriangle, CheckCircle, XCircle, Clock, Pencil
} from "lucide-react";
import { toast } from "sonner";
import { useCloakedLinks, useCloakerVisitors, useCloakerStats } from "@/hooks/useCloakedLinks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  } | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    safeUrl: "",
    targetUrl: "",
    allowedCountries: [] as string[],
    blockedCountries: [] as string[],
    allowedDevices: [] as string[],
    blockBots: true,
    minScore: 40,
    collectFingerprint: true,
    requireBehavior: false,
    behaviorTimeMs: 2000,
  });

  const { data: visitors, isLoading: visitorsLoading } = useCloakerVisitors(selectedLinkId);
  const { data: stats } = useCloakerStats(selectedLinkId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createLink({
        name: formData.name,
        slug: formData.slug,
        safe_url: formData.safeUrl,
        target_url: formData.targetUrl,
        allowed_countries: formData.allowedCountries.length > 0 ? formData.allowedCountries : null,
        blocked_countries: formData.blockedCountries.length > 0 ? formData.blockedCountries : null,
        allowed_devices: formData.allowedDevices.length > 0 ? formData.allowedDevices : null,
        block_bots: formData.blockBots,
        min_score: formData.minScore,
        collect_fingerprint: formData.collectFingerprint,
        require_behavior: formData.requireBehavior,
        behavior_time_ms: formData.behaviorTimeMs,
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
      safeUrl: "",
      targetUrl: "",
      allowedCountries: [],
      blockedCountries: [],
      allowedDevices: [],
      blockBots: true,
      minScore: 40,
      collectFingerprint: true,
      requireBehavior: false,
      behaviorTimeMs: 2000,
    });
  };

  const handleCopyLink = (slug: string) => {
    // Use edge function URL directly - hides lovable domain
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${supabaseUrl}/functions/v1/cloaker-redirect?s=${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
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
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLink) return;
    try {
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
      });
      setIsEditDialogOpen(false);
      setEditingLink(null);
      toast.success("Link atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const toggleEditArrayValue = (field: 'allowedCountries' | 'blockedCountries' | 'allowedDevices', value: string) => {
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Link Protegido</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="filters">Filtros</TabsTrigger>
                    <TabsTrigger value="advanced">Avançado</TabsTrigger>
                  </TabsList>

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
                  </TabsContent>

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
                            >
                              <Copy className="h-3 w-3" />
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
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Selecione um link para ver os visitantes
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stats for selected link */}
                  {stats && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="p-3 rounded-lg bg-card/50 border border-border">
                        <div className="text-lg font-bold text-foreground">{stats.total}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="p-3 rounded-lg bg-card/50 border border-border">
                        <div className="text-lg font-bold text-chart-4">{stats.allowed}</div>
                        <div className="text-xs text-muted-foreground">Permitidos</div>
                      </div>
                      <div className="p-3 rounded-lg bg-card/50 border border-border">
                        <div className="text-lg font-bold text-destructive">{stats.blocked}</div>
                        <div className="text-xs text-muted-foreground">Bloqueados</div>
                      </div>
                      <div className="p-3 rounded-lg bg-card/50 border border-border">
                        <div className="text-lg font-bold text-yellow-500">{stats.bots}</div>
                        <div className="text-xs text-muted-foreground">Bots</div>
                      </div>
                    </div>
                  )}

                  {/* Visitors list */}
                  <ScrollArea className="h-[400px]">
                    {visitorsLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-16 rounded-lg" />
                        ))}
                      </div>
                    ) : visitors && visitors.length > 0 ? (
                      <div className="space-y-2 pr-4">
                        {visitors.map(visitor => (
                          <div key={visitor.id} className="p-3 rounded-lg bg-card/50 border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getDecisionIcon(visitor.decision)}
                                <span className={`text-sm font-medium ${getDecisionColor(visitor.decision)}`}>
                                  {visitor.decision === "allow" ? "Permitido" : visitor.decision === "safe" ? "Safe" : "Bloqueado"}
                                </span>
                              </div>
                              <span className={`text-sm font-bold ${getScoreColor(visitor.score)}`}>
                                {visitor.score}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              {visitor.country_code && (
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {visitor.country_code}
                                </span>
                              )}
                              {visitor.is_bot && <Badge variant="destructive" className="text-[10px] h-4">Bot</Badge>}
                              {visitor.is_headless && <Badge variant="outline" className="text-[10px] h-4">Headless</Badge>}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(visitor.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum visitante ainda
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
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="filters">Filtros</TabsTrigger>
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