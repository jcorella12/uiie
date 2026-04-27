-- ============================================================
-- CIAE — Inteligencia en Ahorro de Energía S.A. de C.V.
-- UIIE-CRE-021
-- Database Schema + RLS Policies
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('inspector_responsable', 'admin', 'inspector', 'cliente');
CREATE TYPE tipo_persona AS ENUM ('fisica', 'moral');
CREATE TYPE solicitud_status AS ENUM ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'folio_asignado');
CREATE TYPE expediente_status AS ENUM ('borrador', 'en_proceso', 'revision', 'aprobado', 'rechazado', 'cerrado');
CREATE TYPE inspeccion_status AS ENUM ('programada', 'en_curso', 'realizada', 'cancelada');
CREATE TYPE documento_tipo AS ENUM ('contrato', 'plano', 'memoria_tecnica', 'dictamen', 'acta', 'fotografia', 'otro');
CREATE TYPE inversor_fase AS ENUM ('monofasico', 'bifasico', 'trifasico');

-- ============================================================
-- TABLE: usuarios (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  nombre        TEXT NOT NULL,
  apellidos     TEXT,
  telefono      TEXT,
  rol           user_role NOT NULL DEFAULT 'inspector',
  activo        BOOLEAN NOT NULL DEFAULT true,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: inspectores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inspectores (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id            UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  numero_cedula         TEXT,
  especialidad          TEXT,
  firma_url             TEXT,
  sello_url             TEXT,
  max_expedientes_mes   INT NOT NULL DEFAULT 20,
  activo                BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(usuario_id)
);

-- ============================================================
-- TABLE: clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo_persona    tipo_persona NOT NULL DEFAULT 'moral',
  nombre          TEXT NOT NULL,          -- Nombre física o Razón social moral
  rfc             TEXT,
  representante   TEXT,                   -- Solo moral
  email           TEXT,
  telefono        TEXT,
  direccion       TEXT,
  ciudad          TEXT,
  estado          TEXT,
  cp              TEXT,
  es_epc          BOOLEAN NOT NULL DEFAULT false,
  notas           TEXT,
  created_by      UUID REFERENCES public.usuarios(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: testigos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.testigos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,
  apellidos   TEXT,
  empresa     TEXT,
  email       TEXT,
  telefono    TEXT,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: inversores (catálogo)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inversores (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marca         TEXT NOT NULL,
  modelo        TEXT NOT NULL,
  potencia_kw   NUMERIC(10,2) NOT NULL,
  fase          inversor_fase NOT NULL DEFAULT 'trifasico',
  tension_ac    NUMERIC(6,1),
  corriente_max NUMERIC(6,2),
  eficiencia    NUMERIC(5,2),
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: folios_lista_control
-- (Master list of authorized folios UIIE-CRE-021-XXXX)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.folios_lista_control (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_folio    TEXT NOT NULL UNIQUE,   -- e.g. "UIIE-CRE-021-0001"
  numero_secuencial INT NOT NULL UNIQUE,
  asignado        BOOLEAN NOT NULL DEFAULT false,
  asignado_a      UUID REFERENCES public.usuarios(id),
  fecha_asignacion TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: solicitudes_folio
-- ============================================================
CREATE TABLE IF NOT EXISTS public.solicitudes_folio (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspector_id        UUID NOT NULL REFERENCES public.usuarios(id),
  cliente_id          UUID REFERENCES public.clientes(id),
  cliente_nombre      TEXT NOT NULL,       -- cache / si cliente no existe aún
  tipo_persona        tipo_persona NOT NULL DEFAULT 'moral',
  ciudad              TEXT NOT NULL,
  estado_mx           TEXT,
  kwp                 NUMERIC(8,2) NOT NULL,
  fecha_estimada      DATE NOT NULL,
  cliente_epc_id      UUID REFERENCES public.clientes(id),
  cliente_epc_nombre  TEXT,
  precio_propuesto    NUMERIC(12,2) NOT NULL,
  precio_base         NUMERIC(12,2) NOT NULL,
  porcentaje_precio   NUMERIC(6,2) NOT NULL,
  requiere_autorizacion BOOLEAN NOT NULL DEFAULT false,
  status              solicitud_status NOT NULL DEFAULT 'pendiente',
  notas_inspector     TEXT,
  notas_responsable   TEXT,
  folio_asignado_id   UUID REFERENCES public.folios_lista_control(id),
  revisado_por        UUID REFERENCES public.usuarios(id),
  fecha_revision      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: expedientes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expedientes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio_id          UUID NOT NULL REFERENCES public.folios_lista_control(id),
  numero_folio      TEXT NOT NULL,
  inspector_id      UUID NOT NULL REFERENCES public.usuarios(id),
  cliente_id        UUID NOT NULL REFERENCES public.clientes(id),
  kwp               NUMERIC(8,2) NOT NULL,
  direccion_proyecto TEXT,
  ciudad            TEXT,
  estado_mx         TEXT,
  inversor_id       UUID REFERENCES public.inversores(id),
  num_paneles       INT,
  potencia_panel_wp NUMERIC(8,2),
  status            expediente_status NOT NULL DEFAULT 'borrador',
  fecha_inicio      DATE,
  fecha_cierre      DATE,
  observaciones     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: documentos_expediente
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documentos_expediente (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expediente_id   UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  tipo            documento_tipo NOT NULL DEFAULT 'otro',
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  storage_path    TEXT NOT NULL,
  mime_type       TEXT,
  tamano_bytes    BIGINT,
  verificado      BOOLEAN NOT NULL DEFAULT false,
  subido_por      UUID REFERENCES public.usuarios(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: inspecciones_agenda
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inspecciones_agenda (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expediente_id   UUID NOT NULL REFERENCES public.expedientes(id),
  inspector_id    UUID NOT NULL REFERENCES public.usuarios(id),
  testigo_id      UUID REFERENCES public.testigos(id),
  fecha_hora      TIMESTAMPTZ NOT NULL,
  duracion_min    INT NOT NULL DEFAULT 120,
  direccion       TEXT,
  status          inspeccion_status NOT NULL DEFAULT 'programada',
  notas           TEXT,
  acta_url        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HELPER: update updated_at automatically
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_inspectores_updated_at
  BEFORE UPDATE ON public.inspectores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_solicitudes_updated_at
  BEFORE UPDATE ON public.solicitudes_folio
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_expedientes_updated_at
  BEFORE UPDATE ON public.expedientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_inspecciones_updated_at
  BEFORE UPDATE ON public.inspecciones_agenda
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- HELPER: new user → auto-insert in usuarios
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'rol')::user_role, 'inspector')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED: Folios lista de control UIIE-CRE-021-0001 a 0500
-- ============================================================
INSERT INTO public.folios_lista_control (numero_folio, numero_secuencial)
SELECT
  'UIIE-CRE-021-' || LPAD(n::TEXT, 4, '0'),
  n
FROM generate_series(1, 500) AS n
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ── usuarios ────────────────────────────────────────────────
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado ve su propio registro
CREATE POLICY "usuarios: ver propio" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

-- inspector_responsable y admin ven todos
CREATE POLICY "usuarios: responsable y admin ven todos" ON public.usuarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.rol IN ('inspector_responsable', 'admin')
    )
  );

-- Solo admin puede crear/modificar usuarios
CREATE POLICY "usuarios: admin insert" ON public.usuarios
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

CREATE POLICY "usuarios: admin update" ON public.usuarios
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'inspector_responsable')
    )
  );

-- ── inspectores ─────────────────────────────────────────────
ALTER TABLE public.inspectores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inspectores: ver propio" ON public.inspectores
  FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "inspectores: responsable y admin ven todos" ON public.inspectores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.rol IN ('inspector_responsable', 'admin')
    )
  );

