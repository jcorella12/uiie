-- Fix bug reportado en Prueba 01:
-- El frontend envía 'ficha_pago' como tipo de documento pero el enum
-- documento_tipo no lo tenía. Agregamos el valor.

ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'ficha_pago';
