import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FacebookConnection {
  id: string;
  user_id: string;
  facebook_user_id: string | null;
  facebook_user_name: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useFacebookConnection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch current connection
  const { data: connection, isLoading, refetch } = useQuery({
    queryKey: ['facebook-connection', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('facebook_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as FacebookConnection | null;
    },
    enabled: !!user,
  });

  // Check for pending connection from OAuth callback
  useEffect(() => {
    const checkPendingConnection = async () => {
      if (!user) return;

      const pendingData = localStorage.getItem('fb_pending_connection');
      if (!pendingData) return;

      try {
        const pending = JSON.parse(pendingData);
        localStorage.removeItem('fb_pending_connection');

        // Save to database
        const { error } = await supabase
          .from('facebook_connections')
          .upsert({
            user_id: user.id,
            access_token: pending.access_token,
            facebook_user_id: pending.facebook_user_id,
            facebook_user_name: pending.facebook_user_name,
            token_expires_at: pending.token_expires_at,
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;

        toast({
          title: 'Facebook conectado!',
          description: `Conta ${pending.facebook_user_name} conectada com sucesso.`,
        });

        refetch();
      } catch (error) {
        console.error('Error saving Facebook connection:', error);
        toast({
          title: 'Erro ao conectar',
          description: 'Não foi possível salvar a conexão do Facebook.',
          variant: 'destructive',
        });
      }
    };

    checkPendingConnection();
  }, [user, toast, refetch]);

  // Check URL params for success/error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fbSuccess = params.get('fb_success');
    const fbError = params.get('fb_error');

    if (fbError) {
      toast({
        title: 'Erro na conexão',
        description: decodeURIComponent(fbError),
        variant: 'destructive',
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (fbSuccess) {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  // Start OAuth flow
  const startConnection = async () => {
    setIsConnecting(true);
    try {
      const redirectUrl = window.location.origin + '/configuracoes';
      
      const { data, error } = await supabase.functions.invoke('facebook-oauth-start', {
        body: { redirectUrl }
      });

      if (error) throw error;
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error starting OAuth:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a conexão com o Facebook.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  // Disconnect
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('facebook_connections')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-connection'] });
      toast({
        title: 'Facebook desconectado',
        description: 'Sua conta do Facebook foi desconectada.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível desconectar o Facebook.',
        variant: 'destructive',
      });
    },
  });

  return {
    connection,
    isLoading,
    isConnecting,
    isConnected: !!connection,
    startConnection,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
  };
}
