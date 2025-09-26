import { promises as fs } from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import type {
  Match,
  MatchEvent,
  PlayerSlot,
  NewMatch,
  NewMatchEvent,
} from '@/types/match';

type SqlClient = ReturnType<typeof neon>;

const projectDataDir = path.join(process.cwd(), 'src', 'data');
const runtimeDataDir = path.join('/tmp', 'data');
const MATCHES_FILE = 'matches.json';

function toNumber(value: any, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSql(): SqlClient | null {
  const connectionString =
    process.env['DATABASE_URL'] ||
    process.env['POSTGRES_URL'] ||
    process.env['POSTGRES_PRISMA_URL'] ||
    process.env['POSTGRES_URL_NON_POOLING'] ||
    process.env['NEON_DATABASE_URL'];
  if (!connectionString) {
    return null;
  }
  return neon(connectionString);
}

function sanitizeLineup(input: any): PlayerSlot[] {
  if (!Array.isArray(input)) return [];
  const lineup: PlayerSlot[] = [];
  input.forEach((raw: any) => {
    const playerId = toNullableNumber(raw?.playerId ?? raw?.player_id);
    if (playerId == null) return;
    const role =
      raw?.role === 'bench' || raw?.role === 'unavailable' ? raw.role : 'field';
    const number = toNullableNumber(raw?.number ?? raw?.dorsal) ?? undefined;
    const minutes = Math.max(0, toNumber(raw?.minutes, 0));
    const position =
      typeof raw?.position === 'string' && raw.position.length
        ? raw.position
        : undefined;
    lineup.push({
      playerId,
      number,
      role,
      position,
      minutes,
    });
  });
  return lineup;
}

function sanitizeEvent(raw: any): MatchEvent {
  const teamIdRaw = raw?.teamId ?? raw?.equipoId ?? raw?.equipo_id;
  const rivalIdRaw = raw?.rivalId ?? raw?.rival_id;
  const playerIdRaw = raw?.playerId ?? raw?.jugadorId ?? raw?.jugador_id;
  return {
    id: toNumber(raw?.id, 0),
    matchId: toNumber(raw?.matchId ?? raw?.match_id ?? raw?.partido_id, 0),
    minute: Math.max(0, Math.round(toNumber(raw?.minute ?? raw?.minuto, 0))),
    type: String(raw?.type ?? raw?.tipo ?? ''),
    playerId: toNullableNumber(playerIdRaw),
    teamId: toNullableNumber(teamIdRaw),
    rivalId: toNullableNumber(rivalIdRaw),
    data: raw?.data ?? null,
  };
}

function normalizeCompetition(value: any): Match['competition'] {
  switch (value) {
    case 'playoff':
    case 'copa':
    case 'amistoso':
      return value;
    default:
      return 'liga';
  }
}

function sanitizeMatch(raw: any): Match {
  const competition = normalizeCompetition(raw?.competition);
  const kickoff = raw?.kickoff ?? raw?.inicio ?? new Date().toISOString();
  const matchdayRaw = raw?.matchday ?? raw?.jornada ?? null;
  const matchdayNumber = Number(matchdayRaw);
  const matchday =
    matchdayRaw === null ||
    matchdayRaw === undefined ||
    matchdayRaw === '' ||
    !Number.isFinite(matchdayNumber)
      ? null
      : matchdayNumber;
  const isHomeRaw = raw?.isHome ?? raw?.is_home;
  const condition = raw?.condition ?? raw?.condicion;
  const isHome =
    typeof isHomeRaw === 'boolean'
      ? isHomeRaw
      : condition
      ? condition === 'local'
      : isHomeRaw === undefined || isHomeRaw === null
      ? false
      : String(isHomeRaw).toLowerCase() === 'true';
  return {
    id: toNumber(raw?.id, 0),
    teamId: toNumber(raw?.teamId ?? raw?.team_id ?? raw?.equipo_id, 0),
    rivalId: toNumber(raw?.rivalId ?? raw?.rival_id, 0),
    isHome,
    kickoff: String(kickoff),
    competition,
    matchday,
    lineup: sanitizeLineup(raw?.lineup ?? []),
    events: Array.isArray(raw?.events)
      ? raw.events.map((event: any) => sanitizeEvent(event))
      : [],
    opponentNotes: raw?.opponentNotes ?? raw?.notas_rival ?? null,
    finished: Boolean(raw?.finished ?? raw?.finalizado ?? false),
  };
}

function cloneEvent(event: MatchEvent): MatchEvent {
  return {
    ...event,
    data:
      event.data === null || event.data === undefined
        ? null
        : JSON.parse(JSON.stringify(event.data)),
  };
}

function cloneMatch(match: Match): Match {
  return {
    ...match,
    lineup: match.lineup.map((slot) => ({ ...slot })),
    events: match.events.map((event) => cloneEvent(event)),
    opponentNotes: match.opponentNotes ?? null,
  };
}

async function readMatchesStore(): Promise<Match[]> {
  const candidates = [runtimeDataDir, projectDataDir];
  for (const dir of candidates) {
    try {
      const payload = await fs.readFile(path.join(dir, MATCHES_FILE), 'utf8');
      const parsed = JSON.parse(payload);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => sanitizeMatch(item));
      }
    } catch {
      // try next location
    }
  }
  return [];
}

