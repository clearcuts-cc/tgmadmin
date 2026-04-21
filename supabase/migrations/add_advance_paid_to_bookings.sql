-- Add advance_paid column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS advance_paid NUMERIC(10,2) DEFAULT 0;
