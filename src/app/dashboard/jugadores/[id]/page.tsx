import Link from "next/link"
import { ArrowLeft, Edit, Trash } from "lucide-react"
import {
  equiposService,
  jugadoresService,
  asistenciasService,
  valoracionesService,
  rivalesService,
} from "@/lib/api/services"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DialogFooter } from "@/components/ui/dialog"
import { FormDialog } from "@/components/form-dialog"
import { RatingStars } from "@/components/rating-stars"
import { PlayerRadarChart } from "@/components/player-radar-chart"
import { revalidatePath } from "next/cache"
import { listMatches } from "@/lib/api/matches"
import {
  aggregatePlayerStats,
  analyzePlayerStreaks,
  buildPlayerMatchSummaries,
  buildPlayerOpponentBreakdown,
  resolveMatchResultLabel,
} from "@/lib/stats"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Match } from "@/types/match"

const POSITIONS = ["Portero", "Defensa", "Centrocampista", "Delantero"]
const COMPETITION_LABELS: Record<string, string> = {
  liga: "Liga",
  copa: "Copa",
  playoff: "Playoff",
  amistoso: "Amistoso",
}

const matchDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

function formatCompetition(value: string) {
  return COMPETITION_LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1)
}

export default async function JugadorPage({ params }: { params: { id: string } }) {
  const jugadorId = Number(params.id)
  const jugador = await jugadoresService.getById(jugadorId)
  if (!jugador) {
    return <div className="p-4">Jugador no encontrado</div>
  }
  const [equipo, asistencias, valoraciones, rivales, matches] = await Promise.all([
    equiposService.getById(jugador.equipoId),
    asistenciasService.getByJugador(jugadorId),
    valoracionesService.getByJugador(jugadorId),
    rivalesService.getAll(),
    listMatches(),
  ])

  // resumen de asistencias
  // medias de valoraciones
  const promedios = valoraciones.length
    ? {
        tecnica:
          valoraciones.reduce((sum: number, v: any) => sum + (v.aptitudes.tecnica || 0), 0) /
          valoraciones.length,
        tactica:
          valoraciones.reduce((sum: number, v: any) => sum + (v.aptitudes.tactica || 0), 0) /
          valoraciones.length,
        fisica:
          valoraciones.reduce((sum: number, v: any) => sum + (v.aptitudes.fisica || 0), 0) /
          valoraciones.length,
        mental:
          valoraciones.reduce((sum: number, v: any) => sum + (v.aptitudes.mental || 0), 0) /
          valoraciones.length,
      }
    : null

  const rivalMap = new Map<number, string>()
  for (const rival of rivales as { id: number; nombre: string }[]) {
    rivalMap.set(rival.id, rival.nombre)
  }

  const teamMatches = (matches as Match[]).filter(
    (match) => match.teamId === jugador.equipoId && match.finished
  )
  const matchDateIndex = new Map<string, Match>()
  for (const match of teamMatches) {
    if (!match.kickoff) continue
    const kickoffDate = match.kickoff.split("T")[0]
    if (kickoffDate) {
      matchDateIndex.set(kickoffDate, match)
    }
  }
  const playerStats = aggregatePlayerStats(teamMatches, jugadorId)
  const matchSummaries = buildPlayerMatchSummaries(teamMatches, jugadorId)
  const streaks = analyzePlayerStreaks(matchSummaries)
  const playerOpponentBreakdown = buildPlayerOpponentBreakdown(matchSummaries)
  const recentMatches = matchSummaries
    .map((summary) => ({
      ...summary,
      opponentName:
        rivalMap.get(summary.opponentId) ?? `Rival ${summary.opponentId}`,
    }))
    .slice(0, 5)
  const participationPercent = Math.round(playerStats.participationRate * 100)
  const availabilityPercent = Math.round(playerStats.availabilityRate * 100)
  const averageMinutes = playerStats.played
    ? Math.round(playerStats.minutes / playerStats.played)
    : 0
  const isGoalkeeper = jugador.posicion?.toLowerCase() === "portero"
  const lastContributionLabel =
    streaks.matchesSinceLastGoalInvolvement === null
      ? "Sin registros de goles o asistencias"
      : streaks.matchesSinceLastGoalInvolvement === 0
      ? "Participó en el último partido"
      : `Hace ${streaks.matchesSinceLastGoalInvolvement} partidos`
  const winRatePercent = Math.round(streaks.winRateWhenPlayed * 100)
  const playerOpponentRows = Array.from(playerOpponentBreakdown.values())
    .map((row) => ({
      ...row,
      opponentName: rivalMap.get(row.opponentId) ?? `Rival ${row.opponentId}`,
      winRate: row.matches ? row.wins / row.matches : 0,
    }))
    .sort((a, b) => b.matches - a.matches)
  const attendanceStats: Record<
    "overall" | "training" | "match" | "other",
    { label: string; present: number; total: number }
  > = {
    overall: { label: "Sesiones registradas", present: 0, total: 0 },
    training: { label: "Entrenamientos", present: 0, total: 0 },
    match: { label: "Partidos", present: 0, total: 0 },
    other: { label: "Otros eventos", present: 0, total: 0 },
  }
  const attendanceEntries = (asistencias as any[])
    .map((record) => {
      const match = matchDateIndex.get(record.fecha)
      const type: "training" | "match" | "other" = record.entrenamientoId
        ? "training"
        : match
        ? "match"
        : "other"
      attendanceStats.overall.total += 1
      attendanceStats[type].total += 1
      if (record.asistio) {
        attendanceStats.overall.present += 1
        attendanceStats[type].present += 1
      }
      const parsedDate = record.fecha ? new Date(record.fecha) : null
      const hasValidDate = parsedDate && !Number.isNaN(parsedDate.getTime())
      const dateLabel = hasValidDate ? matchDateFormatter.format(parsedDate) : record.fecha
      const typeLabel =
        type === "training" ? "Entrenamiento" : type === "match" ? "Partido" : "Evento"
      const contextLabel =
        type === "match" && match
          ? `${match.isHome ? "vs" : "@"} ${
              rivalMap.get(match.rivalId) ?? `Rival ${match.rivalId}`
            } · ${formatCompetition(match.competition)}`
          : type === "training"
          ? "Sesión de entrenamiento programada"
          : "Registro manual del cuerpo técnico"
      return {
        ...record,
        match,
        type,
        typeLabel,
        contextLabel,
        dateLabel,
        sortKey: hasValidDate ? parsedDate.getTime() : 0,
      }
    })
    .sort((a, b) => b.sortKey - a.sortKey)
  const overallAttendancePercent = attendanceStats.overall.total
    ? Math.round((attendanceStats.overall.present / attendanceStats.overall.total) * 100)
    : 0
  const latestAttendance = attendanceEntries[0] ?? null
  const recentAbsences = attendanceEntries.filter((entry) => !entry.asistio)
  const latestAbsence = recentAbsences[0] ?? null
  const absenceHighlights = recentAbsences.slice(0, 3)
  const attendanceSummaryOrder: ("overall" | "training" | "match" | "other")[] = [
    "overall",
    "training",
    "match",
    "other",
  ]
  const summaryBlocks: { label: string; value: string | number }[] = [
    { label: "Partidos del equipo", value: teamMatches.length },
    { label: "Convocatorias", value: playerStats.callUps },
    { label: "Partidos jugados", value: playerStats.played },
    { label: "Titularidades", value: playerStats.starts },
    { label: "Minutos totales", value: `${playerStats.minutes}′` },
    {
      label: "Promedio minutos",
      value: playerStats.played ? `${averageMinutes}'` : "—",
    },
    { label: "Goles", value: playerStats.goals },
    { label: "Asistencias", value: playerStats.assists },
    {
      label: "G+A por 90′",
      value: playerStats.goalInvolvementsPer90.toFixed(2),
    },
    { label: "Participación", value: `${participationPercent}%` },
    { label: "Disponibilidad", value: `${availabilityPercent}%` },
    {
      label: "Balance jugando",
      value: `${playerStats.wins}-${playerStats.draws}-${playerStats.losses}`,
    },
    {
      label: "Tarjetas",
      value: `${playerStats.yellowCards} amarillas · ${playerStats.redCards} rojas`,
    },
  ]

  if (isGoalkeeper) {
    summaryBlocks.push(
      { label: "Porterías a cero", value: playerStats.cleanSheets },
      { label: "Goles encajados", value: playerStats.goalsConceded }
    )
  }

  // server actions
  async function actualizarJugador(formData: FormData) {
    "use server"
    const nombre = formData.get("nombre") as string
    const posicion = formData.get("posicion") as string
    const dorsalRaw = formData.get("dorsal")
    const dorsal = dorsalRaw !== null && dorsalRaw !== "" ? Number(dorsalRaw) : null
    await jugadoresService.update(jugadorId, { nombre, posicion, dorsal })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
    revalidatePath('/dashboard/jugadores')
  }

  async function crearValoracion(formData: FormData) {
    "use server"
    const tecnica = Number(formData.get("tecnica")) || 0
    const tactica = Number(formData.get("tactica")) || 0
    const fisica = Number(formData.get("fisica")) || 0
    const mental = Number(formData.get("mental")) || 0
    const comentarios = formData.get("comentarios") as string
    const fecha = new Date().toISOString()
    await valoracionesService.create({ jugadorId, fecha, aptitudes: { tecnica, tactica, fisica, mental }, comentarios })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
    revalidatePath('/dashboard/jugadores')
  }

  async function actualizarValoracion(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    const tecnica = Number(formData.get("tecnica")) || 0
    const tactica = Number(formData.get("tactica")) || 0
    const fisica = Number(formData.get("fisica")) || 0
    const mental = Number(formData.get("mental")) || 0
    const comentarios = formData.get("comentarios") as string
    await valoracionesService.update(id, { aptitudes: { tecnica, tactica, fisica, mental }, comentarios })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
  }

  async function eliminarValoracion(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    await valoracionesService.delete(id)
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
    revalidatePath('/dashboard/jugadores')
  }

  async function crearAsistencia(formData: FormData) {
    "use server"
    const fecha = formData.get("fecha") as string
    const asistio = formData.get("asistio") === "on"
    const motivo = formData.get("motivo") as string
    await asistenciasService.create({ jugadorId, equipoId: jugador.equipoId, fecha, asistio, motivo })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
  }

  async function actualizarAsistencia(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    const fecha = formData.get("fecha") as string
    const asistio = formData.get("asistio") === "on"
    const motivo = formData.get("motivo") as string
    await asistenciasService.update(id, { fecha, asistio, motivo })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
  }

  async function eliminarAsistencia(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    await asistenciasService.delete(id)
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/jugadores">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{jugador.nombre}</h1>
          {equipo && <p className="text-muted-foreground">{equipo.nombre}</p>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Información personal</CardTitle>
            <FormDialog
              title="Editar jugador"
              trigger={<Button size="icon" variant="ghost"><Edit className="h-4 w-4"/></Button>}
              action={actualizarJugador}
            >
              <Input name="nombre" defaultValue={jugador.nombre} placeholder="Nombre" />
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="player-position">
                    Posición
                  </label>
                  <select
                    id="player-position"
                    name="posicion"
                    defaultValue={jugador.posicion}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {POSITIONS.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="player-number">
                    Dorsal
                  </label>
                  <Input
                    id="player-number"
                    name="dorsal"
                    type="number"
                    min={1}
                    defaultValue={jugador.dorsal ?? ""}
                    placeholder="Número"
                  />
                </div>
              </div>
              <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
            </FormDialog>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="font-medium">Nombre:</span> {jugador.nombre}</div>
            <div><span className="font-medium">Posición:</span> {jugador.posicion}</div>
            <div>
              <span className="font-medium">Dorsal:</span> {jugador.dorsal ?? "Sin asignar"}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Disponibilidad y asistencia</CardTitle>
            <p className="text-sm text-muted-foreground">
              Resumen de presencia en sesiones registradas y eventos competitivos.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {attendanceSummaryOrder.map((key) => {
                const stat = attendanceStats[key]
                if (key === "other" && stat.total === 0) return null
                const percent = stat.total ? Math.round((stat.present / stat.total) * 100) : 0
                return (
                  <div
                    key={key}
                    className="rounded-lg border bg-muted/40 p-3"
                  >
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-lg font-semibold">
                      {stat.present}/{stat.total}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.total ? `${percent}% de asistencia` : "Sin registros"}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Último registro
                </p>
                {latestAttendance ? (
                  <>
                    <p className="text-lg font-semibold">
                      {latestAttendance.dateLabel} · {latestAttendance.asistio ? "Presente" : "Ausente"}
                    </p>
                    <p className="text-xs text-muted-foreground">{latestAttendance.contextLabel}</p>
                  </>
                ) : (
                  <p className="text-lg font-semibold">Sin registros</p>
                )}
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Última ausencia
                </p>
                {latestAbsence ? (
                  <>
                    <p className="text-lg font-semibold">{latestAbsence.dateLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {latestAbsence.contextLabel}
                      {latestAbsence.motivo ? ` · Motivo: ${latestAbsence.motivo}` : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-semibold">Sin ausencias registradas</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Disponibilidad global
              </p>
              <div className="mt-2 flex flex-col gap-1 text-sm">
                <span className="font-semibold">{overallAttendancePercent}%</span>
                <span className="text-xs text-muted-foreground">
                  {attendanceStats.overall.present} sesiones completadas de {attendanceStats.overall.total} registradas.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aptitudes del jugador</CardTitle>
        </CardHeader>
        <CardContent>
          {promedios ? (
            <PlayerRadarChart data={promedios} />
          ) : (
            <p className="text-sm text-muted-foreground">Sin valoraciones</p>
          )}
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>Estadísticas de partidos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Participación y rendimiento en encuentros registrados.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {teamMatches.length > 0 ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {summaryBlocks.map((block) => (
                    <div
                      key={block.label}
                      className="rounded-lg border bg-muted/40 p-3 text-sm"
                    >
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        {block.label}
                      </p>
                      <p className="text-lg font-semibold">{block.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-semibold text-muted-foreground">
                      Rachas personales
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <StreakItem
                        label="Partidos seguidos jugando"
                        value={streaks.currentPlayingStreak}
                        helper={`Mejor marca: ${streaks.longestPlayingStreak}`}
                      />
                      <StreakItem
                        label="Titularidades consecutivas"
                        value={streaks.currentStartingStreak}
                        helper={`Mejor marca: ${streaks.longestStartingStreak}`}
                      />
                      <StreakItem
                        label="Racha de aportes"
                        value={streaks.currentGoalInvolvementStreak}
                        helper={`Máximo: ${streaks.longestGoalInvolvementStreak}`}
                      />
                      <StreakItem
                        label="Victorias con minutos"
                        value={`${winRatePercent}%`}
                        helper={`${streaks.playedMatches} partidos disputados`}
                      />
                      <StreakItem
                        label="Última contribución"
                        value={lastContributionLabel}
                      />
                      <StreakItem
                        label="Últimos 5 partidos"
                        value={`${streaks.lastFive.goals} G · ${streaks.lastFive.assists} A`}
                        helper={`${streaks.lastFive.minutes}′ en ${streaks.lastFive.matches} encuentros`}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-semibold text-muted-foreground">
                      Rendimiento por rival
                    </p>
                    {playerOpponentRows.length > 0 ? (
                      <div className="max-h-[240px] overflow-auto rounded-md border bg-background/60">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Rival</TableHead>
                              <TableHead className="text-right">PJ</TableHead>
                              <TableHead className="text-right">Min.</TableHead>
                              <TableHead className="text-right">G+A</TableHead>
                              <TableHead className="text-right">Balance</TableHead>
                              <TableHead className="text-right">Victorias</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {playerOpponentRows.map((row) => (
                              <TableRow key={row.opponentId}>
                                <TableCell className="font-medium">
                                  {row.opponentName}
                                </TableCell>
                                <TableCell className="text-right">{row.matches}</TableCell>
                                <TableCell className="text-right">{row.minutes}′</TableCell>
                                <TableCell className="text-right">
                                  {row.goalInvolvements}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.wins}-{row.draws}-{row.losses}
                                </TableCell>
                                <TableCell className="text-right">
                                  {Math.round(row.winRate * 100)}%
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aún no hay minutos registrados frente a rivales concretos.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Últimos partidos
                  </p>
                  {recentMatches.length > 0 ? (
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Partido</TableHead>
                            <TableHead>Resultado</TableHead>
                            <TableHead className="text-right">Minutos</TableHead>
                            <TableHead className="text-right">Aporte</TableHead>
                            <TableHead className="text-right">Tarjetas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentMatches.map((match) => {
                            const kickoff = match.kickoff ? new Date(match.kickoff) : null
                            const kickoffLabel =
                              kickoff && !Number.isNaN(kickoff.getTime())
                                ? matchDateFormatter.format(kickoff)
                                : "Fecha por confirmar"
                            const scoreLabel = `${match.goalsFor}-${match.goalsAgainst}`
                            const resultLabel = resolveMatchResultLabel(match.result)
                            const resultTone =
                              match.result === "win"
                                ? "text-emerald-600"
                                : match.result === "loss"
                                ? "text-red-600"
                                : "text-amber-600"
                            const opponentLabel = `${match.isHome ? "vs" : "@"} ${match.opponentName}`
                            const roleLabel = match.played
                              ? match.started
                                ? "Titular"
                                : "Suplente"
                              : "Sin minutos"
                            const contributionLabel =
                              match.goals || match.assists
                                ? `${match.goals} G · ${match.assists} A`
                                : "—"
                            const cardsLabel =
                              match.yellowCards || match.redCards
                                ? `${match.yellowCards} A · ${match.redCards} R`
                                : "—"

                            return (
                              <TableRow key={match.matchId}>
                                <TableCell>{kickoffLabel}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{opponentLabel}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatCompetition(match.competition)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <span className="font-semibold">{scoreLabel}</span>
                                    <span className={`text-xs font-medium ${resultTone}`}>
                                      {resultLabel}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="font-medium">{match.minutes}′</span>
                                    <span className="text-xs text-muted-foreground">{roleLabel}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{contributionLabel}</TableCell>
                                <TableCell className="text-right">{cardsLabel}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay registros de partidos para este jugador.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Todavía no hay partidos finalizados registrados para mostrar estadísticas individuales.
              </p>
            )}
          </CardContent>
        </Card>

      <Tabs defaultValue="valoraciones" className="w-full">
        <TabsList>
          <TabsTrigger value="valoraciones">Valoraciones</TabsTrigger>
          <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
        </TabsList>

        <TabsContent value="valoraciones" className="space-y-4">
          {valoraciones.map((v: any) => (
            <Card key={v.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{new Date(v.fecha).toLocaleDateString()}</CardTitle>
                <div className="flex gap-2">
                  <FormDialog
                    title="Editar valoración"
                    trigger={<Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>}
                    action={actualizarValoracion}
                  >
                    <input type="hidden" name="id" value={v.id} />
                    <Input type="number" step="0.5" name="tecnica" defaultValue={v.aptitudes.tecnica} placeholder="Técnica"/>
                    <Input type="number" step="0.5" name="tactica" defaultValue={v.aptitudes.tactica} placeholder="Táctica"/>
                    <Input type="number" step="0.5" name="fisica" defaultValue={v.aptitudes.fisica} placeholder="Física" />
                    <Input type="number" step="0.5" name="mental" defaultValue={v.aptitudes.mental} placeholder="Mental" />
                    <Textarea className="col-span-2" name="comentarios" defaultValue={v.comentarios} />
                    <DialogFooter className="col-span-2"><Button type="submit">Guardar</Button></DialogFooter>
                  </FormDialog>
                  <form action={eliminarValoracion}>
                    <input type="hidden" name="id" value={v.id} />
                    <Button variant="ghost" size="icon"><Trash className="h-4 w-4" /></Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Técnica</div>
                <div className="flex items-center gap-1"><RatingStars value={v.aptitudes.tecnica} /></div>
                <div className="font-medium">Táctica</div>
                <div className="flex items-center gap-1"><RatingStars value={v.aptitudes.tactica} /></div>
                <div className="font-medium">Física</div>
                <div className="flex items-center gap-1"><RatingStars value={v.aptitudes.fisica} /></div>
                <div className="font-medium">Mental</div>
                <div className="flex items-center gap-1"><RatingStars value={v.aptitudes.mental} /></div>
              </CardContent>
              {v.comentarios && (
                <CardFooter className="text-sm text-muted-foreground">
                  {v.comentarios}
                </CardFooter>
              )}
            </Card>
          ))}
          {valoraciones.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay valoraciones</p>
          )}

          <FormDialog
            title="Nueva valoración"
            trigger={<Button>Nueva valoración</Button>}
            action={crearValoracion}
          >
            <Input type="number" step="0.5" name="tecnica" placeholder="Técnica" />
            <Input type="number" step="0.5" name="tactica" placeholder="Táctica" />
            <Input type="number" step="0.5" name="fisica" placeholder="Física" />
            <Input type="number" step="0.5" name="mental" placeholder="Mental" />
            <Textarea className="col-span-2" name="comentarios" placeholder="Comentarios" />
            <DialogFooter className="col-span-2"><Button type="submit">Guardar</Button></DialogFooter>
          </FormDialog>
        </TabsContent>

        <TabsContent value="asistencias" className="space-y-6">
          {attendanceEntries.length > 0 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(["training", "match", "other"] as const).map((key) => {
                  const stat = attendanceStats[key]
                  if (!stat || (key === "other" && stat.total === 0)) return null
                  const percent = stat.total ? Math.round((stat.present / stat.total) * 100) : 0
                  return (
                    <div key={key} className="rounded-lg border bg-muted/30 p-3 text-sm">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-semibold">{stat.present}/{stat.total}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.total ? `${percent}% de asistencia` : "Sin registros"}
                      </p>
                    </div>
                  )
                })}
              </div>

              {absenceHighlights.length > 0 && (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Últimas ausencias registradas
                  </p>
                  <div className="mt-2 space-y-2 text-sm">
                    {absenceHighlights.map((item) => (
                      <div key={item.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-transparent bg-red-100 text-red-700 hover:bg-red-100">
                            {item.typeLabel}
                          </Badge>
                          <span className="font-medium">{item.dateLabel}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.contextLabel}
                          {item.motivo ? ` · Motivo: ${item.motivo}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Fecha</TableHead>
                      <TableHead>Actividad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap">{entry.dateLabel}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{entry.typeLabel}</Badge>
                              {entry.match && (
                                <Badge variant="outline" className="border-transparent bg-muted text-xs">
                                  {formatCompetition(entry.match.competition)}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{entry.contextLabel}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="outline"
                              className={
                                entry.asistio
                                  ? "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  : "border-transparent bg-red-100 text-red-700 hover:bg-red-100"
                              }
                            >
                              {entry.asistio ? "Presente" : "Ausente"}
                            </Badge>
                            {!entry.asistio && entry.motivo && (
                              <span className="text-xs text-muted-foreground">Motivo: {entry.motivo}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <FormDialog
                              title="Editar asistencia"
                              trigger={<Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>}
                              action={actualizarAsistencia}
                            >
                              <input type="hidden" name="id" value={entry.id} />
                              <Input type="date" name="fecha" defaultValue={entry.fecha} />
                              <label className="flex items-center gap-2">
                                <input type="checkbox" name="asistio" defaultChecked={entry.asistio} /> Presente
                              </label>
                              <Input name="motivo" defaultValue={entry.motivo} placeholder="Motivo" />
                              <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
                            </FormDialog>
                            <form action={eliminarAsistencia}>
                              <input type="hidden" name="id" value={entry.id} />
                              <Button variant="ghost" size="icon"><Trash className="h-4 w-4"/></Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no hay registros de asistencia para este jugador.</p>
          )}

          <div className="flex justify-end">
            <FormDialog
              title="Nueva asistencia"
              trigger={<Button>Nueva asistencia</Button>}
              action={crearAsistencia}
            >
              <Input type="date" name="fecha" />
              <label className="flex items-center gap-2"><input type="checkbox" name="asistio" defaultChecked /> Presente</label>
              <Input name="motivo" placeholder="Motivo (si falta)" />
              <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
            </FormDialog>
          </div>
        </TabsContent>
      </Tabs>

      {jugador.logs && (
        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(jugador.logs).map(([k, v]) => (
              <div key={k}>
                <span className="font-medium mr-2">{k.replace("_", "/")}</span>
                {v as string}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StreakItem({
  label,
  value,
  helper,
}: {
  label: string
  value: string | number
  helper?: string
}) {
  return (
    <div className="rounded-md border bg-background/50 p-3 text-sm">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold">{value}</p>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  )
}
