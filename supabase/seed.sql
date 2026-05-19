-- Seed demo branches
INSERT INTO branches (id, name, email, password, address, created_at) VALUES
('b1111111-1111-1111-1111-111111111111', 'Downtown Flagship', 'downtown@billing.app', 'branch123', '12 Market Street', NOW()),
('b2222222-2222-2222-2222-222222222222', 'Northgate Branch', 'northgate@billing.app', 'branch123', '88 North Ave', NOW()),
('b3333333-3333-3333-3333-333333333333', 'Harbor Outlet', 'harbor@billing.app', 'branch123', '4 Pier Road', NOW());

-- Seed products for Downtown Flagship
INSERT INTO products (id, branch_id, name, sku, price, stock, category) VALUES
('p1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Espresso Blend 250g', 'SKU-00100', 8.00, 5, 'Beverage'),
('p1111111-2222-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Ceramic Mug', 'SKU-01101', 11.00, 10, 'Goods');

-- Seed products for Northgate Branch
INSERT INTO products (id, branch_id, name, sku, price, stock, category) VALUES
('p2222222-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'Cold Brew Bottle', 'SKU-10100', 14.00, 5, 'Beverage'),
('p2222222-2222-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'Artisan Croissant', 'SKU-11101', 17.00, 10, 'Goods');

-- Seed bills for Downtown Flagship
INSERT INTO bills (id, number, branch_id, customer, subtotal, tax, total, created_at) VALUES
('bl111111-1111-1111-1111-111111111111', 'INV-1000', 'b1111111-1111-1111-1111-111111111111', 'Walk-in', 12.00, 0.60, 12.60, NOW()),
('bl111111-2222-1111-1111-111111111111', 'INV-1001', 'b1111111-1111-1111-1111-111111111111', 'Sarah K.', 10.00, 0.50, 10.50, NOW());

-- Seed bill items for INV-1000
INSERT INTO bill_items (bill_id, product_id, name, price, qty) VALUES
('bl111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'Espresso Blend 250g', 12.00, 1);

-- Seed bill items for INV-1001
INSERT INTO bill_items (bill_id, product_id, name, price, qty) VALUES
('bl111111-2222-1111-1111-111111111111', 'p1111111-2222-1111-1111-111111111111', 'Ceramic Mug', 5.00, 2);
