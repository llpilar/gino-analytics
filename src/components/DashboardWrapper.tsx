import { ReactNode } from "react";
import { NavBar } from "./ui/tubelight-navbar";
import { ShootingStars } from "./ui/shooting-stars";
import { LayoutDashboard, BarChart3, Settings, Wallet, Truck, Calculator, Shield } from "lucide-react";
import { useVisualEffects } from "@/contexts/VisualEffectsContext";
import { useTheme } from "@/contexts/ThemeContext";

interface DashboardWrapperProps {
  children: ReactNode;
}

export const DashboardWrapper = ({ children }: DashboardWrapperProps) => {
  const { premiumEffects } = useVisualEffects();
  const { theme, isDarkMode } = useTheme();

  // Check if current theme is dark (cyber-neon is always dark, other themes depend on isDarkMode)
  const isCurrentlyDark = theme === 'cyber-neon' || (['clean-blue', 'royal-blue', 'netflix-red'].includes(theme) && isDarkMode);

  const navItems = [
    { name: 'Dashboard', url: '/', icon: LayoutDashboard },
    { name: 'Análises', url: '/analises', icon: BarChart3 },
    { name: 'Envios', url: '/envios', icon: Truck },
    { name: 'Lucro', url: '/lucratividade', icon: Calculator },
    { name: 'Cloaker', url: '/cloaker', icon: Shield },
    { name: 'Financeiro', url: '/financeiro', icon: Wallet },
    { name: 'Configurações', url: '/configuracoes', icon: Settings }
  ];

  return (
    <div className="min-h-screen w-full relative bg-background overflow-x-hidden">
      {/* Navigation Bar */}
      <NavBar items={navItems} />
      
      {/* Background with shooting stars and static stars - fixed position */}
      <div className="fixed inset-0 bg-background pointer-events-none z-0" aria-hidden="true">
        {isCurrentlyDark && <div className="stars-bg absolute inset-0 opacity-40" />}
        
        {/* Multiple shooting star layers - Only in dark themes and when premium effects enabled */}
        {premiumEffects && isCurrentlyDark && (
          <>
            <ShootingStars starColor="hsl(var(--primary))" trailColor="hsl(var(--secondary))" minSpeed={15} maxSpeed={35} minDelay={800} maxDelay={2500} />
            <ShootingStars starColor="hsl(var(--neon-cyan))" trailColor="hsl(var(--neon-purple))" minSpeed={10} maxSpeed={25} minDelay={1500} maxDelay={3500} />
          </>
        )}
        
        {/* Subtle Ambient Lighting Effects - Only in dark themes and when premium effects enabled */}
        {premiumEffects && isCurrentlyDark && (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px]" />
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-chart-4/5 rounded-full blur-[180px]" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-chart-1/5 rounded-full blur-[180px]" />
          </>
        )}
      </div>


      {/* Content */}
      <div className="relative z-10 pt-14 md:pt-20 min-h-screen w-full">
        <div className="w-full h-full">
          {children}
        </div>
      </div>

      <style>{`
        .stars-bg {
          background-image: 
            radial-gradient(2px 2px at 20px 30px, hsl(var(--primary)), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 40px 70px, hsl(var(--chart-5)), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 50px 160px, hsl(var(--chart-5)), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 90px 40px, hsl(var(--chart-4)), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 130px 80px, hsl(var(--chart-1)), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 200px 50px, hsl(var(--muted-foreground)), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 250px 100px, hsl(var(--muted-foreground)), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 300px 150px, hsl(var(--muted-foreground)), rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 350px 250px;
          animation: twinkle 5s ease-in-out infinite;
        }

        @keyframes twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};
