-- Tabla de logs de uso de IA (costos por llamada)
-- Cada fila representa UNA invocación a Claude API.
CREATE TABLE IF NOT EXISTS ai_costos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Quién y dónde
  usuario_id      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  expediente_id   UUID REFERENCES expedientes(id) ON DELETE SET NULL,

  -- Qué endpoint y modelo
  endpoint        TEXT NOT NULL,           -- e.g. 'ocr/ine', 'expedientes/revision-ia'
  modelo          TEXT NOT NULL,           -- e.g. 'claude-opus-4-5'

  -- Tokens
  tokens_input            INT NOT NULL DEFAULT 0,
  tokens_output           INT NOT NULL DEFAULT 0,
  tokens_cache_read       INT NOT NULL DEFAULT 0,
  tokens_cache_write      INT NOT NULL DEFAULT 0,

  -- Costo calculado al momento (USD)
  costo_usd               NUMERIC(10, 6) NOT NULL DEFAULT 0,

  -- Detalle adicional opcional
  exitoso                 BOOLEAN NOT NULL DEFAULT TRUE,
  detalle                 JSONB
);

CREATE INDEX IF NOT EXISTS idx_ai_costos_usuario     ON ai_costos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ai_costos_expediente  ON ai_costos(expediente_id);
CREATE INDEX IF NOT EXISTS idx_ai_costos_created     ON ai_costos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_costos_endpoint    ON ai_costos(endpoint);

-- RLS: solo admin/inspector_responsable pueden ver todo. Otros solo lo suyo.
ALTER TABLE ai_costos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_costos: admin ve todo" ON ai_costos;
CREATE POLICY "ai_costos: admin ve todo" ON ai_costos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
        AND usuarios.rol IN ('admin', 'inspector_responsable')
    )
  );

DROP POLICY IF EXISTS "ai_costos: usuario ve solo lo suyo" ON ai_costos;
CREATE POLICY "ai_costos: usuario ve solo lo suyo" ON ai_costos
  FOR SELECT
  USING (usuario_id = auth.uid());

-- INSERT solo por service_role (los endpoints lo hacen)
DROP POLICY IF EXISTS "ai_costos: solo service inserta" ON ai_costos;
CREATE POLICY "ai_costos: solo service inserta" ON ai_costos
  FOR INSERT
  WITH CHECK (false);   -- bloquear todo INSERT por usuarios; service_role bypassa RLS

COMMENT ON TABLE ai_costos IS 'Log de cada llamada a Claude API con costo en USD calculado al momento';
