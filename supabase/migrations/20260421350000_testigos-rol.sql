-- Añadir campo rol a testigos
-- Renombrar conceptualmente: testigo → participante en la inspección
ALTER TABLE public.testigos
  ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'testigo'
  CHECK (rol IN ('testigo','representante','firmante','atiende','otro'));

COMMENT ON COLUMN public.testigos.rol
  IS 'Rol del participante en la inspección: testigo, representante, firmante, atiende, otro';
