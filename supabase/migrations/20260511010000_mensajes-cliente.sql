-- Mensajes del inspector / admin → cliente, desde el detalle del expediente.
-- Permite que el inspector pida documentos faltantes, aclare dudas, o dé
-- indicaciones por escrito al cliente sin salir de la app.
--
-- El email sale desde el dominio de la app (Resend) con branding UIIE.
-- El cliente ve el mensaje en su portal con badge destacado hasta que
-- lo marca como leído (o lo hace automáticamente al entrar al detalle).

CREATE TABLE IF NOT EXISTS public.expediente_mensajes_cliente (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id   UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,

  -- Quién manda
  enviado_por     UUID NOT NULL REFERENCES public.usuarios(id),
  enviado_por_rol TEXT NOT NULL,            -- snapshot ('admin', 'inspector_responsable', 'inspector')

  -- A quién (snapshot — puede cambiar el cliente del expediente luego)
  cliente_id      UUID REFERENCES public.clientes(id),
  cliente_email   TEXT,                     -- email al que se mandó

  -- Contenido
  asunto          TEXT,                     -- opcional, defaultea a "Mensaje sobre tu expediente UIIE-XXX"
  mensaje         TEXT NOT NULL CHECK (length(trim(mensaje)) >= 5),

  -- Email tracking
  email_enviado_at TIMESTAMPTZ,
  email_id         TEXT,                    -- id devuelto por Resend
  email_error      TEXT,                    -- si falló el envío

  -- Lectura por el cliente
  leido_at        TIMESTAMPTZ,
  leido_por       UUID REFERENCES public.usuarios(id),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msj_cli_expediente
  ON public.expediente_mensajes_cliente(expediente_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_msj_cli_pendientes
  ON public.expediente_mensajes_cliente(cliente_id, leido_at)
  WHERE leido_at IS NULL;

ALTER TABLE public.expediente_mensajes_cliente ENABLE ROW LEVEL SECURITY;

-- SELECT:
--  · admin / inspector_responsable: todos
--  · inspector: los del expediente del que es dueño / ejecutor (vía expediente)
--  · cliente: los suyos (vinculados al cliente_id de su registro)
DROP POLICY IF EXISTS "msj_cli_select" ON public.expediente_mensajes_cliente;
CREATE POLICY "msj_cli_select" ON public.expediente_mensajes_cliente
  FOR SELECT TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR enviado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.expedientes e
      WHERE e.id = expediente_id
        AND (e.inspector_id = auth.uid() OR e.inspector_ejecutor_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_id AND c.usuario_id = auth.uid()
    )
  );

-- UPDATE solo para marcar como leído (cliente o admin/responsable)
DROP POLICY IF EXISTS "msj_cli_update_leer" ON public.expediente_mensajes_cliente;
CREATE POLICY "msj_cli_update_leer" ON public.expediente_mensajes_cliente
  FOR UPDATE TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_id AND c.usuario_id = auth.uid()
    )
  );

-- INSERT solo desde service role (endpoint /api/expedientes/contactar-cliente)
