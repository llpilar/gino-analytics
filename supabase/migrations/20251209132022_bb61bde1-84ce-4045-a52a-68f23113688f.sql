-- Remove the overly permissive storage policy that allows any authenticated user to view all receipts
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;