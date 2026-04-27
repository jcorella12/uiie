-- Permite a todos los inspectores y auxiliares actualizar testigos
-- (antes solo admin e inspector_responsable podían)
DROP POLICY IF EXISTS "testigos: admin actualiza" ON public.testigos;

CREATE POLICY "testigos: inspector actualiza"
  ON public.testigos FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN
      ('admin', 'inspector_responsable', 'inspector', 'auxiliar')
  );
