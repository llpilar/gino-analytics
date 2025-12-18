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
import { Plus, Link2, Trash2, Copy, ExternalLink, Shield, Globe, Smartphone, Bot, MousePointerClick, ToggleRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useCloakedLinks } from "@/hooks/useCloakedLinks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    safeUrl: "",
    targetUrl: "",
    allowedCountries: [] as string[],
    blockedCountries: [] as string[],
    allowedDevices: [] as string[],
    blockBots: true,
  });

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
      });
      
      setIsDialogOpen(false);
      setFormData({
        name: "",
        slug: "",
        safeUrl: "",
        targetUrl: "",
        allowedCountries: [],
        blockedCountries: [],
        allowedDevices: [],
        blockBots: true,
      });
      toast.success("Link criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar link");
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/go/${slug}`;
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

  return (
    <DashboardWrapper>
      <div className="w-full max-w-[2400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 md:py-6 lg:py-8 min-h-screen pb-24 md:pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-8">
          <PageHeader 
            title="Cloaker"
            subtitle="Proteção e filtros de tráfego para seus links"
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
                <DialogTitle>Criar Novo Link</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Label htmlFor="safeUrl">URL Segura (página normal)</Label>
                  <Input
                    id="safeUrl"
                    type="url"
                    placeholder="https://seusite.com/blog"
                    value={formData.safeUrl}
                    onChange={e => setFormData(prev => ({ ...prev, safeUrl: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Mostrada para bots e tráfego bloqueado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetUrl">URL de Destino (página real)</Label>
                  <Input
                    id="targetUrl"
                    type="url"
                    placeholder="https://seusite.com/oferta"
                    value={formData.targetUrl}
                    onChange={e => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Mostrada para tráfego permitido</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Bloquear Bots</Label>
                      <p className="text-xs text-muted-foreground">Facebook, Google, etc.</p>
                    </div>
                    <Switch
                      checked={formData.blockBots}
                      onCheckedChange={checked => setFormData(prev => ({ ...prev, blockBots: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Países Permitidos (deixe vazio para todos)</Label>
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
                </div>

                <div className="space-y-2">
                  <Label>Dispositivos Permitidos (deixe vazio para todos)</Label>
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
                  subtitle="redirecionados"
                  icon={MousePointerClick}
                  color="purple"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Cliques processados</p></TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={1000}>
            <TooltipTrigger asChild>
              <div>
                <StatsCard
                  title="Proteção Bot"
                  value={linksWithBotBlock.toString()}
                  subtitle="protegidos"
                  icon={Bot}
                  color="orange"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Links com bloqueio de bots ativo</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Links List */}
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
                <Link2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum link criado</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                Crie seu primeiro link cloakado para proteger suas URLs e filtrar tráfego indesejado.
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
                  className={`p-4 rounded-lg bg-card/50 border border-border transition-all ${!link.is_active ? "opacity-50" : "hover:border-primary/30"}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">{link.name}</h3>
                        <Badge variant={link.is_active ? "default" : "secondary"} className="shrink-0">
                          {link.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <code className="bg-muted px-2 py-0.5 rounded text-xs truncate">/go/{link.slug}</code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={() => handleCopyLink(link.slug)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {link.block_bots && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Bot className="h-3 w-3" />
                            Bots bloqueados
                          </Badge>
                        )}
                        {link.allowed_countries && link.allowed_countries.length > 0 && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Globe className="h-3 w-3" />
                            {link.allowed_countries.join(", ")}
                          </Badge>
                        )}
                        {link.allowed_devices && link.allowed_devices.length > 0 && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Smartphone className="h-3 w-3" />
                            {link.allowed_devices.join(", ")}
                          </Badge>
                        )}
                        <Badge variant="outline" className="gap-1 text-xs">
                          <MousePointerClick className="h-3 w-3" />
                          {link.clicks_count.toLocaleString('pt-BR')} cliques
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={() => handleToggleActive(link.id, link.is_active)}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(link.target_url, '_blank')}
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
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(link.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir link</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardWrapper>
  );
}