CREATE POLICY "inspectores: admin insert/update" ON public.inspectores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'inspector_responsable')
    )
  );

-- ── clientes ────────────────────────────────────────────────
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Inspector ve clientes que él creó
CREATE POLICY "clientes: ver propios" ON public.clientes
  FOR SELECT USING (created_by = auth.uid());

-- Responsable y admin ven todos
CREATE POLICY "clientes: responsable admin ven todos" ON public.clientes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.rol IN ('inspector_responsable', 'admin')
    )
  );

CREATE POLICY "clientes: inspectores pueden crear" ON public.clientes
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "clientes: inspector actualiza propios" ON public.clientes
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'inspector_responsable')
    )
  );

-- ── testigos ────────────────────────────────────────────────
ALTER TABLE public.testigos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testigos: todos los autenticados ven" ON public.testigos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "testigos: admin gestiona" ON public.testigos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'inspector_responsable')
    )
  );

-- ── inversores ──────────────────────────────────────────────
ALTER TABLE public.inversores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inversores: todos autenticados ven" ON public.inversores
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "inversores: admin gestiona" ON public.inversores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'inspector_responsable')
    )
  );

-- ── folios_lista_control ─────────────────────────────────────
ALTER TABLE public.folios_lista_control ENABLE ROW LEVEL SECURITY;

