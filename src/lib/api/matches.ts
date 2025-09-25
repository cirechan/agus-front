import { neon } from '@neondatabase/serverless';
import type {
  Match,
  MatchEvent,
  PlayerSlot,
  NewMatch,
  NewMatchEvent,
  MatchScore,
} from '@/types/match';

let scoreColumnAvailable: boolean | null = null;

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

function isMissingScoreColumn(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const code = (error as any).code;
  if (code === '42703') {
    return true;
  }
  const message = (error as any).message;
  if (typeof message === 'string' && message.includes('marcador')) {
    return true;
  }
  return false;
}

async function withOptionalScore<T>(
  runWithScore: () => Promise<T>,
  runWithoutScore: () => Promise<T>
): Promise<T> {
  if (scoreColumnAvailable === false) {
    return runWithoutScore();
  }
  try {
    const result = await runWithScore();
    scoreColumnAvailable = true;
    return result;
  } catch (error) {
    if (isMissingScoreColumn(error)) {
      scoreColumnAvailable = false;
      return runWithoutScore();
    }
    throw error;
  }
}

function normalizeScore(value: any): MatchScore | null {
  if (!value) return null;
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      return null;
    }
  }
  const team = Number(parsed.team);
  const rival = Number(parsed.rival);
  if (Number.isNaN(team) || Number.isNaN(rival)) {
    return null;
  }
  return { team, rival };
}

function mapMatch(row: any, events: MatchEvent[] = []): Match {
  return {
    id: row.id,
    teamId: row.teamId,
    rivalId: row.rivalId,
    isHome: row.condition === 'local',
    kickoff: row.kickoff,
    competition: row.competition,
    matchday: row.matchday,
    lineup: ((row.lineup ?? []) as any[]).map((s) => ({ minutes: 0, ...s })) as PlayerSlot[],
    events,
    opponentNotes: row.opponentNotes ?? null,
    finished: row.finished ?? false,
    score: normalizeScore(row.score),
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
    rivalId: row.rivalId,
    data: row.data,
  };
}

export async function listMatches(): Promise<Match[]> {
  const sql = getSql();
  const rows = await withOptionalScore(
    () =>
      sql`
        SELECT p.id,
               p.equipo_id AS "teamId",
               p.rival_id AS "rivalId",
               p.condicion AS condition,
               p.inicio AS kickoff,
               p.competicion AS competition,
               p.jornada AS "matchday",
               p.alineacion AS lineup,
               p.notas_rival AS "opponentNotes",
               p.finalizado AS finished,
               p.marcador AS score,
               COALESCE(
                 (SELECT json_agg(e ORDER BY e.minuto)
                    FROM eventos_partido e
                    WHERE e.partido_id = p.id),
                 '[]'
               ) AS events
        FROM partidos p
        ORDER BY p.inicio DESC
      `,
    () =>
      sql`
        SELECT p.id,
               p.equipo_id AS "teamId",
               p.rival_id AS "rivalId",
               p.condicion AS condition,
               p.inicio AS kickoff,
               p.competicion AS competition,
               p.jornada AS "matchday",
               p.alineacion AS lineup,
               p.notas_rival AS "opponentNotes",
               p.finalizado AS finished,
               NULL::json AS score,
               COALESCE(
                 (SELECT json_agg(e ORDER BY e.minuto)
                    FROM eventos_partido e
                    WHERE e.partido_id = p.id),
                 '[]'
               ) AS events
        FROM partidos p
        ORDER BY p.inicio DESC
      `
  );

  return rows.map((row: any) =>
    mapMatch(
      { ...row, lineup: row.lineup ? row.lineup : [] },
      (row.events || []).map((e: any) => mapEvent(e))
    )
  );
}

