-- Asignar inspector responsable al cliente (separado de "created_by").
--
-- Hasta ahora "created_by" era la única referencia entre un cliente y un
-- inspector. Cuando admin/responsable invita a un cliente como usuario, no
-- queda ligado a ningún inspector y los inspectores no lo ven en su lista.
--
-- "inspector_id" es la asignación operativa actual (puede cambiar — admin
-- puede reasignar). "created_by" se mantiene como auditoría de origen.

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS inspector_id UUID REFERENCES public.usuarios(id);

CREATE INDEX IF NOT EXISTS idx_clientes_inspector_id
  ON public.clientes(inspector_id);

-- Backfill: si no hay inspector asignado pero sí un creador, úsalo
-- como asignación inicial. Es el comportamiento que ya tenían los
-- clientes históricos vía el RLS.
UPDATE public.clientes
   SET inspector_id = created_by
 WHERE inspector_id IS NULL
   AND created_by IS NOT NULL;

-- Reemplazar la policy SELECT para incluir el nuevo campo. El resto de
-- las condiciones se preservan (admin/responsable, cliente_role, creador,
-- vinculado por expediente/solicitud).
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
CREATE POLICY "clientes_select" ON public.clientes
  FOR SELECT TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR (public.current_user_rol() = 'cliente' AND usuario_id = auth.uid())
    OR created_by = auth.uid()
    OR inspector_id = auth.uid()
    OR public.cliente_vinculado_al_user(id, auth.uid())
  );

COMMENT ON COLUMN public.clientes.inspector_id IS
  'Inspector responsable actual del cliente. Puede ser NULL (cliente recién invitado sin asignar) o reasignarse por admin. created_by se mantiene como auditoría inmutable de origen.';
