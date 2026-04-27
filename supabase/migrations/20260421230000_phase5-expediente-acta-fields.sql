-- ============================================================
-- Phase 5: Campos faltantes en expedientes para Acta FO-12
-- y documentos operativos
-- CIAE — UIIE-CRE-021
-- ============================================================

-- ── Campos técnicos para el Acta FO-12 ───────────────────────
ALTER TABLE public.expedientes
  -- Tipo de interconexión
  ADD COLUMN IF NOT EXISTS tipo_conexion       TEXT DEFAULT 'generacion_distribuida',
  -- Medidor CFE
  ADD COLUMN IF NOT EXISTS numero_medidor      TEXT,
  -- Inversores: cuántas unidades (complementa inversor_id del catálogo)
  ADD COLUMN IF NOT EXISTS num_inversores      INT DEFAULT 1,
  -- Subestación
  ADD COLUMN IF NOT EXISTS capacidad_subestacion_kva  NUMERIC(10,2),
  -- Protecciones (incisos DACG)
  ADD COLUMN IF NOT EXISTS tiene_i1_i2                BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_interruptor_exclusivo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_ccfp                  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_proteccion_respaldo   BOOLEAN DEFAULT false,
  -- Cobro del resolutivo CFE
  ADD COLUMN IF NOT EXISTS resolutivo_tiene_cobro     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolutivo_monto           NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS resolutivo_referencia      TEXT,
  ADD COLUMN IF NOT EXISTS resolutivo_folio           TEXT,
  ADD COLUMN IF NOT EXISTS resolutivo_fecha           DATE,
  -- Dictamen UVIE
  ADD COLUMN IF NOT EXISTS dictamen_folio_dvnp        TEXT,
  ADD COLUMN IF NOT EXISTS dictamen_uvie_nombre       TEXT,
  -- Hallazgos DACG — JSONB: { inciso: string, cumple: bool, observacion: string }[]
  ADD COLUMN IF NOT EXISTS hallazgos_dacg             JSONB,
  -- Notas del acta (texto libre para observaciones finales)
  ADD COLUMN IF NOT EXISTS notas_acta                 TEXT,
  -- Resultado general de la inspección
  ADD COLUMN IF NOT EXISTS resultado_inspeccion       TEXT CHECK (resultado_inspeccion IN ('aprobado','rechazado','condicionado')),
  -- Control: documentos OPE
  ADD COLUMN IF NOT EXISTS paquete_ope_url            TEXT,
  ADD COLUMN IF NOT EXISTS paquete_ope_generado_en    TIMESTAMPTZ;

-- ── DACG incisos predefinidos como tabla de referencia ───────
-- Estos son los incisos de las DACG que se verifican en cada inspección
CREATE TABLE IF NOT EXISTS public.dacg_incisos (
  id          SERIAL PRIMARY KEY,
  codigo      TEXT NOT NULL UNIQUE,    -- ej. "1.1", "2.3"
  descripcion TEXT NOT NULL,
  seccion     TEXT NOT NULL,           -- ej. "Documentación", "Instalación", "Equipos"
  activo      BOOLEAN NOT NULL DEFAULT true
);

-- Insertar incisos DACG estándar para generación distribuida
INSERT INTO public.dacg_incisos (codigo, descripcion, seccion) VALUES
  ('1.1', 'El solicitante presentó el Oficio Resolutivo de la CFE con el folio correspondiente', 'Documentación'),
  ('1.2', 'El número de medidor bidireccional coincide con el registrado en el Oficio Resolutivo', 'Documentación'),
  ('1.3', 'El dictamen de verificación de instalaciones eléctricas (UVIE) está vigente y corresponde a la instalación', 'Documentación'),
  ('1.4', 'Se presentó comprobante de pago de infraestructura CFE (si aplica según resolutivo)', 'Documentación'),
  ('2.1', 'La capacidad del sistema fotovoltaico (kWp) coincide con lo indicado en el Oficio Resolutivo', 'Sistema FV'),
  ('2.2', 'Los inversores cuentan con certificación UL1741 o IEEE 1547 para interconexión a la red', 'Sistema FV'),
  ('2.3', 'La cantidad e identificación de paneles solares coincide con la memoria técnica', 'Sistema FV'),
  ('2.4', 'Los módulos fotovoltaicos cuentan con certificación IEC 61215 o equivalente', 'Sistema FV'),
  ('3.1', 'El interruptor de interconexión (I1/I2) está instalado, señalizado y accesible', 'Protecciones'),
  ('3.2', 'El interruptor exclusivo del sistema FV está instalado en tablero con señalización', 'Protecciones'),
  ('3.3', 'El Centro de Carga con Fusibles de Protección (CCFP) está instalado correctamente', 'Protecciones'),
  ('3.4', 'Existe protección de respaldo contra isla eléctrica activa', 'Protecciones'),
  ('4.1', 'El sistema de puesta a tierra cumple con NOM-001-SEDE-2012 sección 250', 'Instalación eléctrica'),
  ('4.2', 'Los conductores tienen la capacidad de corriente adecuada según NOM-001-SEDE-2012', 'Instalación eléctrica'),
  ('4.3', 'Los ductos y canalizaciones están correctamente instalados y señalizados', 'Instalación eléctrica'),
  ('4.4', 'Las conexiones eléctricas están aseguradas y no presentan daños visibles', 'Instalación eléctrica'),
  ('5.1', 'La subestación eléctrica tiene capacidad suficiente para la carga total instalada', 'Subestación'),
  ('5.2', 'El medidor bidireccional está instalado y en operación correcta', 'Subestación')
ON CONFLICT (codigo) DO NOTHING;

-- ── Tabla: expediente_hallazgos (alternativa estructurada a JSONB) ──
-- Permite guardar resultado por inciso de forma consultable
CREATE TABLE IF NOT EXISTS public.expediente_hallazgos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expediente_id   UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  inciso_codigo   TEXT NOT NULL REFERENCES public.dacg_incisos(codigo),
  cumple          BOOLEAN,            -- true=Cumple, false=No Cumple, null=N/A
  observacion     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(expediente_id, inciso_codigo)
);

CREATE TRIGGER trg_hallazgos_updated_at
  BEFORE UPDATE ON public.expediente_hallazgos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.expediente_hallazgos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dacg_incisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hallazgos: inspector gestiona propios" ON public.expediente_hallazgos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.expedientes e WHERE e.id = expediente_id AND e.inspector_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

CREATE POLICY "hallazgos: admin ve todos" ON public.expediente_hallazgos
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

CREATE POLICY "dacg_incisos: todos leen" ON public.dacg_incisos
  FOR SELECT USING (auth.role() = 'authenticated');
