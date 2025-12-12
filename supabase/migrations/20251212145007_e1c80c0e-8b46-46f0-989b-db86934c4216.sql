-- Create function to update timestamps if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table to store user's Facebook tokens
CREATE TABLE public.facebook_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  facebook_user_id TEXT,
  facebook_user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.facebook_connections ENABLE ROW LEVEL SECURITY;

-- Users can only view their own connection
CREATE POLICY "Users can view own facebook connection" 
ON public.facebook_connections 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own connection
CREATE POLICY "Users can insert own facebook connection" 
ON public.facebook_connections 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own connection
CREATE POLICY "Users can update own facebook connection" 
ON public.facebook_connections 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own connection
CREATE POLICY "Users can delete own facebook connection" 
ON public.facebook_connections 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_facebook_connections_updated_at
BEFORE UPDATE ON public.facebook_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();