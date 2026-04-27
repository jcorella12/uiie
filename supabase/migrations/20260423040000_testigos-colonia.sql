-- Agrega columna colonia a testigos (faltaba, clientes ya la tenía)
ALTER TABLE public.testigos
  ADD COLUMN IF NOT EXISTS colonia TEXT;
