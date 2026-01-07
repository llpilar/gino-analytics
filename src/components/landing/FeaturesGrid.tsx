import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, BarChart3, MapPin, Shield, Bell, DollarSign,
  Zap, Check, Users, ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FeaturesGrid = () => {
  return (
    <section className="relative z-10 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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
            <span className="block text-primary">
              um só lugar
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas para monitorar, analisar e escalar seu negócio COD
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4">
          {/* Card 1 - Wide - Vendas em Tempo Real */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="md:col-span-3 lg:col-span-4"
          >
            <Card className="h-full overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl hover:border-primary/40 transition-all duration-300 group">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Stats Display */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-green-500"
                    />
                    <span className="text-xs text-muted-foreground">Ao vivo</span>
                  </div>
                  <span className="text-4xl font-black text-primary">99.9%</span>
                </div>
                
                {/* Mini Chart Animation */}
                <div className="flex-1 flex items-end gap-1 mb-6 min-h-[80px]">
                  {[45, 60, 35, 80, 55, 90, 70, 85, 65, 95, 75, 88].map((height, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary to-primary/40 rounded-t-sm"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${height}%` }}
                      transition={{ duration: 0.6, delay: i * 0.03 }}
                      viewport={{ once: true }}
                    />
                  ))}
                </div>

                <div className="mt-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Vendas em Tempo Real</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe cada venda no momento em que acontece com atualização instantânea.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2 - Tall - Segurança */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="md:col-span-3 lg:col-span-4 lg:row-span-2"
          >
            <Card className="h-full overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl hover:border-primary/40 transition-all duration-300 group">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Security Visual */}
                <div className="relative flex-1 flex items-center justify-center py-8">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Outer Ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                      style={{ width: 160, height: 160, margin: -20 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* Shield Icon */}
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <Shield className="w-12 h-12 text-primary" />
                      </div>
                    </div>

                    {/* Floating Checks */}
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"
                        style={{
                          top: `${20 + Math.sin(i * 1.5) * 60}%`,
                          left: `${20 + Math.cos(i * 1.5) * 60}%`,
                        }}
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 2, 
                          delay: i * 0.5,
                          repeat: Infinity 
                        }}
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                <div className="mt-auto">
                  <h3 className="text-xl font-bold text-foreground mb-2">Cloaker Integrado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Proteja seus links de afiliado com nosso sistema anti-spy avançado. Bloqueio de bots, VPNs e muito mais.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {["Anti-Bot", "Anti-VPN", "Anti-Spy"].map((tag) => (
                      <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3 - Regular - Análises */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="md:col-span-3 lg:col-span-4"
          >
            <Card className="h-full overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl hover:border-primary/40 transition-all duration-300 group">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { label: "Conversão", value: "4.8%", color: "text-green-500" },
                    { label: "Ticket", value: "R$247", color: "text-primary" },
                    { label: "CTR", value: "2.3%", color: "text-blue-500" },
                    { label: "ROI", value: "312%", color: "text-purple-500" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                      viewport={{ once: true }}
                      className="p-3 rounded-xl bg-muted/50 text-center"
                    >
                      <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Análises Detalhadas</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Métricas completas de conversão, ticket médio e performance por período.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 4 - Wide - Mapa de Vendas */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="md:col-span-3 lg:col-span-4"
          >
            <Card className="h-full overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl hover:border-primary/40 transition-all duration-300 group">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Map Visualization */}
                <div className="relative h-32 rounded-xl bg-muted/30 overflow-hidden mb-4">
                  {/* Map dots */}
                  {[
                    { x: "15%", y: "30%", delay: 0 },
                    { x: "35%", y: "50%", delay: 0.3 },
                    { x: "55%", y: "35%", delay: 0.6 },
                    { x: "75%", y: "55%", delay: 0.9 },
                    { x: "45%", y: "70%", delay: 1.2 },
                    { x: "25%", y: "60%", delay: 1.5 },
                    { x: "65%", y: "25%", delay: 1.8 },
                    { x: "85%", y: "40%", delay: 2.1 },
                  ].map((dot, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{ left: dot.x, top: dot.y }}
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: dot.delay * 0.3 }}
                      viewport={{ once: true }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, delay: dot.delay, repeat: Infinity }}
                        className="w-3 h-3 rounded-full bg-primary"
                      />
                      <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                    </motion.div>
                  ))}

                  {/* Grid lines */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                                      linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
                    backgroundSize: "30px 30px"
                  }} />
                </div>

                <div className="mt-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Mapa de Vendas</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Visualize geograficamente de onde vêm suas vendas COD.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 5 - Notificações Push */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
            className="md:col-span-3 lg:col-span-4"
          >
            <Card className="h-full overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl hover:border-primary/40 transition-all duration-300 group">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Notification Preview */}
                <div className="space-y-3 mb-4">
                  {[
                    { title: "Nova venda!", desc: "São Paulo • R$ 297,00", time: "agora" },
                    { title: "Venda confirmada", desc: "Rio de Janeiro • R$ 189,00", time: "2min" },
                  ].map((notif, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + i * 0.2 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                        className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0"
                      >
                        <Bell className="w-4 h-4 text-green-500" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{notif.desc}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{notif.time}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Notificações Push</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas de novas vendas diretamente no seu dispositivo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 6 - Wide - Controle Financeiro */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
            className="md:col-span-6 lg:col-span-4"
          >
            <Card className="h-full overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl hover:border-primary/40 transition-all duration-300 group">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Financial Summary */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Lucro Líquido</p>
                    <p className="text-2xl font-bold text-green-500">R$ 12.847,00</p>
                  </div>
                  <motion.div
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TrendingUp className="w-4 h-4" />
                    +23%
                  </motion.div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-3 mb-4">
                  {[
                    { label: "Receita", value: 85, color: "bg-primary" },
                    { label: "Despesas", value: 35, color: "bg-orange-500" },
                    { label: "Lucro", value: 65, color: "bg-green-500" },
                  ].map((bar, i) => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{bar.label}</span>
                        <span className="text-foreground font-medium">{bar.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${bar.color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${bar.value}%` }}
                          transition={{ duration: 0.8, delay: 0.7 + i * 0.1 }}
                          viewport={{ once: true }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Controle Financeiro</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Gerencie despesas, lucros e fluxo de caixa em um só lugar.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
