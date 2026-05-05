-- Agregar valor 'homologado_cne' al enum inversor_cert.
-- Se usa para inversores cuyo fabricante NO tiene certificación UL 1741 pero
-- cuenta con un oficio oficial de la CNE que los homologa (p.ej. Huawei vía
-- F00.06.UE/225/2026).

ALTER TYPE public.inversor_cert ADD VALUE IF NOT EXISTS 'homologado_cne';
