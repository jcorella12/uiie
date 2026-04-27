-- ============================================================
-- Phase 6: Agenda — días bloqueados
-- Phase 7: Checklist de revisión formal (10 puntos)
-- CIAE — UIIE-CRE-021
-- ============================================================

-- ── Tabla: dias_bloqueados ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dias_bloqueados (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspector_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,  -- NULL = bloqueo global
  fecha        DATE NOT NULL,
  motivo       TEXT,
  created_by   UUID REFERENCES public.usuarios(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (inspector_id, fecha)
);

ALTER TABLE public.dias_bloqueados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dias_bloqueados: inspector ve los suyos y globales" ON public.dias_bloqueados
  FOR SELECT USING (
    inspector_id = auth.uid()
    OR inspector_id IS NULL
    OR (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

CREATE POLICY "dias_bloqueados: admin gestiona todos" ON public.dias_bloqueados
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable')
  );

-- ── Tabla: checklist_items (catálogo) ────────────────────────
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id          SERIAL PRIMARY KEY,
  orden       INT  NOT NULL,
  descripcion TEXT NOT NULL,
  categoria   TEXT NOT NULL DEFAULT 'General',
  activo      BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_items: autenticados leen" ON public.checklist_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- Poblar los 10 puntos del checklist de revisión formal
INSERT INTO public.checklist_items (orden, descripcion, categoria) VALUES
  (1,  'Oficio Resolutivo CFE recibido, con folio y fecha vigente',                             'Documentación'),
  (2,  'Número de medidor bidireccional coincide con el Oficio Resolutivo',                     'Documentación'),
  (3,  'Dictamen UVIE vigente y válido para la instalación inspeccionada',                      'Documentación'),
  (4,  'Comprobante de pago de infraestructura CFE presentado (si aplica)',                     'Documentación'),
  (5,  'Capacidad instalada (kWp) coincide exactamente con lo indicado en el Oficio Resolutivo','Sistema FV'),
  (6,  'Certificación de inversores verificada (UL1741 o IEEE 1547)',                           'Sistema FV'),
  (7,  'Interruptores I1/I2 y protecciones instalados, señalizados y accesibles',              'Protecciones'),
  (8,  'Sistema de puesta a tierra conforme a NOM-001-SEDE-2012 sección 250',                  'Instalación'),
  (9,  'INE/IFE del propietario y/o firmante verificados e incluidos en expediente',            'Documentación'),
  (10, 'Acta de inspección firmada por el inspector y los dos testigos',                        'Cierre')
ON CONFLICT DO NOTHING;

-- ── Tabla: expediente_checklist ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.expediente_checklist (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expediente_id   UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  item_id         INT  NOT NULL REFERENCES public.checklist_items(id),
  completado      BOOLEAN NOT NULL DEFAULT false,
  completado_por  UUID REFERENCES public.usuarios(id),
  completado_en   TIMESTAMPTZ,
  observacion     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(expediente_id, item_id)
);

CREATE TRIGGER trg_exp_checklist_updated_at
  BEFORE UPDATE ON public.expediente_checklist
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.expediente_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist: inspector gestiona propios" ON public.expediente_checklist
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.expedientes e
      WHERE e.id = expediente_id
        AND (e.inspector_id = auth.uid()
          OR (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'inspector_responsable'))
    )
  );

-- ── Columna checklist_pct en expedientes ─────────────────────
ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS checklist_pct INT NOT NULL DEFAULT 0;
