import { ReactNode } from "react";
import { NavBar } from "./ui/tubelight-navbar";
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
    <div className="min-h-screen w-full relative overflow-hidden bg-[#020617]">
      {/* Navigation Bar */}
      <NavBar items={navItems} />
      
      {/* Background - Subtle gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(148,163,184,0.08),_transparent_50%)]" />
        <div className="subtle-dots absolute inset-0 opacity-30" />
      </div>

      {/* Subtle ambient glow */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-sky-500/[0.02] rounded-full blur-[200px]" />
      <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-slate-500/[0.03] rounded-full blur-[200px]" />

      {/* Live Indicator - Top Right */}
      <div className="fixed top-4 right-4 z-40">
        <div className="px-4 py-2 rounded-full bg-slate-950/70 border border-white/[0.08] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/30" />
            <span className="text-emerald-400 font-medium text-xs uppercase tracking-widest">AO VIVO</span>
            <div className="text-sm font-mono font-semibold text-slate-300 tracking-wider">
              {format(currentTime, "HH:mm:ss")}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-20">
        {children}
      </div>
    </div>
  );
};
