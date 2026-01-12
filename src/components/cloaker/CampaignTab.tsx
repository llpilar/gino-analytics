import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  TrendingUp, Shield, AlertTriangle, Users, Target, 
  ExternalLink, BarChart2, Activity
} from "lucide-react";
import { CloakedLink } from "@/hooks/useCloakedLinks";

interface CloakerVisitorLog {
  id: string;
  link_id: string;
  decision: string;
  score: number;
  is_bot: boolean | null;
  is_vpn: boolean | null;
  is_proxy: boolean | null;
  country_code: string | null;
  created_at: string;
}

interface CampaignTabProps {
  links: CloakedLink[];
  visitors: CloakerVisitorLog[];
}

interface CampaignStats {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  totalClicks: number;
  allowed: number;
  safe: number;
  blocked: number;
  allowRate: number;
  avgScore: number;
  botCount: number;
  vpnCount: number;
  topCountries: { code: string; count: number }[];
}

export function CampaignTab({ links, visitors }: CampaignTabProps) {
  const campaignStats = useMemo(() => {
    return links.map(link => {
      const linkVisitors = visitors.filter(v => v.link_id === link.id);
      const allowed = linkVisitors.filter(v => v.decision === "allow").length;
      const safe = linkVisitors.filter(v => v.decision === "safe").length;
      const blocked = linkVisitors.filter(v => v.decision === "block").length;
      const total = linkVisitors.length;
      
      // Calculate average score
      const avgScore = total > 0 
        ? Math.round(linkVisitors.reduce((acc, v) => acc + v.score, 0) / total)
        : 0;
      
      // Count bots and VPNs
      const botCount = linkVisitors.filter(v => v.is_bot).length;
      const vpnCount = linkVisitors.filter(v => v.is_vpn || v.is_proxy).length;
      
      // Top countries
      const countryCounts: Record<string, number> = {};
      linkVisitors.forEach(v => {
        if (v.country_code) {
          countryCounts[v.country_code] = (countryCounts[v.country_code] || 0) + 1;
        }
      });
      const topCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([code, count]) => ({ code, count }));
      
      return {
        id: link.id,
        name: link.name,
        slug: link.slug,
        isActive: link.is_active,
        totalClicks: total,
        allowed,
        safe,
        blocked,
        allowRate: total > 0 ? Math.round((allowed / total) * 100) : 0,
        avgScore,
        botCount,
        vpnCount,
        topCountries,
      } as CampaignStats;
    }).sort((a, b) => b.totalClicks - a.totalClicks);
  }, [links, visitors]);

  const totals = useMemo(() => {
    return campaignStats.reduce((acc, c) => ({
      clicks: acc.clicks + c.totalClicks,
      allowed: acc.allowed + c.allowed,
      safe: acc.safe + c.safe,
      blocked: acc.blocked + c.blocked,
      bots: acc.bots + c.botCount,
      vpns: acc.vpns + c.vpnCount,
    }), { clicks: 0, allowed: 0, safe: 0, blocked: 0, bots: 0, vpns: 0 });
  }, [campaignStats]);

  if (links.length === 0) {
    return (
      <Card className="p-12 text-center bg-card border-border">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Target className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Nenhuma campanha encontrada</h3>
        <p className="text-muted-foreground mt-1">Crie um link cloaked para começar a monitorar campanhas.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Campanhas</p>
              <p className="text-xl font-bold text-foreground">{links.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Cliques</p>
              <p className="text-xl font-bold text-foreground">{totals.clicks.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aprovados</p>
              <p className="text-xl font-bold text-emerald-500">{totals.allowed.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Safe Pages</p>
              <p className="text-xl font-bold text-yellow-500">{totals.safe.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bloqueados</p>
              <p className="text-xl font-bold text-red-500">{totals.blocked.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">VPN/Proxy</p>
              <p className="text-xl font-bold text-purple-500">{totals.vpns.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground font-medium">Campanha</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Cliques</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Aprovados</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Safe</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Bloqueados</TableHead>
                <TableHead className="text-muted-foreground font-medium">Taxa de Aprovação</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Score Médio</TableHead>
                <TableHead className="text-muted-foreground font-medium">Top Países</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignStats.map((campaign) => (
                <TableRow key={campaign.id} className="border-border hover:bg-muted/50">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{campaign.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">/{campaign.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={campaign.isActive 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" 
                        : "bg-muted text-muted-foreground"
                      }
                    >
                      {campaign.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {campaign.totalClicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-emerald-500 font-medium">{campaign.allowed.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-yellow-500 font-medium">{campaign.safe.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-red-500 font-medium">{campaign.blocked.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress 
                        value={campaign.allowRate} 
                        className="h-2 flex-1"
                      />
                      <span className="text-sm font-medium text-foreground w-10 text-right">
                        {campaign.allowRate}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={
                        campaign.avgScore >= 70 ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" :
                        campaign.avgScore >= 40 ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" :
                        "bg-red-500/20 text-red-500 border-red-500/30"
                      }
                    >
                      {campaign.avgScore}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {campaign.topCountries.length > 0 ? (
                        campaign.topCountries.map(({ code, count }) => (
                          <div key={code} className="flex items-center gap-1">
                            <img 
                              src={`https://flagcdn.com/16x12/${code.toLowerCase()}.png`}
                              width="16" 
                              height="12" 
                              alt={code}
                              className="rounded-[2px]"
                            />
                            <span className="text-xs text-muted-foreground">({count})</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
