-- ==============================================================================
-- 1. Helper function (using (select auth.uid()) for performance)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = (select auth.uid()) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE;

-- ==============================================================================
-- 2. Clean up ALL existing policies to prevent "multiple permissive policies"
--    and clear out legacy/duplicate policies.
-- ==============================================================================
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END
$$;

-- ==============================================================================
-- 3. Ensure RLS is active
-- ==============================================================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE stay_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_status_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. PROFILES POLICIES
-- ==============================================================================
CREATE POLICY "Profiles SELECT" ON profiles FOR SELECT TO authenticated USING (id = (select auth.uid()) OR get_user_role() = 'admin');
CREATE POLICY "Profiles UPDATE" ON profiles FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "Profiles INSERT" ON profiles FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Profiles DELETE" ON profiles FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ==============================================================================
-- 5. UNIFIED POLICIES FOR OPERATIONAL TABLES
-- Employees: SELECT, INSERT
-- Admins: SELECT, INSERT, UPDATE, DELETE
-- ==============================================================================

-- ROOMS
CREATE POLICY "rooms_select" ON rooms FOR SELECT TO authenticated USING (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "rooms_insert" ON rooms FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "rooms_update" ON rooms FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "rooms_delete" ON rooms FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- GUESTS
CREATE POLICY "guests_select" ON guests FOR SELECT TO authenticated USING (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "guests_insert" ON guests FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "guests_update" ON guests FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "guests_delete" ON guests FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- BOOKINGS
CREATE POLICY "bookings_select" ON bookings FOR SELECT TO authenticated USING (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "bookings_insert" ON bookings FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "bookings_update" ON bookings FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "bookings_delete" ON bookings FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ACTIVE STAYS
CREATE POLICY "active_stays_select" ON active_stays FOR SELECT TO authenticated USING (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "active_stays_insert" ON active_stays FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "active_stays_update" ON active_stays FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "active_stays_delete" ON active_stays FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- STAY PAYMENTS
CREATE POLICY "stay_payments_select" ON stay_payments FOR SELECT TO authenticated USING (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "stay_payments_insert" ON stay_payments FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "stay_payments_update" ON stay_payments FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "stay_payments_delete" ON stay_payments FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- BILLING HISTORY
CREATE POLICY "billing_history_select" ON billing_history FOR SELECT TO authenticated USING (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "billing_history_insert" ON billing_history FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "billing_history_update" ON billing_history FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "billing_history_delete" ON billing_history FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ORDERS
CREATE POLICY "orders_select" ON orders FOR SELECT TO authenticated USING (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "orders_insert" ON orders FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "orders_update" ON orders FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "orders_delete" ON orders FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- EVENTS
CREATE POLICY "events_select" ON events FOR SELECT TO authenticated USING (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "events_insert" ON events FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "events_update" ON events FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "events_delete" ON events FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ROOM STATUS OVERRIDES
CREATE POLICY "room_status_overrides_select" ON room_status_overrides FOR SELECT TO authenticated USING (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "room_status_overrides_insert" ON room_status_overrides FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "room_status_overrides_update" ON room_status_overrides FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "room_status_overrides_delete" ON room_status_overrides FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ==============================================================================
-- 6. MENU ITEMS (Employees are Read-Only)
-- ==============================================================================
CREATE POLICY "menu_items_select" ON menu_items FOR SELECT TO authenticated USING (get_user_role() IN ('admin', 'employee'));
CREATE POLICY "menu_items_insert" ON menu_items FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "menu_items_update" ON menu_items FOR UPDATE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "menu_items_delete" ON menu_items FOR DELETE TO authenticated USING (get_user_role() = 'admin');
