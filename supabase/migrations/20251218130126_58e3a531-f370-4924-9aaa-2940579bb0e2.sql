-- Table for visitor fingerprints and behavioral tracking
CREATE TABLE public.cloaker_visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES public.cloaked_links(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 50,
  decision TEXT NOT NULL, -- 'allow', 'block', 'safe'
  
  -- Fingerprint components
  user_agent TEXT,
  language TEXT,
  timezone TEXT,
  screen_resolution TEXT,
  color_depth INTEGER,
  device_memory INTEGER,
  hardware_concurrency INTEGER,
  platform TEXT,
  webgl_vendor TEXT,
  webgl_renderer TEXT,
  canvas_hash TEXT,
  audio_hash TEXT,
  fonts_hash TEXT,
  plugins_count INTEGER,
  touch_support BOOLEAN,
  
  -- Behavioral signals
  mouse_movements INTEGER DEFAULT 0,
  scroll_events INTEGER DEFAULT 0,
  keypress_events INTEGER DEFAULT 0,
  time_on_page INTEGER DEFAULT 0,
  focus_changes INTEGER DEFAULT 0,
  
  -- Detection flags
  is_bot BOOLEAN DEFAULT false,
  is_headless BOOLEAN DEFAULT false,
  is_automated BOOLEAN DEFAULT false,
  has_webdriver BOOLEAN DEFAULT false,
  has_phantom BOOLEAN DEFAULT false,
  has_selenium BOOLEAN DEFAULT false,
  has_puppeteer BOOLEAN DEFAULT false,
  
  -- Network info
  ip_address TEXT,
  country_code TEXT,
  city TEXT,
  isp TEXT,
  is_datacenter BOOLEAN DEFAULT false,
  is_proxy BOOLEAN DEFAULT false,
  is_vpn BOOLEAN DEFAULT false,
  is_tor BOOLEAN DEFAULT false,
  
  -- Score breakdown
  score_fingerprint INTEGER DEFAULT 0,
  score_behavior INTEGER DEFAULT 0,
  score_network INTEGER DEFAULT 0,
  score_automation INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cloaker_visitors ENABLE ROW LEVEL SECURITY;

-- Policy for viewing via link ownership
CREATE POLICY "Users can view visitors of their links"
ON public.cloaker_visitors
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cloaked_links 
    WHERE cloaked_links.id = cloaker_visitors.link_id 
    AND cloaked_links.user_id = auth.uid()
  )
);

-- Add scoring config to cloaked_links
ALTER TABLE public.cloaked_links 
ADD COLUMN min_score INTEGER DEFAULT 40,
ADD COLUMN collect_fingerprint BOOLEAN DEFAULT true,
ADD COLUMN require_behavior BOOLEAN DEFAULT false,
ADD COLUMN behavior_time_ms INTEGER DEFAULT 2000;

-- Create index for performance
CREATE INDEX idx_visitors_link_id ON public.cloaker_visitors(link_id);
CREATE INDEX idx_visitors_fingerprint ON public.cloaker_visitors(fingerprint_hash);
CREATE INDEX idx_visitors_created_at ON public.cloaker_visitors(created_at DESC);