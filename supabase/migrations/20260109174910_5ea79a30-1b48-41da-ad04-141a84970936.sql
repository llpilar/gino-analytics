-- Add webhook configuration to cloaked_links
ALTER TABLE public.cloaked_links 
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS webhook_events TEXT[] DEFAULT ARRAY['bot_blocked', 'vpn_blocked', 'suspicious_score']::TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN public.cloaked_links.webhook_url IS 'URL to send webhook notifications';
COMMENT ON COLUMN public.cloaked_links.webhook_enabled IS 'Whether webhook notifications are enabled';
COMMENT ON COLUMN public.cloaked_links.webhook_events IS 'Types of events to notify: bot_blocked, vpn_blocked, proxy_blocked, datacenter_blocked, tor_blocked, suspicious_score, rate_limited, country_blocked';