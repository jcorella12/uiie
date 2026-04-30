-- Migration: add inspector_ejecutor_id to inspecciones_agenda
-- Allows an inspector to delegate the physical execution of a visit
-- to a colleague while keeping inspector_id as the record owner.

ALTER TABLE public.inspecciones_agenda
  ADD COLUMN IF NOT EXISTS inspector_ejecutor_id UUID REFERENCES public.usuarios(id);

COMMENT ON COLUMN public.inspecciones_agenda.inspector_ejecutor_id IS
  'Inspector que realiza físicamente la visita. NULL = el mismo que inspector_id.';
