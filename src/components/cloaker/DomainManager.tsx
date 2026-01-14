import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { 
  Globe, Plus, Trash2, CheckCircle, XCircle, Clock, Star, 
  RefreshCw, Copy, Shield, AlertTriangle, ExternalLink 
} from "lucide-react";
import { toast } from "sonner";
import { useCloakerDomains, CloakerDomain } from "@/hooks/useCloakerDomains";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DomainManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(true);
  
  const { 
    domains, 
    isLoading, 
    createDomain, 
    deleteDomain, 
    verifyDomain, 
    setAsDefault: setDefaultMutation 
  } = useCloakerDomains();

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error("Digite um domínio válido");
      return;
    }

    try {
      await createDomain.mutateAsync({
        domain: newDomain,
        is_default: setAsDefault,
      });
      setNewDomain("");
      setIsOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const copyDNSRecord = (domain: CloakerDomain) => {
    const record = `TXT _cloaker.${domain.domain} = ${domain.verification_token}`;
    navigator.clipboard.writeText(domain.verification_token);
    toast.success("Token de verificação copiado!");
  };

  const getStatusBadge = (domain: CloakerDomain) => {
    if (domain.is_verified && domain.ssl_status === "active") {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ativo
        </Badge>
      );
    }
    if (domain.dns_status === "verified" && domain.ssl_status === "provisioning") {
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Provisionando SSL
        </Badge>
      );
    }
    if (domain.dns_status === "failed") {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <XCircle className="h-3 w-3 mr-1" />
          DNS Falhou
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          Domínios ({domains.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Gerenciar Domínios Personalizados
          </DialogTitle>
          <DialogDescription>
            Configure domínios personalizados para seus links de cloaker
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new domain */}
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <Label className="text-sm font-medium">Adicionar Novo Domínio</Label>
            <div className="flex gap-2">
              <Input
                placeholder="ex: track.meusite.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleAddDomain} 
                disabled={createDomain.isPending}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="setAsDefault"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="setAsDefault" className="text-sm text-muted-foreground cursor-pointer">
                Definir como domínio padrão
              </Label>
            </div>
          </div>

          {/* DNS Instructions */}
          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Shield className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-sm">
              <strong>Configuração DNS:</strong> Aponte seu domínio para nosso servidor:
              <br />
              <code className="text-xs bg-black/30 px-1 rounded">A record → 185.158.133.1</code>
              <br />
              <span className="text-xs text-muted-foreground">
                Adicione também o registro TXT para verificação de propriedade.
              </span>
            </AlertDescription>
          </Alert>

          {/* Domain list */}
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando domínios...
                </div>
              ) : domains.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhum domínio cadastrado</p>
                  <p className="text-sm">Adicione seu primeiro domínio acima</p>
                </div>
              ) : (
                domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{domain.domain}</span>
                            {domain.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Padrão
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Adicionado em {new Date(domain.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(domain)}
                        
                        <div className="flex gap-1">
                          {!domain.is_verified && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyDNSRecord(domain)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copiar token de verificação</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => verifyDomain.mutate(domain.id)}
                                    disabled={verifyDomain.isPending}
                                  >
                                    <RefreshCw className={`h-4 w-4 ${verifyDomain.isPending ? 'animate-spin' : ''}`} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Verificar DNS</TooltipContent>
                              </Tooltip>
                            </>
                          )}

                          {domain.is_verified && !domain.is_default && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDefaultMutation.mutate(domain.id)}
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Definir como padrão</TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteDomain.mutate(domain.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remover domínio</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>

                    {/* Verification instructions for pending domains */}
                    {!domain.is_verified && (
                      <div className="mt-3 p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-yellow-400">Verificação pendente</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Adicione um registro TXT no seu DNS:
                            </p>
                            <code className="text-xs bg-black/30 px-2 py-1 rounded block mt-1">
                              _cloaker.{domain.domain} = {domain.verification_token}
                            </code>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
