-- Audit log para cambios de número de folio en expedientes.
-- Solo admin/inspector_responsable pueden modificar el folio mediante la
-- ruta POST /api/expedientes/cambiar-folio, que requiere justificación
-- escrita y guarda un registro inmutable en esta tabla.

CREATE TABLE IF NOT EXISTS public.expediente_folio_audit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id   UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  folio_anterior  TEXT NOT NULL,
  folio_nuevo     TEXT NOT NULL,
  justificacion   TEXT NOT NULL CHECK (length(trim(justificacion)) >= 10),
  cambiado_por    UUID NOT NULL REFERENCES public.usuarios(id),
  cambiado_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expfolioaudit_expediente
  ON public.expediente_folio_audit(expediente_id, cambiado_at DESC);

ALTER TABLE public.expediente_folio_audit ENABLE ROW LEVEL SECURITY;

-- Solo admin/inspector_responsable pueden leer el audit log
DROP POLICY IF EXISTS "audit_folio_select_admin" ON public.expediente_folio_audit;
CREATE POLICY "audit_folio_select_admin"
  ON public.expediente_folio_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin', 'inspector_responsable')
    )
  );

-- Inserts solo desde la ruta API (service role). No hay policy de INSERT
-- para clientes anon/auth — el endpoint usa el service client.
