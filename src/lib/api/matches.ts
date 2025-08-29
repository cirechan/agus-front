import { neon } from '@neondatabase/serverless'
import type { Match, PlayerSlot, MatchEvent } from '@/types/match'

const sql = neon(process.env.DATABASE_URL!)

export async function listMatches(): Promise<Match[]> {
  const rows = await sql<Match[]>`
    SELECT id, home_team_id as "homeTeamId", away_team_id as "awayTeamId", kickoff
    FROM matches
    ORDER BY kickoff DESC
  `
  return rows
}

export async function createMatch(
  match: Omit<Match, 'id' | 'lineup' | 'events' | 'createdAt' | 'updatedAt'>
): Promise<Match> {
  const { homeTeamId, awayTeamId, kickoff } = match
  const rows = await sql<Match[]>`
    INSERT INTO matches (home_team_id, away_team_id, kickoff)
    VALUES (${homeTeamId}, ${awayTeamId}, ${kickoff})
    RETURNING id, home_team_id as "homeTeamId", away_team_id as "awayTeamId", kickoff
  `
  return rows[0]
}

export async function recordEvent(
  matchId: string,
  event: Omit<MatchEvent, 'id' | 'matchId' | 'createdAt'>
): Promise<MatchEvent> {
  const { minute, type, playerId, description } = event
  const rows = await sql<MatchEvent[]>`
    INSERT INTO match_events (match_id, minute, type, player_id, description)
    VALUES (${matchId}, ${minute}, ${type}, ${playerId}, ${description})
    RETURNING id, match_id as "matchId", minute, type, player_id as "playerId", description
  `
  return rows[0]
}

export async function updateLineup(matchId: string, lineup: PlayerSlot[]): Promise<void> {
  await sql`DELETE FROM match_lineups WHERE match_id = ${matchId}`
  for (const slot of lineup) {
    await sql`
      INSERT INTO match_lineups (match_id, player_id, position, jersey_number)
      VALUES (${matchId}, ${slot.playerId}, ${slot.position}, ${slot.number})
    `
  }
}
