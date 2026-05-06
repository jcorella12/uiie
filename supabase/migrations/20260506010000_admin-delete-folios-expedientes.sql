-- Permitir que admin / inspector_responsable eliminen folios y expedientes
-- (típicamente datos de prueba). Operación auditada vía expediente_eliminacion_audit.
--
-- IMPORTANTE: el endpoint /api/expedientes/eliminar usa el service client,
-- así que las policies de DELETE solo cubren acciones directas (poco
-- comunes). El audit es la fuente de verdad de qué se borró y por qué.

-- ── RLS DELETE policies ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "expedientes_delete_admin" ON public.expedientes;
CREATE POLICY "expedientes_delete_admin" ON public.expedientes
  FOR DELETE TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

DROP POLICY IF EXISTS "folios_delete_admin" ON public.folios_lista_control;
CREATE POLICY "folios_delete_admin" ON public.folios_lista_control
  FOR DELETE TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- ── Audit log para borrados de expedientes ──────────────────────────────
-- Inmutable. Inspecciona qué se borró, por quién y con qué justificación.
-- Se popula desde el endpoint POST /api/expedientes/eliminar.
CREATE TABLE IF NOT EXISTS public.expediente_eliminacion_audit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id   UUID NOT NULL,        -- snapshot, sin FK porque el expediente ya no existe
  numero_folio    TEXT,
  cliente_id      UUID,
  cliente_nombre  TEXT,
  inspector_id    UUID,
  status_anterior TEXT,
  documentos_borrados INT NOT NULL DEFAULT 0,
  justificacion   TEXT NOT NULL CHECK (length(trim(justificacion)) >= 10),
  borrado_por     UUID NOT NULL REFERENCES public.usuarios(id),
  borrado_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exp_elim_audit_borrado_at
  ON public.expediente_eliminacion_audit(borrado_at DESC);

ALTER TABLE public.expediente_eliminacion_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exp_elim_audit_select_admin" ON public.expediente_eliminacion_audit;
CREATE POLICY "exp_elim_audit_select_admin"
  ON public.expediente_eliminacion_audit
  FOR SELECT TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- Inserts SOLO desde el endpoint API con service role.
