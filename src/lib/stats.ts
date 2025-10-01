import type { Match, PlayerSlot } from "@/types/match"

export type PlayerMatchResult = "win" | "draw" | "loss"

export interface PlayerMatchStats {
  /** Total number of matches considered for the team. */
  matches: number
  /** Times the player appeared on the match sheet (not marked as unavailable). */
  callUps: number
  /** Matches in which the player played at least one minute. */
  played: number
  /** Matches in which the player started the game. */
  starts: number
  /** Total minutes played. */
  minutes: number
  /** Goals scored by the player. */
  goals: number
  /** Assists registered for the player. */
  assists: number
  /** Yellow cards received. */
  yellowCards: number
  /** Red cards received. */
  redCards: number
  /** Clean sheets recorded (mainly for goalkeepers). */
  cleanSheets: number
  /** Goals conceded while the player was on the pitch (goalkeepers). */
  goalsConceded: number
  /** Matches won when the player was on the pitch. */
  wins: number
  /** Matches drawn when the player was on the pitch. */
  draws: number
  /** Matches lost when the player was on the pitch. */
  losses: number
  /** Goal contributions (goals + assists). */
  goalInvolvements: number
  /** Percentage of team matches in which the player played. */
  participationRate: number
  /** Percentage of team matches in which the player was available. */
  availabilityRate: number
  /** Goal involvements per 90 minutes. */
  goalInvolvementsPer90: number
}

export interface PlayerMatchSummary {
  matchId: number
  kickoff: string | null
  opponentId: number
  competition: Match["competition"]
  isHome: boolean
  minutes: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  result: PlayerMatchResult
  goalsFor: number
  goalsAgainst: number
  started: boolean
  played: boolean
}

export interface TeamStatsBreakdown {
  matches: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
}

export interface TeamStats {
  matches: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  cleanSheets: number
  averageGoalsFor: number
  averageGoalsAgainst: number
  points: number
  yellowCards: number
  redCards: number
  home: TeamStatsBreakdown
  away: TeamStatsBreakdown
  competitions: Record<string, TeamStatsBreakdown>
}

export interface OpponentBreakdown {
  opponentId: number
  matches: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  pointsPerMatch: number
  cleanSheets: number
}

export interface TeamFormSummary {
  matches: number
  currentWinStreak: number
  currentUnbeatenStreak: number
  currentScoringStreak: number
  longestWinStreak: number
  longestUnbeatenStreak: number
  longestScoringStreak: number
  lastFive: {
    matches: number
    points: number
    goalsFor: number
    goalsAgainst: number
    cleanSheets: number
  }
}

export interface PlayerStreakSummary {
  totalMatches: number
  playedMatches: number
  currentPlayingStreak: number
  currentStartingStreak: number
  longestPlayingStreak: number
  longestStartingStreak: number
  currentGoalInvolvementStreak: number
  longestGoalInvolvementStreak: number
  matchesSinceLastGoalInvolvement: number | null
  lastGoalInvolvementMatchId: number | null
  lastGoalInvolvementKickoff: string | null
  winRateWhenPlayed: number
  lastFive: {
    matches: number
    goals: number
    assists: number
    minutes: number
  }
}

export interface PlayerOpponentBreakdown {
  opponentId: number
  matches: number
  starts: number
  wins: number
  draws: number
  losses: number
  goals: number
  assists: number
  goalInvolvements: number
  minutes: number
}

interface MutablePlayerStats extends PlayerMatchStats {}

export function createBaselinePlayerStats(
  totalMatches: number
): PlayerMatchStats {
  return createEmptyStats(totalMatches)
}

function createEmptyStats(totalMatches: number): MutablePlayerStats {
  return {
    matches: totalMatches,
    callUps: 0,
    played: 0,
    starts: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    cleanSheets: 0,
    goalsConceded: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalInvolvements: 0,
    participationRate: 0,
    availabilityRate: 0,
    goalInvolvementsPer90: 0,
  }
}

function ensureStats(
  map: Map<number, MutablePlayerStats>,
  id: number,
  totalMatches: number
) {
  let entry = map.get(id)
  if (!entry) {
    entry = createEmptyStats(totalMatches)
    map.set(id, entry)
  }
  return entry
}

function creditMatchOutcome(
  stats: MutablePlayerStats,
  result: PlayerMatchResult
) {
  if (result === "win") {
    stats.wins += 1
  } else if (result === "draw") {
    stats.draws += 1
  } else {
    stats.losses += 1
  }
}

