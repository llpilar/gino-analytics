import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Sparkles, Zap, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

const plans: PricingPlan[] = [
  {
    name: "Starter",
    description: "Para quem está começando no COD",
    monthlyPrice: 97,
    yearlyPrice: 77,
    features: [
      "1 loja Shopify",
      "Até 500 vendas/mês",
      "Dashboard básico",
      "Notificações push",
      "Suporte por email",
    ],
  },
  {
    name: "Pro",
    description: "Para negócios em crescimento",
    monthlyPrice: 197,
    yearlyPrice: 157,
    highlighted: true,
    badge: "Mais Popular",
    features: [
      "3 lojas Shopify",
      "Vendas ilimitadas",
      "Dashboard completo",
      "Cloaker integrado",
      "Facebook Ads sync",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  },
  {
    name: "Enterprise",
    description: "Para operações de grande escala",
    monthlyPrice: 497,
    yearlyPrice: 397,
    features: [
      "Lojas ilimitadas",
      "Vendas ilimitadas",
      "Todas as features Pro",
      "API dedicada",
      "White-label",
      "Gerente de conta",
      "SLA garantido",
      "Onboarding VIP",
    ],
  },
];

const PricingCard = ({ 
  plan, 
  isYearly 
}: { 
  plan: PricingPlan; 
  isYearly: boolean;
}) => {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`
        relative backdrop-blur-xl rounded-2xl shadow-xl flex-1 max-w-sm px-7 py-8 flex flex-col transition-all duration-300
        ${plan.highlighted 
          ? "bg-gradient-to-br from-white/20 to-white/5 border-2 border-primary/30 shadow-2xl shadow-primary/10 scale-105 z-10" 
          : "bg-gradient-to-br from-white/10 to-white/5 border border-white/10 dark:from-white/10 dark:to-white/5"
        }
      `}
    >
      {/* Popular Badge */}
      {plan.badge && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2"
        >
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/30">
            <Star className="w-4 h-4 fill-current" />
            {plan.badge}
          </div>
        </motion.div>
      )}

      {/* Plan Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-1">{plan.name}</h3>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-muted-foreground">R$</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={isYearly ? "yearly" : "monthly"}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="text-5xl font-black text-foreground"
            >
              {price}
            </motion.span>
          </AnimatePresence>
          <span className="text-muted-foreground">/mês</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isYearly ? "cobrado anualmente" : "cobrado mensalmente"}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

      {/* Features */}
      <ul className="space-y-3 flex-1 mb-6">
        {plan.features.map((feature, index) => (
          <motion.li
            key={feature}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            viewport={{ once: true }}
            className="flex items-center gap-3"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              plan.highlighted 
                ? "bg-primary/20 text-primary" 
                : "bg-green-500/20 text-green-500"
            }`}>
              <Check className="w-3 h-3" />
            </div>
            <span className="text-sm text-foreground">{feature}</span>
          </motion.li>
        ))}
      </ul>

      {/* CTA Button */}
      <Link to="/auth" className="mt-auto">
        <Button
          className={`w-full rounded-xl py-6 font-semibold transition-all duration-300 ${
            plan.highlighted
              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
              : "bg-white/10 hover:bg-white/20 text-foreground border border-white/20 backdrop-blur-sm"
          }`}
        >
          Começar Agora
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </motion.div>
  );
};

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (checked: boolean) => {
    setIsYearly(checked);
    
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ["hsl(var(--primary))", "#22c55e", "#3b82f6", "#a855f7"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <section className="relative z-10 py-20 lg:py-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      {/* Animated Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[150px]"
        animate={{ 
          scale: [1, 1.2, 1], 
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-chart-2/20 blur-[120px]"
        animate={{ 
          scale: [1.2, 1, 1.2], 
          opacity: [0.2, 0.4, 0.2],
          x: [0, -40, 0],
          y: [0, 40, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-chart-5/10 blur-[180px]"
        animate={{ 
          scale: [1, 1.1, 1], 
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
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
              Preços
            </span>
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            Encontre o{" "}
            <span className="text-primary">Plano Perfeito</span>
            <span className="block mt-2">para seu Negócio</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Comece gratuitamente por 7 dias. Planos flexíveis para projetos de todos os tamanhos.
          </p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-4 p-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <span className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 ${
              !isYearly 
                ? "bg-primary text-primary-foreground shadow-lg" 
                : "text-muted-foreground hover:text-foreground"
            }`}>
              Mensal
            </span>
            
            <Switch
              ref={switchRef}
              checked={isYearly}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-primary"
            />
            
            <span className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
              isYearly 
                ? "bg-primary text-primary-foreground shadow-lg" 
                : "text-muted-foreground hover:text-foreground"
            }`}>
              Anual
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white font-bold">
                -20%
              </span>
            </span>
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 justify-center items-center md:items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="w-full max-w-sm"
            >
              <PricingCard plan={plan} isYearly={isYearly} />
            </motion.div>
          ))}
        </div>

        {/* Bottom Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-left">
              <p className="text-base font-semibold text-foreground">Garantia de 7 dias</p>
              <p className="text-sm text-muted-foreground">Devolução total se não ficar satisfeito</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
