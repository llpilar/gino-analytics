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
      <div className="container mx-auto p-6 md:p-8 lg:p-12">
        <PageHeader 
          title="Configurações"
          subtitle="Gerencie suas preferências e informações da conta"
        />

        <div className="grid gap-6 max-w-4xl">
          {/* Theme Selector */}
          <ThemeSelector />

          <Card className="bg-black/60 border-2 border-cyan-500/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-white">Perfil</CardTitle>
              </div>
              <CardDescription className="text-gray-400">Suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400">Nome</label>
                <p className="text-white font-medium">{profile?.name || 'Não definido'}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-400">Email</label>
                <p className="text-white font-medium">{user?.email || 'Não definido'}</p>
              </div>
              <ProfileEditor />
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-2 border-cyan-500/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-white">Notificações</CardTitle>
              </div>
              <CardDescription className="text-gray-400">Configure como você recebe notificações</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">Em breve: Configurações de notificações</p>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-2 border-cyan-500/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-white">Segurança</CardTitle>
              </div>
              <CardDescription className="text-gray-400">Gerencie a segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400 text-sm">Em breve: Alteração de senha e autenticação</p>
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