-- Fix: la policy de clientes con EXISTS en expedientes/solicitudes_folio
-- causaba "infinite recursion in policy for relation 'clientes'" porque
-- expedientes y solicitudes_folio también tienen policies que hacen JOIN/EXISTS
-- con clientes (directa o indirectamente), creando un ciclo.
--
-- Solución: simplificar la policy de SELECT.
--   - cliente role: solo el suyo (usuario_id = auth.uid())
--   - staff (admin, responsable, inspector, auxiliar): ven todos los clientes
--     (el catálogo se comparte; el aislamiento de "mis clientes" se hace en
--     la UI via .eq('created_by', user.id) cuando aplica).

DROP POLICY IF EXISTS "clientes: select scoped" ON public.clientes;

CREATE POLICY "clientes: select scoped" ON public.clientes
  FOR SELECT TO authenticated USING (
    -- Cliente role: solo el suyo
    (public.current_user_rol() = 'cliente' AND usuario_id = auth.uid())
    -- Staff (admin, responsable, inspector, auxiliar): ven todos
    OR public.current_user_rol() IN ('admin', 'inspector_responsable', 'inspector', 'auxiliar')
  );
