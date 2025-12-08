import { Bell, BellOff, Send, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Badge } from '@/components/ui/badge';

export const PushNotificationSettings = () => {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-destructive" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push. Tente usar Chrome, Firefox ou Edge.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificações Push
            </CardTitle>
            <CardDescription className="mt-1">
              Receba alertas no celular quando uma nova venda for realizada
            </CardDescription>
          </div>
          {isSubscribed ? (
            <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
              Ativo
            </Badge>
          ) : (
            <Badge variant="secondary">
              Inativo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          <Smartphone className="h-10 w-10 text-primary" />
          <div className="flex-1">
            <p className="font-medium">
              {isSubscribed 
                ? 'Notificações ativadas' 
                : 'Ative as notificações push'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? 'Você receberá alertas quando houver novas vendas'
                : 'Instale o app e receba alertas de vendas no celular'}
            </p>
          </div>
        </div>

        {permission === 'denied' && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Permissão negada. Para ativar, vá nas configurações do navegador e permita notificações para este site.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!isSubscribed ? (
            <Button 
              onClick={subscribe} 
              disabled={isLoading || permission === 'denied'}
              className="flex-1"
            >
              <Bell className="h-4 w-4 mr-2" />
              {isLoading ? 'Ativando...' : 'Ativar Notificações'}
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={sendTestNotification}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Teste
              </Button>
              <Button 
                variant="destructive" 
                onClick={unsubscribe} 
                disabled={isLoading}
              >
                <BellOff className="h-4 w-4 mr-2" />
                Desativar
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>📱 <strong>Dica:</strong> Para melhor experiência, instale o app:</p>
          <ul className="list-disc list-inside ml-4 space-y-0.5">
            <li><strong>iPhone:</strong> Safari → Compartilhar → Adicionar à Tela de Início</li>
            <li><strong>Android:</strong> Chrome → Menu (⋮) → Instalar aplicativo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
