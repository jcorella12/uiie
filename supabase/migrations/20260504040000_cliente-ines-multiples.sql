-- Múltiples INEs por cliente (firmante, esposo/a, representante, suegra, etc.)
--
-- El cliente conserva sus campos `ine_url_frente`/`reverso` para la INE
-- principal (compatibilidad). Esta tabla agrega un catálogo extensible.

CREATE TABLE IF NOT EXISTS public.cliente_ines (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id        UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  etiqueta          TEXT NOT NULL,                  -- ej: "Esposo", "Representante legal", "Hijo"
  nombre_completo   TEXT,
  numero_ine        TEXT,
  curp              TEXT,
  clave_elector     TEXT,
  vigencia          TEXT,
  domicilio         TEXT,
  ine_url_frente    TEXT,                           -- storage path en bucket "documentos"
  ine_url_reverso   TEXT,
  notas             TEXT,
  creado_por        UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cliente_ines_cliente ON public.cliente_ines(cliente_id);

-- RLS — heredan el scope de clientes (si ves al cliente, ves sus INEs)
ALTER TABLE public.cliente_ines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cliente_ines_select" ON public.cliente_ines;
DROP POLICY IF EXISTS "cliente_ines_insert" ON public.cliente_ines;
DROP POLICY IF EXISTS "cliente_ines_update" ON public.cliente_ines;
DROP POLICY IF EXISTS "cliente_ines_delete" ON public.cliente_ines;

-- SELECT: si tienes acceso al cliente, ves sus INEs
CREATE POLICY "cliente_ines_select" ON public.cliente_ines
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id)
  );

-- INSERT: staff puede agregar; cliente role solo si el cliente es suyo
CREATE POLICY "cliente_ines_insert" ON public.cliente_ines
  FOR INSERT TO authenticated WITH CHECK (
    public.current_user_rol() IN ('admin', 'inspector_responsable', 'inspector', 'auxiliar')
    OR EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_id AND c.usuario_id = auth.uid()
    )
  );

-- UPDATE/DELETE: admin/responsable, creador o cliente dueño
CREATE POLICY "cliente_ines_update" ON public.cliente_ines
  FOR UPDATE TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR creado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_id AND c.usuario_id = auth.uid()
    )
  );

CREATE POLICY "cliente_ines_delete" ON public.cliente_ines
  FOR DELETE TO authenticated USING (
    public.current_user_rol() IN ('admin', 'inspector_responsable')
    OR creado_por = auth.uid()
  );

COMMENT ON TABLE public.cliente_ines IS 'INEs adicionales asociadas a un cliente (firmante alterno, representante, esposo/a, etc.)';
