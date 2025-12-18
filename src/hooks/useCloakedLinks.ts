import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CloakedLink {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  safe_url: string;
  target_url: string;
  is_active: boolean;
  allowed_countries: string[] | null;
  blocked_countries: string[] | null;
  allowed_devices: string[] | null;
  block_bots: boolean;
  clicks_count: number;
  created_at: string;
  updated_at: string;
}

interface CreateLinkData {
  name: string;
  slug: string;
  safe_url: string;
  target_url: string;
  allowed_countries: string[] | null;
  blocked_countries: string[] | null;
  allowed_devices: string[] | null;
  block_bots: boolean;
}

interface UpdateLinkData {
  id: string;
  is_active?: boolean;
  name?: string;
  slug?: string;
  safe_url?: string;
  target_url?: string;
  allowed_countries?: string[] | null;
  blocked_countries?: string[] | null;
  allowed_devices?: string[] | null;
  block_bots?: boolean;
}

export function useCloakedLinks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["cloaked-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cloaked_links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CloakedLink[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateLinkData) => {
      const { error } = await supabase.from("cloaked_links").insert({
        ...data,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloaked-links"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: UpdateLinkData) => {
      const { error } = await supabase
        .from("cloaked_links")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloaked-links"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cloaked_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloaked-links"] });
    },
  });

  return {
    links,
    isLoading,
    createLink: createMutation.mutateAsync,
    updateLink: updateMutation.mutateAsync,
    deleteLink: deleteMutation.mutateAsync,
  };
}