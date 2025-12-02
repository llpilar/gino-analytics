import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, User, Bell, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditor } from "@/components/ProfileEditor";

export default function Configuracoes() {
  const { profile, user } = useAuth();

  return (
    <DashboardWrapper>
      <div className="container mx-auto p-6 md:p-8 lg:p-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
              <SettingsIcon className="h-7 w-7 text-orange-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
              Settings
            </h1>
          </div>
          <p className="text-gray-400 text-sm md:text-base">Gerencie suas preferências e informações da conta</p>
        </div>

        <div className="grid gap-6 max-w-4xl">
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
            <CardContent>
              <p className="text-gray-400 text-sm">Em breve: Alteração de senha e autenticação</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardWrapper>
  );
}