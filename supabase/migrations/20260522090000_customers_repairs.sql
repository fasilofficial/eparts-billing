CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    is_business_customer BOOLEAN NOT NULL DEFAULT FALSE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    secondary_phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    type TEXT NOT NULL CHECK (type IN ('Business', 'Direct')),
    opening_balance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    balance_type TEXT NOT NULL DEFAULT 'Receivable' CHECK (balance_type IN ('Receivable', 'Payable')),
    balance_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE repairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT UNIQUE NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE repair_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_id UUID NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    item TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    serial_number TEXT,
    issues TEXT[] NOT NULL DEFAULT '{}',
    issue_description TEXT,
    photos TEXT[] NOT NULL DEFAULT '{}',
    under_warranty BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_cost NUMERIC(10, 2),
    service_cost NUMERIC(10, 2),
    assigned_to TEXT NOT NULL DEFAULT 'Unassigned',
    expected_completion_date DATE
);

CREATE INDEX idx_customers_branch_id ON customers(branch_id);
CREATE INDEX idx_repairs_branch_id ON repairs(branch_id);
CREATE INDEX idx_repairs_customer_id ON repairs(customer_id);
CREATE INDEX idx_repair_items_repair_id ON repair_items(repair_id);
