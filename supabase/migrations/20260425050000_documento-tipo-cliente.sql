-- Agrega tipos de documento usados en el portal del cliente
-- El enum original sólo tenía: contrato, plano, memoria_tecnica, dictamen, acta, fotografia, otro
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'diagrama';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'certificado_inversor';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'dictamen_uvie';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'oficio_resolutivo';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'recibo_cfe';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'ine_participante';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'memoria_calculo';
