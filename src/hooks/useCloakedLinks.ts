import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TargetUrl {
  url: string;
  weight: number;
}

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
  // Advanced fields
  max_clicks_daily: number | null;
  max_clicks_total: number | null;
  allowed_hours_start: number | null;
  allowed_hours_end: number | null;
  passthrough_utm: boolean;
  rate_limit_per_ip: number | null;
  rate_limit_window_minutes: number;
  target_urls: TargetUrl[] | null;
  blocked_isps: string[] | null;
  blocked_asns: string[] | null;
  block_vpn: boolean;
  block_proxy: boolean;
  block_datacenter: boolean;
  block_tor: boolean;
  redirect_delay_ms: number;
  custom_user_agents: string[] | null;
  whitelist_ips: string[] | null;
  blacklist_ips: string[] | null;
  clicks_today: number;
  last_click_reset: string;
  // New filter fields
  allowed_referers: string[] | null;
  blocked_referers: string[] | null;
  required_url_params: Record<string, string> | null;
  blocked_url_params: Record<string, string> | null;
  allowed_languages: string[] | null;
  blocked_languages: string[] | null;
  // Webhook fields
  webhook_url: string | null;
  webhook_enabled: boolean;
  webhook_events: string[] | null;
}

interface CloakerVisitor {
  id: string;
  link_id: string;
  fingerprint_hash: string;
  score: number;
  decision: string;
  user_agent: string;
  country_code: string;
  city: string | null;
  is_bot: boolean;
  is_headless: boolean;
  is_vpn: boolean | null;
  is_proxy: boolean | null;
  is_datacenter: boolean | null;
  is_tor: boolean | null;
  isp: string | null;
  asn: string | null;
  score_fingerprint: number;
  score_behavior: number;
  score_network: number;
  score_automation: number;
  referer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  redirect_url: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

interface CreateLinkData {
  name: string;
  slug: string;
  safe_url: string;
  target_url: string;
  allowed_countries?: string[] | null;
  blocked_countries?: string[] | null;
  allowed_devices?: string[] | null;
  block_bots?: boolean;
  min_score?: number;
  collect_fingerprint?: boolean;
  require_behavior?: boolean;
  behavior_time_ms?: number;
  max_clicks_daily?: number | null;
  max_clicks_total?: number | null;
  allowed_hours_start?: number | null;
  allowed_hours_end?: number | null;
  passthrough_utm?: boolean;
  rate_limit_per_ip?: number | null;
  rate_limit_window_minutes?: number;
  target_urls?: TargetUrl[] | null;
  blocked_isps?: string[] | null;
  blocked_asns?: string[] | null;
  block_vpn?: boolean;
  block_proxy?: boolean;
  block_datacenter?: boolean;
  block_tor?: boolean;
  redirect_delay_ms?: number;
  whitelist_ips?: string[] | null;
  blacklist_ips?: string[] | null;
  // New filter fields
  allowed_referers?: string[] | null;
  blocked_referers?: string[] | null;
  required_url_params?: Record<string, string> | null;
  blocked_url_params?: Record<string, string> | null;
  allowed_languages?: string[] | null;
  blocked_languages?: string[] | null;
  // Webhook fields
  webhook_url?: string | null;
  webhook_enabled?: boolean;
  webhook_events?: string[] | null;
}

interface UpdateLinkData extends Partial<CreateLinkData> {
  id: string;
  is_active?: boolean;
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
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CloakedLink[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateLinkData) => {
      const { error } = await supabase.from("cloaked_links").insert({
        name: data.name,
        slug: data.slug,
        safe_url: data.safe_url,
        target_url: data.target_url,
        user_id: user!.id,
        allowed_countries: data.allowed_countries || null,
        blocked_countries: data.blocked_countries || null,
        allowed_devices: data.allowed_devices || null,
        block_bots: data.block_bots ?? true,
        min_score: data.min_score ?? 40,
        collect_fingerprint: data.collect_fingerprint ?? true,
        require_behavior: data.require_behavior ?? false,
        behavior_time_ms: data.behavior_time_ms ?? 2000,
        max_clicks_daily: data.max_clicks_daily || null,
        max_clicks_total: data.max_clicks_total || null,
        allowed_hours_start: data.allowed_hours_start ?? null,
        allowed_hours_end: data.allowed_hours_end ?? null,
        passthrough_utm: data.passthrough_utm ?? true,
        rate_limit_per_ip: data.rate_limit_per_ip || null,
        rate_limit_window_minutes: data.rate_limit_window_minutes ?? 60,
        target_urls: data.target_urls ? JSON.stringify(data.target_urls) : null,
        blocked_isps: data.blocked_isps || null,
        blocked_asns: data.blocked_asns || null,
        block_vpn: data.block_vpn ?? true,
        block_proxy: data.block_proxy ?? true,
        block_datacenter: data.block_datacenter ?? true,
        block_tor: data.block_tor ?? true,
        redirect_delay_ms: data.redirect_delay_ms ?? 0,
        whitelist_ips: data.whitelist_ips || null,
        blacklist_ips: data.blacklist_ips || null,
        // New filter fields
        allowed_referers: data.allowed_referers || null,
        blocked_referers: data.blocked_referers || null,
        required_url_params: data.required_url_params || null,
        blocked_url_params: data.blocked_url_params || null,
        allowed_languages: data.allowed_languages || null,
        blocked_languages: data.blocked_languages || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloaked-links"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: UpdateLinkData) => {
      const updateData: Record<string, unknown> = {};
      
      // Only include fields that are explicitly set
      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.safe_url !== undefined) updateData.safe_url = data.safe_url;
      if (data.target_url !== undefined) updateData.target_url = data.target_url;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.allowed_countries !== undefined) updateData.allowed_countries = data.allowed_countries;
      if (data.blocked_countries !== undefined) updateData.blocked_countries = data.blocked_countries;
      if (data.allowed_devices !== undefined) updateData.allowed_devices = data.allowed_devices;
      if (data.block_bots !== undefined) updateData.block_bots = data.block_bots;
      if (data.min_score !== undefined) updateData.min_score = data.min_score;
      if (data.collect_fingerprint !== undefined) updateData.collect_fingerprint = data.collect_fingerprint;
      if (data.require_behavior !== undefined) updateData.require_behavior = data.require_behavior;
      if (data.behavior_time_ms !== undefined) updateData.behavior_time_ms = data.behavior_time_ms;
      if (data.max_clicks_daily !== undefined) updateData.max_clicks_daily = data.max_clicks_daily;
      if (data.max_clicks_total !== undefined) updateData.max_clicks_total = data.max_clicks_total;
      if (data.allowed_hours_start !== undefined) updateData.allowed_hours_start = data.allowed_hours_start;
      if (data.allowed_hours_end !== undefined) updateData.allowed_hours_end = data.allowed_hours_end;
      if (data.passthrough_utm !== undefined) updateData.passthrough_utm = data.passthrough_utm;
      if (data.rate_limit_per_ip !== undefined) updateData.rate_limit_per_ip = data.rate_limit_per_ip;
      if (data.rate_limit_window_minutes !== undefined) updateData.rate_limit_window_minutes = data.rate_limit_window_minutes;
      if (data.target_urls !== undefined) updateData.target_urls = data.target_urls ? JSON.stringify(data.target_urls) : null;
      if (data.blocked_isps !== undefined) updateData.blocked_isps = data.blocked_isps;
      if (data.blocked_asns !== undefined) updateData.blocked_asns = data.blocked_asns;
      if (data.block_vpn !== undefined) updateData.block_vpn = data.block_vpn;
      if (data.block_proxy !== undefined) updateData.block_proxy = data.block_proxy;
      if (data.block_datacenter !== undefined) updateData.block_datacenter = data.block_datacenter;
      if (data.block_tor !== undefined) updateData.block_tor = data.block_tor;
      if (data.redirect_delay_ms !== undefined) updateData.redirect_delay_ms = data.redirect_delay_ms;
      if (data.whitelist_ips !== undefined) updateData.whitelist_ips = data.whitelist_ips;
      if (data.blacklist_ips !== undefined) updateData.blacklist_ips = data.blacklist_ips;
      // New filter fields
      if (data.allowed_referers !== undefined) updateData.allowed_referers = data.allowed_referers;
      if (data.blocked_referers !== undefined) updateData.blocked_referers = data.blocked_referers;
      if (data.required_url_params !== undefined) updateData.required_url_params = data.required_url_params;
      if (data.blocked_url_params !== undefined) updateData.blocked_url_params = data.blocked_url_params;
      if (data.allowed_languages !== undefined) updateData.allowed_languages = data.allowed_languages;
      if (data.blocked_languages !== undefined) updateData.blocked_languages = data.blocked_languages;
      // Webhook fields
      if (data.webhook_url !== undefined) updateData.webhook_url = data.webhook_url;
      if (data.webhook_enabled !== undefined) updateData.webhook_enabled = data.webhook_enabled;
      if (data.webhook_events !== undefined) updateData.webhook_events = data.webhook_events;
      
      const { error } = await supabase
        .from("cloaked_links")
        .update(updateData)
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
  const queryClient = useQueryClient();
  
  const query = useQuery({
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
      return data as unknown as CloakerVisitor[];
    },
    enabled: !!linkId,
  });

  const clearVisitorsMutation = useMutation({
    mutationFn: async (targetLinkId: string) => {
      // Delete all visitors for this link
      const { error: visitorsError } = await supabase
        .from("cloaker_visitors")
        .delete()
        .eq("link_id", targetLinkId);
      
      if (visitorsError) throw visitorsError;

      // Reset clicks count on the link
      const { error: linkError } = await supabase
        .from("cloaked_links")
        .update({ clicks_count: 0, clicks_today: 0 })
        .eq("id", targetLinkId);
      
      if (linkError) throw linkError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloaker-visitors", linkId] });
      queryClient.invalidateQueries({ queryKey: ["cloaker-stats", linkId] });
      queryClient.invalidateQueries({ queryKey: ["cloaked-links"] });
    },
  });

  return {
    ...query,
    clearVisitors: clearVisitorsMutation.mutateAsync,
    isClearing: clearVisitorsMutation.isPending,
  };
}

export function useCloakerStats(linkId: string | null) {
  return useQuery({
    queryKey: ["cloaker-stats", linkId],
    queryFn: async () => {
      if (!linkId) return null;
      
      const { data, error } = await supabase
        .from("cloaker_visitors")
        .select("score, decision, is_bot, is_headless, is_vpn, is_proxy, is_datacenter, is_tor")
        .eq("link_id", linkId);

      if (error) throw error;
      
      const visitors = data || [];
      const total = visitors.length;
      const allowed = visitors.filter(v => v.decision === "allow").length;
      const blocked = visitors.filter(v => v.decision === "block" || v.decision === "safe").length;
      const bots = visitors.filter(v => v.is_bot).length;
      const headless = visitors.filter(v => v.is_headless).length;
      const vpns = visitors.filter(v => v.is_vpn).length;
      const proxies = visitors.filter(v => v.is_proxy).length;
      const datacenters = visitors.filter(v => v.is_datacenter).length;
      const tors = visitors.filter(v => v.is_tor).length;
      const avgScore = total > 0 ? visitors.reduce((acc, v) => acc + v.score, 0) / total : 0;

      return { total, allowed, blocked, bots, headless, vpns, proxies, datacenters, tors, avgScore };
    },
    enabled: !!linkId,
  });
}