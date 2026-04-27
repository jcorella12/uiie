-- ============================================================
-- Fix 1: Remove recursive RLS policies on usuarios table
-- Replace with jwt-based checks to avoid infinite recursion
-- ============================================================

DROP POLICY IF EXISTS "usuarios: responsable y admin ven todos" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios: admin insert" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios: admin update" ON public.usuarios;

-- Use auth.jwt() user_metadata to read role — no recursive DB query
CREATE POLICY "usuarios: responsable y admin ven todos" ON public.usuarios
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('inspector_responsable', 'admin')
  );

CREATE POLICY "usuarios: admin insert" ON public.usuarios
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

CREATE POLICY "usuarios: admin update" ON public.usuarios
  FOR UPDATE USING (
    auth.uid() = id OR
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- ============================================================
-- Fix 2: Remove recursive policies on other tables too
-- ============================================================

-- inspectores
DROP POLICY IF EXISTS "inspectores: responsable y admin ven todos" ON public.inspectores;
DROP POLICY IF EXISTS "inspectores: admin insert/update" ON public.inspectores;

CREATE POLICY "inspectores: responsable y admin ven todos" ON public.inspectores
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('inspector_responsable', 'admin')
  );

CREATE POLICY "inspectores: admin insert/update" ON public.inspectores
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- clientes
DROP POLICY IF EXISTS "clientes: responsable admin ven todos" ON public.clientes;
DROP POLICY IF EXISTS "clientes: inspector actualiza propios" ON public.clientes;

CREATE POLICY "clientes: responsable admin ven todos" ON public.clientes
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('inspector_responsable', 'admin')
  );

CREATE POLICY "clientes: inspector actualiza propios" ON public.clientes
  FOR UPDATE USING (
    created_by = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- testigos
DROP POLICY IF EXISTS "testigos: admin gestiona" ON public.testigos;

CREATE POLICY "testigos: admin gestiona" ON public.testigos
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- inversores
DROP POLICY IF EXISTS "inversores: admin gestiona" ON public.inversores;

CREATE POLICY "inversores: admin gestiona" ON public.inversores
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- folios
DROP POLICY IF EXISTS "folios: responsable admin ven todos" ON public.folios_lista_control;
DROP POLICY IF EXISTS "folios: solo admin asigna" ON public.folios_lista_control;

CREATE POLICY "folios: responsable admin ven todos" ON public.folios_lista_control
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('inspector_responsable', 'admin')
  );

CREATE POLICY "folios: solo admin asigna" ON public.folios_lista_control
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- solicitudes
DROP POLICY IF EXISTS "solicitudes: responsable admin ven todas" ON public.solicitudes_folio;
DROP POLICY IF EXISTS "solicitudes: inspector actualiza propias pendientes" ON public.solicitudes_folio;

CREATE POLICY "solicitudes: responsable admin ven todas" ON public.solicitudes_folio
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('inspector_responsable', 'admin')
  );

CREATE POLICY "solicitudes: inspector actualiza propias pendientes" ON public.solicitudes_folio
  FOR UPDATE USING (
    (inspector_id = auth.uid() AND status = 'pendiente') OR
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- expedientes
DROP POLICY IF EXISTS "expedientes: responsable admin ven todos" ON public.expedientes;
DROP POLICY IF EXISTS "expedientes: inspector actualiza propios" ON public.expedientes;

CREATE POLICY "expedientes: responsable admin ven todos" ON public.expedientes
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('inspector_responsable', 'admin')
  );

CREATE POLICY "expedientes: inspector actualiza propios" ON public.expedientes
  FOR UPDATE USING (
    inspector_id = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- documentos
DROP POLICY IF EXISTS "docs: responsable admin ven todos" ON public.documentos_expediente;

CREATE POLICY "docs: responsable admin ven todos" ON public.documentos_expediente
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('inspector_responsable', 'admin')
  );

-- agenda
DROP POLICY IF EXISTS "agenda: responsable admin ven todos" ON public.inspecciones_agenda;
DROP POLICY IF EXISTS "agenda: inspector actualiza propia" ON public.inspecciones_agenda;

CREATE POLICY "agenda: responsable admin ven todos" ON public.inspecciones_agenda
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('inspector_responsable', 'admin')
  );

CREATE POLICY "agenda: inspector actualiza propia" ON public.inspecciones_agenda
  FOR UPDATE USING (
    inspector_id = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- ============================================================
-- Fix 3: Ensure usuarios trigger fires correctly
-- Re-create to handle new sb_publishable key format
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, apellidos, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'apellidos',
    COALESCE((NEW.raw_user_meta_data->>'rol')::user_role, 'inspector')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = COALESCE(EXCLUDED.nombre, public.usuarios.nombre),
    rol = COALESCE(EXCLUDED.rol, public.usuarios.rol);
  RETURN NEW;
END;
$$;

-- Backfill: ensure test users already created are in usuarios table
INSERT INTO public.usuarios (id, email, nombre, apellidos, rol)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nombre', split_part(au.email, '@', 1)),
  au.raw_user_meta_data->>'apellidos',
  COALESCE((au.raw_user_meta_data->>'rol')::user_role, 'inspector')
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  rol = COALESCE((EXCLUDED.rol)::user_role, public.usuarios.rol),
  nombre = COALESCE(EXCLUDED.nombre, public.usuarios.nombre);
