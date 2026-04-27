-- ─── Tabla de notificaciones ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  destinatario_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo            TEXT        NOT NULL,   -- nueva_solicitud | solicitud_actualizada | nuevo_expediente | expediente_actualizado
  titulo          TEXT        NOT NULL,
  mensaje         TEXT,
  url             TEXT,
  leido           BOOLEAN     DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Índice para fetch rápido por destinatario
CREATE INDEX IF NOT EXISTS idx_notif_destinatario
  ON public.notificaciones (destinatario_id, created_at DESC);

-- ─── RLS ────────────────────────────────────────────────────────────────────────
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Solo el destinatario puede ver y actualizar sus propias notificaciones
CREATE POLICY "notif: ver propias"
  ON public.notificaciones FOR SELECT
  USING (destinatario_id = auth.uid());

CREATE POLICY "notif: marcar leida"
  ON public.notificaciones FOR UPDATE
  USING (destinatario_id = auth.uid());

-- Los triggers (SECURITY DEFINER) insertan para otros → necesita política INSERT permisiva
CREATE POLICY "notif: sistema puede insertar"
  ON public.notificaciones FOR INSERT
  WITH CHECK (true);

-- ─── Habilitar Realtime para la tabla ──────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;

-- ══════════════════════════════════════════════════════════════════════════════
-- TRIGGER 1: Nueva solicitud de folio → notificar a admin e inspector_responsable
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fn_notify_nueva_solicitud()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _nombre TEXT;
BEGIN
  _nombre := COALESCE(NEW.cliente_nombre, NEW.propietario_nombre, 'Cliente sin nombre');

  INSERT INTO public.notificaciones (destinatario_id, tipo, titulo, mensaje, url)
  SELECT
    u.id,
    'nueva_solicitud',
    'Nueva solicitud de folio',
    _nombre || ' · ' || COALESCE(NEW.kwp::TEXT, '?') || ' kWp',
    '/dashboard/admin/solicitudes'
  FROM public.usuarios u
  WHERE u.rol IN ('admin', 'inspector_responsable')
    AND u.id IS DISTINCT FROM NEW.inspector_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nueva_solicitud ON public.solicitudes_folio;
CREATE TRIGGER trg_nueva_solicitud
  AFTER INSERT ON public.solicitudes_folio
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_nueva_solicitud();

-- ══════════════════════════════════════════════════════════════════════════════
-- TRIGGER 2: Solicitud cambia de status → notificar al inspector que la hizo
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fn_notify_solicitud_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _titulo  TEXT;
  _mensaje TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  _titulo := CASE NEW.status
    WHEN 'en_revision'    THEN 'Solicitud en revisión'
    WHEN 'aprobada'       THEN 'Solicitud aprobada ✓'
    WHEN 'rechazada'      THEN 'Solicitud rechazada'
    WHEN 'folio_asignado' THEN '¡Folio asignado!'
    ELSE 'Solicitud actualizada'
  END;

  _mensaje := COALESCE(NEW.cliente_nombre, NEW.propietario_nombre, 'Tu solicitud')
    || ' cambió a: ' || NEW.status;

  INSERT INTO public.notificaciones (destinatario_id, tipo, titulo, mensaje, url)
  VALUES (
    NEW.inspector_id,
    'solicitud_actualizada',
    _titulo,
    _mensaje,
    '/dashboard/inspector/solicitudes'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_solicitud_status ON public.solicitudes_folio;
CREATE TRIGGER trg_solicitud_status
  AFTER UPDATE ON public.solicitudes_folio
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_solicitud_status();

-- ══════════════════════════════════════════════════════════════════════════════
-- TRIGGER 3: Nuevo expediente → notificar a admin e inspector_responsable
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fn_notify_nuevo_expediente()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notificaciones (destinatario_id, tipo, titulo, mensaje, url)
  SELECT
    u.id,
    'nuevo_expediente',
    'Nuevo expediente',
    COALESCE(NEW.numero_folio, 'Sin folio') || CASE WHEN NEW.kwp IS NOT NULL THEN ' · ' || NEW.kwp || ' kWp' ELSE '' END,
    '/dashboard/inspector/expedientes/' || NEW.id
  FROM public.usuarios u
  WHERE u.rol IN ('admin', 'inspector_responsable')
    AND u.id IS DISTINCT FROM NEW.inspector_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nuevo_expediente ON public.expedientes;
CREATE TRIGGER trg_nuevo_expediente
  AFTER INSERT ON public.expedientes
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_nuevo_expediente();

-- ══════════════════════════════════════════════════════════════════════════════
-- TRIGGER 4: Expediente cambia status → notificar al inspector asignado
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fn_notify_expediente_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _titulo  TEXT;
  _mensaje TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  IF NEW.inspector_id IS NULL THEN RETURN NEW; END IF;

  _titulo := CASE NEW.status
    WHEN 'en_proceso' THEN 'Expediente en proceso'
    WHEN 'revision'   THEN 'Expediente en revisión'
    WHEN 'aprobado'   THEN 'Expediente aprobado ✓'
    WHEN 'rechazado'  THEN 'Expediente rechazado'
    WHEN 'cerrado'    THEN 'Expediente cerrado'
    ELSE 'Expediente actualizado'
  END;

  _mensaje := COALESCE(NEW.numero_folio, 'Expediente') || ' · Estado: ' || NEW.status;

  INSERT INTO public.notificaciones (destinatario_id, tipo, titulo, mensaje, url)
  VALUES (
    NEW.inspector_id,
    'expediente_actualizado',
    _titulo,
    _mensaje,
    '/dashboard/inspector/expedientes/' || NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_expediente_status ON public.expedientes;
CREATE TRIGGER trg_expediente_status
  AFTER UPDATE ON public.expedientes
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_expediente_status();
