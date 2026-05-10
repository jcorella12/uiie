-- Vincula a un usuario (auxiliar o inspector) con su "supervisor" — el
-- inspector / inspector_responsable que lo administra.
--
-- Caso de uso: ver desde el catálogo de usuarios qué inspector atiende
-- a cada auxiliar (ej. "Alejandra Martínez es de Luis Felipe").
--
-- Para usuarios con rol 'cliente' este campo no aplica (su "inspector"
-- vive en clientes.inspector_id del registro vinculado).

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_supervisor
  ON public.usuarios(supervisor_id)
  WHERE supervisor_id IS NOT NULL;

COMMENT ON COLUMN public.usuarios.supervisor_id IS
  'Inspector / responsable a quien reporta este usuario (típicamente para auxiliares).';
