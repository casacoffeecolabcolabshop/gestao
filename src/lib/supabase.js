import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configurado = Boolean(url && anonKey)

// Só a chave anon fica no front. Quem decide o que cada um pode é o RLS (ADR-004).
export const supabase = configurado ? createClient(url, anonKey) : null
