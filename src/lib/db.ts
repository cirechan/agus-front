import { Pool } from 'pg';

let pool: Pool | null = null;

function getConnectionString() {
  return (
    process.env['POSTGRES_URL'] ||
    process.env['DATABASE_URL'] ||
    process.env['POSTGRES_PRISMA_URL'] ||
    process.env['POSTGRES_URL_NON_POOLING'] ||
    process.env['NEON_DATABASE_URL'] ||
    ''
  );
}

export function hasDatabaseConnection() {
  return Boolean(getConnectionString());
}

function getPool(): Pool | null {
  if (pool) return pool;
  const connectionString = getConnectionString();
  if (!connectionString) return null;
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  });
  return pool;
}

const seedPlayers = async (equipoId: number) => {
  const db = getPool();
  if (!db) return;
  const jugadores = [
    ['Tiziano Oleiro Calamita', 'Portero'],
    ['Carlos Alfaro Mateo', 'Portero'],
    ['Diego Clavería Barrabés', 'Defensa'],
    ['Felipe Tapia Ruiz', 'Defensa'],
    ['Héctor Primo Miranda', 'Defensa'],
    ['Santiago Alexander Beltrán Hernández', 'Defensa'],
    ['Ricardo Romeo', 'Defensa'],
    ['Gabriel Lahuerta Muñoz', 'Defensa'],
    ['Lucas Domingo', 'Centrocampista'],
    ['Jorge Pinto', 'Centrocampista'],
    ['Pablo Moñux Abad', 'Centrocampista'],
    ['César Lázaro Esperón', 'Centrocampista'],
    ['Diego Bueno Ucedo', 'Centrocampista'],
    ['Manuel Lozano Pascual', 'Centrocampista'],
    ['Julio Povar Berdejo', 'Centrocampista'],
    ['Pedro Colás do Carmo', 'Delantero'],
    ['Roberto Oriol Lahuerta', 'Delantero'],
    ['Francisco Javier Frago López-Dupla', 'Delantero'],
    ['Diego Lorca Ferrer', 'Delantero'],
    ['Mateo Almau Vallés', 'Delantero'],
    ['Alejandro Puente Mauleón', 'Delantero'],
    ['David Albert Fañanás', 'Delantero'],
  ];
  for (let index = 0; index < jugadores.length; index += 1) {
    const [nombre, posicion] = jugadores[index];
    await db.query(
      'INSERT INTO jugadores (nombre, posicion, equipoId, logs, dorsal) VALUES ($1,$2,$3,$4,$5)',
      [nombre, posicion, equipoId, '{}', index + 1]
    );
  }
};

