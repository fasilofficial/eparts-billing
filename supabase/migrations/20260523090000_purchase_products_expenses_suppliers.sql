ALTER TABLE products
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Product' CHECK (type IN ('Product', 'Service')),
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_alert INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS track_by_serial_numbers BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS tax TEXT DEFAULT 'No Tax',
ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'Pieces',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE products SET selling_price = price WHERE selling_price = 0;

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    opening_balance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    balance_type TEXT NOT NULL DEFAULT 'Payable' CHECK (balance_type IN ('Payable', 'Receivable')),
    balance_as_of_date DATE,
    payment_terms TEXT,
    credit_limit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    expense_number TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    related_document_type TEXT NOT NULL DEFAULT 'None',
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    receipt TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Paid' CHECK (status IN ('Paid', 'Unpaid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT UNIQUE NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    expected_delivery DATE,
    attachments TEXT[] NOT NULL DEFAULT '{}',
    shipping_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
    shipping_details TEXT,
    additional_charges JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Created')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_suppliers_branch_id ON suppliers(branch_id);
CREATE INDEX idx_expenses_branch_id ON expenses(branch_id);
CREATE INDEX idx_purchase_orders_branch_id ON purchase_orders(branch_id);
CREATE INDEX idx_purchase_order_items_order_id ON purchase_order_items(purchase_order_id);
