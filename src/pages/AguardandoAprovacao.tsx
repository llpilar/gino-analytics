import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut, RefreshCw } from "lucide-react";

export default function AguardandoAprovacao() {
  const { user, profile, isApproved, isAdmin, signOut, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    // Se foi aprovado ou é admin, redireciona para home
    if (!loading && (isApproved || isAdmin)) {
      navigate("/");
    }
  }, [user, loading, isApproved, isAdmin, navigate]);

  const handleRefresh = async () => {
    await refreshProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          <CardTitle className="text-2xl">Aguardando Aprovação</CardTitle>
          <CardDescription className="text-base">
            Sua conta está em análise. Você receberá acesso assim que um administrador aprovar seu cadastro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Email:</strong> {user?.email}
            </p>
            {profile?.name && (
              <p className="text-sm text-muted-foreground mt-1">
                <strong>Nome:</strong> {profile.name}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleRefresh} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Verificar Status
            </Button>
            <Button onClick={signOut} variant="ghost" className="w-full text-muted-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
