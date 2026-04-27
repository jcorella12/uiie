-- ============================================================
-- Auxiliares / Administrativos de Inspector
-- Cada inspector puede tener uno o más auxiliares con acceso
-- a sus expedientes, agenda, clientes y solicitudes.
-- CIAE — UIIE-CRE-021
-- ============================================================

-- ── 1. Nuevo valor en el enum user_role ─────────────────────
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'auxiliar';

-- ── 2. Tabla: inspector_auxiliares ──────────────────────────
CREATE TABLE IF NOT EXISTS public.inspector_auxiliares (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspector_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  auxiliar_id  UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  activo       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(inspector_id, auxiliar_id)
);

ALTER TABLE public.inspector_auxiliares ENABLE ROW LEVEL SECURITY;

-- Inspector ve y gestiona su propio equipo
CREATE POLICY "inspector_auxiliares: inspector gestiona su equipo" ON public.inspector_auxiliares
  FOR ALL USING (
    inspector_id = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- Auxiliar puede ver su propio vínculo
CREATE POLICY "inspector_auxiliares: auxiliar ve su vinculo" ON public.inspector_auxiliares
  FOR SELECT USING (auxiliar_id = auth.uid());

-- ── 3. Función helper: inspector efectivo ───────────────────
-- Si el usuario es auxiliar, devuelve el UUID del inspector al
-- que está vinculado. Si no, devuelve su propio UUID.
CREATE OR REPLACE FUNCTION public.effective_inspector_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'auxiliar'
    THEN (
      SELECT inspector_id
      FROM   public.inspector_auxiliares
      WHERE  auxiliar_id = auth.uid()
        AND  activo = true
      LIMIT  1
    )
    ELSE auth.uid()
  END;
$$;

-- ── 4. RLS — expedientes ─────────────────────────────────────
-- Auxiliar puede gestionar expedientes del inspector al que pertenece
DO $$ BEGIN
  CREATE POLICY "expedientes: auxiliar gestiona de su inspector" ON public.expedientes
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.inspector_auxiliares ia
        WHERE ia.auxiliar_id  = auth.uid()
          AND ia.inspector_id = public.expedientes.inspector_id
          AND ia.activo = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 5. RLS — inspecciones_agenda ────────────────────────────
DO $$ BEGIN
  CREATE POLICY "agenda: auxiliar gestiona de su inspector" ON public.inspecciones_agenda
    FOR ALL USING (
      EXISTS (
        SELECT 1
        FROM   public.inspector_auxiliares ia
        JOIN   public.expedientes e ON e.id = public.inspecciones_agenda.expediente_id
        WHERE  ia.auxiliar_id  = auth.uid()
          AND  ia.inspector_id = e.inspector_id
          AND  ia.activo = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 6. RLS — solicitudes_folio ───────────────────────────────
DO $$ BEGIN
  CREATE POLICY "solicitudes: auxiliar gestiona de su inspector" ON public.solicitudes_folio
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.inspector_auxiliares ia
        WHERE ia.auxiliar_id  = auth.uid()
          AND ia.inspector_id = public.solicitudes_folio.inspector_id
          AND ia.activo = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 7. RLS — clientes ────────────────────────────────────────
-- Auxiliar ve/crea clientes del inspector al que pertenece
DO $$ BEGIN
  CREATE POLICY "clientes: auxiliar gestiona de su inspector" ON public.clientes
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.inspector_auxiliares ia
        WHERE ia.auxiliar_id  = auth.uid()
          AND ia.inspector_id = public.clientes.created_by
          AND ia.activo = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 8. RLS — documentos_expediente ──────────────────────────
DO $$ BEGIN
  CREATE POLICY "documentos: auxiliar gestiona de su inspector" ON public.documentos_expediente
    FOR ALL USING (
      EXISTS (
        SELECT 1
        FROM   public.inspector_auxiliares ia
        JOIN   public.expedientes e ON e.id = public.documentos_expediente.expediente_id
        WHERE  ia.auxiliar_id  = auth.uid()
          AND  ia.inspector_id = e.inspector_id
          AND  ia.activo = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 9. RLS — expediente_checklist ───────────────────────────
DO $$ BEGIN
  CREATE POLICY "checklist: auxiliar gestiona de su inspector" ON public.expediente_checklist
    FOR ALL USING (
      EXISTS (
        SELECT 1
        FROM   public.inspector_auxiliares ia
        JOIN   public.expedientes e ON e.id = public.expediente_checklist.expediente_id
        WHERE  ia.auxiliar_id  = auth.uid()
          AND  ia.inspector_id = e.inspector_id
          AND  ia.activo = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 10. RLS — dias_bloqueados (solo lectura para auxiliar) ──
DO $$ BEGIN
  CREATE POLICY "dias_bloqueados: auxiliar lee de su inspector" ON public.dias_bloqueados
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.inspector_auxiliares ia
        WHERE ia.auxiliar_id = auth.uid()
          AND (ia.inspector_id = public.dias_bloqueados.inspector_id
            OR public.dias_bloqueados.inspector_id IS NULL)
          AND ia.activo = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
