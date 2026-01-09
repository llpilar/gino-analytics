-- Allow users to delete visitors from their own links
CREATE POLICY "Users can delete visitors of their links" 
ON public.cloaker_visitors 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM cloaked_links 
    WHERE cloaked_links.id = cloaker_visitors.link_id 
    AND cloaked_links.user_id = auth.uid()
  )
);