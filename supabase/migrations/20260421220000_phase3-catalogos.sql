-- ============================================================
-- Phase 3: Catálogos enriquecidos
-- Clientes (persona física/moral), Testigos (CURP+INE),
-- Inversores (UL1741/IEEE1547), expediente_testigos
-- CIAE — UIIE-CRE-021
-- ============================================================

-- ── Nuevos ENUMs ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE figura_juridica_tipo AS ENUM (
    'representante_legal', 'gestor', 'propietario'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inversor_tipo AS ENUM (
    'string', 'microinversor', 'hibrido'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inversor_cert AS ENUM (
    'ul1741', 'ieee1547', 'ninguna'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Ampliar tabla: clientes ───────────────────────────────────
ALTER TABLE public.clientes
  -- Datos generales
  ADD COLUMN IF NOT EXISTS nombre_comercial       TEXT,
  ADD COLUMN IF NOT EXISTS colonia                TEXT,
  ADD COLUMN IF NOT EXISTS numero_exterior        TEXT,
  ADD COLUMN IF NOT EXISTS numero_interior        TEXT,
  ADD COLUMN IF NOT EXISTS municipio              TEXT,
  -- Persona física: CURP propio
  ADD COLUMN IF NOT EXISTS curp                   TEXT,
  -- Persona moral: figura jurídica del representante
  ADD COLUMN IF NOT EXISTS figura_juridica        figura_juridica_tipo,
  -- Quien FIRMA el contrato (puede diferir del solicitante)
  ADD COLUMN IF NOT EXISTS firmante_mismo         BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS firmante_nombre        TEXT,
  ADD COLUMN IF NOT EXISTS firmante_curp          TEXT,
  ADD COLUMN IF NOT EXISTS firmante_numero_ine    TEXT,
  ADD COLUMN IF NOT EXISTS firmante_telefono      TEXT,
  ADD COLUMN IF NOT EXISTS firmante_correo        TEXT,
  -- Quien ATIENDE la visita (puede diferir de quien firma)
  ADD COLUMN IF NOT EXISTS atiende_mismo          BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS atiende_nombre         TEXT,
  ADD COLUMN IF NOT EXISTS atiende_curp           TEXT,
  ADD COLUMN IF NOT EXISTS atiende_numero_ine     TEXT,
  ADD COLUMN IF NOT EXISTS atiende_telefono       TEXT,
  ADD COLUMN IF NOT EXISTS atiende_correo         TEXT,
  -- Correo CFE para envío del certificado (acuerdo adicional)
  ADD COLUMN IF NOT EXISTS correo_cfe             TEXT,
  -- INE scans (paths en Storage)
  ADD COLUMN IF NOT EXISTS ine_url_frente         TEXT,
  ADD COLUMN IF NOT EXISTS ine_url_reverso        TEXT,
  -- Datos OCR extraídos de la INE
  ADD COLUMN IF NOT EXISTS ocr_nombre             TEXT,
  ADD COLUMN IF NOT EXISTS ocr_curp               TEXT,
  ADD COLUMN IF NOT EXISTS ocr_clave_elector      TEXT,
  ADD COLUMN IF NOT EXISTS ocr_vigencia           TEXT,
  ADD COLUMN IF NOT EXISTS ocr_domicilio          TEXT;

-- ── Ampliar tabla: testigos ───────────────────────────────────
ALTER TABLE public.testigos
  ADD COLUMN IF NOT EXISTS curp                   TEXT,
  ADD COLUMN IF NOT EXISTS numero_ine             TEXT,
  ADD COLUMN IF NOT EXISTS clave_elector          TEXT,
  ADD COLUMN IF NOT EXISTS domicilio              TEXT,
  ADD COLUMN IF NOT EXISTS ciudad                 TEXT,
  ADD COLUMN IF NOT EXISTS estado                 TEXT,
  ADD COLUMN IF NOT EXISTS cp                     TEXT,
  -- INE scan
  ADD COLUMN IF NOT EXISTS ine_url_frente         TEXT,
  ADD COLUMN IF NOT EXISTS ine_url_reverso        TEXT,
  -- OCR extraídos de la INE
  ADD COLUMN IF NOT EXISTS ocr_nombre             TEXT,
  ADD COLUMN IF NOT EXISTS ocr_curp               TEXT,
  ADD COLUMN IF NOT EXISTS ocr_clave_elector      TEXT,
  ADD COLUMN IF NOT EXISTS ocr_vigencia           TEXT;

-- ── Ampliar tabla: inversores ─────────────────────────────────
ALTER TABLE public.inversores
  ADD COLUMN IF NOT EXISTS tipo                   inversor_tipo NOT NULL DEFAULT 'string',
  ADD COLUMN IF NOT EXISTS certificacion          inversor_cert NOT NULL DEFAULT 'ul1741',
  ADD COLUMN IF NOT EXISTS ficha_tecnica_url      TEXT,
  ADD COLUMN IF NOT EXISTS certificado_url        TEXT,
  -- Texto de justificación para IEEE1547 (sin UL1741) — prellenado desde catálogo
  ADD COLUMN IF NOT EXISTS justificacion_ieee1547 TEXT,
  -- Contador de usos en inspecciones
  ADD COLUMN IF NOT EXISTS total_usos             INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Trigger updated_at para inversores
DO $$ BEGIN
  CREATE TRIGGER trg_inversores_updated_at
    BEFORE UPDATE ON public.inversores
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Nueva tabla: expediente_testigos ─────────────────────────
-- Exactamente 2 testigos por expediente (orden 1 y 2)
CREATE TABLE IF NOT EXISTS public.expediente_testigos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expediente_id   UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  testigo_id      UUID NOT NULL REFERENCES public.testigos(id),
  orden           INT NOT NULL CHECK (orden IN (1, 2)),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(expediente_id, orden)
);

-- RLS: expediente_testigos
ALTER TABLE public.expediente_testigos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exp_testigos: inspector ve propios" ON public.expediente_testigos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.expedientes e
      WHERE e.id = expediente_id AND e.inspector_id = auth.uid()
    )
  );

CREATE POLICY "exp_testigos: inspector gestiona propios" ON public.expediente_testigos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.expedientes e
      WHERE e.id = expediente_id AND e.inspector_id = auth.uid()
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

CREATE POLICY "exp_testigos: admin ve todos" ON public.expediente_testigos
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- ── RLS adicional para testigos ───────────────────────────────
DO $$ BEGIN
  CREATE POLICY "testigos: inspectores ven catalogo" ON public.testigos
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "testigos: inspector inserta" ON public.testigos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "testigos: admin actualiza" ON public.testigos
    FOR UPDATE USING (
      (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── RLS adicional para inversores ────────────────────────────
DO $$ BEGIN
  CREATE POLICY "inversores: autenticados ven catalogo" ON public.inversores
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── RLS para clientes: inspector puede crear clientes ────────
-- (las políticas de INSERT probablemente ya existen, pero aseguramos que inspector pueda crear)
DO $$ BEGIN
  CREATE POLICY "clientes: inspector inserta propios" ON public.clientes
    FOR INSERT WITH CHECK (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "clientes: inspector ve propios" ON public.clientes
    FOR SELECT USING (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Supabase Storage: bucket para certificados de inversores ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'catalogos',
  'catalogos',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf','image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage catalogos: autenticados suben"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'catalogos' AND auth.role() = 'authenticated');

CREATE POLICY "storage catalogos: autenticados leen"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'catalogos' AND auth.role() = 'authenticated');
