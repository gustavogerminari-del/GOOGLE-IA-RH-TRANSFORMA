/**
 * Compatibilidade de UI da antiga opção Supabase.
 * RH-MIL 3.0 usa Firebase Workers + Firestore + Storage; Supabase não faz parte do runtime.
 */
export const isSupabaseConfigured = false;
export const supabase = null;
export function generateSupabaseSQLSchema(): string {
  return '-- RH-MIL 3.0 Firebase-only: esquema ativo em migrations/firestore.';
}
