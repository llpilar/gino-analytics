import { Home, BarChart3, Activity, Settings, Zap, LogOut, Truck, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: BarChart3, label: "Análises", path: "/analises" },
  { icon: Activity, label: "Ao Vivo", path: "/live-view" },
  { icon: Truck, label: "Envios", path: "/envios" },
  { icon: Wallet, label: "Contas", path: "/contas" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export const MobileMenu = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Zap className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-black tracking-tight">
            <span className="text-white">Shop</span>
            <span className="text-primary">Dash</span>
          </h1>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                transition-all duration-300 ease-in-out
                ${isActive 
                  ? 'glass-card-active text-primary' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-zinc-800">
        <Button
          onClick={signOut}
          variant="ghost"
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all duration-300"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );
};