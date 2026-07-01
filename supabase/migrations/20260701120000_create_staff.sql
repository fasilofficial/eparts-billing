-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on branch_id for staff
CREATE INDEX IF NOT EXISTS idx_staff_branch_id ON staff(branch_id);

-- Alter repair_items table to link to staff
ALTER TABLE repair_items 
ADD COLUMN IF NOT EXISTS assigned_to_id UUID REFERENCES staff(id) ON DELETE SET NULL;