export function getMatchScore(match: Match) {
  let goalsFor = 0
  let goalsAgainst = 0

  for (const event of match.events) {
    if (event.type !== "gol") continue
    if (event.teamId === match.teamId) {
      goalsFor += 1
    } else if (event.rivalId === match.rivalId) {
      goalsAgainst += 1
    }
  }

  return { goalsFor, goalsAgainst }
}

function resolveResult(goalsFor: number, goalsAgainst: number): PlayerMatchResult {
  if (goalsFor > goalsAgainst) return "win"
  if (goalsFor < goalsAgainst) return "loss"
  return "draw"
}

function isPlayerAvailable(slot: PlayerSlot | undefined) {
  if (!slot) return false
  return slot.role !== "unavailable"
}

export function aggregatePlayersStats(matches: Match[]): Map<number, PlayerMatchStats> {
  const result = new Map<number, MutablePlayerStats>()
  const totalMatches = matches.length

  for (const match of matches) {
    const { goalsFor, goalsAgainst } = getMatchScore(match)
    const matchResult = resolveResult(goalsFor, goalsAgainst)
    const callUpsRecorded = new Set<number>()
    const playedRecorded = new Set<number>()
    const eventParticipants = new Set<number>()

    for (const slot of match.lineup) {
      if (!slot.playerId) continue
      const stats = ensureStats(result, slot.playerId, totalMatches)
      const playerId = slot.playerId

      if (isPlayerAvailable(slot) && !callUpsRecorded.has(playerId)) {
        stats.callUps += 1
        callUpsRecorded.add(playerId)
      }

      const minutes = Math.max(0, Number(slot.minutes ?? 0))
      const consideredStarter = slot.role === "field"
      const played = minutes > 0 || consideredStarter

      if (minutes > 0) {
        stats.minutes += minutes
      }

      if (played && !playedRecorded.has(playerId)) {
        stats.played += 1
        if (consideredStarter) {
          stats.starts += 1
        }
        if (slot.cleanSheet) {
          stats.cleanSheets += 1
        }
        if (Number.isFinite(Number(slot.goalsConceded))) {
          stats.goalsConceded += Number(slot.goalsConceded ?? 0)
        }
        creditMatchOutcome(stats, matchResult)
        playedRecorded.add(playerId)
      }
    }

    for (const event of match.events) {
      if (event.teamId !== match.teamId) continue
      if (!event.playerId) continue
      const stats = ensureStats(result, event.playerId, totalMatches)
      eventParticipants.add(event.playerId)

      if (event.type === "gol") {
        stats.goals += 1
      } else if (event.type === "asistencia") {
        stats.assists += 1
      } else if (event.type === "amarilla") {
        stats.yellowCards += 1
      } else if (event.type === "roja") {
        stats.redCards += 1
      }
    }

    for (const playerId of eventParticipants) {
      const stats = ensureStats(result, playerId, totalMatches)

      if (!callUpsRecorded.has(playerId)) {
        stats.callUps += 1
        callUpsRecorded.add(playerId)
      }

      if (!playedRecorded.has(playerId)) {
        stats.played += 1
        creditMatchOutcome(stats, matchResult)
        playedRecorded.add(playerId)
      }
    }
  }

  result.forEach((stats) => {
    stats.goalInvolvements = stats.goals + stats.assists
    stats.participationRate = totalMatches
      ? Number((stats.played / totalMatches).toFixed(4))
      : 0
    stats.availabilityRate = totalMatches
      ? Number((stats.callUps / totalMatches).toFixed(4))
      : 0
    stats.goalInvolvementsPer90 = stats.minutes > 0
      ? Number(((stats.goalInvolvements / stats.minutes) * 90).toFixed(4))
      : stats.played > 0
      ? Number((stats.goalInvolvements / stats.played).toFixed(4))
      : 0
  })

  return result
}

export function aggregatePlayerStats(matches: Match[], playerId: number): PlayerMatchStats {
  const map = aggregatePlayersStats(matches)
  const stats = map.get(playerId)
  if (stats) return stats

  return createEmptyStats(matches.length)
}

