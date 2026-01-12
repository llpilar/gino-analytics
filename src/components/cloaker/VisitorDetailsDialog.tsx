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
  User,
  Globe,
  Smartphone,
  Fingerprint,
  Shield,
  Clock,
  MapPin,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Cpu,
  Network
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
  is_bot: boolean | null;
  is_vpn: boolean | null;
  is_datacenter: boolean | null;
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
}

interface VisitorDetailsDialogProps {
  visitor: CloakerVisitor;
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
        <TabsTrigger value="elite">Scores Elite</TabsTrigger>
        <TabsTrigger value="device">Dispositivo</TabsTrigger>
        <TabsTrigger value="detection">Detecção</TabsTrigger>
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
                <div className="mt-2">
                  {visitor.decision === "allowed" ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aprovado
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

        {/* Flags */}
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
                  Bot Detectado
                </Badge>
              )}
              {visitor.is_vpn && (
                <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                  <Wifi className="w-3 h-3 mr-1" />
                  VPN Detectada
                </Badge>
              )}
              {visitor.is_datacenter && (
                <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                  <Monitor className="w-3 h-3 mr-1" />
                  Datacenter
                </Badge>
              )}
              {visitor.is_blacklisted && (
                <Badge variant="outline" className="text-red-400 border-red-400/30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Blacklisted
                </Badge>
              )}
              {!visitor.is_bot && !visitor.is_vpn && !visitor.is_datacenter && !visitor.is_blacklisted && (
                <Badge variant="outline" className="text-green-400 border-green-400/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Sem Flags
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
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

      {/* Device Tab */}
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
                <div className="text-xs text-muted-foreground">País</div>
                <div className="font-medium">{visitor.country_code || "N/A"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Cidade</div>
                <div className="font-medium">{visitor.city || "N/A"}</div>
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
          </CardContent>
        </Card>
      </TabsContent>

      {/* Detection Details Tab */}
      <TabsContent value="detection" className="space-y-4 mt-4">
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Detalhes da Detecção</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(detectionDetails).length > 0 ? (
              <pre className="font-mono text-xs bg-background p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(detectionDetails, null, 2)}
              </pre>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum detalhe de detecção disponível
              </div>
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
