import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Bell, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditor } from "@/components/ProfileEditor";
import { PageHeader } from "@/components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-sky-400" />
                </div>
                <div>
                  <CardTitle className="text-slate-100 text-base">Perfil</CardTitle>
                  <CardDescription className="text-slate-500 text-sm">Suas informações pessoais</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-500">Nome</label>
                <p className="text-slate-100 font-medium">{profile?.name || 'Não definido'}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Email</label>
                <p className="text-slate-100 font-medium">{user?.email || 'Não definido'}</p>
              </div>
              <ProfileEditor />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-sky-400" />
                </div>
                <div>
                  <CardTitle className="text-slate-100 text-base">Notificações</CardTitle>
                  <CardDescription className="text-slate-500 text-sm">Configure como você recebe notificações</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 text-sm">Em breve: Configurações de notificações</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-sky-400" />
                </div>
                <div>
                  <CardTitle className="text-slate-100 text-base">Segurança</CardTitle>
                  <CardDescription className="text-slate-500 text-sm">Gerencie a segurança da sua conta</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-500 text-sm">Em breve: Alteração de senha e autenticação</p>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40"
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
