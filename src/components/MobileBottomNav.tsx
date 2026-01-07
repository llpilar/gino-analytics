import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, BarChart3, Settings, Wallet, Calculator, 
  Shield, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonate } from "@/contexts/ImpersonateContext";

const FINANCEIRO_AUTHORIZED_EMAILS = [
  "lucas@pilar.com.br",
  "obioboost@outlook.com"
];

const baseMainItems = [
  { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { icon: BarChart3, label: "Análises", path: "/analises" },
  { icon: Calculator, label: "Lucro", path: "/lucratividade" },
  { icon: Wallet, label: "Financeiro", path: "/financeiro", restricted: true },
];

const moreItems = [
  { icon: Shield, label: "Cloaker", path: "/cloaker" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { isAdmin, user } = useAuth();
  const { isImpersonating } = useImpersonate();

  const userEmail = user?.email?.toLowerCase() || "";
  const isFinanceiroAuthorized = FINANCEIRO_AUTHORIZED_EMAILS.some(
    email => email.toLowerCase() === userEmail
  ) && !isImpersonating;

  const mainItems = baseMainItems.filter(item => 
    !item.restricted || isFinanceiroAuthorized
  );

  const isInMoreMenu = moreItems.some(item => item.path === location.pathname) || 
    (isAdmin && location.pathname === "/admin");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <Icon className="w-5 h-5" />
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute inset-0 rounded-xl border-2 border-primary/50"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
                isInMoreMenu ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                isInMoreMenu && "bg-primary/10"
              )}>
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <DropdownMenuItem key={item.path} asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 cursor-pointer",
                      isActive && "text-primary bg-primary/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link
                  to="/admin"
                  className={cn(
                    "flex items-center gap-3 cursor-pointer",
                    location.pathname === "/admin" && "text-primary bg-primary/5"
                  )}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
