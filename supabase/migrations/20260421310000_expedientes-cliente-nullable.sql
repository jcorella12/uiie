-- Hacer cliente_id nullable en expedientes.
-- Razón: algunas solicitudes se crean con cliente_nombre (texto libre)
-- sin vincular un registro en public.clientes. El expediente debe poder
-- crearse de todas formas; el inspector enlaza el cliente después.
ALTER TABLE public.expedientes
  ALTER COLUMN cliente_id DROP NOT NULL;
