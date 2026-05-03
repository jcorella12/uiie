-- Migration: add inspector_ejecutor_id to solicitudes_folio, expedientes
-- and inspecciones_agenda. Allows an inspector to delegate the physical
-- execution of a visit to a colleague while keeping inspector_id as the
-- record owner (responsable for billing / conciliación).

ALTER TABLE public.solicitudes_folio
  ADD COLUMN IF NOT EXISTS inspector_ejecutor_id UUID REFERENCES public.usuarios(id);

ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS inspector_ejecutor_id UUID REFERENCES public.usuarios(id);

ALTER TABLE public.inspecciones_agenda
  ADD COLUMN IF NOT EXISTS inspector_ejecutor_id UUID REFERENCES public.usuarios(id);

COMMENT ON COLUMN public.solicitudes_folio.inspector_ejecutor_id IS
  'Inspector que ejecuta físicamente la inspección (delegación). NULL = el mismo que inspector_id.';
COMMENT ON COLUMN public.expedientes.inspector_ejecutor_id IS
  'Inspector que ejecuta físicamente la inspección. NULL = el mismo que inspector_id.';
COMMENT ON COLUMN public.inspecciones_agenda.inspector_ejecutor_id IS
  'Inspector que realiza físicamente la visita. NULL = el mismo que inspector_id.';

-- Índices para acelerar filtros tipo "mis expedientes" (inspector_id OR ejecutor)
CREATE INDEX IF NOT EXISTS idx_solicitudes_ejecutor ON public.solicitudes_folio(inspector_ejecutor_id) WHERE inspector_ejecutor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expedientes_ejecutor ON public.expedientes(inspector_ejecutor_id) WHERE inspector_ejecutor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_ejecutor      ON public.inspecciones_agenda(inspector_ejecutor_id) WHERE inspector_ejecutor_id IS NOT NULL;
