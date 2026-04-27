-- Campos de subestación eléctrica y protecciones para expedientes

ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS numero_subestacion   TEXT,
  ADD COLUMN IF NOT EXISTS voltaje_entrada_kv   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS voltaje_salida_v     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS marca_trafo          TEXT,
  ADD COLUMN IF NOT EXISTS numero_trafo         TEXT;

-- Nota: los campos de protecciones ya existen desde fase 5:
--   tiene_i1_i2                BOOLEAN DEFAULT false
--   tiene_interruptor_exclusivo BOOLEAN DEFAULT false
--   tiene_ccfp                  BOOLEAN DEFAULT false
--   tiene_proteccion_respaldo   BOOLEAN DEFAULT false
--   capacidad_subestacion_kva   NUMERIC(10,2)
