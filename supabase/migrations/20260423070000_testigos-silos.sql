-- Data silos para testigos:
-- Cada inspector solo ve sus propios testigos.
-- Admin e inspector_responsable ven todos.

-- 1. Agregar columna creado_por
ALTER TABLE public.testigos
  ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.testigos.creado_por
  IS 'UUID del inspector que creó este participante. NULL = creado antes de la migración o por admin.';

-- 2. Eliminar políticas SELECT existentes
DROP POLICY IF EXISTS "testigos: inspector lee"       ON public.testigos;
DROP POLICY IF EXISTS "testigos: todos leen"          ON public.testigos;
DROP POLICY IF EXISTS "testigos: autenticados leen"   ON public.testigos;
DROP POLICY IF EXISTS "testigos: inspector ve"        ON public.testigos;

-- 3. Nueva política SELECT con silos
--    Admin / inspector_responsable → todos
--    Inspector / auxiliar          → solo los suyos (o los sin dueño que vienen de antes)
CREATE POLICY "testigos: lectura por rol"
  ON public.testigos FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
    OR (
      (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('inspector', 'auxiliar')
      AND (creado_por = auth.uid() OR creado_por IS NULL)
    )
  );

-- 4. Política INSERT: graba creado_por automáticamente vía API (ya lo seteamos en código)
DROP POLICY IF EXISTS "testigos: inspector inserta"   ON public.testigos;
DROP POLICY IF EXISTS "testigos: admin inserta"       ON public.testigos;

CREATE POLICY "testigos: insertar por rol"
  ON public.testigos FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN
      ('admin', 'inspector_responsable', 'inspector', 'auxiliar')
  );

-- 5. UPDATE ya está cubierto por la política de la migración anterior.
--    Si hace falta, la recreamos aquí con la misma lógica de silos.
DROP POLICY IF EXISTS "testigos: inspector actualiza" ON public.testigos;

CREATE POLICY "testigos: actualizar por rol"
  ON public.testigos FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
    OR (
      (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('inspector', 'auxiliar')
      AND (creado_por = auth.uid() OR creado_por IS NULL)
    )
  );
