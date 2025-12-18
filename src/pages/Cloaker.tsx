import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Link2, Trash2, Copy, ExternalLink, Shield, Globe, Smartphone, Bot } from "lucide-react";
import { toast } from "sonner";
import { useCloakedLinks } from "@/hooks/useCloakedLinks";

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

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Cloaker" 
            subtitle="Gerencie links com proteção e filtros de tráfego"
          />
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Bloquear Bots</Label>
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
                        className="cursor-pointer"
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
                        className="cursor-pointer"
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

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : links.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum link criado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie seu primeiro link cloakado para proteger suas URLs
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {links.map(link => (
              <Card key={link.id} className={!link.is_active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{link.name}</h3>
                        <Badge variant={link.is_active ? "default" : "secondary"}>
                          {link.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link2 className="h-4 w-4" />
                        <code className="bg-muted px-2 py-0.5 rounded">/go/{link.slug}</code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopyLink(link.slug)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {link.block_bots && (
                          <Badge variant="outline" className="gap-1">
                            <Bot className="h-3 w-3" />
                            Bots bloqueados
                          </Badge>
                        )}
                        {link.allowed_countries && link.allowed_countries.length > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <Globe className="h-3 w-3" />
                            {link.allowed_countries.join(", ")}
                          </Badge>
                        )}
                        {link.allowed_devices && link.allowed_devices.length > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <Smartphone className="h-3 w-3" />
                            {link.allowed_devices.join(", ")}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {link.clicks_count} cliques
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={() => handleToggleActive(link.id, link.is_active)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(link.target_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}