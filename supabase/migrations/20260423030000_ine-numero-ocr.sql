-- ============================================================
-- Agrega ocr_numero_ine a clientes y testigos
-- Agrega ocr_domicilio a testigos (faltaba)
-- El numero_ine se extrae de la zona MRZ del reverso de la INE
-- (línea 1: IDMEX...<<043907064679...)
-- ============================================================

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS ocr_numero_ine TEXT;

ALTER TABLE public.testigos
  ADD COLUMN IF NOT EXISTS ocr_numero_ine TEXT,
  ADD COLUMN IF NOT EXISTS ocr_domicilio  TEXT;
