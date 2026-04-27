-- ============================================================
-- Fix: política INSERT faltante en documentos_expediente
-- para admin e inspector_responsable.
--
-- La política existente solo permite al inspector propietario
-- del expediente subir documentos. Los admins no tenían política
-- INSERT y recibían "violates row-level security policy".
-- ============================================================

-- Política INSERT para admin e inspector_responsable
-- (pueden subir docs a cualquier expediente)
DO $$ BEGIN
  CREATE POLICY "docs: admin y responsable pueden subir"
    ON public.documentos_expediente FOR INSERT
    WITH CHECK (
      public.current_user_rol() IN ('inspector_responsable', 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Política UPDATE para que el inspector pueda actualizar sus propios docs
-- (necesario para que analizar/route.ts pueda guardar analisis_ia)
DO $$ BEGIN
  CREATE POLICY "docs: inspector actualiza propios"
    ON public.documentos_expediente FOR UPDATE
    USING (
      subido_por = auth.uid()
      OR public.current_user_rol() IN ('inspector_responsable', 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
