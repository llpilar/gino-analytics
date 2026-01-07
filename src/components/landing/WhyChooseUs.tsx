import React from "react";
import { motion } from "framer-motion";
import { 
  Zap, Smartphone, Clock, Users, Target, Check,
  TrendingUp, Shield, BarChart3, Bell, ShoppingBag, Facebook
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const WhyChooseUs = () => {
  const benefits = [
    { icon: Zap, text: "Dados atualizados em tempo real" },
    { icon: BarChart3, text: "Interface intuitiva e moderna" },
    { icon: ShoppingBag, text: "Integração com Shopify e Facebook Ads" },
    { icon: Shield, text: "Cloaker anti-spy integrado" },
    { icon: Bell, text: "Notificações push de vendas" },
    { icon: TrendingUp, text: "Relatórios detalhados de performance" },
  ];

  const highlights = [
    { 
      icon: Smartphone, 
      title: "Mobile First", 
      desc: "Acesse de qualquer dispositivo",
      stat: "100%",
      statLabel: "Responsivo"
    },
    { 
      icon: Clock, 
      title: "Tempo Real", 
      desc: "Dados atualizados instantaneamente",
      stat: "<1s",
      statLabel: "Latência"
    },
    { 
      icon: Users, 
      title: "Multi-usuário", 
      desc: "Gerencie sua equipe",
      stat: "∞",
      statLabel: "Usuários"
    },
    { 
      icon: Target, 
      title: "Precisão", 
      desc: "Métricas 100% confiáveis",
      stat: "99.9%",
      statLabel: "Uptime"
    }
  ];

  return (
    <section className="relative z-10 py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-block text-primary font-semibold text-sm uppercase tracking-widest mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Por que escolher
          </motion.span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-6">
            O CODFY é diferente de
            <span className="block text-primary">
              qualquer outro
            </span>
          </h2>
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Left - Benefits List Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-5"
          >
            <Card className="h-full border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Tudo Incluído</h3>
                    <p className="text-sm text-muted-foreground">Sem custos extras</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary/5 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <benefit.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                        {benefit.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right - Highlight Cards Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            {highlights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl hover:border-primary/40 transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-5 lg:p-6 h-full flex flex-col">
                    {/* Stat Display */}
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                      >
                        <item.icon className="w-6 h-6 text-primary" />
                      </motion.div>
                      <div className="text-right">
                        <motion.span 
                          className="text-2xl lg:text-3xl font-black text-primary"
                          initial={{ opacity: 0, scale: 0.5 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          {item.stat}
                        </motion.span>
                        <p className="text-xs text-muted-foreground">{item.statLabel}</p>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="mt-auto">
                      <h4 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>

                    {/* Animated border */}
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-primary/50"
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                      viewport={{ once: true }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-8"
        >
          <Card className="border-border/50 bg-gradient-to-r from-primary/5 via-card to-primary/5 backdrop-blur-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { value: "+500", label: "Usuários Ativos", suffix: "" },
                  { value: "R$ 2M", label: "Processados/mês", suffix: "+" },
                  { value: "50K", label: "Vendas Monitoradas", suffix: "+" },
                  { value: "4.9", label: "Avaliação", suffix: "★" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center"
                  >
                    <div className="text-2xl md:text-3xl font-black text-primary">
                      {stat.value}{stat.suffix}
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
