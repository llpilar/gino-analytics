-- Add user_id column to expenses table
ALTER TABLE public.expenses ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to withdrawals table
ALTER TABLE public.withdrawals ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to fixed_expenses table
ALTER TABLE public.fixed_expenses ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to partners_config table
ALTER TABLE public.partners_config ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing policies for expenses
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;

CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all expenses" ON public.expenses FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Update existing policies for withdrawals
DROP POLICY IF EXISTS "Authenticated users can view withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Authenticated users can insert withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Authenticated users can update withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Authenticated users can delete withdrawals" ON public.withdrawals;

CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own withdrawals" ON public.withdrawals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own withdrawals" ON public.withdrawals FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Update existing policies for fixed_expenses
DROP POLICY IF EXISTS "Authenticated users can view fixed expenses" ON public.fixed_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert fixed expenses" ON public.fixed_expenses;
DROP POLICY IF EXISTS "Authenticated users can update fixed expenses" ON public.fixed_expenses;
DROP POLICY IF EXISTS "Authenticated users can delete fixed expenses" ON public.fixed_expenses;

CREATE POLICY "Users can view own fixed expenses" ON public.fixed_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fixed expenses" ON public.fixed_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fixed expenses" ON public.fixed_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fixed expenses" ON public.fixed_expenses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all fixed expenses" ON public.fixed_expenses FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Update existing policies for partners_config
DROP POLICY IF EXISTS "Authenticated users can view partners config" ON public.partners_config;
DROP POLICY IF EXISTS "Authenticated users can insert partners config" ON public.partners_config;
DROP POLICY IF EXISTS "Authenticated users can update partners config" ON public.partners_config;
DROP POLICY IF EXISTS "Authenticated users can delete partners config" ON public.partners_config;

CREATE POLICY "Users can view own partners config" ON public.partners_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own partners config" ON public.partners_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own partners config" ON public.partners_config FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own partners config" ON public.partners_config FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all partners config" ON public.partners_config FOR SELECT USING (has_role(auth.uid(), 'admin'));