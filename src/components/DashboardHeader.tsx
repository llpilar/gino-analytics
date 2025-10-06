import { Bell, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditor } from "./ProfileEditor";

export const DashboardHeader = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { profile } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden text-white hover:bg-zinc-800/50"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-sm md:text-xl font-bold text-white">
              Bem-vindo de volta {profile?.name?.split(' ')[0] || ''}
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 capitalize">
              {formatDate(currentTime)}
            </p>
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-zinc-400">Hora atual (UTC-3)</span>
            <span className="text-xl font-bold text-primary neon-glow">
              {formatTime(currentTime)}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative glass-card hover:bg-zinc-800/50"
          >
            <Bell className="h-5 w-5 text-white" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </Button>
          
          <ProfileEditor />
        </div>
      </div>
    </header>
  );
};
