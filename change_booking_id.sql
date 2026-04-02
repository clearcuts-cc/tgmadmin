-- SQL Migration to change booking ID from UUID to TEXT (TGM-XXXX format)
-- AND update existing records to remove the "weird" UUID look.

-- 1. Drop existing foreign keys
ALTER TABLE active_stays DROP CONSTRAINT IF EXISTS active_stays_booking_id_fkey;
ALTER TABLE stay_payments DROP CONSTRAINT IF EXISTS stay_payments_booking_id_fkey;
ALTER TABLE billing_history DROP CONSTRAINT IF EXISTS billing_history_booking_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_booking_id_fkey;

-- 2. Change bookings.id to TEXT
ALTER TABLE bookings ALTER COLUMN id TYPE TEXT;

-- 3. Change reference columns to TEXT
ALTER TABLE active_stays ALTER COLUMN booking_id TYPE TEXT;
ALTER TABLE stay_payments ALTER COLUMN booking_id TYPE TEXT;
ALTER TABLE billing_history ALTER COLUMN booking_id TYPE TEXT;
ALTER TABLE orders ALTER COLUMN booking_id TYPE TEXT;

-- 4. UPDATE EXISTING DATA to use TGM prefix
-- We take the first 8 characters of the UUID to keep it relatively unique but readable
UPDATE bookings SET id = 'TGM-' || UPPER(SUBSTR(id::text, 1, 8)) WHERE id NOT LIKE 'TGM-%';
UPDATE active_stays SET booking_id = 'TGM-' || UPPER(SUBSTR(booking_id::text, 1, 8)) WHERE booking_id NOT LIKE 'TGM-%';
UPDATE stay_payments SET booking_id = 'TGM-' || UPPER(SUBSTR(booking_id::text, 1, 8)) WHERE booking_id NOT LIKE 'TGM-%';
UPDATE billing_history SET booking_id = 'TGM-' || UPPER(SUBSTR(booking_id::text, 1, 8)) WHERE booking_id NOT LIKE 'TGM-%';
UPDATE orders SET booking_id = 'TGM-' || UPPER(SUBSTR(booking_id::text, 1, 8)) WHERE booking_id NOT LIKE 'TGM-%';

-- 5. Re-add foreign keys with the new TEXT type
ALTER TABLE active_stays ADD CONSTRAINT active_stays_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE stay_payments ADD CONSTRAINT stay_payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE billing_history ADD CONSTRAINT billing_history_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE orders ADD CONSTRAINT orders_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
