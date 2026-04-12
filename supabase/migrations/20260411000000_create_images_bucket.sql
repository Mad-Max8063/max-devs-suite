-- Create the `images` storage bucket for business assets (photo, cover, gallery).
-- Replaces the Base64-in-PostgreSQL pattern to keep the `businesses` table lean.

-- 1. Bucket creation
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies

-- Public read — anyone can view images via the public URL
CREATE POLICY "images: public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'images');

-- Authenticated insert — only logged-in users can upload
CREATE POLICY "images: authenticated insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'images');

-- Authenticated update — only the object owner can overwrite (upsert)
CREATE POLICY "images: authenticated update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'images' AND auth.uid() = owner);

-- Authenticated delete — only the object owner can delete
CREATE POLICY "images: authenticated delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'images' AND auth.uid() = owner);
