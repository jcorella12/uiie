-- Agregar campo de monto total a conciliaciones
ALTER TABLE public.conciliaciones
  ADD COLUMN IF NOT EXISTS total_monto NUMERIC(12,2);

-- Índice para búsquedas por inspector + período
CREATE INDEX IF NOT EXISTS conciliaciones_inspector_periodo
  ON public.conciliaciones (inspector_id, anio DESC, mes DESC);
