"use client"

import { useMemo, useState } from "react"

import {
  aggregatePlayersStats,
  analyzeTeamForm,
  buildOpponentBreakdown,
  collectPlayerRecentForm,
  createBaselinePlayerStats,
  getMatchScore,
  resolveMatchResultLabel,
  summarizeTeamMatches,
  type OpponentBreakdown,
  type PlayerMatchStats,
  type PlayerMatchResult,
} from "@/lib/stats"
import type { Match } from "@/types/match"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PlayerBasic {
  id: number
  nombre: string
  posicion?: string
  dorsal?: number | null
}

interface StatsExplorerProps {
  players: PlayerBasic[]
  matches: Match[]
  opponents: Record<number, string>
  teamName: string
}

const competitionLabels: Record<string, string> = {
  liga: "Liga",
  copa: "Copa",
  playoff: "Playoff",
  amistoso: "Amistoso",
}

const rangeOptions = [
  { value: "season", label: "Temporada completa" },
  { value: "last5", label: "Últimos 5 partidos" },
  { value: "last10", label: "Últimos 10 partidos" },
  { value: "last30", label: "Últimos 30 días" },
] as const

type RangeValue = (typeof rangeOptions)[number]["value"]

type ConditionValue = "all" | "home" | "away"

type MetricKey =
  | "goalInvolvements"
  | "goals"
  | "assists"
  | "minutes"
  | "participationRate"
  | "goalInvolvementsPer90"
  | "yellowCards"
  | "redCards"

type MetricDefinition = {
  label: string
  getValue: (stats: PlayerMatchStats) => number
  format: (value: number) => string
}

const metricDefinitions: Record<MetricKey, MetricDefinition> = {
  goalInvolvements: {
    label: "Goles + asistencias",
    getValue: (stats) => stats.goalInvolvements,
    format: (value) => `${value} contribuciones`,
  },
  goals: {
    label: "Goles",
    getValue: (stats) => stats.goals,
    format: (value) => `${value} goles`,
  },
  assists: {
    label: "Asistencias",
    getValue: (stats) => stats.assists,
    format: (value) => `${value} asistencias`,
  },
  minutes: {
    label: "Minutos jugados",
    getValue: (stats) => stats.minutes,
    format: (value) => `${value} minutos`,
  },
  participationRate: {
    label: "Participación",
    getValue: (stats) => stats.participationRate,
    format: (value) => `${Math.round(value * 100)}% de partidos`,
  },
  goalInvolvementsPer90: {
    label: "G+A por 90′",
    getValue: (stats) => stats.goalInvolvementsPer90,
    format: (value) => `${value.toFixed(2)} por 90′`,
  },
  yellowCards: {
    label: "Tarjetas amarillas",
    getValue: (stats) => stats.yellowCards,
    format: (value) => `${value} amarillas`,
  },
  redCards: {
    label: "Tarjetas rojas",
    getValue: (stats) => stats.redCards,
    format: (value) => `${value} rojas`,
  },
}

const fullDateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
})

