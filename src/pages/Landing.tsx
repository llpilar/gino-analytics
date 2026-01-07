import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { 
  Package, TrendingUp, BarChart3, Shield, Zap, 
  Clock, MapPin, DollarSign, ArrowRight, Check,
  Smartphone, Bell, Users, Sparkles, ChevronDown,
  Activity, Eye, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import codfyLogo from "@/assets/codfy-logo.png";

const features = [
  {
    icon: TrendingUp,
    title: "Vendas em Tempo Real",
    description: "Acompanhe cada venda no momento em que acontece com atualização instantânea.",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    icon: BarChart3,
    title: "Análises Detalhadas",
    description: "Métricas completas de conversão, ticket médio e performance por período.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: MapPin,
    title: "Mapa de Vendas",
    description: "Visualize geograficamente de onde vêm suas vendas COD.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Shield,
    title: "Cloaker Integrado",
    description: "Proteja seus links de afiliado com nosso sistema anti-spy avançado.",
    gradient: "from-orange-500 to-red-500"
  },
  {
    icon: Bell,
    title: "Notificações Push",
    description: "Receba alertas de novas vendas diretamente no seu dispositivo.",
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    icon: DollarSign,
    title: "Controle Financeiro",
    description: "Gerencie despesas, lucros e fluxo de caixa em um só lugar.",
    gradient: "from-green-500 to-emerald-500"
  }
];

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

      {/* Hero Section */}
      <section className="relative z-10 py-16 sm:py-24 lg:py-32 overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-chart-2/20 border border-primary/30 text-primary text-sm font-semibold mb-8 backdrop-blur-sm"
                animate={{ boxShadow: ["0 0 20px rgba(var(--primary), 0.2)", "0 0 40px rgba(var(--primary), 0.4)", "0 0 20px rgba(var(--primary), 0.2)"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Package className="w-4 h-4" />
                <span>Dashboard Profissional para COD</span>
                <Sparkles className="w-4 h-4" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.1] mb-8"
            >
              <span className="text-foreground">Controle </span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-5 bg-clip-text text-transparent">
                  Total
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary to-chart-2 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                />
              </span>
              <br />
              <span className="text-foreground">do seu </span>
              <span className="relative">
                <span className="bg-gradient-to-r from-chart-2 via-primary to-chart-5 bg-clip-text text-transparent">
                  Negócio COD
                </span>
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              A plataforma definitiva para acompanhar vendas, analisar métricas e 
              <span className="text-foreground font-medium"> escalar seu negócio</span> de contra entrega com 
              <span className="text-primary font-medium"> dados em tempo real</span>.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
            >
              <Link to="/auth">
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }} 
                  whileTap={{ scale: 0.98 }}
                >
                  <Button size="lg" className="gap-3 text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-2xl shadow-2xl shadow-primary/30 bg-gradient-to-r from-primary via-primary to-chart-2 hover:opacity-90 transition-opacity">
                    <Zap className="w-5 h-5" />
                    Começar Agora — Grátis
                  </Button>
                </motion.div>
              </Link>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" variant="outline" className="gap-3 text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-2xl border-2 hover:bg-muted/50">
                  <Eye className="w-5 h-5" />
                  Ver Demonstração
                </Button>
              </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-16 flex flex-col items-center gap-2"
            >
              <span className="text-sm text-muted-foreground">Descubra mais</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronDown className="w-6 h-6 text-muted-foreground" />
              </motion.div>
            </motion.div>
          </div>
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

      {/* Features Section */}
      <section className="relative z-10 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16 lg:mb-20"
          >
            <motion.span 
              className="inline-block text-primary font-semibold text-sm uppercase tracking-widest mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Recursos
            </motion.span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-6">
              Tudo que você precisa em
              <span className="block bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                um só lugar
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas para monitorar, analisar e escalar seu negócio COD
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 hover:border-primary/40 backdrop-blur-xl transition-all duration-500 overflow-hidden"
              >
                {/* Hover Glow */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                />
                
                {/* Icon */}
                <motion.div 
                  className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-6`}
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-full h-full rounded-2xl bg-background/90 flex items-center justify-center">
                    <feature.icon className="w-7 h-7 text-foreground" />
                  </div>
                </motion.div>
                
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Arrow indicator */}
                <motion.div
                  className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ x: -10 }}
                  whileHover={{ x: 0 }}
                >
                  <ArrowRight className="w-5 h-5 text-primary" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
                <span className="block bg-gradient-to-r from-primary to-chart-5 bg-clip-text text-transparent">
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
                <span className="block bg-gradient-to-r from-primary via-chart-2 to-chart-5 bg-clip-text text-transparent">
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
