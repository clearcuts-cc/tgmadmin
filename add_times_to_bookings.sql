-- Add check-in and check-out time columns to operational tables

-- 1. Bookings Table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS check_in_time TIME DEFAULT '12:00:00',
ADD COLUMN IF NOT EXISTS check_out_time TIME DEFAULT '11:00:00';

-- 2. Active Stays Table (for current stays)
ALTER TABLE active_stays 
ADD COLUMN IF NOT EXISTS checkin_time TIME DEFAULT '12:00:00',
ADD COLUMN IF NOT EXISTS checkout_time TIME DEFAULT '11:00:00';

-- 3. Billing History Table (for archived stays)
ALTER TABLE billing_history 
ADD COLUMN IF NOT EXISTS check_in_time TIME DEFAULT '12:00:00',
ADD COLUMN IF NOT EXISTS check_out_time TIME DEFAULT '11:00:00';
