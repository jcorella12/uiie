-- Agrega el estado "devuelto" al enum expediente_status
-- Se usa cuando el inspector responsable/admin devuelve un expediente con observaciones

ALTER TYPE public.expediente_status ADD VALUE IF NOT EXISTS 'devuelto';
