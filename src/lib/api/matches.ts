import { neon } from '@neondatabase/serverless';
import type { Match, MatchEvent, PlayerSlot, NewMatch, NewMatchEvent } from '@/types/match';

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
const sql = connectionString ? neon(connectionString) : undefined;

function mapMatch(row: any, events: MatchEvent[] = []): Match {
  return {
    id: row.id,
    homeTeamId: row.homeTeamId,
    awayTeamId: row.awayTeamId,
    kickoff: row.kickoff,
    lineup: (row.lineup ?? []) as PlayerSlot[],
    events,
  };
}

function mapEvent(row: any): MatchEvent {
  return {
    id: row.id,
    matchId: row.matchId,
    minute: row.minute,
    type: row.type,
    playerId: row.playerId,
    teamId: row.teamId,
    data: row.data,
  };
}

export async function listMatches(): Promise<Match[]> {
  if (!sql) {
    throw new Error('Database connection not configured');
  }
  const rows = await sql`
    SELECT m.id,
           m.home_team_id AS "homeTeamId",
           m.away_team_id AS "awayTeamId",
           m.kickoff,
           m.lineup,
           COALESCE(
             (SELECT json_agg(e ORDER BY e.minute)
                FROM match_events e
                WHERE e.match_id = m.id),
             '[]'
           ) AS events
    FROM matches m
    ORDER BY m.kickoff DESC
  `;

  return rows.map((row: any) =>
    mapMatch(
      { ...row, lineup: row.lineup ? row.lineup : [] },
      (row.events || []).map((e: any) => mapEvent(e))
    )
  );
}

export async function createMatch(match: NewMatch): Promise<Match> {
  if (!sql) {
    throw new Error('Database connection not configured');
  }
  const [row] = await sql`
    INSERT INTO matches (home_team_id, away_team_id, kickoff, lineup)
    VALUES (
      ${match.homeTeamId},
      ${match.awayTeamId},
      ${match.kickoff},
      ${JSON.stringify(match.lineup)}
    )
    RETURNING id, home_team_id AS "homeTeamId", away_team_id AS "awayTeamId", kickoff, lineup
  `;
  return mapMatch({ ...row, lineup: row.lineup ? row.lineup : [] }, []);
}

export async function recordEvent(event: NewMatchEvent): Promise<MatchEvent> {
  if (!sql) {
    throw new Error('Database connection not configured');
  }
  const [row] = await sql`
    INSERT INTO match_events (match_id, minute, type, player_id, team_id, data)
    VALUES (
      ${event.matchId},
      ${event.minute},
      ${event.type},
      ${event.playerId ?? null},
      ${event.teamId ?? null},
      ${JSON.stringify(event.data ?? null)}
    )
    RETURNING id, match_id AS "matchId", minute, type, player_id AS "playerId", team_id AS "teamId", data
  `;
  return mapEvent(row);
}

export async function updateLineup(matchId: number, lineup: PlayerSlot[]): Promise<Match> {
  if (!sql) {
    throw new Error('Database connection not configured');
  }
  const [row] = await sql`
    UPDATE matches
    SET lineup = ${JSON.stringify(lineup)}
    WHERE id = ${matchId}
    RETURNING id, home_team_id AS "homeTeamId", away_team_id AS "awayTeamId", kickoff, lineup
  `;

  const events = await sql`
    SELECT id, match_id AS "matchId", minute, type, player_id AS "playerId", team_id AS "teamId", data
    FROM match_events
    WHERE match_id = ${matchId}
    ORDER BY minute
  `;

  return mapMatch({ ...row, lineup: row.lineup ? row.lineup : [] }, events.map((e: any) => mapEvent(e)));
}
