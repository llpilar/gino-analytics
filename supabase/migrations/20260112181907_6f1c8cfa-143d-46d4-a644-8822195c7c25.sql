-- Add option to allow social media link previews (WhatsApp, Telegram, Facebook, etc.)
ALTER TABLE public.cloaked_links 
ADD COLUMN IF NOT EXISTS allow_social_previews BOOLEAN DEFAULT true;

-- Add comment explaining the field
COMMENT ON COLUMN public.cloaked_links.allow_social_previews IS 'Permite bots de preview de redes sociais (WhatsApp, Telegram, Facebook, Twitter, LinkedIn, Discord, Slack)';