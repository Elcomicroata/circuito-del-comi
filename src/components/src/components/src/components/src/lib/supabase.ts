import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Jugador = {
  id: string
  nombre: string
  estado: 'activo' | 'inactivo' | 'traidor'
  created_at: string
}

export type Partido = {
  id: string
  jugador1_id: string
  jugador2_id: string
  sets: { j1: number; j2: number }[]
  ganador_id: string | null
  estado: 'finalizado' | 'empate' | 'incompleto'
  fecha: string
  hora: string | null
  comentario: string | null
  created_at: string
  jugador1?: Jugador
  jugador2?: Jugador
  ganador?: Jugador
}

export type Ajuste = {
  id: string
  jugador_id: string
  puntos: number
  motivo: string
  fecha: string
  created_at: string
  jugador?: Jugador
}
