-- Certificado CRE por expediente
-- Agrega campos de certificado nacional directamente al expediente
-- y dos nuevos tipos de documento para el cert y el acuse

ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS numero_certificado       TEXT,
  ADD COLUMN IF NOT EXISTS fecha_emision_certificado DATE;

-- Nuevos tipos de documento (ENUM de Postgres)
ALTER TYPE documento_tipo ADD VALUE IF NOT EXISTS 'certificado_cre';
ALTER TYPE documento_tipo ADD VALUE IF NOT EXISTS 'acuse_cre';
