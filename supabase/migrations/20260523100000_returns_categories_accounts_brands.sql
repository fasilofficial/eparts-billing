CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    number TEXT UNIQUE NOT NULL,
    party_name TEXT NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Open',
    type TEXT NOT NULL CHECK (type IN ('Sale', 'Purchase')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('Product', 'Expense')),
    name TEXT NOT NULL,
    parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payment_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('Bank Account', 'Cash', 'Card', 'UPI', 'Cheque', 'Other')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    account_number TEXT,
    opening_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
    current_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE account_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL REFERENCES payment_accounts(id) ON DELETE RESTRICT,
    from_account_name TEXT NOT NULL,
    to_account_id UUID NOT NULL REFERENCES payment_accounts(id) ON DELETE RESTRICT,
    to_account_name TEXT NOT NULL,
    transfer_amount NUMERIC(10, 2) NOT NULL,
    transfer_date DATE NOT NULL,
    reference_number TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_returns_branch_id ON returns(branch_id);
CREATE INDEX idx_returns_type ON returns(type);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_payment_accounts_branch_id ON payment_accounts(branch_id);
CREATE INDEX idx_account_transfers_branch_id ON account_transfers(branch_id);
