import data from '@/data/cadete-b.json'

export interface Player {
  id: string
  nombre: string
  apellidos: string
  posicion: string
  dorsal: number
  asistencia?: string
  equipoId?: string
}

export interface AttendanceRecord {
  id: string
  equipoId: string
  fecha: string
  tipo: string
  asistencia?: string
  jugadores: {
    id: string
    nombre?: string
    asistio: boolean
    motivo: string | null
  }[]
}

interface DataFile {
  teams?: { id: string; nombre: string; categoria?: string }[]
  players: Player[]
  attendance: AttendanceRecord[]
  matches?: any[]
}

const db = data as DataFile

export function getTeams() {
  return db.teams || []
}

export function getPlayers(equipoId?: string) {
  return equipoId ? db.players.filter(p => p.equipoId === equipoId) : db.players
}

export function getPlayerById(id: string) {
  return db.players.find(p => p.id === id)
}

export function getAttendance(options: { equipoId?: string; jugadorId?: string } = {}) {
  let records = db.attendance
  if (options.equipoId) {
    records = records.filter(r => r.equipoId === options.equipoId)
  }
  if (options.jugadorId) {
    return records
      .map(r => {
        const jugador = r.jugadores.find(j => j.id === options.jugadorId)
        if (!jugador) return null
        return {
          id: r.id,
          fecha: r.fecha,
          tipo: r.tipo,
          asistio: jugador.asistio,
          motivo: jugador.motivo,
        }
      })
      .filter((r): r is { id: string; fecha: string; tipo: string; asistio: boolean; motivo: string | null } => r !== null)
  }
  return records
}

export function getMatches() {
  return db.matches || []
}
