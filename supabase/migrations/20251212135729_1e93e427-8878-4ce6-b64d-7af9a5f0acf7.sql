-- Drop existing SELECT policy on profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new policy - users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);