-- Campos adicionales para el Acta FO-12 oficial

-- Dirección completa del proyecto
ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS colonia          TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal    TEXT,
  ADD COLUMN IF NOT EXISTS municipio        TEXT,
  ADD COLUMN IF NOT EXISTS tipo_central     TEXT DEFAULT 'MT',   -- MT | BT
  ADD COLUMN IF NOT EXISTS resolutivo_fecha DATE;

-- Testigos: agregar dirección para bloque de firmas
ALTER TABLE public.testigos
  ADD COLUMN IF NOT EXISTS direccion TEXT;
