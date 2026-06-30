-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed a default admin for local development
INSERT INTO admins (id, name, email, password, created_at)
VALUES ('a1111111-1111-1111-1111-111111111111', 'System Administrator', 'admin@billing.app', 'admin123', NOW())
ON CONFLICT (email) DO NOTHING;
