import { supabase } from '@/lib/supabase'
import BackHeader from '@/components/BackHeader'
import { notFound } from 'next/navigation'

async function getH2H(id1: string, id2: string) {
  const [{ data: j1 }, { data: j2 }] = await Promise.all([
    supabase.from('jugadores').select('*').eq('id', id1).single(),
    supabase.from('jugadores').select('*').eq('id', id2).single(),
  ])
  if (!j1 || !j2) return null

  const { data: partidos } = await supabase
    .from('partidos')
    .select(`*, jugador1:jugador1_id(id,nombre), jugador2:jugador2_id(id,nombre), ganador:ganador_id(id,nombre)`)
    .or(`and(jugador1_id.eq.${id1},jugador2_id.eq.${id2}),and(jugador1_id.eq.${id2},jugador2_id.eq.${id1})`)
    .order('fecha', { ascending: false })

  let w1 = 0, w2 = 0, empates = 0
  partidos?.forEach((p: any) => {
    if (p.estado === 'empate') empates++
    else if (p.ganador_id === id1) w1++
    else if (p.ganador_id === id2) w2++
  })

  return { j1, j2, partidos: partidos || [], w1, w2, empates }
}

export default async function CaraACaraPage({ params }: { params: { jugador1: string; jugador2: string } }) {
  const data = await getH2H(params.jugador1, params.jugador2)
  if (!data) notFound()

  const { j1, j2, partidos, w1, w2, empates } = data

  return (
    <>
      <BackHeader title={`${j1.nombre} vs ${j2.nombre}`} subtitle="Cara a cara" />
      <div className="grid grid-cols-3 border-b border-gray-100">
        <div className="py-4 text-center">
          <div className="font-serif text-4xl text-[#3B6D11]">{w1}</div>
          <div className="text-[11px] text-gray-400 mt-1">Victorias {j1.nombre}</div>
        </div>
        <div className="py-4 text-center">
          <div className="font-serif text-2xl text-[#BA7517]">{empates}</div>
          <div className="text-[11px] text-gray-400 mt-1">Empate{empates !== 1 ? 's' : ''}</div>
        </div>
        <div className="py-4 text-center">
          <div className="font-serif text-4xl text-[#A32D2D]">{w2}</div>
          <div className="text-[11px] text-gray-400 mt-1">Victorias {j2.nombre}</div>
        </div>
      </div>
      <main className="p-4">
        <div className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-3">Historial</div>
        {partidos.length === 0 && <p className="text-sm text-gray-400">Sin enfrentamientos aún</p>}
        <div className="space-y-2">
          {partidos.map((p: any) => {
            const esJ1primero = p.jugador1_id === j1.id
            return (
              <div key={p.id} className="border border-gray-100 rounded-lg p-2.5">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{j1.nombre}</span>
                  <span className="text-[#1D9E75] text-xs">{p.sets.map((s: any) => esJ1primero ? `${s.j1}-${s.j2}` : `${s.j2}-${s.j1}`).join(' ')}</span>
                  <span>{j2.nombre}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>{new Date(p.fecha).toLocaleDateString('es-AR')}</span>
                  <span className="text-[#3B6D11] font-medium">{p.estado === 'empate' ? 'Empate' : `${(p.ganador as any)?.nombre} ganó`}</span>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </>
  )
}
