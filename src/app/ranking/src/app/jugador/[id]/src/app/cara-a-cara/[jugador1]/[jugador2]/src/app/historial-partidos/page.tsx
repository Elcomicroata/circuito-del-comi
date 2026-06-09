import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'
import BottomNav from '@/components/BottomNav'

export const revalidate = 60

export default async function HistorialPartidosPage() {
  const { data: partidos } = await supabase
    .from('partidos')
    .select(`*, jugador1:jugador1_id(id,nombre), jugador2:jugador2_id(id,nombre), ganador:ganador_id(id,nombre), puntos_partido(jugador_id, puntos)`)
    .order('fecha', { ascending: false })

  return (
    <>
      <Logo />
      <BottomNav />
      <main className="p-4">
        <div className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-3">Historial de partidos</div>
        {(!partidos || partidos.length === 0) && <p className="text-sm text-gray-400">Sin partidos aún</p>}
        <div className="space-y-2">
          {partidos?.map((p: any) => {
            const puntosGanador = p.puntos_partido?.find((pp: any) => pp.jugador_id === p.ganador_id)
            return (
              <div key={p.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm font-medium mb-1">
                  <span>{p.jugador1?.nombre}</span>
                  <span className="text-[#1D9E75] text-xs">{p.sets.map((s: any) => `${s.j1}-${s.j2}`).join(' ')}</span>
                  <span>{p.jugador2?.nombre}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>{new Date(p.fecha).toLocaleDateString('es-AR')}</span>
                  <div>
                    {p.estado === 'incompleto' && <span className="text-[#BA7517]">Incompleto</span>}
                    {p.estado === 'empate' && <span className="text-[#BA7517]">Empate</span>}
                    {p.estado === 'finalizado' && puntosGanador && (
                      <span className="text-[#3B6D11] font-medium">{p.ganador?.nombre} +{puntosGanador.puntos}</span>
                    )}
                  </div>
                </div>
                {p.comentario && <div className="text-[11px] text-gray-400 mt-1 italic">{p.comentario}</div>}
              </div>
            )
          })}
        </div>
      </main>
    </>
  )
}
