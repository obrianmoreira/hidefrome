import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Vault = {
  id: string
  user_id: string
  name: string
  amount: number
  currency: string
  unlock_date: string
  category: string
  status: 'locked' | 'unlocked' | 'emergency'
  notes?: string
  created_at: string
  unlocked_at?: string
}

export type NewVault = Omit<Vault, 'id' | 'created_at' | 'unlocked_at'>
