-- Add missing filter fields to cloaked_links table
ALTER TABLE public.cloaked_links 
ADD COLUMN IF NOT EXISTS allowed_referers text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blocked_referers text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS required_url_params jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blocked_url_params jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allowed_languages text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blocked_languages text[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.cloaked_links.allowed_referers IS 'List of allowed referer domains';
COMMENT ON COLUMN public.cloaked_links.blocked_referers IS 'List of blocked referer domains';
COMMENT ON COLUMN public.cloaked_links.required_url_params IS 'Required URL parameters as key-value pairs';
COMMENT ON COLUMN public.cloaked_links.blocked_url_params IS 'Blocked URL parameters as key-value pairs';
COMMENT ON COLUMN public.cloaked_links.allowed_languages IS 'List of allowed browser languages (e.g., pt-BR, en-US)';
COMMENT ON COLUMN public.cloaked_links.blocked_languages IS 'List of blocked browser languages';