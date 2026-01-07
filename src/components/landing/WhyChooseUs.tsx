import React from "react";
import { motion } from "framer-motion";
import { 
  Zap, Smartphone, Clock, Users, Target, Check,
  TrendingUp, Shield, BarChart3, Bell, ShoppingBag, Sparkles,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const WhyChooseUs = () => {
  const benefits = [
    { icon: Zap, text: "Dados em tempo real" },
    { icon: BarChart3, text: "Interface moderna" },
    { icon: ShoppingBag, text: "Shopify & Facebook Ads" },
    { icon: Shield, text: "Cloaker anti-spy" },
    { icon: Bell, text: "Notificações push" },
    { icon: TrendingUp, text: "Relatórios detalhados" },
  ];

  const highlights = [
    { 
      icon: Smartphone, 
      title: "Mobile First", 
      desc: "Acesse de qualquer dispositivo, a qualquer momento",
      stat: "100%",
      statLabel: "Responsivo",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      icon: Clock, 
      title: "Tempo Real", 
      desc: "Atualizações instantâneas sem delay",
      stat: "<1s",
      statLabel: "Latência",
      color: "from-green-500 to-emerald-500"
    },
    { 
      icon: Users, 
      title: "Multi-usuário", 
      desc: "Gerencie toda sua equipe em um só lugar",
      stat: "∞",
      statLabel: "Usuários",
      color: "from-purple-500 to-pink-500"
    },
    { 
      icon: Target, 
      title: "Precisão Total", 
      desc: "Métricas 100% confiáveis e verificadas",
      stat: "99.9%",
      statLabel: "Uptime",
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <section className="relative z-10 py-20 lg:py-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">
              Por que escolher
            </span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            O CODFY é diferente de
            <span className="block text-primary mt-2">
              qualquer outro
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Construído por empreendedores COD para empreendedores COD
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column - Feature Showcase */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-5"
          >
            <Card className="h-full border-border/50 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl overflow-hidden relative">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
              
              <CardContent className="p-6 lg:p-8 relative">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25"
                    whileHover={{ rotate: 10, scale: 1.05 }}
                  >
                    <Check className="w-7 h-7 text-primary-foreground" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Tudo Incluído</h3>
                    <p className="text-sm text-muted-foreground">Sem custos extras ou surpresas</p>
                  </div>
                </div>
                
                {/* Benefits Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {benefits.map((benefit, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.08 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all cursor-default group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <benefit.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-tight">
                        {benefit.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Mini */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  viewport={{ once: true }}
                  className="mt-8 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Comece agora mesmo</p>
                      <p className="text-xs text-muted-foreground">Setup em menos de 5 minutos</p>
                    </div>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <ArrowUpRight className="w-5 h-5 text-primary" />
                    </motion.div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Stats Cards */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            {highlights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl hover:border-primary/40 transition-all duration-500 group overflow-hidden relative">
                  {/* Hover gradient overlay */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  />
                  
                  <CardContent className="p-5 lg:p-6 h-full flex flex-col relative">
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} p-0.5`}
                      >
                        <div className="w-full h-full rounded-xl bg-background/90 flex items-center justify-center">
                          <item.icon className="w-6 h-6 text-foreground" />
                        </div>
                      </motion.div>
                      
                      <div className="text-right">
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            duration: 0.5, 
                            delay: 0.3 + index * 0.1,
                            type: "spring",
                            stiffness: 200
                          }}
                          viewport={{ once: true }}
                          className="relative"
                        >
                          <span className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            {item.stat}
                          </span>
                          {/* Glow effect */}
                          <motion.div
                            className="absolute inset-0 bg-primary/20 blur-xl -z-10"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                          />
                        </motion.div>
                        <p className="text-xs text-muted-foreground mt-1">{item.statLabel}</p>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="mt-auto">
                      <h4 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    {/* Animated bottom border */}
                    <motion.div
                      className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${item.color}`}
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

        {/* Bottom Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-10"
        >
          <div className="relative rounded-2xl border border-border/50 bg-gradient-to-r from-card via-card/80 to-card overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="p-6 lg:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: "+500", label: "Usuários Ativos", icon: Users },
                  { value: "R$ 2M+", label: "Processados/mês", icon: TrendingUp },
                  { value: "50K+", label: "Vendas Monitoradas", icon: BarChart3 },
                  { value: "4.9★", label: "Avaliação Média", icon: Sparkles },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-2 mb-2"
                    >
                      <stat.icon className="w-5 h-5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span className="text-2xl md:text-3xl font-black text-foreground group-hover:text-primary transition-colors">
                        {stat.value}
                      </span>
                    </motion.div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
