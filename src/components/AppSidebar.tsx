import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, BarChart3, Settings, Wallet, Truck, 
  Shield, ShieldCheck, ChevronLeft, LogOut, Sparkles,
  RefreshCw, Eye, X, Sun, Moon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonate } from "@/contexts/ImpersonateContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DateFilterDropdown } from "@/components/DateFilterDropdown";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

const FINANCEIRO_AUTHORIZED_EMAILS = [
  "lucas@pilar.com.br",
  "obioboost@outlook.com"
];

const baseMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BarChart3, label: "Análises", path: "/analises" },
  { icon: Wallet, label: "Financeiro", path: "/financeiro", restricted: true },
  { icon: Truck, label: "Envios", path: "/envios" },
  { icon: Shield, label: "Cloaker", path: "/cloaker" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function AppSidebar() {
  const { signOut, isAdmin, profile, user } = useAuth();
  const { impersonatedUser, isImpersonating, stopImpersonating } = useImpersonate();
  const { currency, setCurrency } = useCurrency();
  const { isCollapsed, setIsCollapsed } = useSidebarState();
  const { theme, themes, isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const currentThemeConfig = themes.find(t => t.id === theme);
  const supportsDarkMode = currentThemeConfig?.supportsDarkMode ?? false;

  const userEmail = user?.email?.toLowerCase() || "";
  const isFinanceiroAuthorized = FINANCEIRO_AUTHORIZED_EMAILS.some(
    email => email.toLowerCase() === userEmail
  ) && !isImpersonating;

  const menuItems = baseMenuItems.filter(item => 
    !item.restricted || isFinanceiroAuthorized
  );

  const allMenuItems = isAdmin 
    ? [...menuItems, { icon: ShieldCheck, label: "Admin", path: "/admin" }]
    : menuItems;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    toast.success("Dados atualizados!");
    setIsRefreshing(false);
  };

  const handleStopImpersonating = () => {
    stopImpersonating();
    queryClient.invalidateQueries();
    toast.success("Voltou ao seu perfil");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Determina qual perfil mostrar
  const displayName = isImpersonating ? impersonatedUser?.name : profile?.name;
  const displayRole = isImpersonating ? "Visualizando como" : (isAdmin ? "Administrador" : "Usuário");

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "hidden md:flex flex-col h-screen fixed left-0 top-0 z-40",
          "bg-sidebar/80 backdrop-blur-2xl border-r border-sidebar-border",
          "shadow-2xl shadow-black/5"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border/50">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  CODFY
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 rounded-lg hover:bg-sidebar-accent"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {allMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              const linkContent = (
                <Link
                  to={item.path}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    "hover:bg-sidebar-accent/80",
                    isActive && "bg-primary/10 text-primary shadow-sm shadow-primary/10"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                      : "bg-sidebar-accent/50 text-sidebar-foreground group-hover:bg-sidebar-accent"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={cn(
                          "font-medium text-sm whitespace-nowrap",
                          isActive ? "text-primary" : "text-sidebar-foreground/80"
                        )}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-2 w-1 h-6 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );

              return (
                <li key={item.path} className="relative">
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Controls */}
        <div className="px-2 py-3 border-t border-sidebar-border/50 space-y-2">
          {/* Theme Toggle - Only if theme supports dark mode */}
          {supportsDarkMode && (
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-xl bg-sidebar-accent/30",
              isCollapsed && "justify-center"
            )}>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleDarkMode}
                      className="h-8 w-8 rounded-lg hover:bg-sidebar-accent"
                    >
                      {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {isDarkMode ? "Modo claro" : "Modo escuro"}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div 
                  className="flex items-center bg-sidebar rounded-lg p-0.5 cursor-pointer border border-sidebar-border w-full"
                  onClick={toggleDarkMode}
                >
                  <div className={cn(
                    "flex-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5",
                    !isDarkMode 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}>
                    <Sun className="w-3.5 h-3.5" />
                    Claro
                  </div>
                  <div className={cn(
                    "flex-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5",
                    isDarkMode 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}>
                    <Moon className="w-3.5 h-3.5" />
                    Escuro
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Currency Toggle */}
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-xl bg-sidebar-accent/30",
            isCollapsed && "justify-center"
          )}>
            <div 
              className="flex items-center bg-sidebar rounded-lg p-0.5 cursor-pointer border border-sidebar-border"
              onClick={() => setCurrency(currency === 'COP' ? 'BRL' : 'COP')}
            >
              <div className={cn(
                "px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-200",
                currency === 'COP' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}>
                $
              </div>
              <div className={cn(
                "px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-200",
                currency === 'BRL' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}>
                R$
              </div>
            </div>
            
            {!isCollapsed && <DateFilterDropdown />}
          </div>

          {/* Refresh Button */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-full h-10 rounded-xl hover:bg-sidebar-accent"
                >
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Atualizar dados</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full justify-start gap-3 h-10 rounded-xl hover:bg-sidebar-accent"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              <span className="text-sm">Atualizar dados</span>
            </Button>
          )}
        </div>

        {/* User Profile */}
        <div className="p-2 border-t border-sidebar-border/50">
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-xl transition-colors",
            isCollapsed && "justify-center",
            isImpersonating 
              ? "bg-amber-500/10 border border-amber-500/30" 
              : "hover:bg-sidebar-accent/50 cursor-pointer"
          )}>
            <div className="relative">
              <Avatar className={cn(
                "h-9 w-9 border-2",
                isImpersonating ? "border-amber-500" : "border-primary/20"
              )}>
                <AvatarFallback className={cn(
                  "font-semibold text-sm",
                  isImpersonating 
                    ? "bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-600" 
                    : "bg-gradient-to-br from-primary/20 to-primary/5 text-primary"
                )}>
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              {isImpersonating && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                  <Eye className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isImpersonating && "text-amber-600"
                )}>
                  {displayName || 'Usuário'}
                </p>
                <p className={cn(
                  "text-xs truncate",
                  isImpersonating ? "text-amber-500" : "text-muted-foreground"
                )}>
                  {displayRole}
                </p>
              </div>
            )}
            
            {isImpersonating ? (
              isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStopImpersonating}
                      className="h-8 w-8 hover:bg-amber-500/20 hover:text-amber-600 absolute bottom-16 left-1/2 -translate-x-1/2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Voltar ao meu perfil</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleStopImpersonating}
                  className="h-8 w-8 hover:bg-amber-500/20 hover:text-amber-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )
            ) : (
              isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={signOut}
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive absolute bottom-16 left-1/2 -translate-x-1/2"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sair</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
