import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Para páginas server-side: devuelve el inspector_id efectivo.
 * - Si el usuario es `auxiliar`, retorna el ID del inspector al que está vinculado.
 * - Si no, retorna el UID del propio usuario.
 *
 * Úsalo en lugar de `user.id` cuando hagas consultas filtradas por inspector_id.
 */
export async function getEffectiveInspectorId(
  supabase: SupabaseClient,
  userId: string,
  rol: string,
): Promise<string> {
  if (rol !== 'auxiliar') return userId

  const { data } = await supabase
    .from('inspector_auxiliares')
    .select('inspector_id')
    .eq('auxiliar_id', userId)
    .eq('activo', true)
    .limit(1)
    .maybeSingle()

  return data?.inspector_id ?? userId
}
