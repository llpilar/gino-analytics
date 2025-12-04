-- Create expenses table for tracking partner expenses
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_by TEXT NOT NULL, -- Name of the partner who paid
  category TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage expenses
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

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create partners config table
CREATE TABLE public.partners_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner1_name TEXT NOT NULL DEFAULT 'Sócio 1',
  partner2_name TEXT NOT NULL DEFAULT 'Sócio 2',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for partners_config
ALTER TABLE public.partners_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage partners config" 
ON public.partners_config 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert default config
INSERT INTO public.partners_config (partner1_name, partner2_name) VALUES ('Sócio 1', 'Sócio 2');