-- Migration: add meter serial number and CFE 6-char code to expedientes
ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS numero_serie_medidor TEXT,
  ADD COLUMN IF NOT EXISTS numero_cfe_medidor   TEXT;

COMMENT ON COLUMN public.expedientes.numero_serie_medidor IS
  'Número de serie físico impreso en el medidor bidireccional.';
COMMENT ON COLUMN public.expedientes.numero_cfe_medidor IS
  'Código CFE de 6 dígitos alfanuméricos del medidor bidireccional.';
