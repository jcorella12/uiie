-- Cola de correos CNE recibidos vía SendGrid Inbound Parse que no
-- se pudieron auto-asignar a un expediente (o que requieren revisión).
--
-- Se popula desde POST /api/cne/inbound. Un admin/responsable resuelve
-- cada uno desde /dashboard/admin/cne/pendientes eligiendo el expediente
-- correcto (o descartando el correo).

CREATE TABLE IF NOT EXISTS public.cne_inbound_pendientes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos crudos del correo
  from_email         TEXT,
  to_email           TEXT,
  subject            TEXT,
  body_text          TEXT,           -- texto plano del cuerpo
  received_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Extraídos por regex
  numero_certificado TEXT,           -- ej. UIIE-CC-02840-2026
  cliente_extraido   TEXT,           -- ej. "GSF FITNESS SA PROM D INV D CV"

  -- Adjunto del PDF
  pdf_storage_path   TEXT,           -- path en bucket documentos
  pdf_nombre         TEXT,
  pdf_size_bytes     INT,

  -- Resolución
  status             TEXT NOT NULL DEFAULT 'pendiente'
                       CHECK (status IN ('pendiente', 'aplicado', 'descartado', 'error')),
  expediente_id      UUID REFERENCES public.expedientes(id) ON DELETE SET NULL,
  resuelto_por       UUID REFERENCES public.usuarios(id),
  resuelto_at        TIMESTAMPTZ,
  motivo_descarte    TEXT,           -- si status='descartado', por qué

  -- Match candidates (snapshot al momento de recibir)
  match_candidates   JSONB,          -- [{expediente_id, folio, cliente, score}, ...]
  auto_resuelto      BOOLEAN NOT NULL DEFAULT false,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cne_inbound_status
  ON public.cne_inbound_pendientes(status, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_cne_inbound_cert
  ON public.cne_inbound_pendientes(numero_certificado)
  WHERE numero_certificado IS NOT NULL;

ALTER TABLE public.cne_inbound_pendientes ENABLE ROW LEVEL SECURITY;

-- SELECT: solo admin / inspector_responsable
DROP POLICY IF EXISTS "cne_inbound_select_admin" ON public.cne_inbound_pendientes;
CREATE POLICY "cne_inbound_select_admin"
  ON public.cne_inbound_pendientes
  FOR SELECT TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- UPDATE: solo admin / inspector_responsable (para resolver)
DROP POLICY IF EXISTS "cne_inbound_update_admin" ON public.cne_inbound_pendientes;
CREATE POLICY "cne_inbound_update_admin"
  ON public.cne_inbound_pendientes
  FOR UPDATE TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- INSERT solo via service role (desde el webhook /api/cne/inbound)
