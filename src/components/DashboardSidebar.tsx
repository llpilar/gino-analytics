import { Home, ShoppingBag, BarChart3, Settings, Zap, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: ShoppingBag, label: "Produtos", active: false },
  { icon: BarChart3, label: "Análises", active: false },
  { icon: Settings, label: "Configurações", active: false },
];

export const DashboardSidebar = () => {
  const { signOut } = useAuth();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-zinc-900/50 backdrop-blur-xl border-r border-zinc-800">
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
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                transition-all duration-300 ease-in-out
                ${item.active 
                  ? 'glass-card-active text-primary' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
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
      </aside>
    </>
  );
};
