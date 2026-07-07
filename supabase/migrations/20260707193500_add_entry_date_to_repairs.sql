-- Add entry_date column to repairs table
ALTER TABLE repairs ADD COLUMN entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill entry_date for legacy repairs using their created_at value
UPDATE repairs SET entry_date = created_at WHERE entry_date IS NULL;
