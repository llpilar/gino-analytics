import { ReactNode } from "react";
import { NavBar } from "./ui/tubelight-navbar";
import { ShootingStars } from "./ui/shooting-stars";
import { LayoutDashboard, BarChart3, Settings, Wallet, Truck } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface DashboardWrapperProps {
  children: ReactNode;
}

export const DashboardWrapper = ({ children }: DashboardWrapperProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { name: 'Dashboard', url: '/', icon: LayoutDashboard },
    { name: 'Análises', url: '/analises', icon: BarChart3 },
    { name: 'Envios', url: '/envios', icon: Truck },
    { name: 'Contas', url: '/contas', icon: Wallet },
    { name: 'Configurações', url: '/configuracoes', icon: Settings }
  ];

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black">
      {/* Navigation Bar */}
      <NavBar items={navItems} />
      
      {/* Background - Different per theme */}
      <div className="absolute inset-0 bg-black">
        {theme === "neon" && <div className="stars-bg absolute inset-0" />}
        {theme === "glass" && <div className="glass-bg absolute inset-0" />}
      </div>

      {/* Shooting stars - Neon theme only */}
      {theme === "neon" && (
        <>
          <ShootingStars starColor="#a3e635" trailColor="#84cc16" minSpeed={15} maxSpeed={35} minDelay={800} maxDelay={2500} />
          <ShootingStars starColor="#3b82f6" trailColor="#60a5fa" minSpeed={10} maxSpeed={25} minDelay={1500} maxDelay={3500} />
          <ShootingStars starColor="#a855f7" trailColor="#c084fc" minSpeed={20} maxSpeed={40} minDelay={1000} maxDelay={3000} />
          <ShootingStars starColor="#ec4899" trailColor="#f472b6" minSpeed={12} maxSpeed={30} minDelay={1200} maxDelay={4000} />
        </>
      )}
      
      {/* Ambient Lighting Effects */}
      {theme === "neon" ? (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[150px]" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[180px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[180px]" />
        </>
      ) : (
        <>
          {/* Glass theme - Subtle gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[200px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/[0.03] rounded-full blur-[200px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.01] rounded-full blur-[250px]" />
        </>
      )}

      {/* Live Indicator - Top Right */}
      <div className="fixed top-4 right-4 z-40">
        <div className={cn(
          "px-4 py-2 rounded-full backdrop-blur-xl shadow-lg transition-all duration-300",
          theme === "neon" 
            ? "bg-black/80 border border-cyan-500/30 shadow-cyan-500/20" 
            : "bg-white/[0.05] border border-white/[0.1] shadow-black/30"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              theme === "neon" 
                ? "bg-green-500 shadow-lg shadow-green-500/50" 
                : "bg-emerald-400 shadow-lg shadow-emerald-400/30"
            )} />
            <span className={cn(
              "font-bold text-xs uppercase tracking-widest",
              theme === "neon" ? "text-green-400" : "text-emerald-300"
            )}>AO VIVO</span>
            <div className={cn(
              "text-sm font-mono font-black tracking-wider",
              theme === "neon" ? "text-cyan-300" : "text-white/80"
            )}>
              {format(currentTime, "HH:mm:ss")}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-20">
        {children}
      </div>

      <style>{`
        .stars-bg {
          background-image: 
            radial-gradient(2px 2px at 20px 30px, #06b6d4, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 40px 70px, #8b5cf6, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 50px 160px, #ec4899, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 90px 40px, #a3e635, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 130px 80px, #60a5fa, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 160px 120px, #84cc16, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 200px 50px, #fff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 250px 100px, #fff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 300px 150px, #fff, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 350px 250px;
          animation: twinkle 5s ease-in-out infinite;
          opacity: 0.4;
        }

        .glass-bg {
          background-image: 
            radial-gradient(1px 1px at 100px 50px, rgba(255,255,255,0.15), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 200px 150px, rgba(255,255,255,0.1), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 300px 80px, rgba(255,255,255,0.12), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 400px 200px, rgba(255,255,255,0.08), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 500px 120px, rgba(255,255,255,0.1), rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 600px 300px;
          opacity: 0.3;
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