export function summarizeTeamMatches(matches: Match[]): TeamStats {
  const totalMatches = matches.length
  const baseBreakdown = () => ({
    matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  })

  const home = baseBreakdown()
  const away = baseBreakdown()
  const competitions = new Map<string, TeamStatsBreakdown>()

  let wins = 0
  let draws = 0
  let losses = 0
  let goalsFor = 0
  let goalsAgainst = 0
  let cleanSheets = 0
  let yellowCards = 0
  let redCards = 0

  for (const match of matches) {
    const score = getMatchScore(match)
    goalsFor += score.goalsFor
    goalsAgainst += score.goalsAgainst

    if (score.goalsAgainst === 0) {
      cleanSheets += 1
    }

    const result = resolveResult(score.goalsFor, score.goalsAgainst)
    if (result === "win") wins += 1
    else if (result === "draw") draws += 1
    else losses += 1

    const condition = match.isHome ? home : away
    condition.matches += 1
    condition.goalsFor += score.goalsFor
    condition.goalsAgainst += score.goalsAgainst
    if (result === "win") condition.wins += 1
    else if (result === "draw") condition.draws += 1
    else condition.losses += 1

    const compKey = match.competition
    if (!competitions.has(compKey)) {
      competitions.set(compKey, baseBreakdown())
    }
    const comp = competitions.get(compKey)!
    comp.matches += 1
    comp.goalsFor += score.goalsFor
    comp.goalsAgainst += score.goalsAgainst
    if (result === "win") comp.wins += 1
    else if (result === "draw") comp.draws += 1
    else comp.losses += 1

    for (const event of match.events) {
      if (event.teamId !== match.teamId) continue
      if (event.type === "amarilla") yellowCards += 1
      else if (event.type === "roja") redCards += 1
    }
  }

  return {
    matches: totalMatches,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    cleanSheets,
    averageGoalsFor: totalMatches ? goalsFor / totalMatches : 0,
    averageGoalsAgainst: totalMatches ? goalsAgainst / totalMatches : 0,
    points: wins * 3 + draws,
    yellowCards,
    redCards,
    home,
    away,
    competitions: Object.fromEntries(competitions.entries()),
  }
}

export function buildOpponentBreakdown(matches: Match[]): Map<number, OpponentBreakdown> {
  const map = new Map<number, OpponentBreakdown>()

  for (const match of matches) {
    const score = getMatchScore(match)
    const result = resolveResult(score.goalsFor, score.goalsAgainst)
    const existing = map.get(match.rivalId) ?? {
      opponentId: match.rivalId,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      pointsPerMatch: 0,
      cleanSheets: 0,
    }

    existing.matches += 1
    existing.goalsFor += score.goalsFor
    existing.goalsAgainst += score.goalsAgainst
    if (score.goalsAgainst === 0) {
      existing.cleanSheets += 1
    }

    if (result === "win") {
      existing.wins += 1
      existing.points += 3
    } else if (result === "draw") {
      existing.draws += 1
      existing.points += 1
    } else {
      existing.losses += 1
    }

    existing.goalDifference = existing.goalsFor - existing.goalsAgainst
    existing.pointsPerMatch = Number(
      (existing.points / existing.matches).toFixed(2)
    )

    map.set(match.rivalId, existing)
  }

  return map
}

export function analyzeTeamForm(matches: Match[]): TeamFormSummary {
  const sorted = [...matches].sort((a, b) => {
    const aTime = a.kickoff ? new Date(a.kickoff).getTime() : 0
    const bTime = b.kickoff ? new Date(b.kickoff).getTime() : 0
    return aTime - bTime
  })

  let longestWinStreak = 0
  let longestUnbeatenStreak = 0
  let longestScoringStreak = 0
  let runningWinStreak = 0
  let runningUnbeatenStreak = 0
  let runningScoringStreak = 0

  for (const match of sorted) {
    const score = getMatchScore(match)
    const result = resolveResult(score.goalsFor, score.goalsAgainst)

    if (result === "win") {
      runningWinStreak += 1
      runningUnbeatenStreak += 1
    } else if (result === "draw") {
      longestWinStreak = Math.max(longestWinStreak, runningWinStreak)
      runningWinStreak = 0
      runningUnbeatenStreak += 1
    } else {
      longestWinStreak = Math.max(longestWinStreak, runningWinStreak)
      runningWinStreak = 0
      longestUnbeatenStreak = Math.max(longestUnbeatenStreak, runningUnbeatenStreak)
      runningUnbeatenStreak = 0
    }

    if (score.goalsFor > 0) {
      runningScoringStreak += 1
    } else {
      longestScoringStreak = Math.max(longestScoringStreak, runningScoringStreak)
      runningScoringStreak = 0
    }
  }

  longestWinStreak = Math.max(longestWinStreak, runningWinStreak)
  longestUnbeatenStreak = Math.max(longestUnbeatenStreak, runningUnbeatenStreak)
  longestScoringStreak = Math.max(longestScoringStreak, runningScoringStreak)

  const sortedDesc = [...sorted].reverse()

  let currentWinStreak = 0
  for (const match of sortedDesc) {
    const score = getMatchScore(match)
    const result = resolveResult(score.goalsFor, score.goalsAgainst)
    if (result === "win") {
      currentWinStreak += 1
    } else {
      break
    }
  }

  let currentUnbeatenStreak = 0
  for (const match of sortedDesc) {
    const score = getMatchScore(match)
    const result = resolveResult(score.goalsFor, score.goalsAgainst)
    if (result === "loss") {
      break
    }
    currentUnbeatenStreak += 1
  }

  let currentScoringStreak = 0
  for (const match of sortedDesc) {
    const score = getMatchScore(match)
    if (score.goalsFor > 0) {
      currentScoringStreak += 1
    } else {
      break
    }
  }

  const lastFive = sortedDesc.slice(0, 5)
  const lastFiveSummary = lastFive.reduce(
    (acc, match) => {
      const score = getMatchScore(match)
      const result = resolveResult(score.goalsFor, score.goalsAgainst)
      acc.matches += 1
      acc.goalsFor += score.goalsFor
      acc.goalsAgainst += score.goalsAgainst
      if (score.goalsAgainst === 0) acc.cleanSheets += 1
      if (result === "win") acc.points += 3
      else if (result === "draw") acc.points += 1
      return acc
    },
    { matches: 0, points: 0, goalsFor: 0, goalsAgainst: 0, cleanSheets: 0 }
  )

  return {
    matches: matches.length,
    currentWinStreak,
    currentUnbeatenStreak,
    currentScoringStreak,
    longestWinStreak,
    longestUnbeatenStreak,
    longestScoringStreak,
    lastFive: lastFiveSummary,
  }
}

export function collectPlayerRecentForm(
  matches: Match[],
  limit: number
): Map<number, PlayerMatchStats> {
  if (limit <= 0) {
    return new Map()
  }

  const sorted = [...matches].sort((a, b) => {
    const aTime = a.kickoff ? new Date(a.kickoff).getTime() : 0
    const bTime = b.kickoff ? new Date(b.kickoff).getTime() : 0
    return bTime - aTime
  })

  const selected = sorted.slice(0, limit)
  return aggregatePlayersStats(selected)
}

export function analyzePlayerStreaks(
  summaries: PlayerMatchSummary[]
): PlayerStreakSummary {
  if (summaries.length === 0) {
    return {
      totalMatches: 0,
      playedMatches: 0,
      currentPlayingStreak: 0,
      currentStartingStreak: 0,
      longestPlayingStreak: 0,
      longestStartingStreak: 0,
      currentGoalInvolvementStreak: 0,
      longestGoalInvolvementStreak: 0,
      matchesSinceLastGoalInvolvement: null,
      lastGoalInvolvementMatchId: null,
      lastGoalInvolvementKickoff: null,
      winRateWhenPlayed: 0,
      lastFive: { matches: 0, goals: 0, assists: 0, minutes: 0 },
    }
  }

  const chronological = [...summaries].reverse()

  let longestPlayingStreak = 0
  let longestStartingStreak = 0
  let longestGoalContributionStreak = 0
  let runningPlaying = 0
  let runningStarting = 0
  let runningGoalContribution = 0

  for (const summary of chronological) {
    if (summary.played) {
      runningPlaying += 1
      longestPlayingStreak = Math.max(longestPlayingStreak, runningPlaying)
    } else {
      runningPlaying = 0
    }

    if (summary.started) {
      runningStarting += 1
      longestStartingStreak = Math.max(longestStartingStreak, runningStarting)
    } else {
      runningStarting = 0
    }

    if (summary.goals + summary.assists > 0) {
      runningGoalContribution += 1
      longestGoalContributionStreak = Math.max(
        longestGoalContributionStreak,
        runningGoalContribution
      )
    } else {
      runningGoalContribution = 0
    }
  }

  let currentPlayingStreak = 0
  let currentStartingStreak = 0
  let currentGoalContributionStreak = 0
  let matchesSinceLastContribution: number | null = null
  let lastContributionMatchId: number | null = null
  let lastContributionKickoff: string | null = null

  for (const summary of summaries) {
    if (summary.played) {
      currentPlayingStreak += 1
    } else {
      break
    }
  }

  for (const summary of summaries) {
    if (summary.started) {
      currentStartingStreak += 1
    } else {
      break
    }
  }

  for (let index = 0; index < summaries.length; index += 1) {
    const summary = summaries[index]
    if (summary.goals + summary.assists > 0) {
      currentGoalContributionStreak += 1
    } else {
      break
    }
  }

  for (let index = 0; index < summaries.length; index += 1) {
    const summary = summaries[index]
    if (summary.goals + summary.assists > 0) {
      matchesSinceLastContribution = index
      lastContributionMatchId = summary.matchId
      lastContributionKickoff = summary.kickoff
      break
    }
  }

  const playedSummaries = summaries.filter((summary) => summary.played)
  const winsWhenPlayed = playedSummaries.filter(
    (summary) => summary.result === "win"
  ).length
  const winRateWhenPlayed = playedSummaries.length
    ? Number((winsWhenPlayed / playedSummaries.length).toFixed(4))
    : 0

  const lastFive = summaries.slice(0, 5)
  const lastFiveSummary = lastFive.reduce(
    (acc, summary) => {
      acc.matches += 1
      acc.goals += summary.goals
      acc.assists += summary.assists
      acc.minutes += summary.minutes
      return acc
    },
    { matches: 0, goals: 0, assists: 0, minutes: 0 }
  )

  return {
    totalMatches: summaries.length,
    playedMatches: playedSummaries.length,
    currentPlayingStreak,
    currentStartingStreak,
    longestPlayingStreak,
    longestStartingStreak,
    currentGoalInvolvementStreak: currentGoalContributionStreak,
    longestGoalInvolvementStreak: longestGoalContributionStreak,
    matchesSinceLastGoalInvolvement: matchesSinceLastContribution,
    lastGoalInvolvementMatchId: lastContributionMatchId,
    lastGoalInvolvementKickoff: lastContributionKickoff,
    winRateWhenPlayed,
    lastFive: lastFiveSummary,
  }
}

