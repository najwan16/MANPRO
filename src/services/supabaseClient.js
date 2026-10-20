// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const viteEnv = import.meta.env || {}
const supabaseUrl = viteEnv.VITE_SUPABASE_URL
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function requireSupabase() {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.")
  return supabase
}