async function writeMatchesStore(matches: Match[]): Promise<void> {
  const serialized = matches.map((match) => sanitizeMatch(match));
  const content = JSON.stringify(serialized, null, 2);
  try {
    await fs.mkdir(runtimeDataDir, { recursive: true });
    await fs.writeFile(path.join(runtimeDataDir, MATCHES_FILE), content);
  } catch {
    await fs.mkdir(projectDataDir, { recursive: true });
    await fs.writeFile(path.join(projectDataDir, MATCHES_FILE), content);
  }
}

function getNextMatchId(matches: Match[]): number {
  return matches.reduce((max, match) => Math.max(max, match.id), 0) + 1;
}

function getNextEventId(matches: Match[]): number {
  return (
    matches.reduce((max, match) => {
      const localMax = match.events.reduce((acc, event) => Math.max(acc, event.id), 0);
      return Math.max(max, localMax);
    }, 0) + 1
  );
}

type MatchRow = {
  id: number;
  teamId: number;
  rivalId: number;
  condition: string;
  kickoff: string;
  competition: string;
  matchday: number | null;
  lineup: any[] | null;
  opponentNotes: string | null;
  finished: boolean | null;
  events?: any[] | null;
};

type EventRow = {
  id: number;
  matchId: number;
  minute: number;
  type: string;
  playerId: number | null;
  teamId: number | null;
  rivalId: number | null;
  data: any;
};

function mapMatch(row: MatchRow, events: MatchEvent[] = []): Match {
  return sanitizeMatch({
    id: row.id,
    teamId: row.teamId,
    rivalId: row.rivalId,
    isHome: row.condition === 'local',
    kickoff: row.kickoff,
    competition: normalizeCompetition(row.competition),
    matchday: row.matchday,
    lineup: row.lineup ?? [],
    events,
    opponentNotes: row.opponentNotes ?? null,
    finished: row.finished ?? false,
  });
}

