-- ─── Revisión documental ────────────────────────────────────────────────────
-- Agrega campos de revisión a documentos_expediente y crea tabla envios_revision

-- 1. Campos de revisión por documento
ALTER TABLE public.documentos_expediente
  ADD COLUMN IF NOT EXISTS revisado          BOOLEAN    DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS revisado_por      UUID       REFERENCES public.usuarios(id),
  ADD COLUMN IF NOT EXISTS revisado_en       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nota_revision     TEXT;

-- 2. Tabla de envíos de revisión (una fila por intento de envío)
CREATE TABLE IF NOT EXISTS public.envios_revision (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id   UUID        NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  enviado_por     UUID        NOT NULL REFERENCES public.usuarios(id),
  enviado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notas_envio     TEXT,

  -- Decisión del revisor
  decision        TEXT        CHECK (decision IN ('aprobado', 'rechazado')),
  revisado_por    UUID        REFERENCES public.usuarios(id),
  revisado_en     TIMESTAMPTZ,
  notas_revision  TEXT,

  -- Análisis IA cruzado
  revision_ia     JSONB,
  revision_ia_en  TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS
ALTER TABLE public.envios_revision ENABLE ROW LEVEL SECURITY;

-- Inspectores pueden leer y crear envíos de sus propios expedientes
CREATE POLICY "envios: inspector lee los suyos" ON public.envios_revision
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.expedientes e
      JOIN  public.inspectores i ON i.id = e.inspector_id
      WHERE e.id = expediente_id
        AND i.usuario_id = auth.uid()
    )
  );

CREATE POLICY "envios: inspector inserta los suyos" ON public.envios_revision
  FOR INSERT WITH CHECK (
    enviado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.expedientes e
      JOIN  public.inspectores i ON i.id = e.inspector_id
      WHERE e.id = expediente_id
        AND i.usuario_id = auth.uid()
    )
  );

-- Admins y responsables tienen acceso total
CREATE POLICY "envios: admin acceso total" ON public.envios_revision
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') IN ('admin', 'inspector_responsable')
  );
