-- Add city column to cloaker_visitors table for enhanced GeoIP data
ALTER TABLE public.cloaker_visitors 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add index for city-based analytics
CREATE INDEX IF NOT EXISTS idx_cloaker_visitors_city ON public.cloaker_visitors (city);

-- Add index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_cloaker_visitors_decision_created ON public.cloaker_visitors (decision, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cloaker_visitors_is_proxy ON public.cloaker_visitors (is_proxy);
CREATE INDEX IF NOT EXISTS idx_cloaker_visitors_is_datacenter ON public.cloaker_visitors (is_datacenter);