-- Permite que un inspector cree el "expediente borrador" desde su
-- solicitud aunque admin aún no haya asignado folio. El inspector
-- puede ir adelantando la info técnica (paneles, inversor, dirección,
-- checklist, documentos del cliente, etc.) mientras espera el folio
-- oficial.
--
-- Cambios:
-- 1. expedientes.folio_id    → nullable (estaba NOT NULL)
-- 2. expedientes.numero_folio → nullable (estaba NOT NULL)
-- 3. expedientes.solicitud_origen_id → nueva FK a solicitudes_folio.
--    Cuando admin asigne el folio luego, busca el expediente con esta
--    referencia y lo actualiza con folio_id + numero_folio en lugar
--    de crear uno duplicado.

ALTER TABLE public.expedientes
  ALTER COLUMN folio_id DROP NOT NULL,
  ALTER COLUMN numero_folio DROP NOT NULL;

ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS solicitud_origen_id UUID
    REFERENCES public.solicitudes_folio(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expedientes_solicitud_origen
  ON public.expedientes(solicitud_origen_id)
  WHERE solicitud_origen_id IS NOT NULL;

COMMENT ON COLUMN public.expedientes.folio_id IS
  'Folio oficial asignado. NULL mientras el expediente está en borrador sin folio.';

COMMENT ON COLUMN public.expedientes.numero_folio IS
  'Número de folio asignado (UIIE-XXX-YYYY). NULL mientras está en borrador.';

COMMENT ON COLUMN public.expedientes.solicitud_origen_id IS
  'Solicitud que originó el expediente. Permite linkear el folio cuando admin lo asigne después.';
