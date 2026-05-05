-- Sistema de feedback / reporte de bugs.
--
-- Cualquier usuario autenticado puede crear un feedback (bug, mejora, idea).
-- Solo admin / inspector_responsable lo ve y lo atiende.
-- El usuario que lo reportó ve solo el suyo (status / nota de respuesta).

-- ── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.feedback_tipo AS ENUM ('bug', 'mejora', 'pregunta', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.feedback_status AS ENUM ('nuevo', 'en_revision', 'resuelto', 'descartado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tabla feedback ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id         UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE SET NULL,
  tipo               public.feedback_tipo  NOT NULL DEFAULT 'bug',
  titulo             TEXT  NOT NULL,
  descripcion        TEXT,
  url_pagina         TEXT,
  user_agent         TEXT,
  screenshots        JSONB NOT NULL DEFAULT '[]'::jsonb,
  status             public.feedback_status NOT NULL DEFAULT 'nuevo',
  prioridad          INT   NOT NULL DEFAULT 3 CHECK (prioridad BETWEEN 1 AND 5),
  notas_responsable  TEXT,
  atendido_por       UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  atendido_en        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status     ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_usuario    ON public.feedback(usuario_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_insert" ON public.feedback;
DROP POLICY IF EXISTS "feedback_select" ON public.feedback;
DROP POLICY IF EXISTS "feedback_update" ON public.feedback;

-- INSERT: cualquier autenticado, pero forzando usuario_id = self
CREATE POLICY "feedback_insert" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- SELECT: el reporter ve los suyos; admin/responsable ven todos
CREATE POLICY "feedback_select" ON public.feedback
  FOR SELECT TO authenticated USING (
    usuario_id = auth.uid()
    OR public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- UPDATE: solo admin/responsable (atender, cambiar status)
CREATE POLICY "feedback_update" ON public.feedback
  FOR UPDATE TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  ) WITH CHECK (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
  );

-- ── Trigger: notificar al responsable cuando llega feedback nuevo ──────────
-- Aprovecha la tabla notificaciones existente.
CREATE OR REPLACE FUNCTION public.fn_notify_nuevo_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  responsable_uid UUID;
BEGIN
  -- Notificar al inspector_responsable principal (Joaquín)
  SELECT id INTO responsable_uid
  FROM public.usuarios
  WHERE rol = 'inspector_responsable' AND activo = true
  LIMIT 1;

  IF responsable_uid IS NOT NULL THEN
    INSERT INTO public.notificaciones (destinatario_id, tipo, titulo, mensaje, url)
    VALUES (
      responsable_uid,
      'feedback',
      CASE NEW.tipo
        WHEN 'bug'      THEN '🐞 Nuevo bug reportado'
        WHEN 'mejora'   THEN '💡 Nueva mejora sugerida'
        WHEN 'pregunta' THEN '❓ Nueva pregunta'
        ELSE '📝 Nuevo feedback'
      END,
      LEFT(COALESCE(NEW.titulo, ''), 200),
      '/dashboard/admin/feedback'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nuevo_feedback ON public.feedback;
CREATE TRIGGER trg_nuevo_feedback
  AFTER INSERT ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_nuevo_feedback();

COMMENT ON TABLE public.feedback IS 'Comentarios, bugs y mejoras enviados por usuarios. Solo admin/responsable los atiende.';