export function buildPlayerOpponentBreakdown(
  summaries: PlayerMatchSummary[]
): Map<number, PlayerOpponentBreakdown> {
  const map = new Map<number, PlayerOpponentBreakdown>()

  for (const summary of summaries) {
    if (!summary.played) continue

    const existing = map.get(summary.opponentId) ?? {
      opponentId: summary.opponentId,
      matches: 0,
      starts: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals: 0,
      assists: 0,
      goalInvolvements: 0,
      minutes: 0,
    }

    existing.matches += 1
    existing.starts += summary.started ? 1 : 0
    existing.minutes += summary.minutes
    existing.goals += summary.goals
    existing.assists += summary.assists
    existing.goalInvolvements = existing.goals + existing.assists

    if (summary.result === "win") existing.wins += 1
    else if (summary.result === "draw") existing.draws += 1
    else existing.losses += 1

    map.set(summary.opponentId, existing)
  }

  return map
}

export function buildPlayerMatchSummaries(
  matches: Match[],
  playerId: number
): PlayerMatchSummary[] {
  const sorted = [...matches].sort((a, b) => {
    const aTime = a.kickoff ? new Date(a.kickoff).getTime() : 0
    const bTime = b.kickoff ? new Date(b.kickoff).getTime() : 0
    return bTime - aTime
  })

  const summaries: PlayerMatchSummary[] = []

  for (const match of sorted) {
    const slot = match.lineup.find((entry) => entry.playerId === playerId)
    const { goalsFor, goalsAgainst } = getMatchScore(match)
    const eventsForPlayer = match.events.filter(
      (event) => event.playerId === playerId && event.teamId === match.teamId
    )

    if (!slot && eventsForPlayer.length === 0) {
      continue
    }

    const goals = eventsForPlayer.filter((event) => event.type === "gol").length
    const assists = eventsForPlayer.filter((event) => event.type === "asistencia").length
    const yellowCards = eventsForPlayer.filter((event) => event.type === "amarilla").length
    const redCards = eventsForPlayer.filter((event) => event.type === "roja").length

    const minutes = Number(slot?.minutes ?? 0)
    const consideredStarter = slot?.role === "field"
    const played = slot ? minutes > 0 || consideredStarter : eventsForPlayer.length > 0

    summaries.push({
      matchId: match.id,
      kickoff: match.kickoff ?? null,
      opponentId: match.rivalId,
      competition: match.competition,
      isHome: match.isHome,
      minutes,
      goals,
      assists,
      yellowCards,
      redCards,
      result: resolveResult(goalsFor, goalsAgainst),
      goalsFor,
      goalsAgainst,
      started: Boolean(slot && consideredStarter),
      played,
    })
  }

  return summaries
}

export function resolveMatchResultLabel(result: PlayerMatchResult) {
  switch (result) {
    case "win":
      return "Victoria"
    case "draw":
      return "Empate"
    case "loss":
      return "Derrota"
    default:
      return ""
  }
}

