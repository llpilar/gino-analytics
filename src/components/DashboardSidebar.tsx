import { Home, ShoppingBag, BarChart3, Settings, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: ShoppingBag, label: "Produtos", path: "/produtos" },
  { icon: BarChart3, label: "Análises", path: "/analises" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export const DashboardSidebar = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-zinc-900/50 backdrop-blur-xl border-r border-zinc-800">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-zinc-800">
          <img src={logo} alt="ShopDash Logo" className="w-12 h-12" />
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <a
                key={item.label}
                href={item.path}
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
              </a>
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
      </aside>
    </>
  );
};
