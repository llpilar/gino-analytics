import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Monitor, 
  Wifi, 
  Mouse, 
  Keyboard, 
  Video, 
  Bot, 
  Globe,
  Smartphone,
  Fingerprint,
  Shield,
  Clock,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Network,
  ShieldAlert,
  Ban,
  Eye,
  Zap,
  Database,
  Radio
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EliteScoreCard } from "./EliteScoreCard";
import { ScoreBreakdown } from "./ScoreBreakdown";

interface CloakerVisitor {
  id: string;
  created_at: string;
  decision: string;
  score: number;
  fingerprint_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  country_code: string | null;
  city: string | null;
  isp: string | null;
  asn: string | null;
  is_bot: boolean | null;
  is_vpn: boolean | null;
  is_proxy: boolean | null;
  is_tor: boolean | null;
  is_datacenter: boolean | null;
  is_headless: boolean | null;
  is_automated: boolean | null;
  is_blacklisted: boolean | null;
  redirect_url: string | null;
  referer: string | null;
  platform: string | null;
  language: string | null;
  screen_resolution: string | null;
  score_device_consistency: number | null;
  score_webrtc: number | null;
  score_mouse_pattern: number | null;
  score_keyboard: number | null;
  score_session_replay: number | null;
  score_automation: number | null;
  score_behavior: number | null;
  score_fingerprint: number | null;
  score_network: number | null;
  detection_details: Record<string, unknown> | null;
  webrtc_local_ip: string | null;
  webrtc_public_ip: string | null;
  processing_time_ms: number | null;
  has_webdriver: boolean | null;
  has_selenium: boolean | null;
  has_puppeteer: boolean | null;
  has_phantom: boolean | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

interface VisitorDetailsDialogProps {
  visitor: CloakerVisitor;
}

// Motivos de bloqueio com explicações detalhadas
interface BlockReason {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  icon: React.ElementType;
  details?: string;
}

function getBlockReasons(visitor: CloakerVisitor): BlockReason[] {
  const reasons: BlockReason[] = [];
  
  // Score baixo
  if (visitor.score < 50) {
    reasons.push({
      id: "low_score",
      title: "Score de Confiança Baixo",
      description: `Score ${visitor.score}/100 está abaixo do limite mínimo de segurança`,
      severity: "critical",
      icon: ShieldAlert,
      details: "O visitante falhou em múltiplas verificações de autenticidade, resultando em um score geral abaixo do aceitável."
    });
  }

  // Bot detectado
  if (visitor.is_bot) {
    reasons.push({
      id: "bot",
      title: "Bot Detectado",
      description: "Padrões de comportamento automatizado identificados",
      severity: "critical",
      icon: Bot,
      details: "O user-agent, padrões de navegação ou características do navegador indicam que este visitante é um bot automatizado."
    });
  }

  // Headless browser
  if (visitor.is_headless) {
    reasons.push({
      id: "headless",
      title: "Navegador Headless",
      description: "Chrome Headless, PhantomJS ou navegador sem interface gráfica",
      severity: "critical",
      icon: Monitor,
      details: "Navegadores headless são frequentemente usados por crawlers, scrapers e ferramentas de automação."
    });
  }

  // WebDriver / Selenium / Puppeteer
  if (visitor.has_webdriver || visitor.has_selenium || visitor.has_puppeteer || visitor.has_phantom) {
    const tools = [];
    if (visitor.has_webdriver) tools.push("WebDriver");
    if (visitor.has_selenium) tools.push("Selenium");
    if (visitor.has_puppeteer) tools.push("Puppeteer");
    if (visitor.has_phantom) tools.push("PhantomJS");
    
    reasons.push({
      id: "automation_tools",
      title: "Ferramentas de Automação",
      description: `Detectado: ${tools.join(", ")}`,
      severity: "critical",
      icon: Zap,
      details: "Estas ferramentas são usadas para automatizar navegadores e simular usuários reais, geralmente para scraping ou testes automatizados."
    });
  }

  // Automação detectada
  if (visitor.is_automated) {
    reasons.push({
      id: "automated",
      title: "Comportamento Automatizado",
      description: "Padrões de interação não-humanos detectados",
      severity: "high",
      icon: Activity,
      details: "Movimentos do mouse, cliques ou scroll apresentam padrões mecânicos inconsistentes com comportamento humano."
    });
  }

  // VPN detectada
  if (visitor.is_vpn) {
    reasons.push({
      id: "vpn",
      title: "VPN Detectada",
      description: "Conexão através de rede virtual privada",
      severity: "medium",
      icon: Wifi,
      details: "O IP do visitante pertence a um provedor de VPN conhecido. VPNs podem ser usadas para mascarar localização real."
    });
  }

  // Proxy detectado
  if (visitor.is_proxy) {
    reasons.push({
      id: "proxy",
      title: "Proxy Detectado",
      description: "Conexão através de servidor proxy",
      severity: "medium",
      icon: Server,
      details: "O visitante está usando um servidor proxy para intermediar a conexão, ocultando seu IP real."
    });
  }

  // TOR detectado
  if (visitor.is_tor) {
    reasons.push({
      id: "tor",
      title: "Rede TOR Detectada",
      description: "Conexão através da rede de anonimato TOR",
      severity: "high",
      icon: Radio,
      details: "O IP pertence a um nó de saída da rede TOR, frequentemente usada para anonimato extremo."
    });
  }

  // Datacenter
  if (visitor.is_datacenter) {
    reasons.push({
      id: "datacenter",
      title: "IP de Datacenter",
      description: "Conexão originada de infraestrutura de servidores",
      severity: "high",
      icon: Database,
      details: `ISP: ${visitor.isp || "Desconhecido"}. IPs de datacenter geralmente indicam bots, scrapers ou servidores automatizados.`
    });
  }

  // Blacklisted
  if (visitor.is_blacklisted) {
    reasons.push({
      id: "blacklisted",
      title: "IP na Blacklist",
      description: "Este IP foi bloqueado anteriormente",
      severity: "critical",
      icon: Ban,
      details: "O IP ou fingerprint deste visitante está na lista negra devido a comportamento suspeito anterior."
    });
  }

  // WebRTC leak (VPN bypass)
  if (visitor.webrtc_local_ip && visitor.webrtc_public_ip && visitor.ip_address) {
    if (visitor.webrtc_public_ip !== visitor.ip_address) {
      reasons.push({
        id: "webrtc_leak",
        title: "Vazamento WebRTC",
        description: `IP Real diferente do IP reportado`,
        severity: "high",
        icon: Network,
        details: `IP WebRTC: ${visitor.webrtc_public_ip}, IP Reportado: ${visitor.ip_address}. Indica uso de VPN/proxy com vazamento.`
      });
    }
  }

  // Scores baixos específicos
  if (visitor.score_device_consistency !== null && visitor.score_device_consistency < 50) {
    reasons.push({
      id: "device_inconsistency",
      title: "Inconsistência de Dispositivo",
      description: "Características do dispositivo são contraditórias",
      severity: "medium",
      icon: Smartphone,
      details: `Score: ${visitor.score_device_consistency}/100. O user-agent, resolução de tela, idioma ou outras características não correspondem entre si.`
    });
  }

  if (visitor.score_behavior !== null && visitor.score_behavior < 40) {
    reasons.push({
      id: "suspicious_behavior",
      title: "Comportamento Suspeito",
      description: "Padrões de interação anormais",
      severity: "medium",
      icon: Eye,
      details: `Score: ${visitor.score_behavior}/100. Tempo na página, movimentos do mouse ou eventos de scroll são anormais.`
    });
  }

  if (visitor.score_fingerprint !== null && visitor.score_fingerprint < 40) {
    reasons.push({
      id: "fingerprint_suspicious",
      title: "Fingerprint Suspeito",
      description: "Assinatura digital do navegador é incomum",
      severity: "medium",
      icon: Fingerprint,
      details: `Score: ${visitor.score_fingerprint}/100. Canvas, WebGL, fonts ou outros identificadores apresentam anomalias.`
    });
  }

  if (visitor.score_network !== null && visitor.score_network < 40) {
    reasons.push({
      id: "network_suspicious",
      title: "Rede Suspeita",
      description: "Características de rede indicam alto risco",
      severity: "medium",
      icon: Globe,
      details: `Score: ${visitor.score_network}/100. ISP, ASN ou geolocalização apresentam padrões de alto risco.`
    });
  }

  // Se bloqueado mas sem motivos específicos, adicionar genérico
  if (reasons.length === 0 && visitor.decision === "block") {
    reasons.push({
      id: "general",
      title: "Política de Segurança",
      description: "Visitante não passou nas verificações de segurança",
      severity: "medium",
      icon: Shield,
      details: "O visitante foi bloqueado com base na combinação de múltiplos fatores de risco que, individualmente, não são críticos."
    });
  }

  return reasons.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function getSeverityColor(severity: BlockReason["severity"]) {
  switch (severity) {
    case "critical": return "text-red-500 bg-red-500/10 border-red-500/30";
    case "high": return "text-orange-500 bg-orange-500/10 border-orange-500/30";
    case "medium": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
    case "low": return "text-blue-500 bg-blue-500/10 border-blue-500/30";
  }
}

function getSeverityLabel(severity: BlockReason["severity"]) {
  switch (severity) {
    case "critical": return "Crítico";
    case "high": return "Alto";
    case "medium": return "Médio";
    case "low": return "Baixo";
  }
}

export function VisitorDetailsDialog({ visitor }: VisitorDetailsDialogProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/20 border-green-500/30";
    if (score >= 50) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  const blockReasons = getBlockReasons(visitor);
  const isBlocked = visitor.decision === "block" || visitor.decision === "safe";

  const eliteScores = [
    { title: "Device Consistency", score: visitor.score_device_consistency, icon: Monitor, description: "Validação de hardware/software" },
    { title: "WebRTC Leak", score: visitor.score_webrtc, icon: Network, description: "Detecção de VPN/Proxy via WebRTC" },
    { title: "Mouse Pattern", score: visitor.score_mouse_pattern, icon: Mouse, description: "Padrões de movimento do mouse" },
    { title: "Keyboard Dynamics", score: visitor.score_keyboard, icon: Keyboard, description: "Análise de digitação" },
    { title: "Session Replay", score: visitor.score_session_replay, icon: Video, description: "Detecção de gravadores" },
    { title: "Automation", score: visitor.score_automation, icon: Bot, description: "Detecção de automação" },
    { title: "Behavior", score: visitor.score_behavior, icon: Activity, description: "Análise comportamental" },
    { title: "Fingerprint", score: visitor.score_fingerprint, icon: Fingerprint, description: "Consistência de fingerprint" },
    { title: "Network", score: visitor.score_network, icon: Wifi, description: "Análise de rede" },
  ];

  const detectionDetails = visitor.detection_details || {};

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="reasons" className="relative">
          Motivos
          {blockReasons.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center text-white">
              {blockReasons.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="elite">Scores</TabsTrigger>
        <TabsTrigger value="device">Detalhes</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4 mt-4">
        {/* Main Score Card */}
        <Card className={`border ${getScoreBg(visitor.score)}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Score Final</div>
                <div className={`text-5xl font-bold ${getScoreColor(visitor.score)}`}>
                  {visitor.score}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {visitor.decision === "allow" ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aprovado → Offer Page
                    </Badge>
                  ) : visitor.decision === "safe" ? (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Shield className="w-3 h-3 mr-1" />
                      Redirecionado → Safe Page
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      <XCircle className="w-3 h-3 mr-1" />
                      Bloqueado
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {format(new Date(visitor.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </div>
                {visitor.processing_time_ms && (
                  <div className="text-xs text-muted-foreground">
                    Processado em {visitor.processing_time_ms}ms
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Summary for blocked visitors */}
        {isBlocked && blockReasons.length > 0 && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                Resumo do Bloqueio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Este visitante foi bloqueado por {blockReasons.length} motivo{blockReasons.length > 1 ? "s" : ""}:
              </p>
              <div className="flex flex-wrap gap-2">
                {blockReasons.slice(0, 4).map((reason) => (
                  <Badge 
                    key={reason.id}
                    variant="outline" 
                    className={getSeverityColor(reason.severity)}
                  >
                    <reason.icon className="w-3 h-3 mr-1" />
                    {reason.title}
                  </Badge>
                ))}
                {blockReasons.length > 4 && (
                  <Badge variant="outline" className="text-muted-foreground">
                    +{blockReasons.length - 4} mais
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Globe className="w-4 h-4" />
                Localização
              </div>
              <div className="font-medium">
                {visitor.city || "?"}, {visitor.country_code || "??"}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Server className="w-4 h-4" />
                ISP
              </div>
              <div className="font-medium truncate">
                {visitor.isp || "Desconhecido"}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Network className="w-4 h-4" />
                IP
              </div>
              <div className="font-mono text-sm">
                {visitor.ip_address || "N/A"}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Smartphone className="w-4 h-4" />
                Plataforma
              </div>
              <div className="font-medium">
                {visitor.platform || "Desconhecida"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Flags */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Flags de Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {visitor.is_bot && (
                <Badge variant="outline" className="text-orange-400 border-orange-400/30">
                  <Bot className="w-3 h-3 mr-1" />
                  Bot
                </Badge>
              )}
              {visitor.is_headless && (
                <Badge variant="outline" className="text-red-400 border-red-400/30">
                  <Monitor className="w-3 h-3 mr-1" />
                  Headless
                </Badge>
              )}
              {visitor.is_vpn && (
                <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                  <Wifi className="w-3 h-3 mr-1" />
                  VPN
                </Badge>
              )}
              {visitor.is_proxy && (
                <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                  <Server className="w-3 h-3 mr-1" />
                  Proxy
                </Badge>
              )}
              {visitor.is_tor && (
                <Badge variant="outline" className="text-red-400 border-red-400/30">
                  <Radio className="w-3 h-3 mr-1" />
                  TOR
                </Badge>
              )}
              {visitor.is_datacenter && (
                <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                  <Database className="w-3 h-3 mr-1" />
                  Datacenter
                </Badge>
              )}
              {visitor.is_automated && (
                <Badge variant="outline" className="text-orange-400 border-orange-400/30">
                  <Zap className="w-3 h-3 mr-1" />
                  Automação
                </Badge>
              )}
              {visitor.is_blacklisted && (
                <Badge variant="outline" className="text-red-400 border-red-400/30">
                  <Ban className="w-3 h-3 mr-1" />
                  Blacklisted
                </Badge>
              )}
              {(visitor.has_selenium || visitor.has_puppeteer || visitor.has_webdriver || visitor.has_phantom) && (
                <Badge variant="outline" className="text-red-400 border-red-400/30">
                  <Zap className="w-3 h-3 mr-1" />
                  Automation Tools
                </Badge>
              )}
              {!visitor.is_bot && !visitor.is_vpn && !visitor.is_datacenter && !visitor.is_blacklisted && 
               !visitor.is_headless && !visitor.is_proxy && !visitor.is_tor && !visitor.is_automated && (
                <Badge variant="outline" className="text-green-400 border-green-400/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Sem Flags
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Block Reasons Tab - NEW */}
      <TabsContent value="reasons" className="space-y-4 mt-4">
        {blockReasons.length > 0 ? (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              Análise detalhada dos motivos que levaram ao bloqueio deste visitante.
            </div>
            {blockReasons.map((reason, index) => (
              <Card key={reason.id} className={`border ${getSeverityColor(reason.severity)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getSeverityColor(reason.severity).replace("text-", "bg-").replace("500", "500/20")}`}>
                      <reason.icon className={`h-5 w-5 ${getSeverityColor(reason.severity).split(" ")[0]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{reason.title}</span>
                        <Badge variant="outline" className={`text-xs ${getSeverityColor(reason.severity)}`}>
                          {getSeverityLabel(reason.severity)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {reason.description}
                      </p>
                      {reason.details && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border">
                          💡 {reason.details}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-foreground mb-2">Visitante Aprovado</h3>
              <p className="text-sm text-muted-foreground">
                Nenhum motivo de bloqueio identificado. Este visitante passou em todas as verificações de segurança.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Detection Details Summary */}
        {Object.keys(detectionDetails).length > 0 && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dados Técnicos da Detecção</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="font-mono text-xs bg-background p-4 rounded overflow-auto max-h-48">
                {JSON.stringify(detectionDetails, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Elite Scores Tab */}
      <TabsContent value="elite" className="space-y-4 mt-4">
        <ScoreBreakdown visitor={visitor} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eliteScores.map((item) => (
            <EliteScoreCard 
              key={item.title}
              title={item.title}
              score={item.score}
              icon={item.icon}
              description={item.description}
            />
          ))}
        </div>
      </TabsContent>

      {/* Device & Network Tab (Combined) */}
      <TabsContent value="device" className="space-y-4 mt-4">
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Informações do Dispositivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Plataforma</div>
                <div className="font-medium">{visitor.platform || "N/A"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Idioma</div>
                <div className="font-medium">{visitor.language || "N/A"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Resolução</div>
                <div className="font-medium">{visitor.screen_resolution || "N/A"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Fingerprint</div>
                <div className="font-mono text-xs">{visitor.fingerprint_hash?.slice(0, 16)}...</div>
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground mb-1">User Agent</div>
              <div className="font-mono text-xs bg-background p-2 rounded break-all">
                {visitor.user_agent || "N/A"}
              </div>
            </div>
            {(visitor.webrtc_local_ip || visitor.webrtc_public_ip) && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">WebRTC Local IP</div>
                    <div className="font-mono text-sm">{visitor.webrtc_local_ip || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">WebRTC Public IP</div>
                    <div className="font-mono text-sm">{visitor.webrtc_public_ip || "N/A"}</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Informações de Rede</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">IP</div>
                <div className="font-mono text-sm">{visitor.ip_address || "N/A"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">ISP</div>
                <div className="font-medium">{visitor.isp || "N/A"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">ASN</div>
                <div className="font-medium">{visitor.asn || "N/A"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">País/Cidade</div>
                <div className="font-medium">{visitor.city || "?"}, {visitor.country_code || "??"}</div>
              </div>
            </div>
            {visitor.referer && (
              <>
                <Separator />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Referer</div>
                  <div className="font-mono text-xs bg-background p-2 rounded break-all">
                    {visitor.referer}
                  </div>
                </div>
              </>
            )}
            {(visitor.utm_source || visitor.utm_medium || visitor.utm_campaign) && (
              <>
                <Separator />
                <div>
                  <div className="text-xs text-muted-foreground mb-2">UTM Parameters</div>
                  <div className="flex flex-wrap gap-2">
                    {visitor.utm_source && (
                      <Badge variant="outline">source: {visitor.utm_source}</Badge>
                    )}
                    {visitor.utm_medium && (
                      <Badge variant="outline">medium: {visitor.utm_medium}</Badge>
                    )}
                    {visitor.utm_campaign && (
                      <Badge variant="outline">campaign: {visitor.utm_campaign}</Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {visitor.redirect_url && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Redirecionamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-xs bg-background p-2 rounded break-all">
                {visitor.redirect_url}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
