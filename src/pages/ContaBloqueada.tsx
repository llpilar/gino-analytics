import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX, LogOut, Mail } from "lucide-react";

export default function ContaBloqueada() {
  const { user, profile, signOut } = useAuth();

  const isRejected = profile?.status === 'rejected';
  const isSuspended = profile?.status === 'suspended';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">
            {isRejected ? "Acesso Negado" : "Conta Suspensa"}
          </CardTitle>
          <CardDescription className="text-base">
            {isRejected 
              ? "Seu cadastro foi analisado e não foi aprovado."
              : "Sua conta foi suspensa temporariamente."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Email:</strong> {user?.email}
            </p>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Se você acredita que isso é um erro, entre em contato com o suporte.
          </p>

          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" asChild>
              <a href="mailto:suporte@exemplo.com">
                <Mail className="w-4 h-4 mr-2" />
                Contatar Suporte
              </a>
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
