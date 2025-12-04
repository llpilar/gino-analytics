import { Home, BarChart3, Activity, Settings, Truck, Wallet } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

const menuItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: BarChart3, label: "Análises", path: "/analises" },
  { icon: Activity, label: "Ao Vivo", path: "/live-view" },
  { icon: Truck, label: "Envios", path: "/envios" },
  { icon: Wallet, label: "Contas", path: "/contas" },
];

export const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800">
      <div className="flex items-center justify-around h-16 px-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`
                flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl
                transition-all duration-200
                ${isActive 
                  ? 'text-primary' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
