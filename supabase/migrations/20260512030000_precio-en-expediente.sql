-- ============================================================
-- Mover el "precio actual" del expediente a su propia tabla.
--
-- Antes: el precio vivía únicamente en `solicitudes_folio.precio_propuesto`
-- y el inspector tenía que ir a la solicitud original para verlo o
-- editarlo. Pero hay expedientes sin solicitud (creados manualmente,
-- legacy de la migración inicial, folios asignados directo) y para esos
-- el endpoint /api/expedientes/[id]/precio respondía 404.
--
-- Ahora: cada expediente lleva su propio `precio_propuesto` + bitácora
-- en `precio_historial`. La solicitud mantiene su valor original como
-- referencia comercial; el expediente es la fuente de verdad operativa.
-- ============================================================

ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS precio_propuesto NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS precio_historial JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.expedientes.precio_propuesto IS
  'Precio del expediente en MXN (sin IVA). Fuente de verdad operativa — sobreescribe el de la solicitud original.';
COMMENT ON COLUMN public.expedientes.precio_historial IS
  'Bitácora de cambios del precio. Cada elemento: {precio_anterior, precio_nuevo, fecha, usuario_id, rol, motivo}.';

-- Backfill: para expedientes que no tienen precio cargado pero sí tienen
-- solicitud asociada con precio_propuesto, copiamos el valor.
UPDATE public.expedientes e
   SET precio_propuesto = s.precio_propuesto
  FROM public.solicitudes_folio s
 WHERE s.folio_asignado_id = e.folio_id
   AND e.precio_propuesto IS NULL
   AND s.precio_propuesto IS NOT NULL;
