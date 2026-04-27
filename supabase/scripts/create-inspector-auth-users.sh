#!/bin/bash
# Create inspector auth.users via Supabase Admin API
# Run this BEFORE applying the migration SQL
# Generated: 2026-04-21T17:39:53.728Z

PROJECT_REF="qmpkkicknpvqrnvygvab"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-YOUR_SERVICE_ROLE_KEY}"  # set env var or replace

create_user() {
  local uuid="$1" email="$2" name="$3" role="$4" password="$5"
  echo "Creating user: $email ($uuid)"
  curl -sf -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"${uuid}\",\"email\":\"${email}\",\"password\":\"${password}\",\"email_confirm\":true,\"user_metadata\":{\"nombre\":\"${name}\",\"rol\":\"${role}\"}}" \
    && echo " ✓" || echo " ✗ (may already exist)"
}

echo "Creating 8 inspector auth users..."

create_user "543d5666-52cc-458d-ae32-2bd0cb80ff1d" "efraim.castellanos@ciae.mx" "EFRAIM CASTELLANOS FRAYRE" "inspector" "Ciae2026!"
create_user "c3cd3e66-c075-4fdf-be74-c981dac882cb" "luis.martinez@ciae.mx" "LUIS FELIPE MARTINEZ CERDA" "inspector" "Ciae2026!"
create_user "5c207af9-2054-457f-893e-5e16427aae52" "jesus.rodriguez@ciae.mx" "JESUS ANTONIO RODRIGUEZ DE ITA" "inspector" "Ciae2026!"
create_user "cf63591d-cb83-4cdf-9b36-5ce20a50149c" "hugo.diaz@ciae.mx" "HUGO DIAZ GARCIA" "inspector" "Ciae2026!"
create_user "4265bb74-9a89-4254-8bbd-b13660e0ed98" "eduardo.montelongo@ciae.mx" "EDUARDO MONTELONGO MORAL" "inspector" "Ciae2026!"
create_user "dae0d247-7908-4d9c-a834-92c5883cdac3" "erick.aguirre@ciae.mx" "ERICK ANDRES AGUIRRE PRIETO" "inspector" "Ciae2026!"
create_user "31442556-3938-4c4b-8bd5-b79893b556a0" "aldo.ramirez@ciae.mx" "ALDO RAMIREZ MONTOYA" "inspector" "Ciae2026!"
create_user "a2a6fd3f-4a98-4501-b153-806f5c102c39" "joaquin.corella@ciae.mx" "JOAQUIN CORELLA PUENTE" "inspector_responsable" "Ciae2026!"

echo "Done! All users created with temp password: Ciae2026!"
echo "Have each inspector change their password on first login."