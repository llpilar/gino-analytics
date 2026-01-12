import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { format, parseISO, startOfHour, subDays, eachHourOfInterval, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, PieChartIcon, TrendingUp, Globe, Smartphone, Clock } from "lucide-react";

interface CloakerVisitorLog {
  id: string;
  link_id: string;
  decision: string;
  score: number;
  is_bot: boolean | null;
  is_vpn: boolean | null;
  is_proxy: boolean | null;
  is_datacenter: boolean | null;
  is_tor: boolean | null;
  country_code: string | null;
  user_agent: string | null;
  created_at: string;
}

interface ChartsTabProps {
  visitors: CloakerVisitorLog[];
}

const COLORS = {
  allow: "#10b981",
  safe: "#eab308", 
  block: "#ef4444",
  primary: "#8b5cf6",
  secondary: "#06b6d4",
  tertiary: "#f97316",
};

const PIE_COLORS = ["#10b981", "#eab308", "#ef4444"];

export function ChartsTab({ visitors }: ChartsTabProps) {
  // Visits over time (last 24 hours by hour)
  const hourlyData = useMemo(() => {
    const now = new Date();
    const start = subDays(now, 1);
    const hours = eachHourOfInterval({ start, end: now });
    
    return hours.map(hour => {
      const hourEnd = new Date(hour);
      hourEnd.setHours(hourEnd.getHours() + 1);
      
      const hourVisitors = visitors.filter(v => {
        const date = parseISO(v.created_at);
        return date >= hour && date < hourEnd;
      });
      
      return {
        time: format(hour, "HH:mm"),
        total: hourVisitors.length,
        allowed: hourVisitors.filter(v => v.decision === "allow").length,
        safe: hourVisitors.filter(v => v.decision === "safe").length,
        blocked: hourVisitors.filter(v => v.decision === "block").length,
      };
    });
  }, [visitors]);

  // Daily data (last 7 days)
  const dailyData = useMemo(() => {
    const now = new Date();
    const start = subDays(now, 7);
    const days = eachDayOfInterval({ start, end: now });
    
    return days.map(day => {
      const dayEnd = new Date(day);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayVisitors = visitors.filter(v => {
        const date = parseISO(v.created_at);
        return date >= day && date < dayEnd;
      });
      
      return {
        day: format(day, "EEE", { locale: ptBR }),
        date: format(day, "dd/MM"),
        total: dayVisitors.length,
        allowed: dayVisitors.filter(v => v.decision === "allow").length,
        safe: dayVisitors.filter(v => v.decision === "safe").length,
        blocked: dayVisitors.filter(v => v.decision === "block").length,
      };
    });
  }, [visitors]);

  // Decision distribution
  const decisionData = useMemo(() => {
    const allowed = visitors.filter(v => v.decision === "allow").length;
    const safe = visitors.filter(v => v.decision === "safe").length;
    const blocked = visitors.filter(v => v.decision === "block").length;
    
    return [
      { name: "Aprovados", value: allowed, color: COLORS.allow },
      { name: "Safe Page", value: safe, color: COLORS.safe },
      { name: "Bloqueados", value: blocked, color: COLORS.block },
    ];
  }, [visitors]);

  // Country distribution (top 10)
  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    visitors.forEach(v => {
      if (v.country_code) {
        counts[v.country_code] = (counts[v.country_code] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({
        country,
        count,
      }));
  }, [visitors]);

  // Device distribution
  const deviceData = useMemo(() => {
    let mobile = 0, tablet = 0, desktop = 0;
    
    visitors.forEach(v => {
      const ua = v.user_agent?.toLowerCase() || "";
      if (/ipad|tablet|playbook|silk/i.test(ua)) tablet++;
      else if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) mobile++;
      else desktop++;
    });
    
    return [
      { name: "Desktop", value: desktop },
      { name: "Mobile", value: mobile },
      { name: "Tablet", value: tablet },
    ].filter(d => d.value > 0);
  }, [visitors]);

  // Threat distribution
  const threatData = useMemo(() => {
    return [
      { name: "Bots", value: visitors.filter(v => v.is_bot).length },
      { name: "VPN", value: visitors.filter(v => v.is_vpn).length },
      { name: "Proxy", value: visitors.filter(v => v.is_proxy).length },
      { name: "Datacenter", value: visitors.filter(v => v.is_datacenter).length },
      { name: "TOR", value: visitors.filter(v => v.is_tor).length },
    ].filter(d => d.value > 0);
  }, [visitors]);

  // Score distribution
  const scoreData = useMemo(() => {
    const ranges = [
      { range: "0-20", min: 0, max: 20, count: 0 },
      { range: "21-40", min: 21, max: 40, count: 0 },
      { range: "41-60", min: 41, max: 60, count: 0 },
      { range: "61-80", min: 61, max: 80, count: 0 },
      { range: "81-100", min: 81, max: 100, count: 0 },
    ];
    
    visitors.forEach(v => {
      const r = ranges.find(r => v.score >= r.min && v.score <= r.max);
      if (r) r.count++;
    });
    
    return ranges;
  }, [visitors]);

  if (visitors.length === 0) {
    return (
      <Card className="p-12 text-center bg-card border-border">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Nenhum dado para exibir</h3>
        <p className="text-muted-foreground mt-1">Aguardando visitantes para gerar gráficos.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Timeline and Decision Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Traffic */}
        <Card className="lg:col-span-2 p-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Tráfego por Hora (24h)</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.allow} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.allow} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.block} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.block} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area type="monotone" dataKey="allowed" stroke={COLORS.allow} fill="url(#colorAllowed)" name="Aprovados" />
              <Area type="monotone" dataKey="blocked" stroke={COLORS.block} fill="url(#colorBlocked)" name="Bloqueados" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Decision Pie Chart */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Distribuição de Decisões</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={decisionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {decisionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 2: Daily and Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Traffic */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Tráfego Diário (7 dias)</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="allowed" name="Aprovados" fill={COLORS.allow} radius={[4, 4, 0, 0]} />
              <Bar dataKey="safe" name="Safe" fill={COLORS.safe} radius={[4, 4, 0, 0]} />
              <Bar dataKey="blocked" name="Bloqueados" fill={COLORS.block} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Countries */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Top Países</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={countryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis 
                dataKey="country" 
                type="category" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                width={40}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" name="Visitas" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 3: Devices, Threats, Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Devices */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Dispositivos</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {deviceData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={[COLORS.primary, COLORS.secondary, COLORS.tertiary][index]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Threats Detected */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-foreground">Ameaças Detectadas</h3>
          </div>
          {threatData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={threatData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" name="Detecções" fill={COLORS.block} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nenhuma ameaça detectada
            </div>
          )}
        </Card>

        {/* Score Distribution */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Distribuição de Score</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" name="Visitantes" radius={[4, 4, 0, 0]}>
                {scoreData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.max <= 40 ? COLORS.block :
                      entry.max <= 60 ? COLORS.safe :
                      COLORS.allow
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
