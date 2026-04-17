import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Pre-flight check
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase Credentials Missing: Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.")
}

export const supabase = createClient(
  supabaseUrl || 'https://xxxxxxxx.supabase.co', 
  supabaseAnonKey || 'xxxxxxxxx'
)

// --- DYNAMIC AUTH (Until real Auth is implemented) ---
// Since you already have data, we'll dynamically grab your actual authentic couple_id from your DB.
export const getActiveCoupleId = async (): Promise<string> => {
  const { data, error } = await supabase.from('couples').select('id').limit(1).single()
  if (data && data.id) {
    return data.id;
  }
  return '11111111-1111-1111-1111-111111111111'; // Fallback
}

// -- Centralized Types matching your Exact Schema --
export type CoupleType = {
  id: string;
  created_at: string;
  couple_name: string | null;
}

export type PlanType = {
  id: string;
  couple_id: string;
  title: string;
  description: string | null;
  plan_date: string;
  type: 'cine' | 'cena' | 'viaje' | 'salida' | 'otro';
  status: 'pendiente' | 'completado';
  created_at: string;
}

export type MemoryType = {
  id: string;
  couple_id: string;
  plan_id: string | null;
  image_url: string;
  caption: string | null;
  created_at: string;
}

export type TransactionType = {
  id: string;
  couple_id: string;
  plan_id: string | null;
  amount: number;
  type: 'ingreso' | 'gasto';
  category: string | null;
  transaction_date: string;
  description: string | null;
  created_at: string;
}
