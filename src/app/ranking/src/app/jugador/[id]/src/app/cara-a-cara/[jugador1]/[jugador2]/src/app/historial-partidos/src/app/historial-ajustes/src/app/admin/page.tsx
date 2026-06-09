'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calcularPuntosPartido, calcularPuntosEmpate, determinarResultado } from '@/lib/ranking'
import Logo from '@/components/Logo'
import BottomNav from '@/components/BottomNav'

const ADMIN_PASSWORD = 'comi2025'
type Jugador = { id: string; nombre: string; estado: string }
type SetScore = { j1: string; j2: string }
type Vista = 'menu' | 'partido' | 'ajuste' | 'eliminar' | 'jugadores'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [vista, setVista] = useState<Vista>('menu')
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [msg, setMsg] = useState('')
  const [j1, setJ1] = useState('')
  const [j2, setJ2] = useState('')
  const [sets, setSets] = useState<SetScore[]>([{ j1: '', j2: '' }, { j1: '', j2: '' }])
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [hora, setHora] = useState('')
  const [comentario, setComentario] = useState('')
  const [incompleto, setIncompleto] = useState(false)
  const [ptsJ1Manual, setPtsJ1Manual] = useState('')
  const [ptsJ2Manual, setPtsJ2Manual] = useState('')
  const [ajJugador, setAjJugador] = useState('')
  const [ajPuntos, setAjPuntos] = useState('')
  const [ajMotivo, setAjMotivo] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [partidosEliminar, setPartidosEliminar] = useState<any[]>([])

  useEffect(() => { if (authed) loadJugadores() }, [authed])
  useEffect(() => { if (vista === 'eliminar') loadPartidosEliminar() }, [vista])

  async function loadJugadores() {
    const { data } = await supabase.from('jugadores').select('*').order('nombre')
    setJugadores(data || [])
  }

  async function loadPartidosEliminar() {
    const { data } = await supabase
      .from('partidos')
      .select(`*, jugador1:jugador1_id(nombre), jugador2:jugador2_id(nombre)`)
      .order('fecha', { ascending: false })
      .limit(20)
    setPartidosEliminar(data || [])
  }

  function login() {
    if (pwd === ADMIN_PASSWORD) { setAuthed(true); setError('') }
    else { setError('Contraseña incorrecta'); setPwd('') }
  }

  async function getRankingActual(): Promise<Record<string, number>> {
    const { data: todos } = await supabase.from('jugadores').select('id').neq('estado', 'traidor')
    const mapa: Record<string, number> = {}
    todos?.forEach(j => mapa[j.id] = 0)
    const { data: puntos } = await supabase.from('puntos_partido').select('jugador_id, puntos')
    puntos?.forEach(p => { if (mapa[p.jugador_id] !== undefined) mapa[p.jugador_id] += p.puntos })
    const { data: ajustes } = await supabase.from('ajustes').select('jugador_id, puntos')
    ajustes?.forEach(a => { if (mapa[a.jugador_id] !== undefined) mapa[a.jugador_id] += a.puntos })
    return mapa
  }

  async function guardarPartido() {
    if (!j1 || !j2 || j1 === j2) return setMsg('Seleccioná dos jugadores distintos')
    if (!fecha) return setMsg('La fecha es obligatoria')
    const setsValidos = sets.filter(s => s.j1 !== '' && s.j2 !== '')
    if (setsValidos.length === 0) return setMsg('Ingresá al menos un set')
    const setsNum = setsValidos.map(s => ({ j1: parseInt(s.j1), j2: parseInt(s.j2) }))
    let estadoPartido: 'finalizado' | 'empate' | 'incompleto' = 'finalizado'
    let ganadorId: string | null = null
    if (incompleto) {
      estadoPartido = 'incompleto'
    } else {
      const resultado = determinarResultado(setsNum)
      estadoPartido = resultado.estado
      if (resultado.ganadorIdx === 1) ganadorId = j1
      else if (resultado.ganadorIdx === 2) ganadorId = j2
    }
    const { data: partido, error: errPartido } = await supabase
      .from('partidos')
      .insert({ jugador1_id: j1, jugador2_id: j2, sets: setsNum, ganador_id: ganadorId, estado: estadoPartido, fecha, hora: hora || null, comentario: comentario || null })
      .select().single()
    if (errPartido || !partido) return setMsg('Error: ' + errPartido?.message)
    const ranking = await getRankingActual()
    const sorted = Object.entries(ranking).sort((a, b) => b[1] - a[1])
    const posJ1 = sorted.findIndex(([id]) => id === j1) + 1
    const posJ2 = sorted.findIndex(([id]) => id === j2) + 1
    if (incompleto) {
      const inserts = []
      if (ptsJ1Manual) inserts.push({ partido_id: partido.id, jugador_id: j1, puntos: parseInt(ptsJ1Manual), detalle: null })
      if (ptsJ2Manual) inserts.push({ partido_id: partido.id, jugador_id: j2, puntos: parseInt(ptsJ2Manual), detalle: null })
      if (inserts.length > 0) await supabase.from('puntos_partido').insert(inserts)
    } else if (estadoPartido === 'finalizado' && ganadorId) {
      const posRival = ganadorId === j1 ? posJ2 : posJ1
      const setsGanador = ganadorId === j1 ? setsNum : setsNum.map(s => ({ j1: s.j2, j2: s.j1 }))
      const { puntos, detalle } = calcularPuntosPartido(setsGanador, posRival)
      const perdedorId = ganadorId === j1 ? j2 : j1
      await supabase.from('puntos_partido').insert([
        { partido_id: partido.id, jugador_id: ganadorId, puntos, detalle },
        { partido_id: partido.id, jugador_id: perdedorId, puntos: 0, detalle: null },
      ])
    } else if (estadoPartido === 'empate') {
      const { puntos: ptsJ1c, detalle: det1 } = calcularPuntosEmpate(setsNum, posJ2, true)
      const { puntos: ptsJ2c, detalle: det2 } = calcularPuntosEmpate(setsNum, posJ1, false)
      await supabase.from('puntos_partido').insert([
        { partido_id: partido.id, jugador_id: j1, puntos: ptsJ1c, detalle: det1 },
        { partido_id: partido.id, jugador_id: j2, puntos: ptsJ2c, detalle: det2 },
      ])
    }
    setMsg('✓ Partido guardado')
    setJ1(''); setJ2(''); setSets([{ j1: '', j2: '' }, { j1: '', j2: '' }])
    setFecha(new Date().toISOString().split('T')[0]); setHora(''); setComentario('')
    setIncompleto(false); setPtsJ1Manual(''); setPtsJ2Manual('')
  }

  async function guardarAjuste() {
    if (!ajJugador || !ajPuntos || !ajMotivo) return setMsg('Completá todos los campos')
    const { error } = await supabase.from('ajustes').insert({
      jugador_id: ajJugador, puntos: parseInt(ajPuntos), motivo: ajMotivo, fecha: new Date().toISOString().split('T')[0]
    })
    if (error) return setMsg('Error: ' + error.message)
    setMsg('✓ Ajuste guardado')
    setAjJugador(''); setAjPuntos(''); setAjMotivo('')
  }

  async function agregarJugador() {
    if (!nuevoNombre.trim()) return setMsg('Ingresá un nombre')
    const { error } = await supabase.from('jugadores').insert({ nombre: nuevoNombre.trim(), estado: 'activo' })
    if (error) return setMsg('Error: ' + error.message)
    setMsg('✓ Jugador agregado'); setNuevoNombre(''); loadJugadores()
  }

  async function cambiarEstado(id: string, estado: string) {
    await supabase.from('jugadores').update({ estado }).eq('id', id)
    loadJugadores()
  }

  async function eliminarPartido(id: string) {
    await supabase.from('partidos').delete().eq('id', id)
    setMsg('✓ Partido eliminado'); loadPartidosEliminar()
  }

  if (!authed) {
    return (
      <>
        <Logo />
        <BottomNav />
        <main className="p-8 flex flex-col items-center gap-4">
          <div className="text-4xl">🔒</div>
          <div className="font-serif text-xl">Área privada</div>
          <div className="text-sm text-gray-400">Ingresá la contraseña para continuar</div>
          <input type="password" value={pwd} onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()} placeholder="Contraseña"
            className="w-full max-w-xs border border-gray-200 rounded-lg px-4 py-2.5 text-center" />
          {error && <p className="text-sm text-[#A32D2D]">{error}</p>}
          <button onClick={login} className="w-full max-w-xs bg-[#27500A] text-[#C0DD97] py-3 rounded-lg font-medium">
            Ingresar
          </button>
        </main>
      </>
    )
  }

  return (
    <>
      <Logo />
      <BottomNav />
      <main className="p-4">
        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.startsWith('✓') ? 'bg-[#EAF3DE] text-[#27500A]' : 'bg-[#FCEBEB] text-[#A32D2D]'}`}>
            {msg}<button onClick={() => setMsg('')} className="float-right opacity-50">✕</button>
          </div>
        )}
        {vista === 'menu' && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'partido', icon: '🎾', label: 'Cargar partido' },
              { key: 'ajuste', icon: '⇅', label: 'Cargar ajuste' },
              { key: 'eliminar', icon: '🗑', label: 'Eliminar partido' },
              { key: 'jugadores', icon: '👥', label: 'Jugadores' },
            ].map(item => (
              <button key={item.key} onClick={() => setVista(item.key as Vista)}
                className="border border-gray-100 rounded-xl p-5 flex flex-col items-center gap-2 hover:bg-gray-50">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}
        {vista !== 'menu' && (
          <button onClick={() => { setVista('menu'); setMsg('') }} className="mb-4 text-sm text-[#3B6D11]">← Volver</button>
        )}
        {vista === 'partido' && (
          <div className="space-y-4">
            <div className="font-serif text-lg">Cargar partido</div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Jugador 1</label>
              <select value={j1} onChange={e => setJ1(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
                <option value="">Seleccionar...</option>
                {jugadores.filter(j => j.estado !== 'traidor').map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Jugador 2</label>
              <select value={j2} onChange={e => setJ2(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
                <option value="">Seleccionar...</option>
                {jugadores.filter(j => j.estado !== 'traidor' && j.id !== j1).map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
              </select>
            </div>
            <hr className="border-gray-100" />
            {sets.map((s, i) => (
              <div key={i}>
                <label className="text-xs text-gray-400 block mb-1">Set {i + 1}{i === 2 ? ' (opcional)' : ''}</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" max="7" value={s.j1} onChange={e => { const n = [...sets]; n[i].j1 = e.target.value; setSets(n) }}
                    className="w-14 text-center border border-gray-200 rounded-lg py-2 text-base font-medium" />
                  <span className="text-gray-300 text-lg">–</span>
                  <input type="number" min="0" max="7" value={s.j2} onChange={e => { const n = [...sets]; n[i].j2 = e.target.value; setSets(n) }}
                    className="w-14 text-center border border-gray-200 rounded-lg py-2 text-base font-medium" />
                </div>
              </div>
            ))}
            {sets.length < 3 && (
              <button onClick={() => setSets([...sets, { j1: '', j2: '' }])} className="text-sm text-[#3B6D11]">+ Agregar set 3</button>
            )}
            <hr className="border-gray-100" />
            <div>
              <label className="text-xs text-gray-400 block mb-1">Fecha *</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Hora (opcional)</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Comentario (opcional)</label>
              <input type="text" value={comentario} onChange={e => setComentario(e.target.value)} placeholder="ej. final del torneo"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={incompleto} onChange={e => setIncompleto(e.target.checked)} />
              Partido incompleto
            </label>
            {incompleto && (
              <div className="bg-[#FAEEDA] rounded-lg p-3 space-y-2">
                <div className="text-xs text-[#BA7517] font-medium mb-2">Asignar puntos manualmente</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-20">{jugadores.find(j => j.id === j1)?.nombre || 'J1'}</span>
                  <input type="number" value={ptsJ1Manual} onChange={e => setPtsJ1Manual(e.target.value)}
                    className="w-16 text-center border border-gray-200 rounded-lg py-1.5 text-sm" />
                  <span className="text-xs text-gray-400">pts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-20">{jugadores.find(j => j.id === j2)?.nombre || 'J2'}</span>
                  <input type="number" value={ptsJ2Manual} onChange={e => setPtsJ2Manual(e.target.value)}
                    className="w-16 text-center border border-gray-200 rounded-lg py-1.5 text-sm" />
                  <span className="text-xs text-gray-400">pts</span>
                </div>
              </div>
            )}
            <button onClick={guardarPartido} className="w-full bg-[#27500A] text-[#C0DD97] py-3 rounded-lg font-medium">Guardar partido</button>
          </div>
        )}
        {vista === 'ajuste' && (
          <div className="space-y-4">
            <div className="font-serif text-lg">Cargar ajuste</div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Jugador</label>
              <select value={ajJugador} onChange={e => setAjJugador(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
                <option value="">Seleccionar...</option>
                {jugadores.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Puntos (negativo para restar)</label>
              <input type="number" value={ajPuntos} onChange={e => setAjPuntos(e.target.value)} placeholder="-5"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Motivo</label>
              <input type="text" value={ajMotivo} onChange={e => setAjMotivo(e.target.value)} placeholder="ej. Llegó tarde"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <button onClick={guardarAjuste} className="w-full bg-[#27500A] text-[#C0DD97] py-3 rounded-lg font-medium">Guardar ajuste</button>
          </div>
        )}
        {vista === 'eliminar' && (
          <div className="space-y-3">
            <div className="font-serif text-lg">Eliminar partido</div>
            <p className="text-xs text-gray-400">Los partidos no se editan. Eliminá y volvé a cargar.</p>
            {partidosEliminar.map((p: any) => (
              <div key={p.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{p.jugador1?.nombre} vs {p.jugador2?.nombre}</div>
                  <div className="text-xs text-gray-400">{new Date(p.fecha).toLocaleDateString('es-AR')} · {p.sets.map((s: any) => `${s.j1}-${s.j2}`).join(' ')}</div>
                </div>
                <button onClick={() => { if (confirm('¿Eliminar este partido?')) eliminarPartido(p.id) }} className="text-[#A32D2D] text-lg px-2">🗑</button>
              </div>
            ))}
          </div>
        )}
        {vista === 'jugadores' && (
          <div className="space-y-4">
            <div className="font-serif text-lg">Jugadores</div>
            <div className="space-y-2">
              {jugadores.map(j => (
                <div key={j.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between">
                  <span className="font-medium text-sm">{j.nombre}</span>
                  <select value={j.estado} onChange={e => cambiarEstado(j.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1">
                    <option value="activo">activo</option>
                    <option value="inactivo">inactivo</option>
                    <option value="traidor">traidor</option>
                  </select>
                </div>
              ))}
            </div>
            <hr className="border-gray-100" />
            <div>
              <label className="text-xs text-gray-400 block mb-1">Agregar jugador nuevo</label>
              <div className="flex gap-2">
                <input type="text" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)}
                  placeholder="Nombre" className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <button onClick={agregarJugador} className="bg-[#27500A] text-[#C0DD97] px-4 py-2.5 rounded-lg text-sm font-medium">Agregar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
