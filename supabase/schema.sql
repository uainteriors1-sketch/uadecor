-- =============================================
-- UA INTERIORS — SUPABASE DATABASE SCHEMA
-- Paste this ENTIRE file in:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price TEXT NOT NULL,
  description TEXT,
  supplier TEXT,
  margin TEXT,
  image_url TEXT DEFAULT '',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORDERS TABLE (complete order lifecycle)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  -- Client info
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_address TEXT,
  -- Product info
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  -- Pricing
  unit_price DECIMAL(10,2) NOT NULL,
  gst_percent DECIMAL(5,2) DEFAULT 12,
  gst_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  -- Payments
  advance_amount DECIMAL(10,2) DEFAULT 0,
  advance_paid BOOLEAN DEFAULT false,
  advance_date DATE,
  balance_amount DECIMAL(10,2),
  balance_paid BOOLEAN DEFAULT false,
  balance_date DATE,
  -- Status flow
  status TEXT DEFAULT 'received'
    CHECK (status IN ('received','confirmed','advance_paid','supplier_ordered','dispatched','delivered','completed')),
  -- Supplier
  supplier_name TEXT,
  supplier_order_date DATE,
  expected_delivery DATE,
  -- Tracking
  tracking_number TEXT,
  dispatch_date DATE,
  -- Delivery
  delivery_date DATE,
  -- Notes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 4. Policies: Public can READ products (shop page)
CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT USING (true);

-- 5. Policies: Authenticated users can do everything
CREATE POLICY "Authenticated full access to products"
  ON products FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to orders"
  ON orders FOR ALL USING (auth.role() = 'authenticated');

-- 6. Auto-update timestamp on orders
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. Seed 5 sample products (optional, remove if not needed)
INSERT INTO products (name, category, price, description, supplier, margin, is_available)
VALUES
  ('Custom Forest Wall Mural', 'Murals', '₹120/sq ft onwards', 'Premium custom printed murals. VOC-free, washable, 3yr warranty.', 'Magicdecor.in', '50%', true),
  ('Arched Gold Frame Mirror 5ft', 'Mirrors', '₹8,500 onwards', 'Brushed gold arch frame. Floor standing or wall mount. 2025 #1 trend.', 'IndiaMart Wholesale', '50%', true),
  ('Tall Hammered Brass Vase 60cm', 'Vases', '₹4,500 onwards', 'Handcrafted hammered brass floor vase. Pampas grass compatible.', 'IKIRU / Moradabad', '55%', true),
  ('Large Canvas Abstract Art 4x3ft', 'Art', '₹6,500 onwards', 'Original abstract prints on stretched canvas.', 'Mrunal Art', '60%', true),
  ('Premium Artificial Fiddle Leaf 6ft', 'Plants', '₹5,500 onwards', 'Ultra-realistic fiddle leaf fig. Ceramic pot included.', 'Artificial Plants India', '55%', true);

-- Done! Schema created successfully.
-- Next step: Go to Authentication → Users → Add user (your admin email + password)
