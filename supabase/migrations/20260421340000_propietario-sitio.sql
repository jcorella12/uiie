-- ============================================================
-- Separar "cliente EPC/integrador" de "propietario del sitio"
--
-- Antes:  cliente_nombre = Walmart (dueño del sitio, requerido)
--         cliente_epc_id  = Greenlux (integrador, opcional)
--
-- Después: cliente_nombre = Greenlux/Dicoma (el que contrata a CIAE)
--          propietario_nombre = Walmart/7-Eleven (donde se instala)
-- ============================================================

-- solicitudes_folio
ALTER TABLE public.solicitudes_folio
  ADD COLUMN IF NOT EXISTS propietario_nombre TEXT;

-- expedientes
ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS propietario_nombre TEXT;

-- Hacer cliente_nombre nullable para nuevos flujos
-- (los registros históricos ya tienen el propietario ahí)
ALTER TABLE public.solicitudes_folio
  ALTER COLUMN cliente_nombre DROP NOT NULL;

COMMENT ON COLUMN public.solicitudes_folio.propietario_nombre
  IS 'Dueño del sitio de instalación (Walmart, 7-Eleven, etc.). Distinto del EPC que contrata a CIAE.';

COMMENT ON COLUMN public.expedientes.propietario_nombre
  IS 'Dueño del sitio de instalación. Se copia desde solicitudes_folio.';
