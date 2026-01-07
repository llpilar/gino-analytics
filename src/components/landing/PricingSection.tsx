import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Sparkles, Zap, Crown, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  icon: React.ElementType;
}

const plans: PricingPlan[] = [
  {
    name: "Starter",
    description: "Para quem está começando no COD",
    monthlyPrice: 97,
    yearlyPrice: 77,
    icon: Zap,
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
    icon: Star,
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
    icon: Crown,
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
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <motion.div
        className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-chart-2/10 blur-[120px]"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.2, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
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
            Escolha o plano ideal
            <span className="block text-primary mt-2">para seu negócio</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Comece gratuitamente por 7 dias. Cancele quando quiser.
          </p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-4 p-2 rounded-full bg-muted/50 border border-border/50"
          >
            <span className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
              !isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}>
              Mensal
            </span>
            
            <Switch
              ref={switchRef}
              checked={isYearly}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-primary"
            />
            
            <span className={`text-sm font-medium px-3 py-1 rounded-full transition-colors flex items-center gap-2 ${
              isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}>
              Anual
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 font-bold">
                -20%
              </span>
            </span>
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative ${plan.highlighted ? "md:-mt-4 md:mb-4" : ""}`}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
                >
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25">
                    <Star className="w-4 h-4 fill-current" />
                    {plan.badge}
                  </div>
                </motion.div>
              )}

              <Card className={`h-full overflow-hidden transition-all duration-500 ${
                plan.highlighted
                  ? "border-primary/50 bg-gradient-to-br from-card via-card to-primary/5 shadow-2xl shadow-primary/10"
                  : "border-border/50 bg-gradient-to-br from-card to-card/50 hover:border-primary/30"
              }`}>
                <CardContent className="p-6 lg:p-8 h-full flex flex-col">
                  {/* Plan Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        plan.highlighted
                          ? "bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25"
                          : "bg-primary/10"
                      }`}
                    >
                      <plan.icon className={`w-6 h-6 ${
                        plan.highlighted ? "text-primary-foreground" : "text-primary"
                      }`} />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={isYearly ? "yearly" : "monthly"}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.3 }}
                          className="text-5xl font-black text-foreground"
                        >
                          {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isYearly ? "cobrado anualmente" : "cobrado mensalmente"}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="flex-1 mb-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
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
                  </div>

                  {/* CTA Button */}
                  <Link to="/auth">
                    <Button
                      className={`w-full gap-2 ${
                        plan.highlighted
                          ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      }`}
                      size="lg"
                    >
                      Começar Agora
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted/50 border border-border/50">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Garantia de 7 dias</p>
              <p className="text-xs text-muted-foreground">Devolução total se não gostar</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
