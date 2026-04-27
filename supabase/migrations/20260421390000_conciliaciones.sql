-- ─────────────────────────────────────────────────────────────────────────────
-- Módulo de Conciliación mensual
-- ─────────────────────────────────────────────────────────────────────────────

-- Tabla principal: una conciliación por inspector por mes
CREATE TABLE IF NOT EXISTS public.conciliaciones (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id             UUID         NOT NULL REFERENCES public.usuarios(id),
  mes                      SMALLINT     NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio                     SMALLINT     NOT NULL,
  status                   TEXT         NOT NULL DEFAULT 'aceptada'
                             CHECK (status IN ('aceptada','facturada','pagada','cerrada')),
  total_expedientes        INT          NOT NULL DEFAULT 0,
  total_kwp                NUMERIC(10,2),
  inspector_acepto_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  notas                    TEXT,

  -- Factura que sube el equipo CIAE
  factura_url              TEXT,
  factura_storage_path     TEXT,
  factura_nombre           TEXT,
  factura_subida_at        TIMESTAMPTZ,
  factura_subida_por       UUID         REFERENCES public.usuarios(id),

  -- Comprobante de pago que sube el inspector
  comprobante_url          TEXT,
  comprobante_storage_path TEXT,
  comprobante_nombre       TEXT,
  comprobante_subido_at    TIMESTAMPTZ,

  created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),

  UNIQUE(inspector_id, mes, anio)
);

-- Relación muchos-a-muchos: expedientes incluidos en cada conciliación
-- UNIQUE(expediente_id) → cada expediente solo puede conciliarse una vez
CREATE TABLE IF NOT EXISTS public.conciliacion_expedientes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conciliacion_id  UUID        NOT NULL REFERENCES public.conciliaciones(id) ON DELETE CASCADE,
  expediente_id    UUID        NOT NULL REFERENCES public.expedientes(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(expediente_id)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.conciliaciones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliacion_expedientes ENABLE ROW LEVEL SECURITY;

-- Inspector ve y modifica solo las suyas
CREATE POLICY "conciliaciones_inspector_own"
  ON public.conciliaciones
  USING (auth.uid() = inspector_id);

-- Staff (admin / inspector_responsable) tiene acceso total
CREATE POLICY "conciliaciones_staff_all"
  ON public.conciliaciones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin', 'inspector_responsable')
    )
  );

-- Junction: inspector ve las de sus conciliaciones
CREATE POLICY "conc_exp_inspector_own"
  ON public.conciliacion_expedientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conciliaciones c
      WHERE c.id = conciliacion_id
        AND c.inspector_id = auth.uid()
    )
  );

-- Staff tiene acceso total a la junction
CREATE POLICY "conc_exp_staff_all"
  ON public.conciliacion_expedientes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin', 'inspector_responsable')
    )
  );
