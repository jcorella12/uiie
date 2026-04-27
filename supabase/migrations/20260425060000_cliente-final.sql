-- Agrega el campo "cliente final" directamente en el expediente
-- Es el nombre de la persona/empresa a quien se emite el certificado
-- (puede ser Walmart, el propietario del inmueble, etc.)
-- Se muestra en: InfoTécnica, Acta, Cotización, Lista de Verificación, Plan de Inspección
ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS nombre_cliente_final TEXT;
