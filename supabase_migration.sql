-- ============================================================
--  THE GRAND MIST — SUPABASE MIGRATION
--  Complete database schema for hotel management system
--  Run this in Supabase SQL Editor → New Query
-- ============================================================

-- ┌─────────────────────────────────────────────────────────────┐
-- │  1. ROOMS                                                   │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS rooms (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_number     TEXT NOT NULL UNIQUE,
    room_type       TEXT NOT NULL DEFAULT 'Standard',
    floor           INTEGER DEFAULT 1,
    base_price_per_night NUMERIC(10,2) NOT NULL DEFAULT 0,
    status          TEXT DEFAULT 'available'
                    CHECK (status IN ('available','maintenance','occupied','confirmed','due_checkout')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ┌─────────────────────────────────────────────────────────────┐
-- │  2. GUESTS                                                  │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS guests (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name            TEXT NOT NULL,
    phone           TEXT NOT NULL,
    email           TEXT,
    address         TEXT,
    aadhaar         TEXT,
    total_stays     INTEGER DEFAULT 0,
    last_stay       DATE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Index for fast Aadhaar lookups (returning guest auto-fetch)
CREATE INDEX IF NOT EXISTS idx_guests_aadhaar ON guests (aadhaar);
CREATE INDEX IF NOT EXISTS idx_guests_phone   ON guests (phone);

-- ┌─────────────────────────────────────────────────────────────┐
-- │  3. BOOKINGS                                                │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS bookings (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_id        UUID REFERENCES guests(id) ON DELETE SET NULL,
    guest_name      TEXT NOT NULL,
    room_id         UUID REFERENCES rooms(id) ON DELETE SET NULL,
    room_number     TEXT,
    check_in        DATE NOT NULL,
    check_out       DATE NOT NULL,
    adults          INTEGER DEFAULT 1,
    children        INTEGER DEFAULT 0,
    status          TEXT DEFAULT 'confirmed'
                    CHECK (status IN ('confirmed','checked_in','due_checkout','checked_out','cancelled')),
    special_requests TEXT,
    rate            NUMERIC(10,2) DEFAULT 0,
    nights          INTEGER DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_status   ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_room     ON bookings (room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest    ON bookings (guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_checkin  ON bookings (check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_checkout ON bookings (check_out);

-- ┌─────────────────────────────────────────────────────────────┐
-- │  4. ACTIVE STAYS (billing for checked-in guests)            │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS active_stays (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stay_id         TEXT NOT NULL UNIQUE,
    booking_id      UUID REFERENCES bookings(id) ON DELETE CASCADE,
    guest_name      TEXT NOT NULL,
    room            TEXT,
    room_type       TEXT,
    checkin_date    DATE NOT NULL,
    checkout_date   DATE NOT NULL,
    nights          INTEGER DEFAULT 1,
    rate            NUMERIC(10,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ┌─────────────────────────────────────────────────────────────┐
-- │  5. STAY PAYMENTS (line items for each stay)                │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS stay_payments (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stay_id         UUID REFERENCES active_stays(id) ON DELETE CASCADE,
    booking_id      UUID REFERENCES bookings(id) ON DELETE CASCADE,
    type            TEXT DEFAULT 'room',
    description     TEXT,
    amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
    method          TEXT,
    ref             TEXT,
    paid_at         TIMESTAMPTZ DEFAULT now()
);

-- ┌─────────────────────────────────────────────────────────────┐
-- │  6. BILLING HISTORY (completed stays / invoices)            │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS billing_history (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_no         TEXT NOT NULL UNIQUE,
    booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
    guest_name      TEXT NOT NULL,
    phone           TEXT,
    room            TEXT,
    room_type       TEXT,
    check_in        DATE,
    check_out       DATE,
    nights          INTEGER DEFAULT 1,
    rate            NUMERIC(10,2) DEFAULT 0,
    extra_charge    NUMERIC(10,2) DEFAULT 0,
    discount        NUMERIC(10,2) DEFAULT 0,
    grand_total     NUMERIC(10,2) DEFAULT 0,
    status          TEXT DEFAULT 'completed',
    completed_at    TIMESTAMPTZ DEFAULT now()
);

-- Payments snapshot stored as JSONB (archived from stay_payments)
ALTER TABLE billing_history ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;

-- ┌─────────────────────────────────────────────────────────────┐
-- │  7. MENU ITEMS (restaurant / room service)                  │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS menu_items (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name            TEXT NOT NULL,
    category        TEXT,
    price           NUMERIC(10,2) NOT NULL DEFAULT 0,
    available       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ┌─────────────────────────────────────────────────────────────┐
-- │  8. ORDERS (food / service orders)                          │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS orders (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
    guest_name      TEXT,
    room            TEXT,
    items           JSONB DEFAULT '[]'::jsonb,
    total           NUMERIC(10,2) DEFAULT 0,
    status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','preparing','delivered','cancelled')),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ┌─────────────────────────────────────────────────────────────┐
-- │  9. EVENTS (calendar events / tasks)                        │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS events (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    date            DATE NOT NULL,
    time            TEXT,
    type            TEXT DEFAULT 'general',
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ┌─────────────────────────────────────────────────────────────┐
-- │  10. ROOM STATUS OVERRIDES (maintenance flags)              │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS room_status_overrides (
    room_id         UUID REFERENCES rooms(id) ON DELETE CASCADE PRIMARY KEY,
    status          TEXT NOT NULL DEFAULT 'maintenance'
                    CHECK (status IN ('maintenance')),
    set_at          TIMESTAMPTZ DEFAULT now()
);

-- ┌─────────────────────────────────────────────────────────────┐
-- │  AUTO-UPDATE updated_at TRIGGER                             │
-- └─────────────────────────────────────────────────────────────┘
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_rooms     BEFORE UPDATE ON rooms     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_guests    BEFORE UPDATE ON guests    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_bookings  BEFORE UPDATE ON bookings  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ┌─────────────────────────────────────────────────────────────┐
-- │  ROW LEVEL SECURITY (RLS) — Enable on all tables            │
-- └─────────────────────────────────────────────────────────────┘
ALTER TABLE rooms                ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_stays         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stay_payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_status_overrides ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (adjust as needed for your roles)
CREATE POLICY "Authenticated full access" ON rooms               FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON guests              FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON bookings            FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON active_stays        FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON stay_payments       FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON billing_history     FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON menu_items          FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON orders              FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON events              FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON room_status_overrides FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
--  ✅ Migration complete!
--  All tables match your localStorage data model.
-- ============================================================
