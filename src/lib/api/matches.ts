import { neon } from '@neondatabase/serverless';
import type {
  Match,
  MatchEvent,
  PlayerSlot,
  NewMatch,
  NewMatchEvent,
} from '@/types/match';

function getSql() {
  const connectionString =
    process.env['DATABASE_URL'] ||
    process.env['POSTGRES_URL'] ||
    process.env['POSTGRES_PRISMA_URL'] ||
    process.env['POSTGRES_URL_NON_POOLING'] ||
    process.env['NEON_DATABASE_URL'];
  if (!connectionString) {
    throw new Error('Database connection not configured');
  }
  return neon(connectionString);
}

function mapMatch(row: any, events: MatchEvent[] = []): Match {
  return {
    id: row.id,
    homeTeamId: row.homeTeamId,
    awayTeamId: row.awayTeamId,
    kickoff: row.kickoff,
    competition: row.competition,
    matchday: row.matchday,
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
  const sql = getSql();
  const rows = await sql`
    SELECT p.id,
           p.equipo_local_id AS "homeTeamId",
           p.equipo_visitante_id AS "awayTeamId",
           p.inicio AS kickoff,
           p.competicion AS competition,
           p.jornada AS "matchday",
           p.alineacion AS lineup,
           COALESCE(
             (SELECT json_agg(e ORDER BY e.minuto)
                FROM eventos_partido e
                WHERE e.partido_id = p.id),
             '[]'
           ) AS events
    FROM partidos p
    ORDER BY p.inicio DESC
  `;

  return rows.map((row: any) =>
    mapMatch(
      { ...row, lineup: row.lineup ? row.lineup : [] },
      (row.events || []).map((e: any) => mapEvent(e))
    )
  );
}

export async function getMatch(id: number): Promise<Match | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT p.id,
           p.equipo_local_id AS "homeTeamId",
           p.equipo_visitante_id AS "awayTeamId",
           p.inicio AS kickoff,
           p.competicion AS competition,
           p.jornada AS "matchday",
           p.alineacion AS lineup
    FROM partidos p
    WHERE p.id = ${id}
  `;
  const row = rows[0];
  if (!row) return null;

  const events = await sql`
    SELECT id,
           partido_id AS "matchId",
           minuto AS "minute",
           tipo AS "type",
           jugador_id AS "playerId",
           equipo_id AS "teamId",
           datos AS data
    FROM eventos_partido
    WHERE partido_id = ${id}
    ORDER BY minuto
  `;
  return mapMatch(
    { ...row, lineup: row.lineup ? row.lineup : [] },
    events.map((e: any) => mapEvent(e))
  );
}

export async function createMatch(match: NewMatch): Promise<Match> {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO partidos (equipo_local_id, equipo_visitante_id, inicio, competicion, jornada, alineacion)
    VALUES (
      ${match.homeTeamId},
      ${match.awayTeamId},
      ${match.kickoff},
      ${match.competition},
      ${match.matchday ?? null},
      ${JSON.stringify(match.lineup)}
    )
    RETURNING id,
              equipo_local_id AS "homeTeamId",
              equipo_visitante_id AS "awayTeamId",
              inicio AS kickoff,
              competicion AS competition,
              jornada AS "matchday",
              alineacion AS lineup
  `;
  return mapMatch({ ...row, lineup: row.lineup ? row.lineup : [] }, []);
}

export async function recordEvent(event: NewMatchEvent): Promise<MatchEvent> {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO eventos_partido (partido_id, minuto, tipo, jugador_id, equipo_id, datos)
    VALUES (
      ${event.matchId},
      ${event.minute},
      ${event.type},
      ${event.playerId ?? null},
      ${event.teamId ?? null},
      ${JSON.stringify(event.data ?? null)}
    )
    RETURNING id,
              partido_id AS "matchId",
              minuto AS "minute",
              tipo AS "type",
              jugador_id AS "playerId",
              equipo_id AS "teamId",
              datos AS data
  `;
  return mapEvent(row);
}

export async function updateLineup(matchId: number, lineup: PlayerSlot[]): Promise<Match> {
  const sql = getSql();
  const [row] = await sql`
    UPDATE partidos
    SET alineacion = ${JSON.stringify(lineup)}
    WHERE id = ${matchId}
    RETURNING id,
              equipo_local_id AS "homeTeamId",
              equipo_visitante_id AS "awayTeamId",
              inicio AS kickoff,
              competicion AS competition,
              jornada AS "matchday",
              alineacion AS lineup
  `;

  const events = await sql`
    SELECT id,
           partido_id AS "matchId",
           minuto AS "minute",
           tipo AS "type",
           jugador_id AS "playerId",
           equipo_id AS "teamId",
           datos AS data
    FROM eventos_partido
    WHERE partido_id = ${matchId}
    ORDER BY minuto
  `;

  return mapMatch({ ...row, lineup: row.lineup ? row.lineup : [] }, events.map((e: any) => mapEvent(e)));
}
