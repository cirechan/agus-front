import StatsExplorer from "./stats-explorer"
import { listMatches } from "@/lib/api/matches"
import {
  equiposService,
  jugadoresService,
  rivalesService,
} from "@/lib/api/services"

export default async function EstadisticasPage() {
  const equipos = await equiposService.getAll()
  const equipo = equipos[0]
  const equipoId = equipo ? Number(equipo.id) : null

  if (!equipo || !Number.isFinite(equipoId)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Estadísticas</h1>
        <p className="text-muted-foreground">
          Todavía no hay equipos configurados para generar estadísticas.
        </p>
      </div>
    )
  }

  const [jugadores, matches, rivales] = await Promise.all([
    jugadoresService.getByEquipo(equipoId),
    listMatches(),
    rivalesService.getAll(),
  ])

  const teamMatches = matches
    .filter((match) => match.teamId === equipoId)
    .filter((match) => {
      if (match.finished) {
        return true
      }
      const hasMinutes = match.lineup.some((slot) => (slot.minutes ?? 0) > 0)
      const hasEvents = match.events.length > 0
      return hasMinutes || hasEvents
    })

  const opponents: Record<number, string> = {}
  for (const rival of rivales as { id: number; nombre: string }[]) {
    const rivalId = Number(rival.id)
    if (Number.isFinite(rivalId)) {
      opponents[rivalId] = rival.nombre
    }
  }

  type RawPlayer = {
    id: number
    nombre: string
    posicion?: string
    dorsal?: number | null
  }

  type NormalizedPlayer = {
    id: number
    nombre: string
    posicion?: string
    dorsal: number | null
  }

  const playersPayload = (jugadores as RawPlayer[])
    .map<NormalizedPlayer | null>((player) => {
      const playerId = Number(player.id)
      if (!Number.isFinite(playerId)) {
        return null
      }
      return {
        id: playerId,
        nombre: player.nombre,
        posicion: player.posicion,
        dorsal: player.dorsal ?? null,
      }
    })
    .filter((player): player is NormalizedPlayer => player !== null)

  const matchesPayload = teamMatches.map((match) => ({
    ...match,
    lineup: match.lineup.map((slot) => ({ ...slot })),
    events: match.events.map((event) => ({ ...event })),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel de estadísticas</h1>
        <p className="text-muted-foreground">
          Analiza el rendimiento del equipo y cruza información de partidos y
          jugadores.
        </p>
      </div>

      <StatsExplorer
        players={playersPayload}
        matches={matchesPayload}
        opponents={opponents}
        teamName={equipo.nombre}
      />
    </div>
  )
}

