-- Remove "puesta a tierra NOM-001-SEDE-2012 sección 250" from checklist
-- Not applicable since IISAC does photovoltaic inspection, not electrical verification
UPDATE public.checklist_items
SET activo = false
WHERE orden = 8
  AND descripcion ILIKE '%puesta a tierra%';
