ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS cli_marca_paneles        TEXT,
  ADD COLUMN IF NOT EXISTS cli_modelo_paneles       TEXT,
  ADD COLUMN IF NOT EXISTS cli_num_paneles          INT,
  ADD COLUMN IF NOT EXISTS cli_potencia_panel_wp    NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS cli_marca_inversor       TEXT,
  ADD COLUMN IF NOT EXISTS cli_modelo_inversor      TEXT,
  ADD COLUMN IF NOT EXISTS cli_capacidad_kw         NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS cli_num_inversores       INT,
  ADD COLUMN IF NOT EXISTS cli_num_medidor          TEXT,
  ADD COLUMN IF NOT EXISTS cli_direccion            TEXT,
  ADD COLUMN IF NOT EXISTS cli_notas                TEXT,
  ADD COLUMN IF NOT EXISTS cli_completado_at        TIMESTAMPTZ;

ALTER TABLE public.documentos_expediente
  ADD COLUMN IF NOT EXISTS subido_por_cliente BOOLEAN NOT NULL DEFAULT false;
