import Link from "next/link"
import { SectionCards } from "@/components/section-cards"
import JugadoresTable from "@/app/dashboard/jugadores/jugadores-table"
import {
  equiposService,
  jugadoresService,
  horariosService,
  rivalesService,
  sancionesService,
} from "@/lib/api/services"
import { listMatches } from "@/lib/api/matches"
import type { Match, MatchEvent } from "@/types/match"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CalendarClock, Clock, Flag, ShieldAlert } from "lucide-react"
import { setSanctionStatus } from "./sanctions-actions"

type JugadorConStats = Awaited<ReturnType<typeof jugadoresService.getByEquipo>> extends (infer T)[]
  ? T
  : never

type Horario = {
  id: number | string
  equipoId: number
  dia: string
  hora: string
  duracion?: string
}

type StoredSanction = {
  id: number | string
  playerId: number
  reference: string
  type: "yellow" | "red"
  completed: boolean
  completedAt?: string | null
}

type EventContext = {
  event: MatchEvent
  match: Match
  opponentName: string
}

type SanctionItem = {
  key: string
  playerId: number
  playerName: string
  type: "yellow" | "red"
  reference: string
  label: string
  description?: string
  opponentName?: string
  competition?: Match["competition"]
  matchId?: number
  kickoff?: string
  createdAt?: string
  completed: boolean
  completedAt?: string | null
  threshold?: number
  totalYellows?: number
}

const DAY_TO_INDEX: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "full",
  timeStyle: "short",
})

const shortDateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "long",
})

const relativeFormatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" })

function normalizeDay(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function parseTimeToDate(base: Date, time: string) {
  const [hours, minutes] = time.split(":").map((part) => Number(part))
  const result = new Date(base)
  result.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0)
  return result
}

function getNextTrainingDate(horario: Horario) {
  const normalizedDay = normalizeDay(horario.dia)
  const targetDay = DAY_TO_INDEX[normalizedDay]
  if (targetDay === undefined) return null

  const now = new Date()
  const candidate = parseTimeToDate(now, horario.hora)
  const diff = (targetDay - now.getDay() + 7) % 7
  candidate.setDate(now.getDate() + diff)

  if (diff === 0 && candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 7)
  }

  return candidate
}

function formatDate(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return null
  return dateFormatter.format(date)
}

function formatShortDate(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return null
  return shortDateFormatter.format(date)
}

function formatRelativeTime(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return null
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMinutes = Math.round(diffMs / 60000)
  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, "minute")
  }
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, "hour")
  }
  const diffDays = Math.round(diffHours / 24)
  return relativeFormatter.format(diffDays, "day")
}

async function safeListMatches(): Promise<Match[]> {
  try {
    return await listMatches()
  } catch (error) {
    console.error("No se pudieron recuperar los partidos", error)
    return []
  }
}

