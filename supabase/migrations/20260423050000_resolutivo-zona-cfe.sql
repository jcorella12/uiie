-- Agrega zona/ciudad CFE extraída del resolutivo
ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS resolutivo_zona_cfe TEXT;
