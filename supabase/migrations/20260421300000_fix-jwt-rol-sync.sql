-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: sincronizar rol → auth.users.raw_user_meta_data
--
-- Problema raíz:
--   El import Q1 (import-q1-2026.sql) insertó registros en public.usuarios
--   con UUIDs hardcodeados. Las cuentas reales en auth.users tienen UUIDs
--   distintos. current_user_rol() falla en ambas ramas:
--     1) auth.jwt()->'user_metadata'->>'rol' → null (cuenta sin metadata)
--     2) SELECT rol FROM usuarios WHERE id = auth.uid() → null (UUID mismatch)
--   Resultado: todas las RLS policies devuelven false → cero datos visibles.
--
-- Solución:
--   Inyectar 'rol' en raw_user_meta_data de auth.users haciendo JOIN por email
--   (email es único y no depende del UUID). Tras esto, la rama 1 de
--   current_user_rol() funciona siempre, independientemente del UUID.
--
--   Además se crea un trigger para que cualquier cambio futuro de rol en
--   public.usuarios se propague automáticamente al JWT metadata.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Sincronizar rol para todos los usuarios existentes ─────────────────────
UPDATE auth.users au
SET raw_user_meta_data =
      COALESCE(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('rol', u.rol::text)
FROM public.usuarios u
WHERE au.email = u.email;

-- ── 2. Función trigger: propagar cambios de rol al JWT metadata ───────────────
CREATE OR REPLACE FUNCTION public.sync_rol_to_jwt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Busca la cuenta auth por id directo O por email (cubre el UUID mismatch)
  UPDATE auth.users
  SET raw_user_meta_data =
        COALESCE(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('rol', NEW.rol::text)
  WHERE id = NEW.id
     OR email = (
          SELECT email FROM auth.users
          WHERE id = NEW.id
          LIMIT 1
        );
  RETURN NEW;
END;
$$;

-- ── 3. Trigger en public.usuarios ────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_sync_rol_to_jwt ON public.usuarios;

CREATE TRIGGER trg_sync_rol_to_jwt
  AFTER INSERT OR UPDATE OF rol
  ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_rol_to_jwt();
