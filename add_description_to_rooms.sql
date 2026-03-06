-- Add description column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS description TEXT;
