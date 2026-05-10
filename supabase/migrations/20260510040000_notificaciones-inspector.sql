-- Notificaciones bidireccionales auditor → inspector ↔ respuesta.
--
-- Caso de uso (SKILL UIIE — PRIORIDAD 3 dirección):
-- El auditor revisa con IA, salta una discrepancia de dirección entre
-- OR y Acta. Pulsa "Notificar al inspector" → este sistema crea una
-- notificación con un token único, manda email al inspector con 2
-- botones (Sí confirma / No cambiará docs), recibe la respuesta del
-- inspector vía link público (sin login), y el auditor ve la respuesta
-- en la UI del expediente.
--
-- Extensible a otras prioridades (razón social, capacidad, firmas) —
-- ver columna `tipo`.

CREATE TABLE IF NOT EXISTS public.expediente_notificaciones_inspector (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id          UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  inspector_id           UUID NOT NULL REFERENCES public.usuarios(id),  -- destinatario
  enviado_por            UUID NOT NULL REFERENCES public.usuarios(id),  -- auditor

  -- Clasificación del hallazgo
  tipo                   TEXT NOT NULL CHECK (tipo IN (
                           'direccion', 'razon_social', 'capacidad',
                           'firmas', 'ficha_pago', 'otro'
                         )),
  prioridad              INT NOT NULL CHECK (prioridad BETWEEN 1 AND 8),
  hallazgo_descripcion   TEXT NOT NULL,           -- copia del hallazgo IA
  pregunta_al_inspector  TEXT NOT NULL,           -- texto del email
  opciones               JSONB NOT NULL,          -- [{ key, label }] que aparece como botones

  -- Token único para responder vía link sin login
  token_respuesta        TEXT NOT NULL UNIQUE,

  -- Estado y respuesta
  status                 TEXT NOT NULL DEFAULT 'pendiente'
                            CHECK (status IN ('pendiente', 'respondida', 'expirada')),
  respuesta              TEXT,                    -- key de la opción elegida
  respuesta_label        TEXT,                    -- snapshot del label de la opción
  respondida_at          TIMESTAMPTZ,

  -- Email tracking
  email_enviado_at       TIMESTAMPTZ,
  email_id               TEXT,                    -- id devuelto por Resend

  -- Auditoría
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at             TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days')
);

CREATE INDEX IF NOT EXISTS idx_notif_insp_expediente
  ON public.expediente_notificaciones_inspector(expediente_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notif_insp_inspector
  ON public.expediente_notificaciones_inspector(inspector_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notif_insp_token
  ON public.expediente_notificaciones_inspector(token_respuesta);

ALTER TABLE public.expediente_notificaciones_inspector ENABLE ROW LEVEL SECURITY;

-- SELECT: el inspector ve las suyas; admin/responsable ven todas.
DROP POLICY IF EXISTS "notif_insp_select" ON public.expediente_notificaciones_inspector;
CREATE POLICY "notif_insp_select" ON public.expediente_notificaciones_inspector
  FOR SELECT TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR inspector_id = auth.uid()
    OR enviado_por = auth.uid()
  );

-- INSERT/UPDATE solo desde service role (los endpoints API).
