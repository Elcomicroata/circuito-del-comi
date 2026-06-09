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

export const revalidate = 60

export default async function RankingPage() {
  const ranking = await getRanking()

  return (
    <>
      <Logo />
      <BottomNav />
      <main className="p-4">
        <div className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-3">Ranking · Temporada 2025</div>
        <div className="space-y-1.5">
          {ranking.map((entry, i) => (
            <Link key={entry.jugador.id} href={`/jugador/${entry.jugador.id}`}
              className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="w-8 text-center">
                {i < 3
                  ? <span className="text-xl">{MEDALS[i]}</span>
                  : <span className="text-sm text-gray-500 font-medium">{entry.posicion}</span>
                }
              </div>
              <div className="flex-1 font-medium text-[15px]">{entry.jugador.nombre}</div>
              <div className="text-sm text-gray-500 min-w-[56px] text-right">{entry.puntos} pts</div>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
