import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { format } from "date-fns";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  category: string | null;
  expense_date: string;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnersConfig {
  id: string;
  partner1_name: string;
  partner2_name: string;
}

export const useExpenses = () => {
  const { dateRange } = useDateFilter();
  
  return useQuery({
    queryKey: ['expenses', dateRange.from, dateRange.to],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*')
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

export const uploadReceipt = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
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
