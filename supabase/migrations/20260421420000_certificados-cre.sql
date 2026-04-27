-- Registro de certificados CRE (Comisión Reguladora de Energía)
-- Cada certificado tiene un link directo a la página pública de la CRE
CREATE TABLE IF NOT EXISTS public.certificados_cre (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_certificado  TEXT        NOT NULL,             -- e.g. UIIE-CRE-021-2026-001
  titulo              TEXT,                             -- descripción breve
  url_cre             TEXT        NOT NULL,             -- link a la página CRE
  url_qr              TEXT,                             -- link que trae el QR del certificado
  resumen_acta        TEXT,                             -- texto del resumen del acta (del QR)
  fecha_emision       DATE,
  expediente_id       UUID        REFERENCES public.expedientes(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID        REFERENCES public.usuarios(id)
);

-- Todos los autenticados pueden leer (catálogo compartido)
ALTER TABLE public.certificados_cre ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cert_cre_read_all"
  ON public.certificados_cre FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "cert_cre_write_staff"
  ON public.certificados_cre FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin', 'inspector_responsable')
    )
  );

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS cert_cre_fecha_idx
  ON public.certificados_cre (fecha_emision DESC NULLS LAST);
