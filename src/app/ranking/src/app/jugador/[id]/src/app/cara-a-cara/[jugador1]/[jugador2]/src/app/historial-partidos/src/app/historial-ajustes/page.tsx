import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'
import BottomNav from '@/components/BottomNav'

export const revalidate = 60

export default async function HistorialAjustesPage() {
  const { data: ajustes } = await supabase
    .from('ajustes')
    .select(`*, jugador:jugador_id(id, nombre)`)
    .order('fecha', { ascending: false })

  return (
    <>
      <Logo />
      <BottomNav />
      <main className="p-4">
        <div className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-3">Historial de ajustes</div>
        {(!ajustes || ajustes.length === 0) && <p className="text-sm text-gray-400">Sin ajustes aún</p>}
        <div className="space-y-2">
          {ajustes?.map((a: any) => (
            <div key={a.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{a.jugador?.nombre}</span>
                <span className={`font-medium text-base ${a.puntos >= 0 ? 'text-[#3B6D11]' : 'text-[#A32D2D]'}`}>
                  {a.puntos >= 0 ? '+' : ''}{a.puntos} pts
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>{new Date(a.fecha).toLocaleDateString('es-AR')}</span>
                <span>{a.motivo}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
