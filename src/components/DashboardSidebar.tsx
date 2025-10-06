import { Home, ShoppingBag, BarChart3, Settings, Zap } from "lucide-react";

export const DashboardSidebar = () => {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col liquid-glass border-r border-white/10">
      <div className="flex h-16 items-center justify-center border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary neon-glow" />
          <h1 className="text-xl font-black tracking-tight">
            <span className="text-white">Shop</span>
            <span className="text-primary neon-glow">Dash</span>
          </h1>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2 p-4">
        <a
          href="#"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium liquid-glass border border-primary/30 text-primary hover:border-primary/50 transition-all duration-300"
        >
          <Home className="h-5 w-5" />
          Dashboard
        </a>
        <a
          href="#"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-white/5 transition-all duration-300"
        >
          <ShoppingBag className="h-5 w-5" />
          Produtos
        </a>
        <a
          href="#"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-white/5 transition-all duration-300"
        >
          <BarChart3 className="h-5 w-5" />
          Análises
        </a>
        <a
          href="#"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-white/5 transition-all duration-300"
        >
          <Settings className="h-5 w-5" />
          Configurações
        </a>
      </nav>
    </aside>
  );
};
