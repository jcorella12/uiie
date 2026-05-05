-- Aislamiento real de clientes por inspector — sin recursión.
--
-- La versión anterior simplificaba demasiado (cualquier staff veía TODOS los
-- clientes). Esta versión usa una función SECURITY DEFINER que escapa de RLS
-- para chequear "está este cliente vinculado a algún expediente/solicitud
-- del usuario actual?" sin caer en recursión.
--
-- Reglas:
--   - Admin / inspector_responsable: ven todo
--   - Cliente role: solo el suyo (usuario_id = auth.uid())
--   - Inspector / auxiliar: ven los que crearon (created_by) Y los vinculados
--     a sus propios expedientes/solicitudes (como inspector_id o ejecutor)

-- ── Función helper SECURITY DEFINER (no pasa por RLS) ──────────────────────
CREATE OR REPLACE FUNCTION public.cliente_vinculado_al_user(
  p_cliente_id uuid,
  p_user_id    uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.expedientes
      WHERE cliente_id = p_cliente_id
        AND (inspector_id = p_user_id OR inspector_ejecutor_id = p_user_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.solicitudes_folio
      WHERE (cliente_id = p_cliente_id OR cliente_epc_id = p_cliente_id)
        AND (inspector_id = p_user_id OR inspector_ejecutor_id = p_user_id)
    );
$$;

COMMENT ON FUNCTION public.cliente_vinculado_al_user IS
  'Retorna true si el cliente está vinculado a algún expediente/solicitud del usuario. SECURITY DEFINER evita recursión RLS.';

-- ── Limpiar TODAS las policies SELECT viejas en clientes ──────────────────
DROP POLICY IF EXISTS "cli_resp_select"                      ON public.clientes;
DROP POLICY IF EXISTS "cliente_read_own_record"              ON public.clientes;
DROP POLICY IF EXISTS "clientes: auxiliar gestiona de su inspector" ON public.clientes;
DROP POLICY IF EXISTS "clientes: inspector ve propios"       ON public.clientes;
DROP POLICY IF EXISTS "clientes: responsable admin ven todos" ON public.clientes;
DROP POLICY IF EXISTS "clientes: select scoped"              ON public.clientes;
DROP POLICY IF EXISTS "clientes: ver propios"                ON public.clientes;
DROP POLICY IF EXISTS "clientes_select"                      ON public.clientes;

-- ── Policy SELECT unificada — sin recursión ───────────────────────────────
CREATE POLICY "clientes_select" ON public.clientes
  FOR SELECT TO authenticated USING (
    -- Admin / responsable: ven todo
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    -- Cliente role: solo el suyo (vinculado por usuario_id)
    OR (public.current_user_rol() = 'cliente' AND usuario_id = auth.uid())
    -- Inspector / auxiliar: los que crearon
    OR created_by = auth.uid()
    -- Inspector / auxiliar: vinculados a sus expedientes/solicitudes (sin recursión)
    OR public.cliente_vinculado_al_user(id, auth.uid())
  );
