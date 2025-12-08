import { Bell, BellOff, Send, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
        <div className="flex items-center gap-2 mb-2">
          <BellOff className="h-5 w-5 text-destructive" />
          <span className="font-medium text-destructive">Não suportado</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Seu navegador não suporta notificações push. Tente usar Chrome, Firefox ou Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Smartphone className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium">
              {isSubscribed 
                ? 'Notificações ativadas' 
                : 'Ative as notificações push'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? 'Você receberá alertas quando houver novas vendas'
                : 'Receba alertas no celular quando uma venda for realizada'}
            </p>
          </div>
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
          <Button 
            variant="destructive" 
            onClick={unsubscribe} 
            disabled={isLoading}
          >
            <BellOff className="h-4 w-4 mr-2" />
            Desativar
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={sendTestNotification}
          className="flex-1"
        >
          <Send className="h-4 w-4 mr-2" />
          Testar Notificação
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-muted/30">
        <p>📱 <strong>Dica:</strong> Para melhor experiência, instale o app:</p>
        <ul className="list-disc list-inside ml-4 space-y-0.5">
          <li><strong>iPhone:</strong> Safari → Compartilhar → Adicionar à Tela de Início</li>
          <li><strong>Android:</strong> Chrome → Menu (⋮) → Instalar aplicativo</li>
        </ul>
      </div>
    </div>
  );
};
