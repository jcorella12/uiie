-- Add inspector priority ordering column to expedientes
ALTER TABLE expedientes
  ADD COLUMN IF NOT EXISTS orden_inspector INT;

-- Seed existing rows: within each inspector, order by created_at
UPDATE expedientes e
SET orden_inspector = sub.rn
FROM (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY inspector_id
           ORDER BY created_at
         ) AS rn
  FROM expedientes
) sub
WHERE e.id = sub.id;

-- Index for fast ordering queries
CREATE INDEX IF NOT EXISTS idx_expedientes_inspector_orden
  ON expedientes (inspector_id, orden_inspector ASC NULLS LAST);
