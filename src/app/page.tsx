import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Logo from '@/components/Logo'
import BottomNav from '@/components/BottomNav'

const MEDALS = ['🥇', '🥈', '🥉']

async function getRanking() {
  const { data: jugadores } = await supabase
    .from('jugadores')
    .select('*')
    .neq('estado', 'traidor')

  if (!jugadores) return []

  const puntosMap: Record<string, number> = {}
  for (const j of jugadores) puntosMap[j.id] = 0

  const { data: puntos } = await supabase.from('puntos_partido').select('jugador_id, puntos')
  puntos?.forEach(p => { if (puntosMap[p.jugador_id] !== undefined) puntosMap[p.jugador_id] += p.puntos })

  const { data: ajustes } = await supabase.from('ajustes').select('jugador_id, puntos')
  ajustes?.forEach(a => { if (puntosMap[a.jugador_id] !== undefined) puntosMap[a.jugador_id] += a.puntos })

  return jugadores
    .map(j => ({ jugador: j, puntos: puntosMap[j.id] }))
    .sort((a, b) => b.puntos - a.puntos)
    .map((entry, idx) => ({ ...entry, posicion: idx + 1 }))
}

async function getUltimosPartidos() {
  const { data } = await supabase
    .from('partidos')
    .select(`*, jugador1:jugador1_id(id,nombre), jugador2:jugador2_id(id,nombre), ganador:ganador_id(id,nombre)`)
    .order('fecha', { ascending: false })
    .limit(3)
  return data || []
}

export const revalidate = 60

export default async function Home() {
  const [ranking, partidos] = await Promise.all([getRanking(), getUltimosPartidos()])

  return (
    <>
      <Logo />
      <BottomNav />
      <main className="p-4 space-y-6">
        <section>
          <div className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-2">Ranking</div>
          <div className="space-y-1.5">
            {ranking.map((entry, i) => (
              <Link key={entry.jugador.id} href={`/jugador/${entry.jugador.id}`}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-100 hover:bg-
