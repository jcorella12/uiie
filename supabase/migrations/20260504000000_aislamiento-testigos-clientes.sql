-- Aislamiento de testigos y clientes por inspector.
--
-- Reglas:
--   - Inspectores y auxiliares solo ven sus propios testigos/clientes
--     (los que ellos crearon, o los vinculados a sus expedientes).
--   - Admin / inspector_responsable ven todo.
--   - Si una INE/cliente ya existe (creado por otro inspector), al vincularlo
--     a un expediente del usuario actual queda automáticamente visible para
--     ambos — esa relación se establece via expediente_testigos / expedientes.
--   - Cliente role: ve solo su propio cliente (clientes.usuario_id = auth.uid()).

-- ══════════════════════════════════════════════════════════════════
-- TESTIGOS
-- ══════════════════════════════════════════════════════════════════

-- Quitamos la política permisiva anterior que dejaba a cualquier autenticado ver todo
DROP POLICY IF EXISTS "testigos: inspectores ven catalogo" ON public.testigos;
DROP POLICY IF EXISTS "testigos: select scoped"            ON public.testigos;

-- SELECT: admin/responsable todo; inspector solo los suyos o vinculados a sus expedientes
CREATE POLICY "testigos: select scoped" ON public.testigos
  FOR SELECT TO authenticated USING (
    -- Admin / responsable: todo
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR
    -- Mis propios testigos (los que yo creé)
    creado_por = auth.uid()
    OR
    -- Testigos vinculados a algún expediente donde soy dueño o ejecutor
    EXISTS (
      SELECT 1
      FROM public.expediente_testigos et
      INNER JOIN public.expedientes e ON e.id = et.expediente_id
      WHERE et.testigo_id = public.testigos.id
        AND (e.inspector_id = auth.uid() OR e.inspector_ejecutor_id = auth.uid())
    )
  );

-- ══════════════════════════════════════════════════════════════════
-- CLIENTES
-- ══════════════════════════════════════════════════════════════════

-- Quitamos políticas permisivas anteriores (si existen)
DROP POLICY IF EXISTS "clientes: select scoped"          ON public.clientes;
DROP POLICY IF EXISTS "clientes: inspectores ven todos"  ON public.clientes;
DROP POLICY IF EXISTS "clientes: authenticated read"     ON public.clientes;

-- SELECT: admin/responsable todo; inspector los suyos o los vinculados a sus expedientes
CREATE POLICY "clientes: select scoped" ON public.clientes
  FOR SELECT TO authenticated USING (
    -- Admin / responsable: todo
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR
    -- Cliente role: solo el suyo (vinculado por usuario_id)
    (public.current_user_rol() = 'cliente' AND usuario_id = auth.uid())
    OR
    -- Los que yo creé como inspector
    created_by = auth.uid()
    OR
    -- Los vinculados a algún expediente donde soy dueño o ejecutor
    -- (vía expedientes.cliente_id o vía solicitudes_folio.cliente_epc_id)
    EXISTS (
      SELECT 1 FROM public.expedientes e
      WHERE e.cliente_id = public.clientes.id
        AND (e.inspector_id = auth.uid() OR e.inspector_ejecutor_id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.solicitudes_folio s
      WHERE (s.cliente_id = public.clientes.id OR s.cliente_epc_id = public.clientes.id)
        AND (s.inspector_id = auth.uid() OR s.inspector_ejecutor_id = auth.uid())
    )
  );

-- ══════════════════════════════════════════════════════════════════
-- IMPORTANTE: el endpoint /api/testigos/guardar y /api/clientes/guardar
-- usan el service role para chequear duplicados (por INE/RFC respectivamente)
-- y "compartir" un registro existente con el usuario actual via expediente.
-- Eso lo manejan los routes en TypeScript (no se controla por RLS aquí).
-- ══════════════════════════════════════════════════════════════════
