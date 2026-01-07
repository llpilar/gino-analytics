import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { 
  Package, TrendingUp, BarChart3, Shield, Zap, 
  Clock, MapPin, DollarSign, ArrowRight, Check,
  Smartphone, Bell, Users, Sparkles, ChevronDown,
  Activity, Eye, Target, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { AnimatedHero } from "@/components/ui/animated-hero";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import codfyLogo from "@/assets/codfy-logo.png";

const stats = [
  { value: "99.9%", label: "Uptime", icon: Activity },
  { value: "<1s", label: "Atualização", icon: Zap },
  { value: "24/7", label: "Monitoramento", icon: Eye },
  { value: "100%", label: "Seguro", icon: Shield }
];

const FloatingParticle = ({ delay, duration, x, y, size }: { delay: number; duration: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{ width: size, height: size, left: x, top: y }}
    animate={{
      y: [0, -30, 0],
      opacity: [0.2, 0.5, 0.2],
      scale: [1, 1.2, 1]
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

const GlowOrb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full blur-[100px] ${className}`}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3]
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

// Animated Dashboard Demo Component with Scroll Animation
const DemoSection = () => {
  const [activeMetric, setActiveMetric] = useState(0);
  const [salesCount, setSalesCount] = useState(127);
  const [revenue, setRevenue] = useState(15847.50);
  
  // Animate metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMetric((prev) => (prev + 1) % 4);
      setSalesCount((prev) => prev + Math.floor(Math.random() * 3));
      setRevenue((prev) => prev + Math.random() * 150);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const demoMetrics = [
    { label: "Vendas Hoje", value: salesCount, prefix: "", suffix: "", color: "from-emerald-500 to-teal-500" },
    { label: "Faturamento", value: revenue.toFixed(2), prefix: "R$ ", suffix: "", color: "from-blue-500 to-cyan-500" },
    { label: "Ticket Médio", value: (revenue / salesCount).toFixed(2), prefix: "R$ ", suffix: "", color: "from-purple-500 to-pink-500" },
    { label: "Conversão", value: "4.8", prefix: "", suffix: "%", color: "from-orange-500 to-amber-500" }
  ];

  return (
    <section className="relative z-10 overflow-hidden bg-gradient-to-b from-transparent via-card/20 to-transparent">
      <ContainerScroll
        titleComponent={
          <div className="text-center mb-8">
            <motion.span 
              className="inline-block text-primary font-semibold text-sm uppercase tracking-widest mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Demonstração Interativa
            </motion.span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-foreground mb-4">
              Veja o poder do
              <span className="block text-primary">
                Dashboard em Ação
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Role para baixo e veja a interface que vai transformar seu negócio
            </p>
          </div>
        }
      >
        {/* Dashboard Content Inside the 3D Card */}
        <div className="h-full w-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-4 sm:p-6 lg:p-8 overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={codfyLogo} alt="CODFY" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-white">Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-500"
              />
              <span className="text-xs text-zinc-400">Ao vivo</span>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-primary ml-2"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {demoMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                animate={{
                  scale: activeMetric === index ? 1.02 : 1,
                  borderColor: activeMetric === index ? "hsl(var(--primary))" : "rgba(255,255,255,0.1)"
                }}
                className="relative p-4 sm:p-5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 overflow-hidden group"
              >
                {/* Active indicator */}
                {activeMetric === index && (
                  <motion.div
                    layoutId="activeMetricDemo"
                    className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <p className="text-xs sm:text-sm text-zinc-400 mb-1">{metric.label}</p>
                <motion.p 
                  key={metric.value}
                  initial={{ opacity: 0.5, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-white"
                >
                  {metric.prefix}{metric.value}{metric.suffix}
                </motion.p>
                <motion.div
                  className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${metric.color}`}
                  animate={{ width: activeMetric === index ? "100%" : "30%" }}
                  transition={{ duration: 0.5 }}
                />
              </motion.div>
            ))}
          </div>

          {/* Chart Area */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Main Chart */}
            <div className="lg:col-span-2 p-4 sm:p-6 rounded-xl bg-zinc-800/60 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white">Vendas por Hora</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs text-zinc-400">Hoje</span>
                </div>
              </div>
              {/* Animated Chart Bars */}
              <div className="flex items-end justify-between h-24 sm:h-32 gap-1 sm:gap-2">
                {[65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88, 72].map((height, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-primary/80 to-primary/40 rounded-t-sm"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    viewport={{ once: true }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-zinc-500">
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
              </div>
            </div>

            {/* Side Stats */}
            <div className="space-y-4">
              {/* Recent Sale Animation */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center"
                  >
                    <Bell className="w-5 h-5 text-green-500" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-white">Nova Venda!</p>
                    <p className="text-xs text-zinc-400">São Paulo • R$ 297,00</p>
                  </div>
                </div>
              </motion.div>

              {/* Map Preview */}
              <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/50">
                <p className="text-sm font-medium text-white mb-3">Mapa de Vendas</p>
                <div className="relative h-20 rounded-lg bg-zinc-900/50 overflow-hidden">
                  {[
                    { x: "20%", y: "30%" },
                    { x: "45%", y: "50%" },
                    { x: "70%", y: "40%" },
                    { x: "55%", y: "70%" },
                    { x: "30%", y: "60%" }
                  ].map((pos, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2"
                      style={{ left: pos.x, top: pos.y }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                    >
                      <div className="w-full h-full rounded-full bg-primary" />
                      <div className="absolute inset-0 rounded-full bg-primary/50 animate-ping" />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Stat */}
              <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Taxa de Aprovação</span>
                  <span className="text-lg font-bold text-green-500">92%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-zinc-700 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: "92%" }}
                    transition={{ duration: 1, delay: 0.3 }}
                    viewport={{ once: true }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContainerScroll>

      {/* Feature Tags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
        className="flex flex-wrap items-center justify-center gap-3 -mt-32 pb-20 relative z-20"
      >
        {["Tempo Real", "Dados Seguros", "Multi-dispositivo", "Fácil de Usar"].map((tag, i) => (
          <motion.span
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
            viewport={{ once: true }}
            className="px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm"
          >
            {tag}
          </motion.span>
        ))}
      </motion.div>
    </section>
  );
};

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orbs */}
        <GlowOrb className="w-[800px] h-[800px] -top-[400px] -left-[200px] bg-primary/20" />
        <GlowOrb className="w-[600px] h-[600px] top-1/4 right-0 bg-chart-2/20" delay={2} />
        <GlowOrb className="w-[500px] h-[500px] bottom-0 left-1/3 bg-chart-5/15" delay={4} />
        
        {/* Floating Particles */}
        <FloatingParticle delay={0} duration={6} x="10%" y="20%" size={8} />
        <FloatingParticle delay={1} duration={8} x="80%" y="30%" size={6} />
        <FloatingParticle delay={2} duration={7} x="30%" y="60%" size={10} />
        <FloatingParticle delay={3} duration={9} x="70%" y="70%" size={8} />
        <FloatingParticle delay={4} duration={6} x="50%" y="40%" size={6} />
        <FloatingParticle delay={5} duration={8} x="20%" y="80%" size={12} />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px"
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-50 border-b border-border/30 backdrop-blur-2xl bg-background/60 sticky top-0"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <img src={codfyLogo} alt="CODFY" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
                <motion.div
                  className="absolute inset-0 rounded-xl bg-primary/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span className="font-black text-xl sm:text-2xl bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                CODFY
              </span>
            </motion.div>
            <Link to="/auth">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="gap-2 rounded-full px-6 shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/80">
                  <span className="hidden sm:inline">Acessar Dashboard</span>
                  <span className="sm:hidden">Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with Animated Titles */}
      <section className="relative z-10 overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <AnimatedHero
            badge="Dashboard Profissional para COD"
            badgeIcon={<><Package className="w-4 h-4" /><Sparkles className="w-4 h-4" /></>}
            titles={["Total", "Completo", "Inteligente", "Profissional", "Automatizado"]}
            staticTitle="Controle"
            staticTitleAfter="do seu Negócio COD"
            description="A plataforma definitiva para acompanhar vendas, analisar métricas e escalar seu negócio de contra entrega com dados em tempo real."
            primaryCta={{
              text: "Começar Agora — Grátis",
              href: "/auth",
              icon: <Zap className="w-5 h-5" />
            }}
            secondaryCta={{
              text: "Ver Demonstração",
              href: "#demo",
              icon: <Eye className="w-5 h-5" />
            }}
          />
          
          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex flex-col items-center gap-2 pb-8"
          >
            <span className="text-sm text-muted-foreground">Descubra mais</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-card/50 to-card/30 backdrop-blur-xl p-8 sm:p-12 overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-chart-2/5" />
            
            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center group"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4 group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow"
                  >
                    <stat.icon className="w-7 h-7 text-primary" />
                  </motion.div>
                  <motion.div 
                    className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-sm sm:text-base text-muted-foreground font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <DemoSection />

      {/* Features Section - New Grid */}
      <FeaturesGrid />

      {/* Benefits Section */}
      <section className="relative z-10 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-primary font-semibold text-sm uppercase tracking-widest mb-4">
                Por que escolher
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-8">
                O CODFY é diferente de
                <span className="block text-primary">
                  qualquer outro
                </span>
              </h2>
              <div className="space-y-5">
                {[
                  "Dados atualizados em tempo real",
                  "Interface intuitiva e moderna",
                  "Integração com Shopify e Facebook Ads",
                  "Cloaker anti-spy integrado",
                  "Notificações push de vendas",
                  "Relatórios detalhados de performance"
                ].map((benefit, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center gap-4 group"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <motion.div 
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Check className="w-4 h-4 text-primary" />
                    </motion.div>
                    <span className="text-foreground text-lg group-hover:text-primary transition-colors">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4 sm:gap-6"
            >
              {[
                { icon: Smartphone, title: "Mobile First", desc: "Acesse de qualquer dispositivo", gradient: "from-blue-500 to-cyan-500" },
                { icon: Clock, title: "Tempo Real", desc: "Dados atualizados instantaneamente", gradient: "from-green-500 to-emerald-500" },
                { icon: Users, title: "Multi-usuário", desc: "Gerencie sua equipe", gradient: "from-purple-500 to-pink-500" },
                { icon: Target, title: "Precisão", desc: "Métricas 100% confiáveis", gradient: "from-orange-500 to-red-500" }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, scale: 1.03 }}
                  className="p-6 rounded-2xl bg-card/80 border border-border/50 hover:border-primary/30 backdrop-blur-xl transition-all duration-300 group"
                >
                  <motion.div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} p-0.5 mb-4`}
                    whileHover={{ rotate: 10 }}
                  >
                    <div className="w-full h-full rounded-xl bg-background/90 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-foreground" />
                    </div>
                  </motion.div>
                  <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative text-center p-8 sm:p-12 lg:p-16 rounded-[2.5rem] overflow-hidden"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-chart-2/20 border border-border/50 rounded-[2.5rem]" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/10 to-chart-2/10"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-10 -right-10 w-40 h-40 border border-primary/20 rounded-full"
              />
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-foreground mb-6">
                Pronto para
                <span className="block text-primary">
                  escalar seu negócio?
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Junte-se a centenas de empreendedores que já estão usando o CODFY 
                para gerenciar suas vendas COD.
              </p>
              <Link to="/auth">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block"
                >
                  <Button size="lg" className="gap-3 text-lg sm:text-xl px-10 sm:px-14 py-7 sm:py-8 rounded-2xl shadow-2xl shadow-primary/30 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 font-bold">
                    Criar Conta Grátis
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ArrowRight className="w-6 h-6" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
              
              <p className="mt-6 text-sm text-muted-foreground">
                Sem cartão de crédito • Setup em 2 minutos
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 sm:py-12 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <img src={codfyLogo} alt="CODFY" className="w-10 h-10 rounded-xl" />
              <span className="font-bold text-xl text-foreground">CODFY</span>
            </motion.div>
            <p className="text-sm text-muted-foreground text-center sm:text-right">
              © 2024 CODFY. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
