-- Private bucket for voice entry recordings (04 J4, J5). Each user may only read and write files under a
-- folder named with their own user id: "<user id>/<entry id>.m4a". The app plays them with signed URLs.
-- delete-account removes these files before deleting the account.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('journal-audio', 'journal-audio', false, 26214400,
  ARRAY['audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-caf', 'audio/webm'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "journal-audio: owner reads" ON storage.objects;
DROP POLICY IF EXISTS "journal-audio: owner uploads" ON storage.objects;
DROP POLICY IF EXISTS "journal-audio: owner deletes" ON storage.objects;
CREATE POLICY "journal-audio: owner reads" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'journal-audio' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "journal-audio: owner uploads" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'journal-audio' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "journal-audio: owner deletes" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'journal-audio' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
