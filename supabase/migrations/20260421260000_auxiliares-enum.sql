-- Agregar el valor 'auxiliar' al enum user_role
-- Debe estar en su propia transacción antes de ser usado en DDL
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'auxiliar';
