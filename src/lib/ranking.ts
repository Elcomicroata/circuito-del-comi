const TABLA_PUNTOS = [
  { partido: 25, set: 10, bonus: 5 },
  { partido: 15, set: 6,  bonus: 3 },
  { partido: 10, set: 4,  bonus: 2 },
  { partido: 8,  set: 3,  bonus: 2 },
  { partido: 5,  set: 2,  bonus: 1 },
  { partido: 3,  set: 1,  bonus: 1 },
]

export function getPuntosPorPosicion(posicion: number) {
  const idx = Math.min(posicion - 1, 5)
  return TABLA_PUNTOS[idx]
}

export function calcularPuntosPartido(
  sets: { j1: number; j2: number }[],
  posRival: number
): { puntos: number; detalle: { partido: number; sets: number; bonus: number } } {
  const tabla = getPuntosPorPosicion(posRival)
  let bonus = 0
  sets.forEach(s => {
    if (s.j1 === 6 && s.j2 === 0) bonus += tabla.bonus
  })
  return {
    puntos: tabla.partido + bonus,
    detalle: { partido: tabla.partido, sets: 0, bonus },
  }
}

export function calcularPuntosEmpate(
  sets: { j1: number; j2: number }[],
  posRival: number,
  esJ1: boolean
): { puntos: number; detalle: { partido: number; sets: number; bonus: number } } {
  const tabla = getPuntosPorPosicion(posRival)
  let bonus = 0
  let setsGanados = 0
  sets.forEach(s => {
    const gano = esJ1 ? s.j1 > s.j2 : s.j2 > s.j1
    if (gano) setsGanados++
    const esSeisACero = esJ1 ? (s.j1 === 6 && s.j2 === 0) : (s.j2 === 6 && s.j1 === 0)
    if (esSeisACero) bonus += tabla.bonus
  })
  const puntosSet = setsGanados * tabla.set
  return {
    puntos: puntosSet + bonus,
    detalle: { partido: 0, sets:
