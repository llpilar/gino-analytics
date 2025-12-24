-- Add advanced cloaker features
ALTER TABLE public.cloaked_links 
ADD COLUMN IF NOT EXISTS max_clicks_daily integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_clicks_total integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allowed_hours_start integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allowed_hours_end integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS passthrough_utm boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS rate_limit_per_ip integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rate_limit_window_minutes integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS target_urls jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blocked_isps text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blocked_asns text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS block_vpn boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS block_proxy boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS block_datacenter boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS block_tor boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS redirect_delay_ms integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS custom_user_agents text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS whitelist_ips text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blacklist_ips text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS clicks_today integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_click_reset date DEFAULT CURRENT_DATE;

-- Add more visitor tracking fields
ALTER TABLE public.cloaker_visitors
ADD COLUMN IF NOT EXISTS referer text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS utm_source text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS utm_medium text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS utm_campaign text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS utm_content text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS utm_term text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS redirect_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS asn text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS processing_time_ms integer DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cloaker_visitors_created_at ON public.cloaker_visitors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cloaker_visitors_link_id ON public.cloaker_visitors(link_id);
CREATE INDEX IF NOT EXISTS idx_cloaked_links_slug ON public.cloaked_links(slug);

-- Add function to reset daily clicks
CREATE OR REPLACE FUNCTION public.reset_daily_clicks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.cloaked_links 
  SET clicks_today = 0, last_click_reset = CURRENT_DATE 
  WHERE last_click_reset < CURRENT_DATE;
END;
$$;

-- Allow edge function to insert visitors and update click counts
CREATE POLICY "Edge function can insert visitors" 
ON public.cloaker_visitors 
FOR INSERT 
WITH CHECK (true);

-- Allow edge function to update link click counts
CREATE POLICY "Edge function can update click counts" 
ON public.cloaked_links 
FOR UPDATE 
USING (true);

-- Allow anyone to read links by slug (for edge function)
CREATE POLICY "Anyone can read links by slug" 
ON public.cloaked_links 
FOR SELECT 
USING (true);