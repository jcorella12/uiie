-- Limpieza de RLS de testigos y usuarios.
--
-- Hay 6 policies acumuladas en testigos (varias redundantes y conflictivas).
-- Reescribimos en 3 simples y explícitas:
--   - SELECT: admin/responsable todo · inspector lo suyo + lo vinculado a sus expedientes
--   - INSERT: cualquier staff
--   - UPDATE: admin/responsable todo · inspector solo los suyos
-- Para usuarios: admin/responsable ven todos · todos ven el propio.

-- ══════════════════════════════════════════════════════════════════
-- TESTIGOS
-- ══════════════════════════════════════════════════════════════════

-- Quitar TODAS las policies viejas
DROP POLICY IF EXISTS "testigos: lectura por rol"          ON public.testigos;
DROP POLICY IF EXISTS "testigos: actualizar por rol"       ON public.testigos;
DROP POLICY IF EXISTS "testigos: insertar por rol"         ON public.testigos;
DROP POLICY IF EXISTS "testigos: admin gestiona"           ON public.testigos;
DROP POLICY IF EXISTS "testigos: select scoped"            ON public.testigos;
DROP POLICY IF EXISTS "testigos: todos los autenticados ven" ON public.testigos;
DROP POLICY IF EXISTS "testigos_all"                       ON public.testigos;

-- SELECT: scoped por rol con dedup cross-inspector via expediente_testigos
CREATE POLICY "testigos_select" ON public.testigos
  FOR SELECT TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR creado_por = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.expediente_testigos et
      INNER JOIN public.expedientes e ON e.id = et.expediente_id
      WHERE et.testigo_id = public.testigos.id
        AND (e.inspector_id = auth.uid() OR e.inspector_ejecutor_id = auth.uid())
    )
  );

-- INSERT: cualquier staff (incluye cliente que crea su propio cliente, cubierto en route)
CREATE POLICY "testigos_insert" ON public.testigos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_rol() IN ('admin', 'inspector_responsable', 'inspector', 'auxiliar')
  );

-- UPDATE: admin/responsable todo · creador puede editar el suyo
CREATE POLICY "testigos_update" ON public.testigos
  FOR UPDATE TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR creado_por = auth.uid()
  );

-- ══════════════════════════════════════════════════════════════════
-- USUARIOS
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "usuarios: ver propio"                  ON public.usuarios;
DROP POLICY IF EXISTS "usuarios: responsable y admin ven todos" ON public.usuarios;
DROP POLICY IF EXISTS "usr_resp_select"                       ON public.usuarios;

-- SELECT: admin/responsable todos · resto solo el propio
CREATE POLICY "usuarios_select" ON public.usuarios
  FOR SELECT TO authenticated USING (
    auth.uid() = id
    OR public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- Para que el inspector pueda ver inspectores en dropdowns (seleccionar ejecutor),
-- agregamos una policy que les permite VER otros inspectores ACTIVOS (sin email
-- ni datos sensibles fuera del nombre — la app filtra columnas via select).
CREATE POLICY "usuarios_select_inspectores_activos" ON public.usuarios
  FOR SELECT TO authenticated USING (
    rol IN ('inspector', 'inspector_responsable', 'auxiliar')
    AND activo = true
  );
