import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, User, Bell, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditor } from "@/components/ProfileEditor";

export default function Configuracoes() {
  const { profile, user } = useAuth();

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">Configurações</h1>
          </div>
          <p className="text-zinc-400">Gerencie suas preferências e informações da conta</p>
        </div>

        <div className="grid gap-6 max-w-4xl">
          <Card className="glass-card border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-white">Perfil</CardTitle>
              </div>
              <CardDescription>Suas informações pessoais</CardDescription>
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

          <Card className="glass-card border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-white">Notificações</CardTitle>
              </div>
              <CardDescription>Configure como você recebe notificações</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400 text-sm">Em breve: Configurações de notificações</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-white">Segurança</CardTitle>
              </div>
              <CardDescription>Gerencie a segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400 text-sm">Em breve: Alteração de senha e autenticação</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}