export async function getMatch(id: number): Promise<Match | null> {
  const sql = getSql();
  const rows = await withOptionalScore(
    () =>
      sql`
        SELECT p.id,
               p.equipo_id AS "teamId",
               p.rival_id AS "rivalId",
               p.condicion AS condition,
               p.inicio AS kickoff,
               p.competicion AS competition,
               p.jornada AS "matchday",
               p.alineacion AS lineup,
               p.notas_rival AS "opponentNotes",
               p.finalizado AS finished,
               p.marcador AS score
        FROM partidos p
        WHERE p.id = ${id}
      `,
    () =>
      sql`
        SELECT p.id,
               p.equipo_id AS "teamId",
               p.rival_id AS "rivalId",
               p.condicion AS condition,
               p.inicio AS kickoff,
               p.competicion AS competition,
               p.jornada AS "matchday",
               p.alineacion AS lineup,
               p.notas_rival AS "opponentNotes",
               p.finalizado AS finished,
               NULL::json AS score
        FROM partidos p
        WHERE p.id = ${id}
      `
  );
  const row = rows[0];
  if (!row) return null;

  const events = await sql`
    SELECT id,
           partido_id AS "matchId",
           minuto AS "minute",
           tipo AS "type",
           jugador_id AS "playerId",
           equipo_id AS "teamId",
           rival_id AS "rivalId",
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
  const [row] = await withOptionalScore(
    () =>
      sql`
        INSERT INTO partidos (equipo_id, rival_id, condicion, inicio, competicion, jornada, alineacion, notas_rival, marcador)
        VALUES (
          ${match.teamId},
          ${match.rivalId},
          ${match.isHome ? 'local' : 'visitante'},
          ${match.kickoff},
          ${match.competition},
          ${match.matchday ?? null},
          ${JSON.stringify(match.lineup)},
          ${match.opponentNotes ?? null},
          ${match.score ? JSON.stringify(match.score) : null}
        )
        RETURNING id,
                  equipo_id AS "teamId",
                  rival_id AS "rivalId",
                  condicion AS condition,
                  inicio AS kickoff,
                  competicion AS competition,
                  jornada AS "matchday",
                  alineacion AS lineup,
                  notas_rival AS "opponentNotes",
                  finalizado AS finished,
                  marcador AS score
      `,
    () =>
      sql`
        INSERT INTO partidos (equipo_id, rival_id, condicion, inicio, competicion, jornada, alineacion, notas_rival)
        VALUES (
          ${match.teamId},
          ${match.rivalId},
          ${match.isHome ? 'local' : 'visitante'},
          ${match.kickoff},
          ${match.competition},
          ${match.matchday ?? null},
          ${JSON.stringify(match.lineup)},
          ${match.opponentNotes ?? null}
        )
        RETURNING id,
                  equipo_id AS "teamId",
                  rival_id AS "rivalId",
                  condicion AS condition,
                  inicio AS kickoff,
                  competicion AS competition,
                  jornada AS "matchday",
                  alineacion AS lineup,
                  notas_rival AS "opponentNotes",
                  finalizado AS finished,
                  NULL::json AS score
      `
  );
  return mapMatch({ ...row, lineup: row.lineup ? row.lineup : [] }, []);
}

interface UpdateMatchInput {
  rivalId: number;
  isHome: boolean;
  kickoff: string;
  competition: 'liga' | 'playoff' | 'copa' | 'amistoso';
  matchday: number | null;
  lineup: PlayerSlot[];
}

export async function updateMatch(
  matchId: number,
  data: UpdateMatchInput
): Promise<Match> {
  const sql = getSql();
  const [row] = await withOptionalScore(
    () =>
      sql`
        UPDATE partidos
        SET rival_id = ${data.rivalId},
            condicion = ${data.isHome ? 'local' : 'visitante'},
            inicio = ${data.kickoff},
            competicion = ${data.competition},
            jornada = ${data.matchday ?? null},
            alineacion = ${JSON.stringify(data.lineup)}
        WHERE id = ${matchId}
        RETURNING id,
                  equipo_id AS "teamId",
                  rival_id AS "rivalId",
                  condicion AS condition,
                  inicio AS kickoff,
                  competicion AS competition,
                  jornada AS "matchday",
                  alineacion AS lineup,
                  notas_rival AS "opponentNotes",
                  finalizado AS finished,
                  marcador AS score
      `,
    () =>
      sql`
        UPDATE partidos
        SET rival_id = ${data.rivalId},
            condicion = ${data.isHome ? 'local' : 'visitante'},
            inicio = ${data.kickoff},
            competicion = ${data.competition},
            jornada = ${data.matchday ?? null},
            alineacion = ${JSON.stringify(data.lineup)}
        WHERE id = ${matchId}
        RETURNING id,
                  equipo_id AS "teamId",
                  rival_id AS "rivalId",
                  condicion AS condition,
                  inicio AS kickoff,
                  competicion AS competition,
                  jornada AS "matchday",
                  alineacion AS lineup,
                  notas_rival AS "opponentNotes",
                  finalizado AS finished,
                  NULL::json AS score
      `
  );

  const events = await sql`
    SELECT id,
           partido_id AS "matchId",
           minuto AS "minute",
           tipo AS "type",
           jugador_id AS "playerId",
           equipo_id AS "teamId",
           rival_id AS "rivalId",
           datos AS data
    FROM eventos_partido
    WHERE partido_id = ${matchId}
    ORDER BY minuto
  `;

  return mapMatch(
    { ...row, lineup: row.lineup ? row.lineup : [] },
    events.map((e: any) => mapEvent(e))
  );
}

export async function recordEvent(event: NewMatchEvent): Promise<MatchEvent> {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO eventos_partido (partido_id, minuto, tipo, jugador_id, equipo_id, rival_id, datos)
    VALUES (
      ${event.matchId},
      ${event.minute},
      ${event.type},
      ${event.playerId ?? null},
      ${event.teamId ?? null},
      ${event.rivalId ?? null},
      ${JSON.stringify(event.data ?? null)}
    )
    RETURNING id,
              partido_id AS "matchId",
              minuto AS "minute",
              tipo AS "type",
              jugador_id AS "playerId",
              equipo_id AS "teamId",
              rival_id AS "rivalId",
              datos AS data
  `;
  return mapEvent(row);
}

