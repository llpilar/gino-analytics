import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Shield, LogOut, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditor } from "@/components/ProfileEditor";
import { PageHeader } from "@/components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeSelector } from "@/components/ThemeSelector";
import { FacebookConnection } from "@/components/FacebookConnection";

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
      <div className="container mx-auto px-4 py-3 md:px-6 md:py-8 lg:px-12 lg:py-12 min-h-screen pb-24 md:pb-12">
        <PageHeader 
          title="Configurações"
          subtitle="Gerencie suas preferências e informações da conta"
        />

        <div className="grid gap-4 md:gap-6 w-full">
          {/* Theme Selector */}
          <ThemeSelector />

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

          {/* Privacy Policy */}
          <Card className="bg-card/60 border-2 border-primary/30 backdrop-blur-xl">
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-foreground text-base md:text-lg">Política de Privacidade</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground text-xs md:text-sm">Informações sobre como tratamos seus dados</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Política de Privacidade
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Política de Privacidade</DialogTitle>
                    <DialogDescription>Última atualização: Dezembro 2025</DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <section>
                        <h3 className="font-semibold text-foreground mb-2">1. Coleta de Dados</h3>
                        <p>Coletamos informações que você nos fornece diretamente, como nome, email e dados de perfil. Também coletamos dados de uso do aplicativo para melhorar nossos serviços.</p>
                      </section>
                      
                      <section>
                        <h3 className="font-semibold text-foreground mb-2">2. Uso das Informações</h3>
                        <p>Utilizamos suas informações para: fornecer e manter nossos serviços, personalizar sua experiência, enviar notificações importantes e melhorar continuamente nossa plataforma.</p>
                      </section>
                      
                      <section>
                        <h3 className="font-semibold text-foreground mb-2">3. Integrações de Terceiros</h3>
                        <p>Ao conectar sua conta do Facebook ou outras plataformas, acessamos apenas os dados necessários para exibir métricas e análises. Não compartilhamos essas informações com terceiros.</p>
                      </section>
                      
                      <section>
                        <h3 className="font-semibold text-foreground mb-2">4. Segurança dos Dados</h3>
                        <p>Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração ou destruição.</p>
                      </section>
                      
                      <section>
                        <h3 className="font-semibold text-foreground mb-2">5. Seus Direitos</h3>
                        <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento. Para exercer esses direitos, entre em contato conosco através das configurações da sua conta.</p>
                      </section>
                      
                      <section>
                        <h3 className="font-semibold text-foreground mb-2">6. Cookies e Tecnologias Similares</h3>
                        <p>Utilizamos cookies para manter sua sessão ativa e melhorar sua experiência. Você pode controlar o uso de cookies através das configurações do seu navegador.</p>
                      </section>
                      
                      <section>
                        <h3 className="font-semibold text-foreground mb-2">7. Alterações nesta Política</h3>
                        <p>Podemos atualizar esta política periodicamente. Notificaremos você sobre quaisquer alterações significativas através do aplicativo ou por email.</p>
                      </section>
                      
                      <section>
                        <h3 className="font-semibold text-foreground mb-2">8. Contato</h3>
                        <p>Se você tiver dúvidas sobre esta política de privacidade, entre em contato conosco através das opções disponíveis na sua conta.</p>
                      </section>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardWrapper>
  );
}
