-- Add receipt_url column to expenses table
ALTER TABLE public.expenses ADD COLUMN receipt_url TEXT;

-- Create storage bucket for expense receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('expense-receipts', 'expense-receipts', true);

-- Allow authenticated users to upload receipts
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-receipts');

-- Allow anyone to view receipts
CREATE POLICY "Anyone can view receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'expense-receipts');

-- Allow authenticated users to delete their receipts
CREATE POLICY "Authenticated users can delete receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'expense-receipts');