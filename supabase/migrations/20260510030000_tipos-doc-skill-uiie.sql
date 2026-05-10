-- Nuevos tipos de documento requeridos por el SKILL Analizador de
-- Expediente UIIE. Cada uno tiene reglas específicas de validación
-- en /api/expedientes/revision-ia.
--
-- Mapeo a la spec del SKILL:
--   cotizacion         → COTIZACIÓN (UIIE)
--   plan_inspeccion    → PLAN DE INSPECCIÓN (UIIE)
--   recibo_cfe         → RECIBO CFE (cliente)
--   foto_medidor       → FOTO DE MEDIDOR (cliente, valida bidir en JAL/NL)
--   comprobante_pago   → COMPROBANTE DE PAGO (cliente, si OR trae ficha)

ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'cotizacion';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'plan_inspeccion';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'recibo_cfe';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'foto_medidor';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'comprobante_pago';
