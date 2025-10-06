import { Bell, User } from "lucide-react";
import { Button } from "./ui/button";

export const DashboardHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full liquid-glass border-b border-white/10 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            <span className="text-white">Dashboard</span>
          </h2>
          <p className="text-sm text-muted-foreground">Bem-vindo de volta</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative liquid-glass hover:bg-white/10 rounded-xl"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="liquid-glass hover:bg-white/10 rounded-xl"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
