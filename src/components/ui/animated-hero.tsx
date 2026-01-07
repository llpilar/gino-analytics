import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface AnimatedHeroProps {
  badge?: string;
  badgeIcon?: React.ReactNode;
  titles: string[];
  staticTitle?: string;
  staticTitleAfter?: string;
  description: string;
  primaryCta?: {
    text: string;
    href: string;
    icon?: React.ReactNode;
  };
  secondaryCta?: {
    text: string;
    href: string;
    icon?: React.ReactNode;
  };
}

function AnimatedHero({
  badge,
  badgeIcon,
  titles,
  staticTitle = "Controle",
  staticTitleAfter,
  description,
  primaryCta,
  secondaryCta,
}: AnimatedHeroProps) {
  const [titleNumber, setTitleNumber] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2500);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-16 sm:py-24 lg:py-32 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col items-center">
            {badge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div 
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-chart-2/20 border border-primary/30 text-primary text-sm font-semibold backdrop-blur-sm"
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(var(--primary), 0.2)", 
                      "0 0 40px rgba(var(--primary), 0.4)", 
                      "0 0 20px rgba(var(--primary), 0.2)"
                    ] 
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {badgeIcon}
                  <span>{badge}</span>
                </motion.div>
              </motion.div>
            )}

            <div className="flex gap-2 flex-col items-center">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl max-w-5xl tracking-tight text-center font-black"
              >
                <span className="text-foreground">{staticTitle}</span>
                <span className="relative flex w-full justify-center overflow-hidden text-center h-[1.2em]">
                  &nbsp;
                  {titles.map((title, index) => (
                    <motion.span
                      key={index}
                      className="absolute font-black bg-gradient-to-r from-primary via-chart-2 to-chart-5 bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: 100 }}
                      transition={{ type: "spring", stiffness: 50 }}
                      animate={
                        titleNumber === index
                          ? {
                              y: 0,
                              opacity: 1,
                            }
                          : {
                              y: titleNumber > index ? -150 : 150,
                              opacity: 0,
                            }
                      }
                    >
                      {title}
                    </motion.span>
                  ))}
                </span>
                {staticTitleAfter && (
                  <span className="text-foreground">{staticTitleAfter}</span>
                )}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg sm:text-xl lg:text-2xl leading-relaxed tracking-tight text-muted-foreground max-w-3xl text-center mt-6"
              >
                {description}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 mt-8"
            >
              {primaryCta && (
                <Link to={primaryCta.href}>
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -2 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      size="lg" 
                      className="gap-3 text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-2xl shadow-2xl shadow-primary/30 bg-gradient-to-r from-primary via-primary to-chart-2 hover:opacity-90 transition-opacity"
                    >
                      {primaryCta.icon}
                      {primaryCta.text}
                    </Button>
                  </motion.div>
                </Link>
              )}
              {secondaryCta && (
                <Link to={secondaryCta.href}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="gap-3 text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-2xl border-2 hover:bg-muted/50"
                    >
                      {secondaryCta.icon}
                      {secondaryCta.text}
                    </Button>
                  </motion.div>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AnimatedHero };
