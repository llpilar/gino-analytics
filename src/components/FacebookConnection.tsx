import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Facebook, Link, Unlink, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useFacebookConnection } from "@/hooks/useFacebookConnection";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function FacebookConnection() {
  const {
    connection,
    isLoading,
    isConnecting,
    isConnected,
    startConnection,
    disconnect,
    isDisconnecting,
  } = useFacebookConnection();

  const isExpired = connection?.token_expires_at 
    ? new Date(connection.token_expires_at) < new Date()
    : false;

  return (
    <Card className="bg-card/60 border-2 border-primary/30 backdrop-blur-xl">
      <CardHeader className="p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-[#1877F2]" />
          <CardTitle className="text-foreground text-base md:text-lg">Facebook Ads</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground text-xs md:text-sm">
          Conecte sua conta para visualizar métricas de anúncios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {isExpired ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {connection?.facebook_user_name || 'Conta conectada'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isExpired ? (
                    <span className="text-destructive">Token expirado - reconecte sua conta</span>
                  ) : connection?.token_expires_at ? (
                    `Expira em ${format(new Date(connection.token_expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
                  ) : (
                    'Conectado'
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {isExpired && (
                <Button
                  onClick={startConnection}
                  disabled={isConnecting}
                  className="flex-1"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  Reconectar
                </Button>
              )}
              <Button
                onClick={() => disconnect()}
                disabled={isDisconnecting}
                variant="outline"
                className={`${isExpired ? '' : 'flex-1'} border-destructive/50 text-destructive hover:bg-destructive/10`}
              >
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Unlink className="h-4 w-4 mr-2" />
                )}
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Conecte sua conta do Facebook para visualizar métricas de todas as suas contas de anúncio e Business Managers.
            </p>
            <Button
              onClick={startConnection}
              disabled={isConnecting}
              className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Facebook className="h-4 w-4 mr-2" />
              )}
              Conectar com Facebook
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
