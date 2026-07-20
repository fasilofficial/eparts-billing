-- Replace estimated_cost with parts_cost in repair_items table
ALTER TABLE repair_items
DROP COLUMN IF EXISTS estimated_cost;

ALTER TABLE repair_items
ADD COLUMN IF NOT EXISTS parts_cost NUMERIC(10, 2) DEFAULT 0;
