-- Security hardening — Pre-launch audit fixes
--
-- 1. C5: Tighten storage RLS for `documentos` bucket
--    Previous policies allowed any authenticated user to SELECT/INSERT
--    anywhere in the bucket. Now scope reads/writes by path prefix.
-- 2. C11: Prevent self-promotion via usuarios.rol / usuarios.activo
--    The existing policy lets a user UPDATE their own row. A BEFORE UPDATE
--    trigger now resets `rol` and `activo` to their OLD values unless the
--    caller is admin or inspector_responsable.

-- ─── 1. Storage RLS tightening ────────────────────────────────────────────
DROP POLICY IF EXISTS "storage: inspector sube propios docs"  ON storage.objects;
DROP POLICY IF EXISTS "storage: inspector ve propios docs"    ON storage.objects;
DROP POLICY IF EXISTS "storage: inspector borra propios docs" ON storage.objects;

-- Helper: the current user's role (already exists from earlier migrations)
-- Returns NULL if no session.
-- Defined in 20260421280000_fix-rls-jwt-fallback.sql as public.current_user_rol().

-- INSERT: staff can write anywhere; cliente only inside cliente/<expediente_id>/
-- where they actually own the expediente.
CREATE POLICY "storage_documentos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos' AND auth.role() = 'authenticated' AND (
      -- Staff: always allowed (server-side service role bypasses anyway,
      -- but JWT-based clients still go through this gate).
      public.current_user_rol() IN ('admin', 'inspector_responsable', 'inspector', 'auxiliar')
      OR
      -- Cliente: only into their own expediente subfolder.
      -- Path convention: cliente/<expediente_id>/...
      (
        public.current_user_rol() = 'cliente'
        AND (storage.foldername(name))[1] = 'cliente'
        AND (storage.foldername(name))[2]::uuid IN (
          SELECT e.id FROM public.expedientes e
          INNER JOIN public.clientes c ON c.id = e.cliente_id
          WHERE c.usuario_id = auth.uid()
        )
      )
    )
  );

-- SELECT: staff can read anywhere; cliente only their own expediente docs.
CREATE POLICY "storage_documentos_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentos' AND auth.role() = 'authenticated' AND (
      public.current_user_rol() IN ('admin', 'inspector_responsable', 'inspector', 'auxiliar')
      OR
      (
        public.current_user_rol() = 'cliente'
        AND (storage.foldername(name))[1] = 'cliente'
        AND (storage.foldername(name))[2]::uuid IN (
          SELECT e.id FROM public.expedientes e
          INNER JOIN public.clientes c ON c.id = e.cliente_id
          WHERE c.usuario_id = auth.uid()
        )
      )
    )
  );

-- DELETE: staff only (clientes shouldn't delete via direct storage; their
-- /api/cliente/documentos/eliminar route handles their case via service role).
CREATE POLICY "storage_documentos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documentos' AND auth.role() = 'authenticated' AND
    public.current_user_rol() IN ('admin', 'inspector_responsable', 'inspector', 'auxiliar')
  );

-- ─── 2. Block self-promotion on usuarios ──────────────────────────────────
-- A BEFORE UPDATE trigger that snaps `rol` and `activo` back to OLD whenever
-- the caller is not admin / responsable. The whitelist of fields that a
-- regular user can self-edit (nombre, apellidos, telefono, avatar_url,
-- debe_cambiar_password, etc.) is enforced at the route layer; this trigger
-- is the last line of defense against direct supabase-js calls.

CREATE OR REPLACE FUNCTION public.prevent_self_role_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_rol text;
BEGIN
  -- Service role / no session: skip (server-side admin operations).
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  caller_rol := public.current_user_rol();

  -- Admins and responsables can change any field on any user.
  IF caller_rol IN ('admin', 'inspector_responsable') THEN
    RETURN NEW;
  END IF;

  -- Self-edit: reset privileged fields to OLD.
  IF auth.uid() = OLD.id THEN
    NEW.rol    := OLD.rol;
    NEW.activo := OLD.activo;
    -- Email change requires admin too (auth flow controls this).
    NEW.email  := OLD.email;
    RETURN NEW;
  END IF;

  -- Any other case: block.
  RAISE EXCEPTION 'No autorizado para modificar este usuario';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_role_promotion ON public.usuarios;
CREATE TRIGGER trg_prevent_self_role_promotion
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_promotion();

COMMENT ON FUNCTION public.prevent_self_role_promotion IS
  'Hardening: prevents self-promotion to admin/responsable via direct supabase-js UPDATE.';