function formatCompetition(value: string) {
  return competitionLabels[value] ?? value.charAt(0).toUpperCase() + value.slice(1)
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

export default function StatsExplorer({
  players,
  matches,
  opponents,
  teamName,
}: StatsExplorerProps) {
  const [selectedCompetition, setSelectedCompetition] = useState<string>("all")
  const [condition, setCondition] = useState<ConditionValue>("all")
  const [range, setRange] = useState<RangeValue>("season")
  const [metric, setMetric] = useState<MetricKey>("goalInvolvements")

  const competitions = useMemo(() => {
    const unique = new Set(matches.map((match) => match.competition))
    return Array.from(unique)
  }, [matches])

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const aTime = a.kickoff ? new Date(a.kickoff).getTime() : 0
      const bTime = b.kickoff ? new Date(b.kickoff).getTime() : 0
      return bTime - aTime
    })
  }, [matches])

  const filteredMatches = useMemo(() => {
    let result = sortedMatches
    if (selectedCompetition !== "all") {
      result = result.filter((match) => match.competition === selectedCompetition)
    }
    if (condition === "home") {
      result = result.filter((match) => match.isHome)
    } else if (condition === "away") {
      result = result.filter((match) => !match.isHome)
    }

    if (range === "last5") {
      result = result.slice(0, 5)
    } else if (range === "last10") {
      result = result.slice(0, 10)
    } else if (range === "last30") {
      const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000
      result = result.filter((match) => {
        if (!match.kickoff) return false
        const kickoff = new Date(match.kickoff).getTime()
        return Number.isFinite(kickoff) && kickoff >= threshold
      })
    }

    return result
  }, [sortedMatches, selectedCompetition, condition, range])

  const teamStats = useMemo(() => summarizeTeamMatches(filteredMatches), [filteredMatches])
  const playerStatsMap = useMemo(
    () => aggregatePlayersStats(filteredMatches),
    [filteredMatches]
  )

  const matchesCount = filteredMatches.length

  const playersWithStats = useMemo(
    () =>
      players.map((player) => ({
        player,
        stats:
          playerStatsMap.get(player.id) ??
          createBaselinePlayerStats(matchesCount),
      })),
    [players, playerStatsMap, matchesCount]
  )

  const playerNameMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const player of players) {
      map.set(player.id, player.nombre)
    }
    return map
  }, [players])

  const metricInfo = metricDefinitions[metric]

  const sortedPlayersByMetric = useMemo(() => {
    const info = metricDefinitions[metric]
    return [...playersWithStats].sort(
      (a, b) => info.getValue(b.stats) - info.getValue(a.stats)
    )
  }, [playersWithStats, metric])

  const topPlayers = sortedPlayersByMetric.slice(0, 5)
  const topMetricMax = topPlayers.reduce((max, entry) => {
    const value = metricInfo.getValue(entry.stats)
    return value > max ? value : max
  }, 0)

  const matchItems = useMemo(() => {
    return filteredMatches.map((match) => {
      const score = getMatchScore(match)
      const result: PlayerMatchResult = score.goalsFor > score.goalsAgainst
        ? "win"
        : score.goalsFor < score.goalsAgainst
        ? "loss"
        : "draw"
      const opponentName = opponents[match.rivalId] ?? `Rival ${match.rivalId}`
      const kickoffDate = match.kickoff ? new Date(match.kickoff) : null
      const goalEvents = match.events.filter(
        (event) => event.type === "gol" && event.teamId === match.teamId
      )
      const assistEvents = match.events.filter(
        (event) => event.type === "asistencia" && event.teamId === match.teamId
      )
      const yellowCards = match.events.filter(
        (event) => event.type === "amarilla" && event.teamId === match.teamId
      ).length
      const redCards = match.events.filter(
        (event) => event.type === "roja" && event.teamId === match.teamId
      ).length
      const goalScorers = goalEvents.map((event) => {
        if (event.playerId && playerNameMap.has(event.playerId)) {
          return playerNameMap.get(event.playerId) as string
        }
        if (event.playerId) {
          return `Jugador ${event.playerId}`
        }
        return "Gol del equipo"
      })
      const assistProviders = assistEvents.map((event) => {
        if (event.playerId && playerNameMap.has(event.playerId)) {
          return playerNameMap.get(event.playerId) as string
        }
        if (event.playerId) {
          return `Jugador ${event.playerId}`
        }
        return "Equipo"
      })
      const playersUsed = match.lineup.filter(
        (slot) => Number(slot.minutes ?? 0) > 0
      ).length
      const callUps = match.lineup.filter((slot) => slot.role !== "unavailable").length

      return {
        match,
        opponentName,
        kickoffDate,
        score,
        result,
        goalScorers,
        assistProviders,
        yellowCards,
        redCards,
        playersUsed,
        callUps,
      }
    })
  }, [filteredMatches, opponents, playerNameMap])

  const hasMatches = matchesCount > 0

  const teamForm = useMemo(
    () => analyzeTeamForm(filteredMatches),
    [filteredMatches]
  )

  const opponentBreakdown = useMemo(
    () => buildOpponentBreakdown(filteredMatches),
    [filteredMatches]
  )

  const opponentRows = useMemo(() => {
    const rows: (OpponentBreakdown & { opponentName: string })[] = []
    Array.from(opponentBreakdown.values()).forEach((breakdown) => {
      rows.push({
        ...breakdown,
        opponentName:
          opponents[breakdown.opponentId] ??
          `Rival ${breakdown.opponentId}`,
      })
    })
    return rows.sort((a, b) => b.matches - a.matches)
  }, [opponentBreakdown, opponents])

  const recentFormMap = useMemo(
    () => collectPlayerRecentForm(filteredMatches, 5),
    [filteredMatches]
  )

  const recentFormPlayers = useMemo(() => {
    const entries = players
      .map((player) => {
        const stats = recentFormMap.get(player.id)
        return stats ? { player, stats } : null
      })
      .filter((entry): entry is { player: PlayerBasic; stats: PlayerMatchStats } => {
        if (!entry) return false
        return entry.stats.minutes > 0 || entry.stats.goalInvolvements > 0
      })

    return entries
      .sort((a, b) => {
        const diff =
          b.stats.goalInvolvementsPer90 - a.stats.goalInvolvementsPer90
        if (diff !== 0) return diff
        return b.stats.minutes - a.stats.minutes
      })
      .slice(0, 5)
  }, [players, recentFormMap])

  const disciplinaryAlerts = useMemo(() => {
    return playersWithStats
      .map((entry) => ({
        player: entry.player,
        yellowCards: entry.stats.yellowCards,
        redCards: entry.stats.redCards,
        totalCards: entry.stats.yellowCards + entry.stats.redCards,
      }))
      .filter((entry) => entry.totalCards > 0)
      .sort((a, b) => {
        if (b.totalCards !== a.totalCards) {
          return b.totalCards - a.totalCards
        }
        return b.redCards - a.redCards
      })
      .slice(0, 4)
  }, [playersWithStats])

  const insights = useMemo(() => {
    if (!hasMatches) {
      return [
        "Ajusta los filtros para generar tendencias accionables del equipo.",
      ]
    }

    const list: string[] = []

    if (teamForm.currentWinStreak >= 2) {
      list.push(
        `Racha activa de ${teamForm.currentWinStreak} victorias consecutivas.`
      )
    } else if (teamForm.currentUnbeatenStreak >= 4) {
      list.push(
        `El equipo suma ${teamForm.currentUnbeatenStreak} partidos sin perder.`
      )
    } else if (teamForm.currentScoringStreak >= 3) {
      list.push(
        `Ha marcado en los últimos ${teamForm.currentScoringStreak} encuentros.`
      )
    }

    if (teamForm.lastFive.matches >= 3) {
      const averagePoints = teamForm.lastFive.points / teamForm.lastFive.matches
      list.push(
        `Promedia ${averagePoints.toFixed(2)} puntos en los últimos ${
          teamForm.lastFive.matches
        } partidos (${teamForm.lastFive.goalsFor}-${teamForm.lastFive.goalsAgainst}).`
      )
    }

    const opponentsWithSample = opponentRows
      .filter((row) => row.matches >= 2)
      .slice()
    if (opponentsWithSample.length > 0) {
      opponentsWithSample.sort((a, b) => b.pointsPerMatch - a.pointsPerMatch)
      const bestOpponent = opponentsWithSample[0]
      if (bestOpponent.pointsPerMatch >= 2) {
        list.push(
          `${teamName} promedia ${bestOpponent.pointsPerMatch} puntos por partido contra ${bestOpponent.opponentName}.`
        )
      }

      opponentsWithSample.sort((a, b) => a.pointsPerMatch - b.pointsPerMatch)
      const toughestOpponent = opponentsWithSample[0]
      if (toughestOpponent.pointsPerMatch < 1.5) {
        list.push(
          `${toughestOpponent.opponentName} reduce al equipo a ${toughestOpponent.pointsPerMatch} puntos por partido.`
        )
      }
    }

    const hotPlayer = recentFormPlayers.find(
      (entry) => entry.stats.goalInvolvements > 0
    )
    if (hotPlayer) {
      list.push(
        `${hotPlayer.player.nombre} participó en ${hotPlayer.stats.goalInvolvements} goles (${hotPlayer.stats.goals} G / ${hotPlayer.stats.assists} A) en sus últimos ${hotPlayer.stats.played} partidos.`
      )
    } else if (recentFormPlayers.length > 0) {
      const mostMinutes = recentFormPlayers[0]
      list.push(
        `${mostMinutes.player.nombre} acumula ${mostMinutes.stats.minutes} minutos recientes, clave para la rotación.`
      )
    }

    if (teamStats.cleanSheets > 0 && teamStats.matches > 0) {
      const cleanSheetRate = (teamStats.cleanSheets / teamStats.matches) * 100
      list.push(
        `Ha dejado la portería a cero en ${cleanSheetRate.toFixed(0)}% de los partidos analizados.`
      )
    }

    if (list.length === 0) {
      list.push(
        "Explora las tablas para detectar tendencias y prepara el próximo rival."
      )
    }

    return list.slice(0, 4)
  }, [
    hasMatches,
    opponentRows,
    recentFormPlayers,
    teamForm,
    teamName,
    teamStats.cleanSheets,
    teamStats.matches,
  ])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Filtros de análisis</CardTitle>
          <CardDescription>
            Ajusta los criterios para cruzar la información de los partidos del {teamName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select
              value={selectedCompetition}
              onValueChange={setSelectedCompetition}
            >
              <SelectTrigger>
                <SelectValue placeholder="Competición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las competiciones</SelectItem>
                {competitions.map((competition) => (
                  <SelectItem key={competition} value={competition}>
                    {formatCompetition(competition)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={condition} onValueChange={(value) => setCondition(value as ConditionValue)}>
              <SelectTrigger>
                <SelectValue placeholder="Condición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Local y visitante</SelectItem>
                <SelectItem value="home">Solo local</SelectItem>
                <SelectItem value="away">Solo visitante</SelectItem>
              </SelectContent>
            </Select>

            <Select value={range} onValueChange={(value) => setRange(value as RangeValue)}>
              <SelectTrigger>
                <SelectValue placeholder="Rango temporal" />
              </SelectTrigger>
              <SelectContent>
                {rangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={metric} onValueChange={(value) => setMetric(value as MetricKey)}>
              <SelectTrigger>
                <SelectValue placeholder="Métrica destacada" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(metricDefinitions).map(([value, info]) => (
                  <SelectItem key={value} value={value}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Insights clave</CardTitle>
          <CardDescription>
            Historias destacadas construidas con los filtros aplicados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {insights.map((insight, index) => (
              <div key={index} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Resumen colectivo</CardTitle>
            <CardDescription>
              Balance global de los partidos seleccionados y datos agregados del equipo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {hasMatches ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatItem label="Partidos" value={teamStats.matches} />
                  <StatItem label="Puntos" value={teamStats.points} />
                  <StatItem label="Victorias" value={teamStats.wins} />
                  <StatItem label="Empates" value={teamStats.draws} />
                  <StatItem label="Derrotas" value={teamStats.losses} />
                  <StatItem label="Goles a favor" value={teamStats.goalsFor} />
                  <StatItem label="Goles en contra" value={teamStats.goalsAgainst} />
                  <StatItem
                    label="Diferencia"
                    value={teamStats.goalDifference}
                    valueClassName={
                      teamStats.goalDifference > 0
                        ? "text-emerald-600"
                        : teamStats.goalDifference < 0
                        ? "text-red-600"
                        : undefined
                    }
                  />
                  <StatItem label="Porterías a cero" value={teamStats.cleanSheets} />
                  <StatItem
                    label="Promedio GF"
                    value={teamStats.averageGoalsFor.toFixed(2)}
                  />
                  <StatItem
                    label="Promedio GC"
                    value={teamStats.averageGoalsAgainst.toFixed(2)}
                  />
                  <StatItem
                    label="Tarjetas"
                    value={`${teamStats.yellowCards} amarillas · ${teamStats.redCards} rojas`}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Rendimiento por competición
                  </p>
                  {Object.keys(teamStats.competitions).length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {Object.entries(teamStats.competitions).map(
                        ([competition, breakdown]) => (
                          <div
                            key={competition}
                            className="rounded-lg border bg-muted/40 p-3 text-sm"
                          >
                            <p className="font-medium">
                              {formatCompetition(competition)}
                            </p>
                            <p className="text-muted-foreground">
                              {breakdown.wins}-{breakdown.draws}-{breakdown.losses} · {breakdown.goalsFor}-{breakdown.goalsAgainst}
                            </p>
                            <p className="text-muted-foreground">
                              {breakdown.matches} partidos
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay partidos en el rango seleccionado.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ajusta los filtros para visualizar estadísticas disponibles.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Condición y disciplina</CardTitle>
            <CardDescription>
              Comparativa entre partidos como local y visitante.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasMatches ? (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-semibold">Local</p>
                  <p className="text-muted-foreground">
                    {teamStats.home.matches} partidos · {teamStats.home.wins}-{teamStats.home.draws}-{teamStats.home.losses}
                  </p>
                  <p className="text-muted-foreground">
                    Goles: {teamStats.home.goalsFor}-{teamStats.home.goalsAgainst}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-semibold">Visitante</p>
                  <p className="text-muted-foreground">
                    {teamStats.away.matches} partidos · {teamStats.away.wins}-{teamStats.away.draws}-{teamStats.away.losses}
                  </p>
                  <p className="text-muted-foreground">
                    Goles: {teamStats.away.goalsFor}-{teamStats.away.goalsAgainst}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-semibold">Disciplina</p>
                  <p className="text-muted-foreground">
                    {teamStats.yellowCards} amarillas · {teamStats.redCards} rojas
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay registros para mostrar.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Rachas y tendencias</CardTitle>
            <CardDescription>
              Evolución temporal del equipo en el tramo filtrado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasMatches ? (
              <div className="space-y-3 text-sm">
                <TrendItem
                  label="Victorias seguidas"
                  value={teamForm.currentWinStreak}
                />
                <TrendItem
                  label="Partidos invicto"
                  value={teamForm.currentUnbeatenStreak}
                />
                <TrendItem
                  label="Racha goleadora"
                  value={teamForm.currentScoringStreak}
                />
                <TrendItem
                  label="Mejor racha de victorias"
                  value={teamForm.longestWinStreak}
                />
                <TrendItem
                  label="Mejor racha sin perder"
                  value={teamForm.longestUnbeatenStreak}
                />
                <TrendItem
                  label="Últimos 5 partidos (puntos)"
                  value={`${teamForm.lastFive.points} pts`}
                  helper={`GF ${teamForm.lastFive.goalsFor} · GC ${teamForm.lastFive.goalsAgainst} · ${teamForm.lastFive.cleanSheets} porterías a cero`}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Todavía no hay suficientes encuentros para calcular rachas.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Rendimiento por rival</CardTitle>
            <CardDescription>
              Balance de puntos y goles contra cada oponente analizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasMatches && opponentRows.length > 0 ? (
              <div className="max-h-[320px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rival</TableHead>
                      <TableHead className="text-right">PJ</TableHead>
                      <TableHead className="text-right">G-E-P</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                      <TableHead className="text-right">Port. 0</TableHead>
                      <TableHead className="text-right">Pts/Partido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opponentRows.map((row) => (
                      <TableRow key={row.opponentId}>
                        <TableCell className="font-medium">
                          {row.opponentName}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.matches}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.wins}-{row.draws}-{row.losses}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.goalsFor}-{row.goalsAgainst}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.cleanSheets}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {row.pointsPerMatch.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay enfrentamientos suficientes para este análisis.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Top jugadores</CardTitle>
            <CardDescription>{metricDefinitions[metric].label}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasMatches ? (
              topMetricMax > 0 ? (
                topPlayers.map((entry) => {
                  const value = metricInfo.getValue(entry.stats)
                  const percentage = topMetricMax ? (value / topMetricMax) * 100 : 0
                  return (
                    <div key={entry.player.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{entry.player.nombre}</p>
                          {entry.player.posicion && (
                            <p className="text-xs text-muted-foreground">
                              {entry.player.posicion}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold">
                          {metricInfo.format(value)}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ningún jugador acumula registros en la métrica seleccionada.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay datos suficientes para mostrar este ranking.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Jugadores en forma</CardTitle>
            <CardDescription>Últimos 5 partidos oficiales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasMatches && recentFormPlayers.length > 0 ? (
              recentFormPlayers.map((entry) => {
                const per90 = entry.stats.goalInvolvementsPer90
                return (
                  <div key={entry.player.id} className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{entry.player.nombre}</p>
                        {entry.player.posicion && (
                          <p className="text-xs text-muted-foreground">
                            {entry.player.posicion}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold">
                        {entry.stats.goalInvolvements} G+A
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.stats.minutes} minutos · {per90.toFixed(2)} G+A/90′
                    </p>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                Nadie ha sumado participación destacada en el tramo analizado.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Alertas de disciplina</CardTitle>
            <CardDescription>
              Vigila a los jugadores más amonestados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {hasMatches && disciplinaryAlerts.length > 0 ? (
              disciplinaryAlerts.map((entry) => (
                <div key={entry.player.id} className="flex justify-between">
                  <div>
                    <p className="font-medium">{entry.player.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.yellowCards} amarillas · {entry.redCards} rojas
                    </p>
                  </div>
                  <Badge variant="secondary" className="self-start">
                    {entry.totalCards} tarjetas
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Ningún jugador acumula tarjetas en los filtros seleccionados.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Tabla cruzada de jugadores</CardTitle>
          <CardDescription>
            Compara convocatorias, minutos y contribuciones con los filtros aplicados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasMatches ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="text-right">Jugados</TableHead>
                    <TableHead className="text-right">Titular</TableHead>
                    <TableHead className="text-right">Min.</TableHead>
                    <TableHead className="text-right">Goles</TableHead>
                    <TableHead className="text-right">Asist.</TableHead>
                    <TableHead className="text-right">G+A</TableHead>
                    <TableHead className="text-right">Amar.</TableHead>
                    <TableHead className="text-right">Rojas</TableHead>
                    <TableHead className="text-right">Part.%</TableHead>
                    <TableHead className="text-right">G+A/90′</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPlayersByMetric.map(({ player, stats }) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{player.nombre}</span>
                          {player.posicion && (
                            <span className="text-xs text-muted-foreground">
                              {player.posicion}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{stats.callUps}</TableCell>
                      <TableCell className="text-right">{stats.played}</TableCell>
                      <TableCell className="text-right">{stats.starts}</TableCell>
                      <TableCell className="text-right">{stats.minutes}</TableCell>
                      <TableCell className="text-right">{stats.goals}</TableCell>
                      <TableCell className="text-right">{stats.assists}</TableCell>
                      <TableCell className="text-right">{stats.goalInvolvements}</TableCell>
                      <TableCell className="text-right">{stats.yellowCards}</TableCell>
                      <TableCell className="text-right">{stats.redCards}</TableCell>
                      <TableCell className="text-right">
                        {formatPercent(stats.participationRate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {stats.goalInvolvementsPer90.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin datos de jugadores para el rango seleccionado.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Historial de partidos filtrados</CardTitle>
          <CardDescription>
            Detalle de cada encuentro con goleadores, asistencias y disciplina.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasMatches ? (
            matchItems.length > 0 ? (
              <ul className="space-y-3">
                {matchItems.map((item) => {
                  const scoreLabel = `${item.score.goalsFor}-${item.score.goalsAgainst}`
                  const resultLabel = resolveMatchResultLabel(item.result)
                  const badgeClassName =
                    item.result === "win"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.result === "loss"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  return (
                    <li
                      key={item.match.id}
                      className="rounded-lg border bg-background p-3"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <p className="font-medium">
                            {item.match.isHome ? "vs" : "@"} {item.opponentName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.kickoffDate
                              ? `${fullDateFormatter.format(item.kickoffDate)} · ${formatCompetition(item.match.competition)}`
                              : formatCompetition(item.match.competition)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">{scoreLabel}</p>
                          <Badge className={badgeClassName}>{resultLabel}</Badge>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-foreground">Goleadores:</span> {item.goalScorers.length > 0 ? item.goalScorers.join(", ") : "—"}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Asistencias:</span> {item.assistProviders.length > 0 ? item.assistProviders.join(", ") : "—"}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Tarjetas:</span> {item.yellowCards} amarillas · {item.redCards} rojas
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Participación:</span> {item.playersUsed} jugadores en campo · {item.callUps} convocados
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay partidos en el rango seleccionado.
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecciona otra combinación de filtros para ver los encuentros.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatItem({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: number | string
  valueClassName?: string
}) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3 text-sm">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${valueClassName ?? ""}`}>{value}</p>
    </div>
  )
}

function TrendItem({
  label,
  value,
  helper,
}: {
  label: string
  value: string | number
  helper?: string
}) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3 text-sm">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold">{value}</p>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  )
}

