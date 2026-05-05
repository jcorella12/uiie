-- Nuevo tipo de documento: paquete escaneado que contiene Acta, Lista,
-- Cotización y Plan en un solo PDF. Frecuente cuando el inspector escanea
-- todos los documentos firmados juntos.

ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'paquete_actas_listas';
