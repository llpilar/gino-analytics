import { Home, BarChart3, Activity, Settings, LogOut, Wallet, Truck, Calculator, Shield, ShieldCheck, LayoutGrid } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: BarChart3, label: "Análises", path: "/analises" },
  { icon: Activity, label: "Ao Vivo", path: "/live-view" },
  { icon: Truck, label: "Envios", path: "/envios" },
  { icon: Calculator, label: "Lucro", path: "/lucratividade" },
  { icon: Shield, label: "Cloaker", path: "/cloaker" },
  { icon: LayoutGrid, label: "Whiteboard", path: "/whiteboard" },
  { icon: Wallet, label: "Financeiro", path: "/financeiro" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export const DashboardSidebar = () => {
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();
  const { open } = useSidebar();

  // Adiciona Admin ao menu se usuário for admin
  const allMenuItems = isAdmin 
    ? [...menuItems, { icon: ShieldCheck, label: "Admin", path: "/admin" }]
    : menuItems;

  return (
    <Sidebar collapsible="icon" className="bg-sidebar/50 backdrop-blur-xl border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-16 items-center justify-center">
          <h1 className={`text-2xl font-bold text-primary tracking-tight transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}>
            CODFY
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {allMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={`
                        ${isActive 
                          ? 'glass-card-active text-primary' 
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                        }
                      `}
                    >
                      <Link to={item.path}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip="Sair"
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
