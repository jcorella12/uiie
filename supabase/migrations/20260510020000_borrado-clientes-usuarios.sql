-- Permite borrado de clientes y desactivación de usuarios.
--
-- Reglas:
-- · CLIENTES: hard delete con guarda (refuse si tiene expedientes o
--   solicitudes_folio activas). Inspectors borran los suyos
--   (created_by o inspector_id), admin/responsable todos.
-- · USUARIOS: soft delete (activo=false). Hard delete es peligroso por
--   las múltiples FKs históricas (expedientes.inspector_id,
--   documentos.subido_por, etc.). Inspectors solo desactivan los que
--   les reportan (supervisor_id = auth.uid()), admin/responsable
--   todos los que no sean otro admin.

-- ── RLS DELETE policy en clientes ───────────────────────────────────────
DROP POLICY IF EXISTS "clientes_delete_propios" ON public.clientes;
CREATE POLICY "clientes_delete_propios" ON public.clientes
  FOR DELETE TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR created_by   = auth.uid()
    OR inspector_id = auth.uid()
  );

-- ── Audit log de borrado de clientes ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cliente_eliminacion_audit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      UUID NOT NULL,
  cliente_nombre  TEXT,
  cliente_rfc     TEXT,
  inspector_id    UUID,           -- snapshot del inspector_id del cliente
  justificacion   TEXT NOT NULL CHECK (length(trim(justificacion)) >= 5),
  borrado_por     UUID NOT NULL REFERENCES public.usuarios(id),
  borrado_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cli_elim_audit_at
  ON public.cliente_eliminacion_audit(borrado_at DESC);

ALTER TABLE public.cliente_eliminacion_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cli_elim_audit_select_admin" ON public.cliente_eliminacion_audit;
CREATE POLICY "cli_elim_audit_select_admin"
  ON public.cliente_eliminacion_audit
  FOR SELECT TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- ── Audit log de desactivación de usuarios ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.usuario_desactivacion_audit (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        UUID NOT NULL,
  usuario_email     TEXT,
  usuario_nombre    TEXT,
  usuario_rol       TEXT,
  justificacion     TEXT NOT NULL CHECK (length(trim(justificacion)) >= 5),
  desactivado_por   UUID NOT NULL REFERENCES public.usuarios(id),
  desactivado_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuario_desact_audit_at
  ON public.usuario_desactivacion_audit(desactivado_at DESC);

ALTER TABLE public.usuario_desactivacion_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuario_desact_audit_select_admin" ON public.usuario_desactivacion_audit;
CREATE POLICY "usuario_desact_audit_select_admin"
  ON public.usuario_desactivacion_audit
  FOR SELECT TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );
