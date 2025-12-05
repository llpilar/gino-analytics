-- Create fixed expenses table
CREATE TABLE public.fixed_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  paid_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view fixed expenses"
ON public.fixed_expenses FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert fixed expenses"
ON public.fixed_expenses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update fixed expenses"
ON public.fixed_expenses FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete fixed expenses"
ON public.fixed_expenses FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_fixed_expenses_updated_at
BEFORE UPDATE ON public.fixed_expenses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();