export const ready = (async () => {
  const db = getPool();
  if (!db) return;
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS equipos (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      categoria TEXT,
      temporadaId TEXT,
      color TEXT DEFAULT '#dc2626'
    )`);
    await db.query('ALTER TABLE equipos ADD COLUMN IF NOT EXISTS temporadaId TEXT');
    await db.query("ALTER TABLE equipos ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#dc2626'");
    await db.query(`CREATE TABLE IF NOT EXISTS rivales (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      color TEXT DEFAULT '#1d4ed8'
    )`);
    await db.query(
      "ALTER TABLE rivales ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#1d4ed8'"
    );
    await db.query(
      "ALTER TABLE rivales ALTER COLUMN color SET DEFAULT '#1d4ed8'"
    );
    await db.query(`CREATE TABLE IF NOT EXISTS jugadores (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      posicion TEXT,
      equipoId INTEGER REFERENCES equipos(id),
      logs TEXT,
      dorsal INTEGER
    )`);
    await db.query('ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS dorsal INTEGER');
    await db.query(`CREATE TABLE IF NOT EXISTS partidos (
      id SERIAL PRIMARY KEY,
      equipo_id INTEGER REFERENCES equipos(id) ON DELETE CASCADE,
      rival_id INTEGER REFERENCES rivales(id) ON DELETE SET NULL,
      condicion TEXT NOT NULL DEFAULT 'local',
      inicio TIMESTAMPTZ NOT NULL,
      competicion TEXT NOT NULL DEFAULT 'liga',
      jornada INTEGER,
      alineacion JSONB,
      notas_rival TEXT,
      finalizado BOOLEAN NOT NULL DEFAULT FALSE
    )`);
    await db.query(
      'ALTER TABLE partidos ADD COLUMN IF NOT EXISTS equipo_id INTEGER REFERENCES equipos(id) ON DELETE CASCADE'
    );
    await db.query(
      "ALTER TABLE partidos ADD COLUMN IF NOT EXISTS rival_id INTEGER REFERENCES rivales(id) ON DELETE SET NULL"
    );
    await db.query(
      "ALTER TABLE partidos ADD COLUMN IF NOT EXISTS condicion TEXT DEFAULT 'local'"
    );
    await db.query(
      "ALTER TABLE partidos ALTER COLUMN condicion SET DEFAULT 'local'"
    );
    await db.query(
      "ALTER TABLE partidos ADD COLUMN IF NOT EXISTS inicio TIMESTAMPTZ"
    );
    await db.query(
      "ALTER TABLE partidos ADD COLUMN IF NOT EXISTS competicion TEXT DEFAULT 'liga'"
    );
    await db.query(
      "ALTER TABLE partidos ALTER COLUMN competicion SET DEFAULT 'liga'"
    );
    await db.query(
      'ALTER TABLE partidos ADD COLUMN IF NOT EXISTS jornada INTEGER'
    );
    await db.query(
      'ALTER TABLE partidos ADD COLUMN IF NOT EXISTS alineacion JSONB'
    );
    await db.query(
      'ALTER TABLE partidos ADD COLUMN IF NOT EXISTS notas_rival TEXT'
    );
    await db.query(
      'ALTER TABLE partidos ADD COLUMN IF NOT EXISTS finalizado BOOLEAN DEFAULT FALSE'
    );
    await db.query(
      "ALTER TABLE partidos ALTER COLUMN finalizado SET DEFAULT FALSE"
    );
    await db.query(`CREATE TABLE IF NOT EXISTS asistencias (
      id SERIAL PRIMARY KEY,
      jugadorId INTEGER REFERENCES jugadores(id),
      equipoId INTEGER REFERENCES equipos(id),
      fecha TEXT,
      asistio INTEGER,
      motivo TEXT
    )`);
    await db.query(`CREATE TABLE IF NOT EXISTS entrenamientos (
      id SERIAL PRIMARY KEY,
      equipoId INTEGER REFERENCES equipos(id) ON DELETE CASCADE,
      inicio TIMESTAMPTZ NOT NULL,
      fin TIMESTAMPTZ
    )`);
    await db.query(
      'ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS entrenamientoId INTEGER REFERENCES entrenamientos(id) ON DELETE CASCADE'
    );
    await db.query(`CREATE TABLE IF NOT EXISTS valoraciones (
      id SERIAL PRIMARY KEY,
      jugadorId INTEGER REFERENCES jugadores(id),
      fecha TEXT,
      aptitudes TEXT,
      comentarios TEXT
    )`);
    await db.query(`CREATE TABLE IF NOT EXISTS scouting (
      id SERIAL PRIMARY KEY,
      data TEXT
    )`);
    await db.query(`CREATE TABLE IF NOT EXISTS eventos_partido (
      id SERIAL PRIMARY KEY,
      partido_id INTEGER NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
      minuto INTEGER NOT NULL DEFAULT 0,
      tipo TEXT NOT NULL,
      jugador_id INTEGER REFERENCES jugadores(id) ON DELETE SET NULL,
      equipo_id INTEGER REFERENCES equipos(id) ON DELETE SET NULL,
      rival_id INTEGER REFERENCES rivales(id) ON DELETE SET NULL,
      datos JSONB
    )`);
    await db.query(
      'ALTER TABLE eventos_partido ADD COLUMN IF NOT EXISTS partido_id INTEGER REFERENCES partidos(id) ON DELETE CASCADE'
    );
    await db.query(
      'ALTER TABLE eventos_partido ADD COLUMN IF NOT EXISTS minuto INTEGER DEFAULT 0'
    );
    await db.query(
      'ALTER TABLE eventos_partido ADD COLUMN IF NOT EXISTS tipo TEXT'
    );
    await db.query(
      'ALTER TABLE eventos_partido ADD COLUMN IF NOT EXISTS jugador_id INTEGER REFERENCES jugadores(id) ON DELETE SET NULL'
    );
    await db.query(
      'ALTER TABLE eventos_partido ADD COLUMN IF NOT EXISTS equipo_id INTEGER REFERENCES equipos(id) ON DELETE SET NULL'
    );
    await db.query(
      'ALTER TABLE eventos_partido ADD COLUMN IF NOT EXISTS rival_id INTEGER REFERENCES rivales(id) ON DELETE SET NULL'
    );
    await db.query(
      'ALTER TABLE eventos_partido ADD COLUMN IF NOT EXISTS datos JSONB'
    );
    await db.query(
      'ALTER TABLE eventos_partido ALTER COLUMN minuto SET DEFAULT 0'
    );
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'eventos_partido_tipo_check'
            AND conrelid = 'eventos_partido'::regclass
        ) THEN
          ALTER TABLE eventos_partido
          ADD CONSTRAINT eventos_partido_tipo_check
          CHECK (tipo IN ('gol','amarilla','roja','asistencia'));
        END IF;
      END;
      $$;
    `);
    await db.query(`CREATE TABLE IF NOT EXISTS sanciones (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
      reference TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('yellow','red')),
      completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMPTZ,
      UNIQUE(player_id, reference)
    )`);

    const eqRes = await db.query('SELECT COUNT(*)::int AS count FROM equipos');
    if (eqRes.rows[0].count === 0) {
      const insertRes = await db.query(
        'INSERT INTO equipos (nombre) VALUES ($1) RETURNING id',
        ['Equipo A']
      );
      await seedPlayers(insertRes.rows[0].id);
    } else {
      const jugRes = await db.query('SELECT COUNT(*)::int AS count FROM jugadores');
      if (jugRes.rows[0].count === 0) {
        const team = await db.query('SELECT id FROM equipos LIMIT 1');
        if (team.rows.length) {
          await seedPlayers(team.rows[0].id);
        }
      }
    }
  } catch (err) {
    console.error('DB init error', err);
  }
})();

export const run = async (sql: string, params: any[] = []) => {
  const db = getPool();
  if (!db) throw new Error('DATABASE_URL not configured');
  const result = await db.query(sql, params);
  return { id: result.rows[0]?.id, changes: result.rowCount };
};

export const get = async (sql: string, params: any[] = []) => {
  const db = getPool();
  if (!db) return undefined;
  const result = await db.query(sql, params);
  return result.rows[0];
};

export const all = async (sql: string, params: any[] = []) => {
  const db = getPool();
  if (!db) return [];
  const result = await db.query(sql, params);
  return result.rows;
};
