-- ============================================================
-- Evidencia de Visita
-- 1. Nuevo valor en el enum documento_tipo
-- 2. Ampliar tipos MIME aceptados en el bucket 'documentos'
--    (NULL = sin restricción de tipo, acepta cualquier archivo)
-- ============================================================

ALTER TYPE documento_tipo ADD VALUE IF NOT EXISTS 'evidencia_visita';

-- Abrir bucket a todos los MIME types para evidencia libre
UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'documentos';
