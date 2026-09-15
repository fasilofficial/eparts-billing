-- Add status column to repair_items table
ALTER TABLE repair_items
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Open';