-- Inspectores ven solo los folios que les fueron asignados
CREATE POLICY "folios: inspector ve los suyos" ON public.folios_lista_control
  FOR SELECT USING (
    asignado_a = auth.uid() OR NOT asignado
  );

-- Responsable y admin ven todos
CREATE POLICY "folios: responsable admin ven todos" ON public.folios_lista_control
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.rol IN ('inspector_responsable', 'admin')
    )
  );

CREATE POLICY "folios: solo admin asigna" ON public.folios_lista_control
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'inspector_responsable')
    )
  );

-- ── solicitudes_folio ────────────────────────────────────────
ALTER TABLE public.solicitudes_folio ENABLE ROW LEVEL SECURITY;

-- Inspector ve solo sus propias solicitudes (RLS a nivel BD)
CREATE POLICY "solicitudes: inspector ve propias" ON public.solicitudes_folio
  FOR SELECT USING (inspector_id = auth.uid());

-- Responsable y admin ven todas
CREATE POLICY "solicitudes: responsable admin ven todas" ON public.solicitudes_folio
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.rol IN ('inspector_responsable', 'admin')
    )
  );

CREATE POLICY "solicitudes: inspector crea propias" ON public.solicitudes_folio
  FOR INSERT WITH CHECK (inspector_id = auth.uid());

CREATE POLICY "solicitudes: inspector actualiza propias pendientes" ON public.solicitudes_folio
  FOR UPDATE USING (
    (inspector_id = auth.uid() AND status = 'pendiente') OR
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'inspector_responsable')
    )
  );

-- ── expedientes ──────────────────────────────────────────────
ALTER TABLE public.expedientes ENABLE ROW LEVEL SECURITY;

-- Inspector ve SOLO sus propios expedientes (filtro BD, no UI)
CREATE POLICY "expedientes: inspector ve propios" ON public.expedientes
  FOR SELECT USING (inspector_id = auth.uid());

-- Responsable y admin ven todos
CREATE POLICY "expedientes: responsable admin ven todos" ON public.expedientes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.rol IN ('inspector_responsable', 'admin')
    )
  );

CREATE POLICY "expedientes: inspector crea propios" ON public.expedientes
  FOR INSERT WITH CHECK (inspector_id = auth.uid());

CREATE POLICY "expedientes: inspector actualiza propios" ON public.expedientes
  FOR UPDATE USING (
    inspector_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'inspector_responsable')
    )
  );

-- ── documentos_expediente ────────────────────────────────────
ALTER TABLE public.documentos_expediente ENABLE ROW LEVEL SECURITY;

-- Inspector ve docs de sus expedientes
CREATE POLICY "docs: inspector ve propios" ON public.documentos_expediente
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.expedientes e
      WHERE e.id = expediente_id AND e.inspector_id = auth.uid()
    )
  );

CREATE POLICY "docs: responsable admin ven todos" ON public.documentos_expediente
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.rol IN ('inspector_responsable', 'admin')
    )
  );

CREATE POLICY "docs: inspector sube a propios expedientes" ON public.documentos_expediente
  FOR INSERT WITH CHECK (
    subido_por = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.expedientes e
      WHERE e.id = expediente_id AND e.inspector_id = auth.uid()
    )
  );

-- ── inspecciones_agenda ──────────────────────────────────────
ALTER TABLE public.inspecciones_agenda ENABLE ROW LEVEL SECURITY;

-- Inspector ve solo su propia agenda
CREATE POLICY "agenda: inspector ve propia" ON public.inspecciones_agenda
  FOR SELECT USING (inspector_id = auth.uid());

CREATE POLICY "agenda: responsable admin ven todos" ON public.inspecciones_agenda
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.rol IN ('inspector_responsable', 'admin')
    )
  );

CREATE POLICY "agenda: inspector crea propia" ON public.inspecciones_agenda
  FOR INSERT WITH CHECK (inspector_id = auth.uid());

CREATE POLICY "agenda: inspector actualiza propia" ON public.inspecciones_agenda
  FOR UPDATE USING (
    inspector_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'inspector_responsable')
    )
  );
