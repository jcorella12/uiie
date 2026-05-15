-- ============================================================
-- Permite editar el precio de un expediente DESPUÉS de que el folio
-- fue asignado (la solicitud ya está aceptada).
--
-- Antes: el `precio_propuesto` se fijaba al crear la solicitud y no
-- se podía cambiar — pero en la práctica los proyectos cambian de
-- alcance (más paneles, ajuste comercial, descuento, etc.) y el
-- inspector necesitaba reflejarlo sin tirar el folio.
--
-- Este migration solo agrega una columna de historial. La columna
-- `precio_propuesto` ya existe y se sigue usando como "precio actual".
-- ============================================================

ALTER TABLE public.solicitudes_folio
  ADD COLUMN IF NOT EXISTS precio_historial JSONB
    NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.solicitudes_folio.precio_historial IS
  'Bitácora de cambios de precio. Cada elemento: {precio_anterior, precio_nuevo, fecha (ISO), usuario_id, motivo}';
