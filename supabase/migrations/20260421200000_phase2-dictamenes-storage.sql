-- ============================================================
-- Phase 2: Dictámenes table, Storage policies, IA analysis column
-- CIAE — UIIE-CRE-021
-- ============================================================

-- ── resultado_dictamen enum ──────────────────────────────────
DO $$ BEGIN
  CREATE TYPE resultado_dictamen AS ENUM ('aprobado', 'rechazado', 'condicionado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Add analisis_ia column to documentos_expediente ──────────
ALTER TABLE public.documentos_expediente
  ADD COLUMN IF NOT EXISTS analisis_ia JSONB,
  ADD COLUMN IF NOT EXISTS analizado_en TIMESTAMPTZ;

-- ── TABLE: dictamenes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dictamenes (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expediente_id             UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  inspector_id              UUID NOT NULL REFERENCES public.usuarios(id),
  numero_folio              TEXT NOT NULL,
  resultado                 resultado_dictamen NOT NULL DEFAULT 'aprobado',
  fecha_inspeccion          DATE NOT NULL,
  fecha_emision             DATE NOT NULL DEFAULT CURRENT_DATE,
  potencia_kwp              NUMERIC(8,2) NOT NULL,
  norma_aplicable           TEXT NOT NULL DEFAULT 'NOM-001-SEDE-2012',
  cumple_norma              BOOLEAN NOT NULL DEFAULT true,
  observaciones_generales   TEXT,
  observaciones_tecnicas    TEXT,
  recomendaciones           TEXT,
  -- PDF generated and stored in Supabase Storage
  pdf_storage_path          TEXT,
  pdf_generado_en           TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(expediente_id)     -- One dictamen per expediente
);

CREATE TRIGGER trg_dictamenes_updated_at
  BEFORE UPDATE ON public.dictamenes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS: dictamenes ──────────────────────────────────────────
ALTER TABLE public.dictamenes ENABLE ROW LEVEL SECURITY;

-- Inspector sees their own dictamenes
CREATE POLICY "dictamenes: inspector ve propios" ON public.dictamenes
  FOR SELECT USING (inspector_id = auth.uid());

-- Inspector can insert their own dictamenes
CREATE POLICY "dictamenes: inspector inserta propios" ON public.dictamenes
  FOR INSERT WITH CHECK (inspector_id = auth.uid());

-- Inspector can update their own dictamenes
CREATE POLICY "dictamenes: inspector actualiza propios" ON public.dictamenes
  FOR UPDATE USING (
    inspector_id = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- Responsable/admin see all
CREATE POLICY "dictamenes: responsable admin ven todos" ON public.dictamenes
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('inspector_responsable', 'admin')
  );

-- ── Supabase Storage: bucket policies (bucket = 'documentos') ─
-- NOTE: Create bucket 'documentos' in Supabase Dashboard → Storage → New bucket
-- (public: false, file size limit: 20MB)
-- The policies below govern row-level access to the objects table.

-- Allow authenticated users to upload their own files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  false,
  20971520,  -- 20 MB
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies on storage.objects
CREATE POLICY "storage: inspector sube propios docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "storage: inspector ve propios docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "storage: inspector borra propios docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documentos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
