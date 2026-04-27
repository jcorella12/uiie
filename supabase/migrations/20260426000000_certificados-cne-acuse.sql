-- Tabla de certificados CNE (antes llamada CRE)
-- Incluye url_acuse para el acuse de recibo del certificado

CREATE TABLE IF NOT EXISTS public.certificados_cre (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_certificado  TEXT        NOT NULL,              -- e.g. UIIE-CC-02311-2026
  titulo              TEXT,                              -- descripción breve / nombre del cliente
  url_cre             TEXT        NOT NULL,              -- link al portal CNE/CRE
  url_acuse           TEXT,                              -- link o archivo del acuse de recibo
  url_qr              TEXT,                              -- link que trae el QR del certificado
  resumen_acta        TEXT,                              -- texto del resumen del acta
  fecha_emision       DATE,
  expediente_id       UUID        REFERENCES public.expedientes(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID        REFERENCES public.usuarios(id)
);

ALTER TABLE public.certificados_cre ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='certificados_cre' AND policyname='cert_cre_read_all'
  ) THEN
    CREATE POLICY cert_cre_read_all
      ON public.certificados_cre FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='certificados_cre' AND policyname='cert_cre_write_staff'
  ) THEN
    CREATE POLICY cert_cre_write_staff
      ON public.certificados_cre FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.usuarios u
          WHERE u.id = auth.uid()
            AND u.rol IN ('admin', 'inspector_responsable')
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS cert_cre_fecha_idx
  ON public.certificados_cre (fecha_emision DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS cert_cre_num_idx
  ON public.certificados_cre (numero_certificado);
