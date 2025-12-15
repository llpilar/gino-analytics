import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditor } from "@/components/ProfileEditor";
import { PageHeader } from "@/components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeSelector } from "@/components/ThemeSelector";
import { FacebookConnection } from "@/components/FacebookConnection";
import { VisualEffectsToggle } from "@/components/VisualEffectsToggle";
import { DashboardSettingsToggle } from "@/components/DashboardSettingsToggle";

export default function Configuracoes() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/auth");
  };

  return (
    <DashboardWrapper>
      <div className="w-full max-w-[2400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-3 md:py-6 lg:py-8 min-h-screen pb-24 md:pb-12">
        <PageHeader 
          title="Configurações"
          subtitle="Gerencie suas preferências e informações da conta"
        />

        <div className="grid gap-4 md:gap-6 w-full">
          {/* Theme Selector */}
          <ThemeSelector />

          {/* Visual Effects Toggle */}
          <VisualEffectsToggle />

          {/* Dashboard Settings */}
          <DashboardSettingsToggle />

          {/* Facebook Connection */}
          <FacebookConnection />

          <Card className="bg-card/60 border-2 border-primary/30 backdrop-blur-xl">
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-foreground text-base md:text-lg">Perfil</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground text-xs md:text-sm">Suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
              <div>
                <label className="text-xs md:text-sm text-muted-foreground">Nome</label>
                <p className="text-foreground font-medium text-sm md:text-base">{profile?.name || 'Não definido'}</p>
              </div>
              <div>
                <label className="text-xs md:text-sm text-muted-foreground">Email</label>
                <p className="text-foreground font-medium text-sm md:text-base break-all">{user?.email || 'Não definido'}</p>
              </div>
              <ProfileEditor />
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-2 border-primary/30 backdrop-blur-xl">
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-foreground text-base md:text-lg">Segurança</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground text-xs md:text-sm">Gerencie a segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
              <p className="text-muted-foreground text-xs md:text-sm">Em breve: Alteração de senha e autenticação</p>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
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
