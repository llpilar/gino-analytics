import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notificações push não são suportadas neste navegador');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Permissão concedida para notificações');
        return true;
      } else if (result === 'denied') {
        toast.error('Permissão negada para notificações');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Erro ao solicitar permissão');
      return false;
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) {
      toast.error('Não foi possível ativar notificações');
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission first
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoading(false);
          return false;
        }
      }

      // Get VAPID public key from edge function
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke('push-notifications', {
        body: { action: 'get-vapid-key' }
      });

      if (vapidError || !vapidData?.publicKey) {
        throw new Error('Erro ao obter chave VAPID');
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      // Save subscription to backend
      const { error: saveError } = await supabase.functions.invoke('push-notifications', {
        body: {
          action: 'subscribe',
          subscription: subscriptionData,
          userId: user.id,
        },
      });

      if (saveError) {
        throw saveError;
      }

      setIsSubscribed(true);
      toast.success('Notificações push ativadas com sucesso!');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Erro ao ativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user, permission]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove subscription from backend
        await supabase.functions.invoke('push-notifications', {
          body: {
            action: 'unsubscribe',
            userId: user.id,
          },
        });
      }

      setIsSubscribed(false);
      toast.success('Notificações push desativadas');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Erro ao desativar notificações');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const sendTestNotification = async () => {
    if (!isSubscribed || !user) {
      toast.error('Ative as notificações primeiro');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('push-notifications', {
        body: {
          action: 'send-test',
          userId: user.id,
        },
      });

      if (error) {
        throw error;
      }

      // Show a local notification as test
      if (Notification.permission === 'granted') {
        new Notification('🎉 Teste de Notificação', {
          body: 'As notificações estão funcionando! Você receberá alertas de vendas.',
          icon: '/app-icon.png',
          tag: 'test',
        });
      }

      toast.success('Notificações configuradas com sucesso!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Erro ao testar notificação');
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
};

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
