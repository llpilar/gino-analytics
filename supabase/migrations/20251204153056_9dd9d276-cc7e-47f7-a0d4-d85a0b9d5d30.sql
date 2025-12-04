-- Make the expense-receipts bucket private
UPDATE storage.buckets SET public = false WHERE id = 'expense-receipts';