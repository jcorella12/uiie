-- Tabla de homologaciones por marca de inversor.
--
-- Cuando una marca tiene un oficio CNE que reconoce el cumplimiento del
-- numeral 6.2.1 de la RES/142/2017 mediante reportes alternos a UL 1741
-- (p.ej. IEEE 1547 + IEC 61727 para Huawei), almacenamos los archivos PDF
-- en `documentos/homologaciones/inversores/<marca>/` y guardamos las
-- redacciones para la lista de verificación y para el acta.
--
-- En la generación del ZIP del expediente, cuando el inversor del expediente
-- pertenece a una marca con homologación vigente, los PDFs se agregan
-- automáticamente a la carpeta "4. CERTIFICADO INVERSOR".

CREATE TABLE IF NOT EXISTS public.inversor_homologaciones (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marca               TEXT NOT NULL UNIQUE,
  oficio_cne_path     TEXT,                  -- Path en bucket "documentos"
  oficio_cne_nombre   TEXT,                  -- Filename amigable (e.g. "F00.06.UE.225.2026.pdf")
  oficio_cne_numero   TEXT,                  -- Número del oficio (e.g. "F00.06.UE/225/2026")
  oficio_cne_fecha    DATE,
  carta_marca_path    TEXT,                  -- Path de la clarificación del fabricante
  carta_marca_nombre  TEXT,
  carta_marca_fecha   DATE,
  redaccion_lista     TEXT,                  -- Texto sugerido para lista de verificación
  redaccion_acta      TEXT,                  -- Texto sugerido para acta de inspección
  vigente             BOOLEAN NOT NULL DEFAULT true,
  notas               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inversor_homol_marca ON public.inversor_homologaciones(LOWER(marca)) WHERE vigente = true;

-- RLS: lectura para cualquier staff/cliente autenticado; escritura solo admin/responsable.
ALTER TABLE public.inversor_homologaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "homol_read"  ON public.inversor_homologaciones;
DROP POLICY IF EXISTS "homol_write" ON public.inversor_homologaciones;

CREATE POLICY "homol_read" ON public.inversor_homologaciones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "homol_write" ON public.inversor_homologaciones
  FOR ALL TO authenticated
  USING (public.current_user_rol() IN ('admin', 'inspector_responsable'))
  WITH CHECK (public.current_user_rol() IN ('admin', 'inspector_responsable'));

-- Seed: Huawei (con paths placeholder — los actualizamos tras subir los PDFs)
INSERT INTO public.inversor_homologaciones (
  marca, oficio_cne_numero, oficio_cne_fecha, carta_marca_fecha,
  redaccion_lista, redaccion_acta
) VALUES (
  'Huawei',
  'F00.06.UE/225/2026',
  '2026-01-28',
  '2026-02-06',
  'Inversor marca Huawei. CUMPLE. El solicitante presenta el oficio F00.06.UE/225/2026 emitido por la Comisión Nacional de Energía (CNE) el 28 de enero de 2026, mediante el cual se reconoce que los reportes de conformidad de pruebas operativas de Huawei Technologies de México, S.A. de C.V. acreditan las pruebas indicadas en la Tabla 5 de la RES/142/2017, así como la carta de Clarificación RES/142/2017 de Huawei (06/02/2026) que documenta el cumplimiento bajo los estándares IEEE 1547 e IEC 61727.',
  'El inversor instalado corresponde a la marca Huawei. En sustitución del certificado UL 1741, el solicitante exhibe los siguientes documentos que acreditan el cumplimiento del numeral 6.2.1 de la Resolución RES/142/2017:

1. Oficio F00.06.UE/225/2026, expedido por la Comisión Nacional de Energía a través de su Unidad de Electricidad el 28 de enero de 2026, firmado por el Titular de la Unidad, Héctor Alejandro Beltrán Mora. La CNE manifiesta que "no encuentra impedimento en que los citados reportes sean presentados como evidencia a efecto de que se acrediten las pruebas que se indican en la Tabla 5" y que los parámetros de aceptación o rechazo serán los considerados en las normas IEEE 1547 y UL 1741.

2. Carta de Clarificación RES/142/2017 emitida por Huawei Technologies de México, S.A. de C.V. el 06 de febrero de 2026, en la que se relacionan los reportes de pruebas operativas (IEEE 1547 e IEC 61727) que acreditan: factor de potencia, distorsión armónica, inyección de corriente directa, variación de tensión y frecuencia, reconexión con retardo, anti-isla, no exportación, capacidad de aislamiento contra sobretensiones y sincronización.

Por lo anterior, se da por acreditado el requisito de certificación del equipo de interconexión y se determina CUMPLE respecto a la Tabla 5 de la RES/142/2017.'
)
ON CONFLICT (marca) DO UPDATE SET
  oficio_cne_numero  = EXCLUDED.oficio_cne_numero,
  oficio_cne_fecha   = EXCLUDED.oficio_cne_fecha,
  carta_marca_fecha  = EXCLUDED.carta_marca_fecha,
  redaccion_lista    = EXCLUDED.redaccion_lista,
  redaccion_acta     = EXCLUDED.redaccion_acta,
  updated_at         = now();
