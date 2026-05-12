-- ============================================================
-- Multi-inversores por expediente
--
-- Antes: cada expediente tenía un solo inversor (expedientes.inversor_id +
-- num_inversores como cantidad). Esto no representaba proyectos reales
-- donde es común ver mezcla de modelos (ej. 8 Sungrow SG110CX + 2 Huawei
-- SUN2000-100KTL).
--
-- Ahora: nueva tabla `expediente_inversores` (1..N filas por expediente).
-- Cada fila lleva su propia marca/modelo/potencia/cantidad/certificación.
-- Las columnas viejas (expedientes.inversor_id, num_inversores, etc.) se
-- mantienen como respaldo para no romper nada — se llenan con la "fila
-- principal" para retrocompatibilidad.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.expediente_inversores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id   UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  orden           INT  NOT NULL DEFAULT 1,           -- para mostrar en orden estable
  inversor_id     UUID REFERENCES public.inversores(id),  -- catálogo (opcional)

  -- Snapshot de datos del catálogo (en caso que el catálogo cambie luego,
  -- el acta sigue reflejando lo que se inspeccionó).
  marca           TEXT NOT NULL,
  modelo          TEXT NOT NULL,
  potencia_kw     NUMERIC(10,2),                     -- por unidad
  cantidad        INT NOT NULL DEFAULT 1 CHECK (cantidad >= 1),
  certificacion   TEXT NOT NULL DEFAULT 'ul1741'
                  CHECK (certificacion IN ('ul1741','ieee1547','homologado_cne','ninguna')),
  justificacion_ieee1547 TEXT,
  notas           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exp_inv_expediente
  ON public.expediente_inversores(expediente_id, orden);

CREATE TRIGGER trg_exp_inv_updated_at
  BEFORE UPDATE ON public.expediente_inversores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────
ALTER TABLE public.expediente_inversores ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquiera que pueda leer el expediente (admin/responsable/
-- inspector dueño/ejecutor/cliente vinculado).
DROP POLICY IF EXISTS "exp_inv_select" ON public.expediente_inversores;
CREATE POLICY "exp_inv_select" ON public.expediente_inversores
  FOR SELECT TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR EXISTS (
      SELECT 1 FROM public.expedientes e
      WHERE e.id = expediente_id
        AND (
          e.inspector_id = auth.uid()
          OR e.inspector_ejecutor_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.clientes c
            WHERE c.id = e.cliente_id AND c.usuario_id = auth.uid()
          )
        )
    )
  );

-- Insert/Update/Delete: admin, responsable, o inspector dueño del expediente.
-- Cliente también puede cuando edita su precarga (vía endpoint propio que
-- usa service role, así que no lo agregamos a RLS aquí).
DROP POLICY IF EXISTS "exp_inv_modify" ON public.expediente_inversores;
CREATE POLICY "exp_inv_modify" ON public.expediente_inversores
  FOR ALL TO authenticated
  USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR EXISTS (
      SELECT 1 FROM public.expedientes e
      WHERE e.id = expediente_id
        AND (e.inspector_id = auth.uid() OR e.inspector_ejecutor_id = auth.uid())
    )
  )
  WITH CHECK (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR EXISTS (
      SELECT 1 FROM public.expedientes e
      WHERE e.id = expediente_id
        AND (e.inspector_id = auth.uid() OR e.inspector_ejecutor_id = auth.uid())
    )
  );

-- ── Backfill: una fila por expediente con datos existentes ─────
-- Esto asegura que documentos generados para expedientes antiguos
-- sigan funcionando sin que el inspector tenga que recargar nada.
INSERT INTO public.expediente_inversores
  (expediente_id, orden, inversor_id, marca, modelo, potencia_kw, cantidad, certificacion, justificacion_ieee1547)
SELECT
  e.id,
  1,
  e.inversor_id,
  COALESCE(i.marca, '—'),
  COALESCE(i.modelo, '—'),
  i.potencia_kw,
  COALESCE(e.num_inversores, 1),
  COALESCE(i.certificacion, 'ul1741'),
  i.justificacion_ieee1547
FROM public.expedientes e
LEFT JOIN public.inversores i ON i.id = e.inversor_id
WHERE e.inversor_id IS NOT NULL                              -- solo expedientes que ya tenían inversor
  AND NOT EXISTS (                                            -- evitar duplicados si la migración corre 2 veces
    SELECT 1 FROM public.expediente_inversores x
    WHERE x.expediente_id = e.id
  );

COMMENT ON TABLE public.expediente_inversores IS
  'Permite registrar múltiples modelos de inversor por expediente (común en proyectos grandes con marcas mezcladas).';
