-- Marca que el usuario debe cambiar su contraseña en el próximo inicio de sesión
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN usuarios.debe_cambiar_password IS
  'TRUE cuando el inspector asignó una contraseña temporal. El cliente debe cambiarla en su primer ingreso.';
