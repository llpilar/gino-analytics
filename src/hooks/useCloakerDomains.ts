import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CloakerDomain {
  id: string;
  user_id: string;
  domain: string;
  is_verified: boolean;
  is_default: boolean;
  verification_token: string;
  ssl_status: "pending" | "provisioning" | "active" | "failed";
  dns_status: "pending" | "verified" | "failed";
  last_check_at: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDomainData {
  domain: string;
  is_default?: boolean;
}

export function useCloakerDomains() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: domains, isLoading, error } = useQuery({
    queryKey: ["cloaker-domains", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("cloaker_domains")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CloakerDomain[];
    },
    enabled: !!user?.id,
  });

  const createDomain = useMutation({
    mutationFn: async (data: CreateDomainData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Normalize domain (remove protocol, trailing slash)
      const normalizedDomain = data.domain
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .trim();

      // Validate domain format
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
      if (!domainRegex.test(normalizedDomain)) {
        throw new Error("Formato de domínio inválido");
      }

      // If setting as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from("cloaker_domains")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("is_default", true);
      }

      const { data: newDomain, error } = await supabase
        .from("cloaker_domains")
        .insert({
          user_id: user.id,
          domain: normalizedDomain,
          is_default: data.is_default || false,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Este domínio já está cadastrado");
        }
        throw error;
      }

      return newDomain as CloakerDomain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloaker-domains"] });
      toast.success("Domínio adicionado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar domínio");
    },
  });

  const updateDomain = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CloakerDomain> & { id: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // If setting as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from("cloaker_domains")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("is_default", true);
      }

      const { data: updated, error } = await supabase
        .from("cloaker_domains")
        .update(data)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return updated as CloakerDomain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloaker-domains"] });
      toast.success("Domínio atualizado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar domínio");
    },
  });

  const deleteDomain = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("cloaker_domains")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloaker-domains"] });
      toast.success("Domínio removido!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover domínio");
    },
  });

  const verifyDomain = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Get domain info
      const { data: domain, error: fetchError } = await supabase
        .from("cloaker_domains")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !domain) throw new Error("Domínio não encontrado");

      // Simulate DNS check (in production, would call edge function)
      // For now, we'll just update the status
      const { data: updated, error } = await supabase
        .from("cloaker_domains")
        .update({
          last_check_at: new Date().toISOString(),
          dns_status: "verified",
          is_verified: true,
          verified_at: new Date().toISOString(),
          ssl_status: "active",
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return updated as CloakerDomain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloaker-domains"] });
      toast.success("Domínio verificado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao verificar domínio");
    },
  });

  const setAsDefault = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Unset all defaults first
      await supabase
        .from("cloaker_domains")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Set new default
      const { data: updated, error } = await supabase
        .from("cloaker_domains")
        .update({ is_default: true })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return updated as CloakerDomain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloaker-domains"] });
      toast.success("Domínio padrão definido!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao definir domínio padrão");
    },
  });

  const defaultDomain = domains?.find((d) => d.is_default && d.is_verified);
  const verifiedDomains = domains?.filter((d) => d.is_verified) || [];

  return {
    domains: domains || [],
    verifiedDomains,
    defaultDomain,
    isLoading,
    error,
    createDomain,
    updateDomain,
    deleteDomain,
    verifyDomain,
    setAsDefault,
  };
}
