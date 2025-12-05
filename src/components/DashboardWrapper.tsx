import { ReactNode } from "react";
import { NavBar } from "./ui/tubelight-navbar";
import { ShootingStars } from "./ui/shooting-stars";
import { LayoutDashboard, BarChart3, Settings, Wallet, Truck } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";

interface DashboardWrapperProps {
  children: ReactNode;
}

export const DashboardWrapper = ({ children }: DashboardWrapperProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

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
    <div className="min-h-screen w-full relative overflow-hidden bg-background">
      {/* Navigation Bar */}
      <NavBar items={navItems} />
      
      {/* Background with shooting stars and static stars */}
      <div className="absolute inset-0 bg-background">
        <div className="stars-bg absolute inset-0 dark:opacity-40 opacity-0" />
      </div>

      {/* Multiple shooting star layers - Only in dark mode */}
      <div className="dark:block hidden">
        <ShootingStars starColor="#1da1f2" trailColor="#1e9df1" minSpeed={15} maxSpeed={35} minDelay={800} maxDelay={2500} />
        <ShootingStars starColor="#1c9cf0" trailColor="#1da1f2" minSpeed={10} maxSpeed={25} minDelay={1500} maxDelay={3500} />
      </div>
      
      {/* Subtle Ambient Lighting Effects - Only in dark mode */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px] dark:opacity-100 opacity-0" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px] dark:opacity-100 opacity-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-chart-4/5 rounded-full blur-[180px] dark:opacity-100 opacity-0" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-chart-1/5 rounded-full blur-[180px] dark:opacity-100 opacity-0" />

      {/* Live Indicator - Top Right */}
      <div className="fixed top-4 right-4 z-40">
        <div className="px-4 py-2 rounded-full bg-card border border-primary/30 backdrop-blur-xl shadow-lg shadow-primary/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-chart-4 rounded-full animate-pulse shadow-lg shadow-chart-4/50" />
            <span className="text-chart-4 font-bold text-xs uppercase tracking-widest">AO VIVO</span>
            <div className="text-sm font-mono font-black text-primary tracking-wider">
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
