import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useUserIntegrations } from "@/hooks/useUserIntegrations";
import { format } from "date-fns";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  category: string | null;
  expense_date: string;
  receipt_url: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PartnersConfig {
  id: string;
  partner1_name: string;
  partner2_name: string;
  user_id: string;
}

export const useExpenses = () => {
  const { dateRange } = useDateFilter();
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['expenses', dateRange.from, dateRange.to, effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('expense_date', { ascending: false });
      
      if (dateRange.from) {
        query = query.gte('expense_date', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange.to) {
        query = query.lte('expense_date', format(dateRange.to, 'yyyy-MM-dd'));
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!effectiveUserId,
  });
};

export const usePartnersConfig = () => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['partners-config', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return null;
      
      const { data, error } = await supabase
        .from('partners_config')
        .select('*')
        .eq('user_id', effectiveUserId)
        .maybeSingle();
      
      if (error) throw error;
      return data as PartnersConfig | null;
    },
    enabled: !!effectiveUserId,
  });
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  const { effectiveUserId, isImpersonating } = useUserIntegrations();
  
  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!effectiveUserId) throw new Error('User not authenticated');
      if (isImpersonating) throw new Error('Não é possível adicionar despesas enquanto visualiza outro usuário');
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...expense, user_id: effectiveUserId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Despesa adicionada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar despesa: ' + error.message);
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const { isImpersonating } = useUserIntegrations();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (isImpersonating) throw new Error('Não é possível remover despesas enquanto visualiza outro usuário');
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Despesa removida com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover despesa: ' + error.message);
    },
  });
};

export const useUpdatePartnersConfig = () => {
  const queryClient = useQueryClient();
  const { effectiveUserId, isImpersonating } = useUserIntegrations();
  
  return useMutation({
    mutationFn: async (config: { partner1_name: string; partner2_name: string }) => {
      if (!effectiveUserId) throw new Error('User not authenticated');
      if (isImpersonating) throw new Error('Não é possível atualizar configurações enquanto visualiza outro usuário');
      
      const { data: existing } = await supabase
        .from('partners_config')
        .select('id')
        .eq('user_id', effectiveUserId)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('partners_config')
          .update(config)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('partners_config')
          .insert({ ...config, user_id: effectiveUserId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners-config'] });
      toast.success('Nomes dos sócios atualizados!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar nomes: ' + error.message);
    },
  });
};

export const uploadReceipt = async (file: File): Promise<string | null> => {
  // Get current user for folder-based storage policy
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast.error('Usuário não autenticado');
    return null;
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from('expense-receipts')
    .upload(fileName, file);
  
  if (error) {
    toast.error('Erro ao enviar comprovante: ' + error.message);
    return null;
  }
  
  // Return the file path - we'll generate signed URLs when displaying
  return fileName;
};

// Generate a signed URL for viewing a receipt (expires in 1 hour)
export const getReceiptSignedUrl = async (filePath: string): Promise<string | null> => {
  // If it's already a full URL (legacy public URLs), return as-is
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  const { data, error } = await supabase.storage
    .from('expense-receipts')
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  
  if (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
  
  return data.signedUrl;
};

// Fixed Expenses
export interface FixedExpense {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  category: string | null;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useFixedExpenses = () => {
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['fixed-expenses', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      
      const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FixedExpense[];
    },
    enabled: !!effectiveUserId,
  });
};

export const useAddFixedExpense = () => {
  const queryClient = useQueryClient();
  const { effectiveUserId, isImpersonating } = useUserIntegrations();
  
  return useMutation({
    mutationFn: async (expense: Omit<FixedExpense, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!effectiveUserId) throw new Error('User not authenticated');
      if (isImpersonating) throw new Error('Não é possível adicionar gastos fixos enquanto visualiza outro usuário');
      
      const { data, error } = await supabase
        .from('fixed_expenses')
        .insert({ ...expense, user_id: effectiveUserId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
      toast.success('Gasto fixo adicionado!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar gasto fixo: ' + error.message);
    },
  });
};

export const useDeleteFixedExpense = () => {
  const queryClient = useQueryClient();
  const { isImpersonating } = useUserIntegrations();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (isImpersonating) throw new Error('Não é possível remover gastos fixos enquanto visualiza outro usuário');
      
      const { error } = await supabase
        .from('fixed_expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
      toast.success('Gasto fixo removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover gasto fixo: ' + error.message);
    },
  });
};

export const useToggleFixedExpense = () => {
  const queryClient = useQueryClient();
  const { isImpersonating } = useUserIntegrations();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (isImpersonating) throw new Error('Não é possível atualizar gastos fixos enquanto visualiza outro usuário');
      
      const { error } = await supabase
        .from('fixed_expenses')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar gasto fixo: ' + error.message);
    },
  });
};

// Withdrawals (Saques)
export interface Withdrawal {
  id: string;
  partner_name: string;
  amount: number;
  description: string | null;
  withdrawal_date: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useWithdrawals = () => {
  const { dateRange } = useDateFilter();
  const { effectiveUserId } = useUserIntegrations();
  
  return useQuery({
    queryKey: ['withdrawals', dateRange.from, dateRange.to, effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      
      let query = supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('withdrawal_date', { ascending: false });
      
      if (dateRange.from) {
        query = query.gte('withdrawal_date', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange.to) {
        query = query.lte('withdrawal_date', format(dateRange.to, 'yyyy-MM-dd'));
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Withdrawal[];
    },
    enabled: !!effectiveUserId,
  });
};

export const useAddWithdrawal = () => {
  const queryClient = useQueryClient();
  const { effectiveUserId, isImpersonating } = useUserIntegrations();
  
  return useMutation({
    mutationFn: async (withdrawal: Omit<Withdrawal, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!effectiveUserId) throw new Error('User not authenticated');
      if (isImpersonating) throw new Error('Não é possível adicionar saques enquanto visualiza outro usuário');
      
      const { data, error } = await supabase
        .from('withdrawals')
        .insert({ ...withdrawal, user_id: effectiveUserId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      toast.success('Saque registrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar saque: ' + error.message);
    },
  });
};

export const useDeleteWithdrawal = () => {
  const queryClient = useQueryClient();
  const { isImpersonating } = useUserIntegrations();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (isImpersonating) throw new Error('Não é possível remover saques enquanto visualiza outro usuário');
      
      const { error } = await supabase
        .from('withdrawals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      toast.success('Saque removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover saque: ' + error.message);
    },
  });
};