export async function removeEvent(id: number): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM eventos_partido WHERE id = ${id}`;
}

interface UpdateLineupInput {
  lineup: PlayerSlot[];
  opponentNotes?: string | null;
  finished?: boolean;
  score?: MatchScore | null;
}

export async function updateLineup(
  matchId: number,
  data: UpdateLineupInput
): Promise<Match> {
  const sql = getSql();
  const hasScoreUpdate = data.score !== undefined;
  const scoreValue =
    data.score === undefined
      ? null
      : data.score === null
      ? null
      : JSON.stringify(data.score);
  const [row] = await withOptionalScore(
    () =>
      sql`
        UPDATE partidos
        SET alineacion = ${JSON.stringify(data.lineup)},
            notas_rival = ${data.opponentNotes ?? null},
            finalizado = ${data.finished ?? false},
            marcador = CASE WHEN ${hasScoreUpdate} THEN ${scoreValue} ELSE marcador END
        WHERE id = ${matchId}
        RETURNING id,
                  equipo_id AS "teamId",
                  rival_id AS "rivalId",
                  condicion AS condition,
                  inicio AS kickoff,
                  competicion AS competition,
                  jornada AS "matchday",
                  alineacion AS lineup,
                  notas_rival AS "opponentNotes",
                  finalizado AS finished,
                  marcador AS score
      `,
    () =>
      sql`
        UPDATE partidos
        SET alineacion = ${JSON.stringify(data.lineup)},
            notas_rival = ${data.opponentNotes ?? null},
            finalizado = ${data.finished ?? false}
        WHERE id = ${matchId}
        RETURNING id,
                  equipo_id AS "teamId",
                  rival_id AS "rivalId",
                  condicion AS condition,
                  inicio AS kickoff,
                  competicion AS competition,
                  jornada AS "matchday",
                  alineacion AS lineup,
                  notas_rival AS "opponentNotes",
                  finalizado AS finished,
                  NULL::json AS score
      `
  );

  const events = await sql`
    SELECT id,
           partido_id AS "matchId",
           minuto AS "minute",
           tipo AS "type",
           jugador_id AS "playerId",
           equipo_id AS "teamId",
           rival_id AS "rivalId",
           datos AS data
    FROM eventos_partido
    WHERE partido_id = ${matchId}
    ORDER BY minuto
  `;

  return mapMatch(
    { ...row, lineup: row.lineup ? row.lineup : [] },
    events.map((e: any) => mapEvent(e))
  );
}
