-- Campos para alimentar el reporte trimestral CRE.
-- "Hora de cierre del Acta", "Tensión", "Tipo de Instalación", etc.
-- También captura del contacto que atiende la visita en sitio.

ALTER TABLE expedientes
  ADD COLUMN IF NOT EXISTS hora_inicio_inspeccion  TIME,
  ADD COLUMN IF NOT EXISTS hora_cierre_acta        TIME,
  ADD COLUMN IF NOT EXISTS tipo_instalacion        TEXT,
  ADD COLUMN IF NOT EXISTS tipo_tecnologia         TEXT,
  ADD COLUMN IF NOT EXISTS tension_interconexion_v NUMERIC,
  ADD COLUMN IF NOT EXISTS numero_permiso_cre_cne  TEXT,
  ADD COLUMN IF NOT EXISTS atiende_visita_nombre   TEXT,
  ADD COLUMN IF NOT EXISTS atiende_visita_telefono TEXT,
  ADD COLUMN IF NOT EXISTS atiende_visita_correo   TEXT;

COMMENT ON COLUMN expedientes.hora_inicio_inspeccion  IS 'Hora a la que inició la inspección en sitio. Va en el acta y en la agenda.';
COMMENT ON COLUMN expedientes.hora_cierre_acta        IS 'Hora de cierre del acta. Va en el reporte trimestral.';
COMMENT ON COLUMN expedientes.tipo_instalacion        IS 'Tipo de instalación reportado a CRE (ej. Central de Generación Distribuida).';
COMMENT ON COLUMN expedientes.tipo_tecnologia         IS 'Tipo de tecnología (ej. Fotovoltaica).';
COMMENT ON COLUMN expedientes.tension_interconexion_v IS 'Tensión de interconexión o conexión en volts.';
COMMENT ON COLUMN expedientes.numero_permiso_cre_cne  IS 'Número de permiso CNE/CRE si aplica.';
COMMENT ON COLUMN expedientes.atiende_visita_nombre   IS 'Persona que atiende la visita en sitio.';
COMMENT ON COLUMN expedientes.atiende_visita_telefono IS 'Teléfono de quien atiende la visita.';
COMMENT ON COLUMN expedientes.atiende_visita_correo   IS 'Correo de quien atiende la visita.';
