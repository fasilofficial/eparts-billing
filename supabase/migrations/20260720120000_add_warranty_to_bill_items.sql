-- Add warranty column to bill_items table
ALTER TABLE bill_items
ADD COLUMN IF NOT EXISTS warranty TEXT;
