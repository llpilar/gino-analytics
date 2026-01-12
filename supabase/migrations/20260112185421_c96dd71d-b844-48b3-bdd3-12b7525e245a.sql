-- Table for auto-blacklisted IPs
CREATE TABLE public.cloaker_blacklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ip_address TEXT NOT NULL,
  reason TEXT NOT NULL,
  fail_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = permanent
  link_id UUID REFERENCES public.cloaked_links(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Unique constraint per user + IP
CREATE UNIQUE INDEX idx_cloaker_blacklist_user_ip ON public.cloaker_blacklist(user_id, ip_address);

-- Index for lookups
CREATE INDEX idx_cloaker_blacklist_ip ON public.cloaker_blacklist(ip_address);
CREATE INDEX idx_cloaker_blacklist_user ON public.cloaker_blacklist(user_id);

-- Enable RLS
ALTER TABLE public.cloaker_blacklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own blacklist" 
ON public.cloaker_blacklist 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own blacklist" 
ON public.cloaker_blacklist 
FOR ALL 
USING (auth.uid() = user_id);

-- Table for webhook events log
CREATE TABLE public.cloaker_webhooks_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES public.cloaked_links(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'bot_blocked', 'visitor_allowed', 'suspicious_activity', etc
  visitor_id UUID REFERENCES public.cloaker_visitors(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  success BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_webhooks_log_link ON public.cloaker_webhooks_log(link_id);
CREATE INDEX idx_webhooks_log_event ON public.cloaker_webhooks_log(event_type);

-- Enable RLS
ALTER TABLE public.cloaker_webhooks_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy (via link ownership)
CREATE POLICY "Users can view webhook logs for their links" 
ON public.cloaker_webhooks_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.cloaked_links 
    WHERE id = link_id AND user_id = auth.uid()
  )
);

-- Add webhook columns to cloaked_links if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaked_links' AND column_name = 'webhook_url') THEN
    ALTER TABLE public.cloaked_links ADD COLUMN webhook_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaked_links' AND column_name = 'webhook_enabled') THEN
    ALTER TABLE public.cloaked_links ADD COLUMN webhook_enabled BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaked_links' AND column_name = 'webhook_events') THEN
    ALTER TABLE public.cloaked_links ADD COLUMN webhook_events TEXT[] DEFAULT ARRAY['bot_blocked'];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaked_links' AND column_name = 'auto_blacklist_enabled') THEN
    ALTER TABLE public.cloaked_links ADD COLUMN auto_blacklist_enabled BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaked_links' AND column_name = 'auto_blacklist_threshold') THEN
    ALTER TABLE public.cloaked_links ADD COLUMN auto_blacklist_threshold INTEGER DEFAULT 3;
  END IF;
END $$;

-- Add elite detection scores to visitors
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaker_visitors' AND column_name = 'score_device_consistency') THEN
    ALTER TABLE public.cloaker_visitors ADD COLUMN score_device_consistency NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaker_visitors' AND column_name = 'score_webrtc') THEN
    ALTER TABLE public.cloaker_visitors ADD COLUMN score_webrtc NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaker_visitors' AND column_name = 'score_mouse_pattern') THEN
    ALTER TABLE public.cloaker_visitors ADD COLUMN score_mouse_pattern NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaker_visitors' AND column_name = 'score_keyboard') THEN
    ALTER TABLE public.cloaker_visitors ADD COLUMN score_keyboard NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaker_visitors' AND column_name = 'score_session_replay') THEN
    ALTER TABLE public.cloaker_visitors ADD COLUMN score_session_replay NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaker_visitors' AND column_name = 'detection_details') THEN
    ALTER TABLE public.cloaker_visitors ADD COLUMN detection_details JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaker_visitors' AND column_name = 'webrtc_local_ip') THEN
    ALTER TABLE public.cloaker_visitors ADD COLUMN webrtc_local_ip TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaker_visitors' AND column_name = 'webrtc_public_ip') THEN
    ALTER TABLE public.cloaker_visitors ADD COLUMN webrtc_public_ip TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloaker_visitors' AND column_name = 'is_blacklisted') THEN
    ALTER TABLE public.cloaker_visitors ADD COLUMN is_blacklisted BOOLEAN DEFAULT false;
  END IF;
END $$;