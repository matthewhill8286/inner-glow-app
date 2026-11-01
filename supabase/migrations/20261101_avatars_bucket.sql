-- Private bucket for profile photos (P1). Each user may only read and write files under a folder
-- named with their own user id: "<user id>/avatar.jpg". The app shows photos with signed URLs.
-- delete-account removes these files before deleting the account.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars: owner reads" ON storage.objects;
DROP POLICY IF EXISTS "avatars: owner uploads" ON storage.objects;
DROP POLICY IF EXISTS "avatars: owner updates" ON storage.objects;
DROP POLICY IF EXISTS "avatars: owner deletes" ON storage.objects;
CREATE POLICY "avatars: owner reads" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "avatars: owner uploads" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "avatars: owner updates" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "avatars: owner deletes" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
