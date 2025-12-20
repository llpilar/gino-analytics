-- Criar função para incrementar contagem de login
CREATE OR REPLACE FUNCTION public.increment_login_count(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    last_login_at = now(),
    login_count = COALESCE(login_count, 0) + 1,
    last_active_at = now()
  WHERE id = user_id;
END;
$$;