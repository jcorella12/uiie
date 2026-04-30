-- Migration: add cli_inversor_id to expedientes so clients can select from the catalog
ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS cli_inversor_id UUID REFERENCES public.inversores(id);

COMMENT ON COLUMN public.expedientes.cli_inversor_id IS
  'Inversor seleccionado por el cliente desde el catálogo. NULL = captura manual.';
