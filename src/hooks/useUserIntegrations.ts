import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonate } from "@/contexts/ImpersonateContext";

interface UserIntegration {
  id: string;
  user_id: string;
  integration_type: string;
  config: Record<string, any>;
  is_active: boolean;
}

export function useUserIntegrations() {
  const { user } = useAuth();
  const { getEffectiveUserId, isImpersonating } = useImpersonate();
  
  const effectiveUserId = getEffectiveUserId(user?.id);

  const { data: integrations, isLoading, error } = useQuery({
    queryKey: ['user-integrations', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', effectiveUserId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as UserIntegration[];
    },
    enabled: !!effectiveUserId,
  });

  const getIntegrationConfig = (type: string): Record<string, any> | null => {
    const integration = integrations?.find(i => i.integration_type === type);
    return integration?.config || null;
  };

  const hasIntegration = (type: string): boolean => {
    return integrations?.some(i => i.integration_type === type) || false;
  };

  return {
    integrations,
    isLoading,
    error,
    getIntegrationConfig,
    hasIntegration,
    isImpersonating,
    effectiveUserId,
  };
}
