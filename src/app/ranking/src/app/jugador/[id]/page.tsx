import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import BackHeader from '@/components/BackHeader'
import { notFound } from 'next/navigation'

async function getJugadorData(id: string) {
  const { data: jugador } = await supabase.from('jugadores').select('*').eq('id', id).single()
  if (!jugador) return null

  const { data: puntos } = await supabase.from('puntos_partido').select('puntos').eq('jugador_id', id)
  const { data: ajustes } = await supabase.from('ajustes').select('puntos').eq('jugador_id', id)
  const totalPuntos = (puntos?.reduce((s, p) => s + p.puntos, 0) ?? 0) + (ajustes?.reduce((s, a) => s + a.puntos, 0) ?? 0)

  const { data: todosJugadores } = await supabase.from('jugadores').select('id').neq('estado', 'traidor')
  const puntosAll: Record<string, number> = {}
  todosJugadores?.forEach(j => puntosAll[j.id] = 0)
  const { data: todosPuntos } = await supabase.from('puntos_partido').select('jugador_id, puntos')
  todosPuntos?.forEach(p => { if (puntosAll[p.jugador_id] !== undefined) puntosAll[p.jugador_id] += p.puntos })
  const { data: todosAjustes } = await supabase.from('ajustes').select('jugador_id, puntos')
  todosAjustes?.forEach(a => { if (puntosAll[a.jugador_id] !== undefined) puntosAll[a.jugador_id] += a.puntos })
  const sorted = Object.entries(puntosAll).sort((a, b) => b[1] - a[1])
  const posicion = sorted.findIndex(([jid]) => jid === id) + 1

  const { data: partidos } = await supabase
    .from('partidos')
    .select(`*, jugador1:jugador1_id(id,nombre), jugador2:jugador2_id(id,nombre), ganador:ganador_id(id,nombre)`)
    .or(`jugador1_id.eq.${id},jugador2_id.eq.${id}`)
    .order('fecha', { ascending: false })
    .limit(20)

  const { data: rivales } = await supabase.from('jugadores').select('id, nombre').neq('id', id).neq('estado', 'traidor')
  const record: Record<string, { w: number; l: number; e: number; nombre: string; rivalId: string }> = {}
  rivales?.forEach(j => { record[j.id] = { w: 0, l: 0, e: 0, nombre: j.nombre, rivalId: j.id } })

  partidos?.forEach((p: any) => {
    const rivalId = p.jugador1_id === id ? p.jugador2_id : p.jugador1_id
    if (!record[rivalId]) return
    if (p.estado === 'empate') record[rivalId].e++
    else if (p.ganador