function mapEvent(row: EventRow): MatchEvent {
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
  if (sql) {
    const rows = (await sql`
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
           COALESCE(
             (SELECT json_agg(e ORDER BY e.minuto)
                FROM eventos_partido e
                WHERE e.partido_id = p.id),
             '[]'
           ) AS events
    FROM partidos p
    ORDER BY p.inicio DESC
  `) as MatchRow[];

    return rows.map((row) =>
      mapMatch(
        { ...row, lineup: row.lineup ? row.lineup : [] },
        (row.events || []).map((e: any) => mapEvent(e as EventRow))
      )
    );
  }

  const matches = await readMatchesStore();
  return matches
    .slice()
    .sort(
      (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
    )
    .map((match) => cloneMatch(match));
}

export async function getMatch(id: number): Promise<Match | null> {
  const sql = getSql();
  if (sql) {
    const rows = (await sql`
    SELECT p.id,
           p.equipo_id AS "teamId",
           p.rival_id AS "rivalId",
           p.condicion AS condition,
           p.inicio AS kickoff,
           p.competicion AS competition,
           p.jornada AS "matchday",
           p.alineacion AS lineup,
           p.notas_rival AS "opponentNotes",
           p.finalizado AS finished
    FROM partidos p
    WHERE p.id = ${id}
  `) as MatchRow[];
    const row = rows[0];
    if (!row) return null;

    const events = (await sql`
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
  `) as EventRow[];
    return mapMatch(
      { ...row, lineup: row.lineup ? row.lineup : [] },
      events.map((e) => mapEvent(e))
    );
  }

  const matches = await readMatchesStore();
  const match = matches.find((item) => item.id === id);
  return match ? cloneMatch(match) : null;
}

export async function createMatch(match: NewMatch): Promise<Match> {
  const sql = getSql();
  if (sql) {
    const [row] = (await sql`
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
              finalizado AS finished
  `) as MatchRow[];
    return mapMatch({ ...row, lineup: row.lineup ? row.lineup : [] }, []);
  }

  const matches = await readMatchesStore();
  const id = getNextMatchId(matches);
  const newMatch = sanitizeMatch({
    ...match,
    id,
    events: match.events ?? [],
    finished: false,
  });
  matches.push(newMatch);
  await writeMatchesStore(matches);
  return cloneMatch(newMatch);
}

export async function recordEvent(event: NewMatchEvent): Promise<MatchEvent> {
  const sql = getSql();
  if (sql) {
    const [row] = (await sql`
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
  `) as EventRow[];
    return mapEvent(row);
  }

  const matches = await readMatchesStore();
  const index = matches.findIndex((match) => match.id === event.matchId);
  if (index === -1) {
    throw new Error(`Match ${event.matchId} not found`);
  }
  const id = getNextEventId(matches);
  const storedEvent = sanitizeEvent({
    ...event,
    id,
    matchId: event.matchId,
  });
  const updatedMatch: Match = {
    ...matches[index],
    events: [...matches[index].events, storedEvent].sort(
      (a, b) => a.minute - b.minute
    ),
  };
  matches[index] = updatedMatch;
  await writeMatchesStore(matches);
  return cloneEvent(storedEvent);
}

export async function removeEvent(id: number): Promise<void> {
  const sql = getSql();
  if (sql) {
    await sql`DELETE FROM eventos_partido WHERE id = ${id}`;
    return;
  }

  const matches = await readMatchesStore();
  let updated = false;
  const nextMatches = matches.map((match) => {
    const remaining = match.events.filter((event) => event.id !== id);
    if (remaining.length !== match.events.length) {
      updated = true;
      return { ...match, events: remaining };
    }
    return match;
  });
  if (updated) {
    await writeMatchesStore(nextMatches);
  }
}

export async function updateLineup(
  matchId: number,
  lineup: PlayerSlot[],
  opponentNotes: string | null = null,
  finished = false
): Promise<Match> {
  const sql = getSql();
  if (sql) {
    const [row] = (await sql`
    UPDATE partidos
    SET alineacion = ${JSON.stringify(lineup)},
        notas_rival = ${opponentNotes},
        finalizado = ${finished}
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
              finalizado AS finished
  `) as MatchRow[];

    const events = (await sql`
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
  `) as EventRow[];

    return mapMatch(
      { ...row, lineup: row.lineup ? row.lineup : [] },
      events.map((e) => mapEvent(e))
    );
  }

  const matches = await readMatchesStore();
  const index = matches.findIndex((match) => match.id === matchId);
  if (index === -1) {
    throw new Error(`Match ${matchId} not found`);
  }
  const updatedMatch: Match = sanitizeMatch({
    ...matches[index],
    lineup,
    opponentNotes,
    finished,
  });
  matches[index] = updatedMatch;
  await writeMatchesStore(matches);
  return cloneMatch(updatedMatch);
}
