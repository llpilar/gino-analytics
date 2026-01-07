import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, TrendingUp, BarChart3, Shield, Zap, 
  Clock, MapPin, DollarSign, ArrowRight, Check,
  Smartphone, Bell, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import codfyLogo from "@/assets/codfy-logo.png";

const features = [
  {
    icon: TrendingUp,
    title: "Vendas em Tempo Real",
    description: "Acompanhe cada venda no momento em que acontece com atualização instantânea."
  },
  {
    icon: BarChart3,
    title: "Análises Detalhadas",
    description: "Métricas completas de conversão, ticket médio e performance por período."
  },
  {
    icon: MapPin,
    title: "Mapa de Vendas",
    description: "Visualize geograficamente de onde vêm suas vendas COD."
  },
  {
    icon: Shield,
    title: "Cloaker Integrado",
    description: "Proteja seus links de afiliado com nosso sistema anti-spy avançado."
  },
  {
    icon: Bell,
    title: "Notificações Push",
    description: "Receba alertas de novas vendas diretamente no seu dispositivo."
  },
  {
    icon: DollarSign,
    title: "Controle Financeiro",
    description: "Gerencie despesas, lucros e fluxo de caixa em um só lugar."
  }
];

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "<1s", label: "Atualização" },
  { value: "24/7", label: "Monitoramento" },
  { value: "100%", label: "Seguro" }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-chart-2/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={codfyLogo} alt="CODFY" className="w-10 h-10 rounded-lg" />
              <span className="font-bold text-xl text-foreground">CODFY</span>
            </div>
            <Link to="/auth">
              <Button variant="default" className="gap-2">
                Entrar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                <Package className="w-4 h-4" />
                Dashboard para Contra Entrega
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground leading-tight mb-6"
            >
              Controle Total do seu
              <span className="block bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
                Negócio COD
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              A plataforma definitiva para acompanhar vendas, analisar métricas e 
              escalar seu negócio de contra entrega com dados em tempo real.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/auth">
                <Button size="lg" className="gap-2 text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25">
                  Começar Agora
                  <Zap className="w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6 rounded-xl">
                Ver Demonstração
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-4 shadow-2xl shadow-black/20">
              <div className="aspect-video bg-gradient-to-br from-card to-background rounded-xl flex items-center justify-center border border-border/30">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-chart-2/20 flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-chart-2" />
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-chart-3/20 flex items-center justify-center">
                      <DollarSign className="w-8 h-8 text-chart-3" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">Preview do Dashboard</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 border-y border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-black text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
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
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas para monitorar, analisar e escalar seu negócio COD
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-20 lg:py-32 bg-card/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-6">
                Por que escolher o CODFY?
              </h2>
              <div className="space-y-4">
                {[
                  "Dados atualizados em tempo real",
                  "Interface intuitiva e moderna",
                  "Integração com Shopify e Facebook Ads",
                  "Cloaker anti-spy integrado",
                  "Notificações push de vendas",
                  "Relatórios detalhados de performance"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <Smartphone className="w-8 h-8 text-primary mb-4" />
                <h4 className="font-bold text-foreground mb-2">Mobile First</h4>
                <p className="text-sm text-muted-foreground">Acesse de qualquer dispositivo</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <Clock className="w-8 h-8 text-chart-2 mb-4" />
                <h4 className="font-bold text-foreground mb-2">Tempo Real</h4>
                <p className="text-sm text-muted-foreground">Dados atualizados instantaneamente</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <Users className="w-8 h-8 text-chart-3 mb-4" />
                <h4 className="font-bold text-foreground mb-2">Multi-usuário</h4>
                <p className="text-sm text-muted-foreground">Gerencie sua equipe</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <Shield className="w-8 h-8 text-chart-5 mb-4" />
                <h4 className="font-bold text-foreground mb-2">Seguro</h4>
                <p className="text-sm text-muted-foreground">Dados criptografados</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-6">
              Pronto para escalar seu negócio?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Junte-se a centenas de empreendedores que já estão usando o CODFY 
              para gerenciar suas vendas COD.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-lg px-10 py-6 rounded-xl shadow-lg shadow-primary/25">
                Criar Conta Grátis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-border/50 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={codfyLogo} alt="CODFY" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-foreground">CODFY</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 CODFY. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
