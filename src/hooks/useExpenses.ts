import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  category: string | null;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface PartnersConfig {
  id: string;
  partner1_name: string;
  partner2_name: string;
}

export const useExpenses = () => {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    },
  });
};

export const usePartnersConfig = () => {
  return useQuery({
    queryKey: ['partners-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners_config')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data as PartnersConfig | null;
    },
  });
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
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
  
  return useMutation({
    mutationFn: async (id: string) => {
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
  
  return useMutation({
    mutationFn: async (config: { partner1_name: string; partner2_name: string }) => {
      const { data: existing } = await supabase
        .from('partners_config')
        .select('id')
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
          .insert(config);
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
