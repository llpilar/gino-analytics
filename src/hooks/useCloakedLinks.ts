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
  min_score: number;
  collect_fingerprint: boolean;
  require_behavior: boolean;
  behavior_time_ms: number;
  created_at: string;
  updated_at: string;
}

interface CloakerVisitor {
  id: string;
  link_id: string;
  fingerprint_hash: string;
  score: number;
  decision: string;
  user_agent: string;
  country_code: string;
  is_bot: boolean;
  is_headless: boolean;
  score_fingerprint: number;
  score_behavior: number;
  score_network: number;
  score_automation: number;
  created_at: string;
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
  min_score?: number;
  collect_fingerprint?: boolean;
  require_behavior?: boolean;
  behavior_time_ms?: number;
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
  min_score?: number;
  collect_fingerprint?: boolean;
  require_behavior?: boolean;
  behavior_time_ms?: number;
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

export function useCloakerVisitors(linkId: string | null) {
  return useQuery({
    queryKey: ["cloaker-visitors", linkId],
    queryFn: async () => {
      if (!linkId) return [];
      
      const { data, error } = await supabase
        .from("cloaker_visitors")
        .select("*")
        .eq("link_id", linkId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as CloakerVisitor[];
    },
    enabled: !!linkId,
  });
}

export function useCloakerStats(linkId: string | null) {
  return useQuery({
    queryKey: ["cloaker-stats", linkId],
    queryFn: async () => {
      if (!linkId) return null;
      
      const { data, error } = await supabase
        .from("cloaker_visitors")
        .select("score, decision, is_bot, is_headless")
        .eq("link_id", linkId);

      if (error) throw error;
      
      const visitors = data || [];
      const total = visitors.length;
      const allowed = visitors.filter(v => v.decision === "allow").length;
      const blocked = visitors.filter(v => v.decision === "block" || v.decision === "safe").length;
      const bots = visitors.filter(v => v.is_bot).length;
      const headless = visitors.filter(v => v.is_headless).length;
      const avgScore = total > 0 ? visitors.reduce((acc, v) => acc + v.score, 0) / total : 0;

      return { total, allowed, blocked, bots, headless, avgScore };
    },
    enabled: !!linkId,
  });
}