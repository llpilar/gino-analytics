import { LayoutDashboard, FlaskConical, Smartphone, Shield, Mail, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "OVERVIEW", active: true },
  { icon: FlaskConical, label: "LABORATORY" },
  { icon: Smartphone, label: "DEVICES" },
  { icon: Shield, label: "SECURITY" },
  { icon: Mail, label: "COMMUNICATION" },
];

export const DashboardSidebar = () => {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider">SHOPIFY</h1>
            <p className="text-xs text-muted-foreground">DASHBOARD</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-xs text-primary font-bold">TOOLS</span>
          </div>
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  item.active
                    ? "bg-primary/10 border border-primary/30 text-primary neon-border-green"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-all">
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">ADMIN SETTINGS</span>
        </button>
      </div>
    </aside>
  );
};
