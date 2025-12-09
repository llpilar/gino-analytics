-- Fix RLS policies to properly restrict to authenticated users only

-- ==================== PROFILES TABLE ====================
-- Drop existing SELECT policy and recreate with proper authentication
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Recreate: Only authenticated users can view profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- ==================== EXPENSES TABLE ====================
-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;

-- Recreate with proper TO authenticated clause
CREATE POLICY "Authenticated users can view expenses" 
ON public.expenses 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert expenses" 
ON public.expenses 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update expenses" 
ON public.expenses 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete expenses" 
ON public.expenses 
FOR DELETE 
TO authenticated
USING (true);

-- ==================== FIXED_EXPENSES TABLE ====================
-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can view fixed expenses" ON public.fixed_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert fixed expenses" ON public.fixed_expenses;
DROP POLICY IF EXISTS "Authenticated users can update fixed expenses" ON public.fixed_expenses;
DROP POLICY IF EXISTS "Authenticated users can delete fixed expenses" ON public.fixed_expenses;

-- Recreate with proper TO authenticated clause
CREATE POLICY "Authenticated users can view fixed expenses" 
ON public.fixed_expenses 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert fixed expenses" 
ON public.fixed_expenses 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update fixed expenses" 
ON public.fixed_expenses 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete fixed expenses" 
ON public.fixed_expenses 
FOR DELETE 
TO authenticated
USING (true);

-- ==================== PARTNERS_CONFIG TABLE ====================
-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users can manage partners config" ON public.partners_config;

-- Recreate with proper TO authenticated clause
CREATE POLICY "Authenticated users can manage partners config" 
ON public.partners_config 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);