import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Bell, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditor } from "@/components/ProfileEditor";
import { PageHeader } from "@/components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeSelector } from "@/components/ThemeSelector";

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
      <div className="container mx-auto p-6 md:p-8 lg:p-12 min-h-screen">
        <PageHeader 
          title="Configurações"
          subtitle="Gerencie suas preferências e informações da conta"
        />

        <div className="grid gap-6 w-full">
          {/* Theme Selector */}
          <ThemeSelector />

          <Card className="bg-card/60 border-2 border-primary/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-foreground">Perfil</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">Suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <p className="text-foreground font-medium">{profile?.name || 'Não definido'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="text-foreground font-medium">{user?.email || 'Não definido'}</p>
              </div>
              <ProfileEditor />
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-2 border-primary/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-foreground">Notificações</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">Configure como você recebe notificações</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Em breve: Configurações de notificações</p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-2 border-primary/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-foreground">Segurança</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">Gerencie a segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">Em breve: Alteração de senha e autenticação</p>
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
