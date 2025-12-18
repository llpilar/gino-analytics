import { useState } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, Link2, Trash2, Copy, ExternalLink, Shield, Globe, Smartphone, Bot, 
  MousePointerClick, ToggleRight, Fingerprint, Activity,
  Users, AlertTriangle, CheckCircle, XCircle, Clock, Zap, Target, Eye,
  TrendingUp, Server, Cpu
} from "lucide-react";
import { toast } from "sonner";
import { useCloakedLinks, useCloakerVisitors, useCloakerStats } from "@/hooks/useCloakedLinks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

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
      case "safe": return "text-[hsl(var(--neon-orange))]";
      default: return "text-muted-foreground";
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case "allow": return <CheckCircle className="h-4 w-4 text-chart-4" />;
      case "block": return <XCircle className="h-4 w-4 text-destructive" />;
      case "safe": return <AlertTriangle className="h-4 w-4 text-[hsl(var(--neon-orange))]" />;
      default: return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-chart-4";
    if (score >= 40) return "text-[hsl(var(--neon-orange))]";
    return "text-destructive";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-chart-4/20";
    if (score >= 40) return "bg-[hsl(var(--neon-orange))]/20";
    return "bg-destructive/20";
  };

  const selectedLink = links.find(l => l.id === selectedLinkId);

  return (
    <DashboardWrapper>
      <div className="w-full max-w-[2400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 min-h-screen pb-24 md:pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Cloaker Avançado</h1>
                <p className="text-sm text-muted-foreground">Proteção inteligente com fingerprinting e scoring dinâmico</p>
              </div>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity">
                <Plus className="h-4 w-4" />
                Novo Link
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border/50 bg-card/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Criar Link Protegido
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-muted/50">
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
                          className="bg-background/50"
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
                          className="bg-background/50"
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
                        className="bg-background/50"
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
                        className="bg-background/50"
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

                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Bot className="h-4 w-4 text-red-400" />
                          Bloquear Bots
                        </Label>
                        <p className="text-xs text-muted-foreground">Facebook, Google, crawlers</p>
                      </div>
                      <Switch
                        checked={formData.blockBots}
                        onCheckedChange={checked => setFormData(prev => ({ ...prev, blockBots: checked }))}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 mt-4">
                    <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          Score Mínimo: {formData.minScore}
                        </Label>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${getScoreBg(formData.minScore)} ${getScoreColor(formData.minScore)}`}>
                          {formData.minScore >= 70 ? "Alto" : formData.minScore >= 40 ? "Médio" : "Baixo"}
                        </span>
                      </div>
                      <Slider
                        value={[formData.minScore]}
                        onValueChange={([value]) => setFormData(prev => ({ ...prev, minScore: value }))}
                        min={0}
                        max={100}
                        step={5}
                        className="py-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Visitantes com score abaixo serão redirecionados para URL segura
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Fingerprint className="h-4 w-4 text-purple-400" />
                          Coletar Fingerprint
                        </Label>
                        <p className="text-xs text-muted-foreground">Canvas, WebGL, áudio, fontes</p>
                      </div>
                      <Switch
                        checked={formData.collectFingerprint}
                        onCheckedChange={checked => setFormData(prev => ({ ...prev, collectFingerprint: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Activity className="h-4 w-4 text-cyan-400" />
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
                      <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Tempo mínimo: {formData.behaviorTimeMs}ms
                        </Label>
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

                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                  <Shield className="h-4 w-4 mr-2" />
                  Criar Link Protegido
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid - Redesigned */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-[hsl(var(--neon-cyan))]/10 via-card to-card border-[hsl(var(--neon-cyan))]/20 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--neon-cyan))]/5 to-transparent" />
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Links</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">{totalLinks}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--neon-cyan))]/20">
                    <Link2 className="h-5 w-5 text-[hsl(var(--neon-cyan))]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-[hsl(var(--neon-green))]/10 via-card to-card border-[hsl(var(--neon-green))]/20 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--neon-green))]/5 to-transparent" />
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ativos</p>
                    <p className="text-2xl md:text-3xl font-bold text-[hsl(var(--neon-green))] mt-1">{activeLinks}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--neon-green))]/20">
                    <Zap className="h-5 w-5 text-[hsl(var(--neon-green))]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-[hsl(var(--neon-purple))]/10 via-card to-card border-[hsl(var(--neon-purple))]/20 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--neon-purple))]/5 to-transparent" />
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cliques</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">{totalClicks.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--neon-purple))]/20">
                    <MousePointerClick className="h-5 w-5 text-[hsl(var(--neon-purple))]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-[hsl(var(--neon-orange))]/10 via-card to-card border-[hsl(var(--neon-orange))]/20 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--neon-orange))]/5 to-transparent" />
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Proteção</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">{linksWithBotBlock}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--neon-orange))]/20">
                    <Shield className="h-5 w-5 text-[hsl(var(--neon-orange))]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Links List - Redesigned */}
          <div className="xl:col-span-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Seus Links
                  {links.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">{links.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                  </div>
                ) : links.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 border border-primary/20">
                      <Fingerprint className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Sistema de Proteção Avançado</h3>
                    <p className="text-muted-foreground text-sm max-w-md mb-8">
                      Crie links protegidos com fingerprinting, análise comportamental e scoring dinâmico para filtrar tráfego indesejado.
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-secondary">
                      <Plus className="h-4 w-4" />
                      Criar Primeiro Link
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {links.map((link, index) => (
                        <motion.div
                          key={link.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            selectedLinkId === link.id 
                              ? "bg-primary/5 border-primary/40 shadow-lg shadow-primary/10" 
                              : "bg-card/80 border-border/50 hover:border-primary/30 hover:bg-card"
                          } ${!link.is_active ? "opacity-60" : ""}`}
                          onClick={() => setSelectedLinkId(link.id === selectedLinkId ? null : link.id)}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-3 flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className={`p-2 rounded-lg ${link.is_active ? 'bg-[hsl(var(--neon-green))]/20' : 'bg-muted'}`}>
                                  <Shield className={`h-4 w-4 ${link.is_active ? 'text-[hsl(var(--neon-green))]' : 'text-muted-foreground'}`} />
                                </div>
                                <h3 className="font-semibold text-foreground truncate">{link.name}</h3>
                                <Badge 
                                  variant={link.is_active ? "default" : "secondary"} 
                                  className={`shrink-0 ${link.is_active ? 'bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30' : ''}`}
                                >
                                  {link.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                <code className="bg-muted/50 px-3 py-1 rounded-lg text-xs font-mono truncate border border-border/50">
                                  /go/{link.slug}
                                </code>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-7 w-7 p-0 shrink-0 hover:bg-primary/20"
                                      onClick={(e) => { e.stopPropagation(); handleCopyLink(link.slug); }}
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copiar link</TooltipContent>
                                </Tooltip>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="gap-1.5 text-xs bg-[hsl(var(--neon-purple))]/10 border-[hsl(var(--neon-purple))]/30 text-[hsl(var(--neon-purple-light))]">
                                  <Target className="h-3 w-3" />
                                  Score ≥ {link.min_score}
                                </Badge>
                                {link.block_bots && (
                                  <Badge variant="outline" className="gap-1.5 text-xs bg-destructive/10 border-destructive/30 text-destructive">
                                    <Bot className="h-3 w-3" />
                                    Anti-Bot
                                  </Badge>
                                )}
                                {link.collect_fingerprint && (
                                  <Badge variant="outline" className="gap-1.5 text-xs bg-[hsl(var(--neon-cyan))]/10 border-[hsl(var(--neon-cyan))]/30 text-[hsl(var(--neon-cyan-light))]">
                                    <Fingerprint className="h-3 w-3" />
                                  </Badge>
                                )}
                                {link.allowed_countries && link.allowed_countries.length > 0 && (
                                  <Badge variant="outline" className="gap-1.5 text-xs bg-[hsl(var(--neon-blue))]/10 border-[hsl(var(--neon-blue))]/30 text-[hsl(var(--neon-blue-light))]">
                                    <Globe className="h-3 w-3" />
                                    {link.allowed_countries.length} países
                                  </Badge>
                                )}
                                <Badge variant="outline" className="gap-1.5 text-xs bg-[hsl(var(--neon-green))]/10 border-[hsl(var(--neon-green))]/30 text-[hsl(var(--neon-green-light))]">
                                  <MousePointerClick className="h-3 w-3" />
                                  {link.clicks_count.toLocaleString('pt-BR')} cliques
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Switch
                                checked={link.is_active}
                                onCheckedChange={() => handleToggleActive(link.id, link.is_active)}
                                onClick={e => e.stopPropagation()}
                              />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 hover:bg-primary/20"
                                    onClick={(e) => { e.stopPropagation(); window.open(link.target_url, '_blank'); }}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Abrir destino</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/20"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(link.id); }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Visitors Panel - Redesigned */}
          <div>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-[hsl(var(--neon-cyan))]" />
                  Visitantes
                  {selectedLink && (
                    <Badge variant="secondary" className="ml-auto text-xs">{selectedLink.name}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedLinkId ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 border border-border/50">
                      <Eye className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Selecione um link para ver os visitantes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Stats for selected link */}
                    {stats && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Total</span>
                          </div>
                          <div className="text-xl font-bold text-foreground mt-1">{stats.total}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-chart-4/10 to-chart-4/5 border border-chart-4/20">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-chart-4" />
                            <span className="text-xs text-chart-4/80">Permitidos</span>
                          </div>
                          <div className="text-xl font-bold text-chart-4 mt-1">{stats.allowed}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive/80">Bloqueados</span>
                          </div>
                          <div className="text-xl font-bold text-destructive mt-1">{stats.blocked}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-[hsl(var(--neon-orange))]/10 to-[hsl(var(--neon-orange))]/5 border border-[hsl(var(--neon-orange))]/20">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-[hsl(var(--neon-orange))]" />
                            <span className="text-xs text-[hsl(var(--neon-orange))]/80">Bots</span>
                          </div>
                          <div className="text-xl font-bold text-[hsl(var(--neon-orange))] mt-1">{stats.bots}</div>
                        </div>
                      </div>
                    )}

                    {/* Visitors list */}
                    <ScrollArea className="h-[420px]">
                      {visitorsLoading ? (
                        <div className="space-y-2">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-20 rounded-xl" />
                          ))}
                        </div>
                      ) : visitors && visitors.length > 0 ? (
                        <div className="space-y-2 pr-4">
                          <AnimatePresence>
                            {visitors.map((visitor, index) => (
                              <motion.div 
                                key={visitor.id} 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className={`p-3 rounded-xl border transition-all ${
                                  visitor.decision === 'allow' 
                                    ? 'bg-chart-4/5 border-chart-4/20' 
                                    : visitor.decision === 'safe'
                                    ? 'bg-[hsl(var(--neon-orange))]/5 border-[hsl(var(--neon-orange))]/20'
                                    : 'bg-destructive/5 border-destructive/20'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {getDecisionIcon(visitor.decision)}
                                    <span className={`text-sm font-medium ${getDecisionColor(visitor.decision)}`}>
                                      {visitor.decision === "allow" ? "Permitido" : visitor.decision === "safe" ? "Safe" : "Bloqueado"}
                                    </span>
                                  </div>
                                  <span className={`text-sm font-bold px-2 py-0.5 rounded ${getScoreBg(visitor.score)} ${getScoreColor(visitor.score)}`}>
                                    {visitor.score}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
                                  {visitor.country_code && (
                                    <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded">
                                      <Globe className="h-3 w-3" />
                                      {visitor.country_code || 'N/A'}
                                    </span>
                                  )}
                                  {visitor.is_bot && (
                                    <Badge className="text-[10px] h-5 bg-destructive/20 text-destructive border-destructive/30">
                                      Bot
                                    </Badge>
                                  )}
                                  {visitor.is_headless && (
                                    <Badge variant="outline" className="text-[10px] h-5">
                                      Headless
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(visitor.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Server className="h-10 w-10 text-muted-foreground/50 mb-3" />
                          <p className="text-muted-foreground text-sm">
                            Nenhum visitante ainda
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardWrapper>
  );
}
