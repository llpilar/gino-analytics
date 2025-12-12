-- Drop existing permissive policies on expenses table
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;

-- Create new policies requiring authentication
CREATE POLICY "Authenticated users can view expenses" 
ON public.expenses 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert expenses" 
ON public.expenses 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update expenses" 
ON public.expenses 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete expenses" 
ON public.expenses 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Fix partners_config table (same issue)
DROP POLICY IF EXISTS "Authenticated users can manage partners config" ON public.partners_config;

CREATE POLICY "Authenticated users can view partners config" 
ON public.partners_config 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert partners config" 
ON public.partners_config 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update partners config" 
ON public.partners_config 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete partners config" 
ON public.partners_config 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Fix fixed_expenses table (same issue)
DROP POLICY IF EXISTS "Authenticated users can delete fixed expenses" ON public.fixed_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert fixed expenses" ON public.fixed_expenses;
DROP POLICY IF EXISTS "Authenticated users can update fixed expenses" ON public.fixed_expenses;
DROP POLICY IF EXISTS "Authenticated users can view fixed expenses" ON public.fixed_expenses;

CREATE POLICY "Authenticated users can view fixed expenses" 
ON public.fixed_expenses 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert fixed expenses" 
ON public.fixed_expenses 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update fixed expenses" 
ON public.fixed_expenses 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete fixed expenses" 
ON public.fixed_expenses 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);