export default async function DashboardPage() {
  const equipos = await equiposService.getAll()
  const equipo = equipos[0]

  const [jugadores, horarios, rivales, storedSanctions, matches] = await Promise.all([
    equipo ? jugadoresService.getByEquipo(equipo.id) : Promise.resolve([]),
    equipo ? horariosService.getByEquipo(equipo.id) : Promise.resolve([]),
    rivalesService.getAll(),
    sancionesService.getAll(),
    safeListMatches(),
  ])

  const storedSanctionsTyped = (storedSanctions ?? []) as StoredSanction[]

  const teamMap = new Map<number, string>()
  if (equipo) {
    teamMap.set(equipo.id, equipo.nombre)
  }
  for (const rival of rivales as { id: number; nombre: string }[]) {
    teamMap.set(rival.id, rival.nombre)
  }

  const playerMap = new Map<number, JugadorConStats>()
  for (const jugador of jugadores as JugadorConStats[]) {
    playerMap.set(jugador.id, jugador)
  }

  const teamMatches = (matches as Match[]).filter((match) =>
    equipo ? match.teamId === equipo.id : true
  )

  const now = new Date()
  const upcomingMatch = teamMatches
    .filter((match) => {
      const kickoffDate = new Date(match.kickoff)
      return !match.finished && kickoffDate.getTime() >= now.getTime()
    })
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0]

  const upcomingMatchDate = upcomingMatch ? new Date(upcomingMatch.kickoff) : null
  const upcomingMatchOpponent = upcomingMatch
    ? teamMap.get(upcomingMatch.rivalId) ?? "Rival por confirmar"
    : null

  const horariosConFecha = (horarios as Horario[])
    .map((horario) => ({
      horario,
      fecha: getNextTrainingDate(horario),
    }))
    .filter((item): item is { horario: Horario; fecha: Date } => !!item.fecha)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

  const proximoEntrenamiento = horariosConFecha[0]
  const proximoEntrenamientoFecha = proximoEntrenamiento ? proximoEntrenamiento.fecha : null

  const discipline = new Map<
    number,
    {
      jugador: JugadorConStats
      yellowEvents: EventContext[]
      redEvents: EventContext[]
      goals: number
    }
  >()

  for (const jugador of jugadores as JugadorConStats[]) {
    discipline.set(jugador.id, {
      jugador,
      yellowEvents: [],
      redEvents: [],
      goals: 0,
    })
  }

  for (const match of teamMatches) {
    const opponentName = teamMap.get(match.rivalId) ?? "Rival por confirmar"
    for (const event of match.events) {
      if (!event.playerId) continue
      if (equipo && event.teamId !== equipo.id) continue
      const jugador = playerMap.get(event.playerId)
      if (!jugador) continue
      const entry = discipline.get(event.playerId)
      if (!entry) continue
      const context: EventContext = {
        event,
        match,
        opponentName,
      }
      if (event.type === "gol") {
        entry.goals += 1
      }
      if (event.type === "amarilla") {
        entry.yellowEvents.push(context)
      }
      if (event.type === "roja") {
        entry.redEvents.push(context)
      }
    }
  }

  const sanctions: SanctionItem[] = []

  discipline.forEach((data, playerId) => {
    const yellowEvents = [...data.yellowEvents].sort((a, b) => {
      const dateDiff = new Date(a.match.kickoff).getTime() - new Date(b.match.kickoff).getTime()
      if (dateDiff !== 0) return dateDiff
      return (a.event.minute ?? 0) - (b.event.minute ?? 0)
    })
    const yellowCount = yellowEvents.length

    for (let threshold = 5; threshold <= yellowCount; threshold += 5) {
      const triggerEvent = yellowEvents[threshold - 1]
      if (!triggerEvent) continue
      const reference = `yellow-${threshold}`
      const stored = storedSanctionsTyped.find(
        (item) => item.playerId === playerId && item.reference === reference
      )
      sanctions.push({
        key: `${playerId}-${reference}`,
        playerId,
        playerName: data.jugador.nombre,
        type: "yellow",
        reference,
        label: `Acumulación de ${threshold} amarillas`,
        description: `Total: ${yellowCount} amarillas registradas`,
        opponentName: triggerEvent.opponentName,
        competition: triggerEvent.match.competition,
        matchId: triggerEvent.match.id,
        kickoff: triggerEvent.match.kickoff,
        createdAt: triggerEvent.match.kickoff,
        completed: stored?.completed ?? false,
        completedAt: stored?.completedAt ?? null,
        threshold,
        totalYellows: yellowCount,
      })
    }

    for (const context of data.redEvents) {
      const reference = `red-${context.event.id}`
      const stored = storedSanctionsTyped.find(
        (item) => item.playerId === playerId && item.reference === reference
      )
      sanctions.push({
        key: `${playerId}-${reference}`,
        playerId,
        playerName: data.jugador.nombre,
        type: "red",
        reference,
        label: "Sanción por roja directa",
        description: `Encuentro frente a ${context.opponentName}`,
        opponentName: context.opponentName,
        competition: context.match.competition,
        matchId: context.match.id,
        kickoff: context.match.kickoff,
        createdAt: context.match.kickoff,
        completed: stored?.completed ?? false,
        completedAt: stored?.completedAt ?? null,
      })
    }
  })

  sanctions.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return dateA - dateB
  })

  const pendingSanctions = sanctions.filter((sanction) => !sanction.completed)
  const completedSanctions = sanctions
    .filter((sanction) => sanction.completed)
    .sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return dateB - dateA
    })

  const pendingYellowPlayers = new Set(
    pendingSanctions.filter((item) => item.type === "yellow").map((item) => item.playerId)
  )

  const yellowLeaders = Array.from(discipline.entries())
    .map(([playerId, data]) => {
      const yellowCount = data.yellowEvents.length
      if (yellowCount === 0) return null
      const pendingYellow = pendingYellowPlayers.has(playerId)
      const baseThreshold = Math.floor(yellowCount / 5) * 5
      const nextThreshold = baseThreshold === yellowCount ? yellowCount + 5 : baseThreshold + 5
      const distance = Math.max(nextThreshold - yellowCount, 0)
      return {
        playerId,
        playerName: data.jugador.nombre,
        yellowCards: yellowCount,
        redCards: data.redEvents.length,
        pendingYellow,
        distance,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      if (b.yellowCards !== a.yellowCards) return b.yellowCards - a.yellowCards
      return a.playerName.localeCompare(b.playerName, "es")
    })

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Hola Míster!</h1>
          <p className="text-muted-foreground">
            {equipo ? `Bienvenido a la plataforma del ${equipo.nombre}` : "Selecciona un equipo para comenzar"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 px-4 lg:px-6 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5 text-primary" /> Próximo entrenamiento
            </CardTitle>
            <CardDescription>Organiza la sesión y registra la asistencia de tu plantilla.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {proximoEntrenamiento && proximoEntrenamientoFecha ? (
              <>
                <div className="text-2xl font-semibold">
                  {formatDate(proximoEntrenamientoFecha)}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {proximoEntrenamiento.horario.hora}
                  </span>
                  {proximoEntrenamiento.horario.duracion ? (
                    <Badge variant="outline">{proximoEntrenamiento.horario.duracion}</Badge>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Todavía no hay un horario de entrenamiento configurado.</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {proximoEntrenamientoFecha
                ? formatRelativeTime(proximoEntrenamientoFecha)
                : "Define tus horarios para ver el próximo entrenamiento"}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link href="/dashboard/asistencias">Marcar asistencia</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/horarios">Gestionar horarios</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flag className="h-5 w-5 text-primary" /> Próximo partido
            </CardTitle>
            <CardDescription>Planifica la convocatoria y lleva el seguimiento competitivo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMatch && upcomingMatchDate ? (
              <>
                <div className="text-2xl font-semibold">
                  {equipo ? equipo.nombre : "Nuestro equipo"} vs {upcomingMatchOpponent}
                </div>
                <div className="text-muted-foreground">
                  {formatDate(upcomingMatchDate)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {upcomingMatch.matchday
                    ? `Jornada ${upcomingMatch.matchday} · ${upcomingMatch.competition}`
                    : upcomingMatch.competition === "amistoso"
                      ? "Partido amistoso"
                      : `Competición: ${upcomingMatch.competition}`}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No hay partidos futuros programados actualmente.</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {upcomingMatchDate
                ? formatRelativeTime(upcomingMatchDate)
                : "Añade un partido para mostrarlo aquí"}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/partidos">Gestionar partidos</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/partidos/new">Nuevo partido</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-10 px-4 lg:px-6">
        <h2 className="text-xl font-semibold">Estadísticas del equipo</h2>
        <p className="text-muted-foreground">Resumen global del rendimiento colectivo.</p>
      </div>

      <SectionCards />

      <div className="mt-8 grid gap-4 px-4 lg:px-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Tarjetas amarillas</CardTitle>
              {yellowLeaders.length > 0 ? (
                <Badge variant="outline" className="text-xs">
                  {yellowLeaders.length} jugador{yellowLeaders.length === 1 ? "" : "es"}
                </Badge>
              ) : null}
            </div>
            <CardDescription>Controla a los jugadores apercibidos y el riesgo disciplinario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {yellowLeaders.length > 0 ? (
              yellowLeaders.map((item) => {
                const nextCut = item.yellowCards + (item.distance === 0 ? 5 : item.distance)
                return (
                  <div
                    key={item.playerId}
                    className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.playerName}</p>
                        {item.pendingYellow ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Sanción pendiente
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.pendingYellow
                          ? "Debe cumplir la sanción vigente antes del próximo corte"
                          : item.distance === 1
                            ? "A 1 amarilla de la próxima sanción"
                            : `A ${item.distance} amarillas de la próxima sanción`}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="border-yellow-500/60 text-yellow-700">
                          {item.yellowCards} amarilla{item.yellowCards === 1 ? "" : "s"}
                        </Badge>
                        {item.redCards > 0 ? (
                          <Badge variant="outline" className="border-red-500/60 text-red-600">
                            {item.redCards} roja{item.redCards === 1 ? "" : "s"}
                          </Badge>
                        ) : null}
                        <Badge variant="outline" className="text-xs">
                          Próximo corte en {nextCut} amarillas
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:self-start">
                      <div className="text-right">
                        <div className="text-2xl font-semibold">{item.yellowCards}</div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">amarillas</div>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/jugadores/${item.playerId}`}>Ver ficha</Link>
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Todavía no se han registrado tarjetas amarillas para tus jugadores.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Próximas sanciones</CardTitle>
              {pendingSanctions.length > 0 ? (
                <Badge variant="outline" className="text-xs text-yellow-700">
                  {pendingSanctions.length} pendiente{pendingSanctions.length === 1 ? "" : "s"}
                </Badge>
              ) : null}
            </div>
            <CardDescription>Marca como cumplidas las sanciones disciplinarias para mantener el control al día.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingSanctions.length > 0 ? (
              pendingSanctions.map((sanction) => {
                const kickoffDate = sanction.kickoff ? new Date(sanction.kickoff) : null
                return (
                  <div key={sanction.key} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {sanction.type === "yellow" ? (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                              🟨 Amarillas
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500 text-red-600">
                              🟥 Roja
                            </Badge>
                          )}
                          {sanction.playerName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sanction.label}
                          {sanction.description ? ` · ${sanction.description}` : ""}
                        </p>
                        {kickoffDate ? (
                          <p className="text-xs text-muted-foreground">
                            {sanction.opponentName ? `vs ${sanction.opponentName} · ` : ""}
                            {formatShortDate(kickoffDate)} ({formatRelativeTime(kickoffDate)})
                          </p>
                        ) : null}
                      </div>
                      <form action={setSanctionStatus} className="shrink-0">
                        <input type="hidden" name="playerId" value={sanction.playerId} />
                        <input type="hidden" name="reference" value={sanction.reference} />
                        <input type="hidden" name="type" value={sanction.type} />
                        <input type="hidden" name="completed" value="true" />
                        <Button size="sm">Marcar como cumplida</Button>
                      </form>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4" />
                No hay sanciones pendientes en este momento.
              </div>
            )}

            {completedSanctions.length > 0 ? (
              <div className="space-y-3 border-t pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sanciones cumplidas recientemente</p>
                {completedSanctions.slice(0, 4).map((sanction) => {
                  const completedDate = sanction.completedAt ? new Date(sanction.completedAt) : null
                  return (
                    <div key={`completed-${sanction.key}`} className="rounded-lg border bg-muted/40 p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-medium flex items-center gap-2">
                            {sanction.playerName}
                            {sanction.type === "yellow" ? (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                🟨 Amarillas
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-red-500 text-red-600">
                                🟥 Roja
                              </Badge>
                            )}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {sanction.label}
                            {completedDate ? ` · ${formatRelativeTime(completedDate)}` : ""}
                          </p>
                        </div>
                        <form action={setSanctionStatus} className="shrink-0">
                          <input type="hidden" name="playerId" value={sanction.playerId} />
                          <input type="hidden" name="reference" value={sanction.reference} />
                          <input type="hidden" name="type" value={sanction.type} />
                          <input type="hidden" name="completed" value="false" />
                          <Button size="sm" variant="ghost" className="px-2 text-xs">
                            Reabrir
                          </Button>
                        </form>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <JugadoresTable jugadores={jugadores as any} equipoNombre={equipo ? equipo.nombre : ""} />
    </>
  )
}
