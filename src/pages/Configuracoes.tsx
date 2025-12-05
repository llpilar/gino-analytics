import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Bell, Shield, LogOut, Palette, Sparkles, MonitorSmartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditor } from "@/components/ProfileEditor";
import { PageHeader } from "@/components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTheme, ThemeVariant } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const themes: { id: ThemeVariant; name: string; description: string; icon: React.ReactNode; preview: string }[] = [
  {
    id: "neon",
    name: "Neon Cyberpunk",
    description: "Visual vibrante com cores neon e bordas brilhantes",
    icon: <Sparkles className="h-5 w-5" />,
    preview: "bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-cyan-500/50",
  },
  {
    id: "glass",
    name: "Liquid Glass",
    description: "Glassmorphism elegante com blur e transparências",
    icon: <MonitorSmartphone className="h-5 w-5" />,
    preview: "bg-white/[0.05] backdrop-blur-xl border-white/20",
  },
];

export default function Configuracoes() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/auth");
  };

  const handleThemeChange = (newTheme: ThemeVariant) => {
    setTheme(newTheme);
    toast({
      title: "Tema alterado",
      description: `Tema "${themes.find(t => t.id === newTheme)?.name}" aplicado com sucesso.`,
    });
  };

  return (
    <DashboardWrapper>
      <div className="container mx-auto p-6 md:p-8 lg:p-12">
        <PageHeader 
          title="Configurações"
          subtitle="Gerencie suas preferências e informações da conta"
        />

        <div className="grid gap-6 max-w-4xl">
          {/* Theme Selector */}
          <Card className="glass-panel">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-white">Aparência</CardTitle>
              </div>
              <CardDescription className="text-neutral-400">Escolha o tema visual do dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all duration-300 text-left group",
                      theme === t.id
                        ? "border-cyan-400/60 bg-cyan-400/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    )}
                  >
                    {/* Preview area */}
                    <div className={cn(
                      "h-20 rounded-lg mb-3 border transition-all duration-300",
                      t.preview
                    )}>
                      <div className="p-2 h-full flex flex-col gap-1">
                        <div className="h-2 w-12 rounded bg-white/20" />
                        <div className="h-2 w-8 rounded bg-white/10" />
                        <div className="flex gap-1 mt-auto">
                          <div className="h-3 w-3 rounded bg-cyan-400/40" />
                          <div className="h-3 w-3 rounded bg-purple-400/40" />
                          <div className="h-3 w-3 rounded bg-green-400/40" />
                        </div>
                      </div>
                    </div>

                    {/* Theme info */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "transition-colors",
                        theme === t.id ? "text-cyan-400" : "text-neutral-400"
                      )}>
                        {t.icon}
                      </span>
                      <h3 className={cn(
                        "font-semibold transition-colors",
                        theme === t.id ? "text-white" : "text-neutral-200"
                      )}>
                        {t.name}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-400">{t.description}</p>

                    {/* Active indicator */}
                    {theme === t.id && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-white">Perfil</CardTitle>
              </div>
              <CardDescription className="text-neutral-400">Suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400">Nome</label>
                <p className="text-white font-medium">{profile?.name || 'Não definido'}</p>
              </div>
              <div>
                <label className="text-sm text-neutral-400">Email</label>
                <p className="text-white font-medium">{user?.email || 'Não definido'}</p>
              </div>
              <ProfileEditor />
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-white">Notificações</CardTitle>
              </div>
              <CardDescription className="text-neutral-400">Configure como você recebe notificações</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 text-sm">Em breve: Configurações de notificações</p>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-white">Segurança</CardTitle>
              </div>
              <CardDescription className="text-neutral-400">Gerencie a segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-400 text-sm">Em breve: Alteração de senha e autenticação</p>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair da conta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardWrapper>
  );
}
