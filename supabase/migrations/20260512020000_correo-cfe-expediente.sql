-- ============================================================
-- Correo CFE por expediente
--
-- Antes: el correo CFE solo vivía a nivel cliente (clientes.correo_cfe),
-- así que todos los expedientes del mismo cliente compartían un correo.
-- En la práctica cada proyecto puede tener un contacto distinto en CFE
-- (responsable de la zona, gerente comercial, etc.).
--
-- Ahora: el inspector lo captura al crear la solicitud y se copia al
-- expediente cuando se asigna el folio. Tanto inspector como cliente
-- pueden editarlo después desde la UI sin tocar el cliente compartido.
-- ============================================================

-- Captura inicial al crear la solicitud
ALTER TABLE public.solicitudes_folio
  ADD COLUMN IF NOT EXISTS correo_cfe TEXT;

-- Valor canónico por expediente (con fallback al del cliente si está vacío)
ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS correo_cfe TEXT;

COMMENT ON COLUMN public.solicitudes_folio.correo_cfe IS
  'Correo CFE al que se enviará el certificado, capturado al crear la solicitud.';
COMMENT ON COLUMN public.expedientes.correo_cfe IS
  'Correo CFE para el envío del certificado (sobreescribe clientes.correo_cfe). Editable por inspector y cliente.';
