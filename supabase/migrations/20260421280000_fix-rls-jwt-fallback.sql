-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: RLS policies que solo usaban auth.jwt() user_metadata
-- Problema: si el JWT no tiene 'rol' en user_metadata (cuentas creadas antes
-- de que se añadiera el campo, o via admin sin metadata), la policy retorna
-- false y el usuario no puede ver nada aunque su registro en public.usuarios
-- tenga el rol correcto.
--
-- Solución: función SECURITY DEFINER que lee de AMBOS: JWT y public.usuarios.
-- SECURITY DEFINER = corre con permisos del owner, bypassea RLS de usuarios.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helper: rol efectivo del usuario actual ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_user_rol()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF((auth.jwt() -> 'user_metadata' ->> 'rol'), ''),
    (SELECT rol::text FROM public.usuarios WHERE id = auth.uid())
  );
$$;

-- ── inspecciones_agenda ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "agenda: responsable admin ven todos" ON public.inspecciones_agenda;

CREATE POLICY "agenda: responsable admin ven todos"
  ON public.inspecciones_agenda FOR SELECT
  USING (
    public.current_user_rol() IN ('inspector_responsable', 'admin')
  );

DROP POLICY IF EXISTS "agenda: inspector actualiza propia" ON public.inspecciones_agenda;

CREATE POLICY "agenda: inspector actualiza propia"
  ON public.inspecciones_agenda FOR UPDATE
  USING (
    inspector_id = auth.uid()
    OR public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

CREATE POLICY "agenda: responsable admin insertan"
  ON public.inspecciones_agenda FOR INSERT
  WITH CHECK (
    inspector_id = auth.uid()
    OR public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- ── expedientes ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "expedientes: responsable admin ven todos" ON public.expedientes;

CREATE POLICY "expedientes: responsable admin ven todos"
  ON public.expedientes FOR SELECT
  USING (
    public.current_user_rol() IN ('inspector_responsable', 'admin')
  );

DROP POLICY IF EXISTS "expedientes: inspector actualiza propios" ON public.expedientes;

CREATE POLICY "expedientes: inspector actualiza propios"
  ON public.expedientes FOR UPDATE
  USING (
    inspector_id = auth.uid()
    OR public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- ── solicitudes_folio ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "solicitudes: responsable admin ven todas" ON public.solicitudes_folio;

CREATE POLICY "solicitudes: responsable admin ven todas"
  ON public.solicitudes_folio FOR SELECT
  USING (
    public.current_user_rol() IN ('inspector_responsable', 'admin')
  );

DROP POLICY IF EXISTS "solicitudes: inspector actualiza propias pendientes" ON public.solicitudes_folio;

CREATE POLICY "solicitudes: inspector actualiza propias pendientes"
  ON public.solicitudes_folio FOR UPDATE
  USING (
    (inspector_id = auth.uid() AND status = 'pendiente')
    OR public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- ── usuarios ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "usuarios: responsable y admin ven todos" ON public.usuarios;

CREATE POLICY "usuarios: responsable y admin ven todos"
  ON public.usuarios FOR SELECT
  USING (
    public.current_user_rol() IN ('inspector_responsable', 'admin')
  );

DROP POLICY IF EXISTS "usuarios: admin insert" ON public.usuarios;

CREATE POLICY "usuarios: admin insert"
  ON public.usuarios FOR INSERT
  WITH CHECK (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

DROP POLICY IF EXISTS "usuarios: admin update" ON public.usuarios;

CREATE POLICY "usuarios: admin update"
  ON public.usuarios FOR UPDATE
  USING (
    auth.uid() = id
    OR public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- ── clientes ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "clientes: responsable admin ven todos" ON public.clientes;

CREATE POLICY "clientes: responsable admin ven todos"
  ON public.clientes FOR SELECT
  USING (
    public.current_user_rol() IN ('inspector_responsable', 'admin')
  );

DROP POLICY IF EXISTS "clientes: inspector actualiza propios" ON public.clientes;

CREATE POLICY "clientes: inspector actualiza propios"
  ON public.clientes FOR UPDATE
  USING (
    created_by = auth.uid()
    OR public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- ── documentos_expediente ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "docs: responsable admin ven todos" ON public.documentos_expediente;

CREATE POLICY "docs: responsable admin ven todos"
  ON public.documentos_expediente FOR SELECT
  USING (
    public.current_user_rol() IN ('inspector_responsable', 'admin')
  );

-- ── folios_lista_control ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "folios: responsable admin ven todos" ON public.folios_lista_control;

CREATE POLICY "folios: responsable admin ven todos"
  ON public.folios_lista_control FOR SELECT
  USING (
    public.current_user_rol() IN ('inspector_responsable', 'admin')
  );

DROP POLICY IF EXISTS "folios: solo admin asigna" ON public.folios_lista_control;

CREATE POLICY "folios: solo admin asigna"
  ON public.folios_lista_control FOR UPDATE
  USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- ── testigos e inversores ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "testigos: admin gestiona" ON public.testigos;

CREATE POLICY "testigos: admin gestiona"
  ON public.testigos FOR ALL
  USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

DROP POLICY IF EXISTS "inversores: admin gestiona" ON public.inversores;

CREATE POLICY "inversores: admin gestiona"
  ON public.inversores FOR ALL
  USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- ── inspectores ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "inspectores: responsable y admin ven todos" ON public.inspectores;

CREATE POLICY "inspectores: responsable y admin ven todos"
  ON public.inspectores FOR SELECT
  USING (
    public.current_user_rol() IN ('inspector_responsable', 'admin')
  );

DROP POLICY IF EXISTS "inspectores: admin insert/update" ON public.inspectores;

CREATE POLICY "inspectores: admin insert/update"
  ON public.inspectores FOR ALL
  USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- ── días bloqueados ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "dias_bloqueados: admin gestiona" ON public.dias_bloqueados;
DROP POLICY IF EXISTS "dias_bloqueados: inspector ve propios" ON public.dias_bloqueados;

CREATE POLICY "dias_bloqueados: admin gestiona"
  ON public.dias_bloqueados FOR ALL
  USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

CREATE POLICY "dias_bloqueados: inspector ve propios"
  ON public.dias_bloqueados FOR SELECT
  USING (
    inspector_id = auth.uid()
    OR inspector_id IS NULL   -- días globales
  );

-- ── app_config ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_config" ON public.app_config;

CREATE POLICY "admin_manage_config"
  ON public.app_config FOR ALL
  USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );
