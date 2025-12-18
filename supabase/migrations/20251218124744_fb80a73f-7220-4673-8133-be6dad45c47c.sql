-- Create table for cloaked links
CREATE TABLE public.cloaked_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  safe_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allowed_countries TEXT[] DEFAULT NULL,
  blocked_countries TEXT[] DEFAULT NULL,
  allowed_devices TEXT[] DEFAULT NULL,
  block_bots BOOLEAN NOT NULL DEFAULT true,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cloaked_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own links" 
ON public.cloaked_links 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own links" 
ON public.cloaked_links 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links" 
ON public.cloaked_links 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links" 
ON public.cloaked_links 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_cloaked_links_updated_at
BEFORE UPDATE ON public.cloaked_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();