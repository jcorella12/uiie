-- ============================================================
-- Bucket público para fotos de perfil (avatares)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                -- público para que las URLs sean accesibles sin token
  5242880,            -- 5 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Cualquier autenticado puede ver avatares (bucket público de por sí, pero RLS extra)
CREATE POLICY "avatars: todos pueden ver"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Solo el propio usuario puede subir/reemplazar su avatar
CREATE POLICY "avatars: usuario sube su propio avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars: usuario actualiza su propio avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars: usuario elimina su propio avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
