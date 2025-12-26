-- Remove the policy that allows anyone to read all links
DROP POLICY IF EXISTS "Anyone can read links by slug" ON public.cloaked_links;