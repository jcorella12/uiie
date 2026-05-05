-- Actualizar inversores Huawei existentes a 'homologado_cne'.
UPDATE public.inversores
SET certificacion = 'homologado_cne'
WHERE LOWER(marca) LIKE 'huawei%'
  AND certificacion <> 'homologado_cne';
