-- ==============================================================================
-- SETUP STORAGE BUCKET & POLICIES FOR GUEST DOCUMENTS
-- Run this in the Supabase SQL Editor to allow image uploads from the app
-- ==============================================================================

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
    'guest-documents',
    'guest-documents',
    true,
    false,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 2. Drop existing policies on this bucket (to prevent conflicts)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- 3. Create permissive policies for guest-documents (Authenticated access)
-- Note: Assuming authenticated users are allowed to upload
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'guest-documents');

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'guest-documents');

CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'guest-documents');

CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'guest-documents');

-- If you also want ANONYMOUS uploads (not recommended for production but sometimes used if app operates without auth)
-- Change "TO authenticated" to "TO public" above.
