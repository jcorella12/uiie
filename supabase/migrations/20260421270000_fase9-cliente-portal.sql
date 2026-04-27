-- ─────────────────────────────────────────────────────────────────────────────
-- Fase 9: Portal del Cliente
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Vincular clientes con su cuenta de usuario (portal de acceso)
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_usuario_id ON public.clientes(usuario_id);

-- 2. RLS: el cliente puede leer su propio registro en clientes
CREATE POLICY "cliente_read_own_record"
  ON public.clientes FOR SELECT
  USING (usuario_id = auth.uid());

-- 3. RLS: el cliente puede leer sus expedientes
CREATE POLICY "cliente_read_own_expedientes"
  ON public.expedientes FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE usuario_id = auth.uid()
    )
  );

-- 4. RLS: el cliente puede ver las inspecciones de sus expedientes
CREATE POLICY "cliente_read_own_inspecciones"
  ON public.inspecciones_agenda FOR SELECT
  USING (
    expediente_id IN (
      SELECT e.id FROM public.expedientes e
      JOIN public.clientes c ON c.id = e.cliente_id
      WHERE c.usuario_id = auth.uid()
    )
  );

-- 5. RLS: el cliente puede ver los dictámenes de sus expedientes
CREATE POLICY "cliente_read_own_dictamenes"
  ON public.dictamenes FOR SELECT
  USING (
    expediente_id IN (
      SELECT e.id FROM public.expedientes e
      JOIN public.clientes c ON c.id = e.cliente_id
      WHERE c.usuario_id = auth.uid()
    )
  );

-- 6. RLS: el cliente puede ver los documentos de sus expedientes
CREATE POLICY "cliente_read_own_documentos"
  ON public.documentos_expediente FOR SELECT
  USING (
    expediente_id IN (
      SELECT e.id FROM public.expedientes e
      JOIN public.clientes c ON c.id = e.cliente_id
      WHERE c.usuario_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla app_config: configuración global (API keys, parámetros del sistema)
-- Usada en Fase 8 para almacenar credenciales CNE cuando se obtengan
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_config (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  descripcion TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id)
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Solo admin e inspector_responsable pueden leer/escribir la config
CREATE POLICY "admin_manage_config"
  ON public.app_config FOR ALL
  USING (
    (SELECT rol FROM public.usuarios WHERE id = auth.uid())
    IN ('admin', 'inspector_responsable')
  );

-- Sembrar filas vacías para CNE (Phase 8)
INSERT INTO public.app_config (key, value, descripcion) VALUES
  ('cne_api_url',   NULL, 'URL base de la API CNE (una vez aprobada la solicitud)'),
  ('cne_api_token', NULL, 'Token de autenticación API CNE'),
  ('cne_api_status','pendiente', 'Estado de solicitud: pendiente | solicitado | activo')
ON CONFLICT (key) DO NOTHING;
