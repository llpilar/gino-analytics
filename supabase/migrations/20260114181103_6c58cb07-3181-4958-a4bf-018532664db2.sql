-- Tabela para gerenciar domínios personalizados dos usuários
CREATE TABLE public.cloaker_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  verification_token VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  ssl_status VARCHAR(50) DEFAULT 'pending', -- pending, provisioning, active, failed
  dns_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed
  last_check_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_domain UNIQUE (domain),
  CONSTRAINT unique_user_default UNIQUE (user_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Índices para performance
CREATE INDEX idx_cloaker_domains_user_id ON public.cloaker_domains(user_id);
CREATE INDEX idx_cloaker_domains_domain ON public.cloaker_domains(domain);
CREATE INDEX idx_cloaker_domains_verified ON public.cloaker_domains(is_verified) WHERE is_verified = true;

-- Enable RLS
ALTER TABLE public.cloaker_domains ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own domains"
  ON public.cloaker_domains FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own domains"
  ON public.cloaker_domains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains"
  ON public.cloaker_domains FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains"
  ON public.cloaker_domains FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_cloaker_domains_updated_at
  BEFORE UPDATE ON public.cloaker_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna de domínio customizado na tabela de links
ALTER TABLE public.cloaked_links 
ADD COLUMN custom_domain_id UUID REFERENCES public.cloaker_domains(id) ON DELETE SET NULL;

-- Índice para busca por domínio
CREATE INDEX idx_cloaked_links_custom_domain ON public.cloaked_links(custom_domain_id);