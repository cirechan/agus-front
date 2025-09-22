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
  for (const [nombre, posicion] of jugadores) {
    await db.query(
      'INSERT INTO jugadores (nombre, posicion, equipoId, logs) VALUES ($1,$2,$3,$4)',
      [nombre, posicion, equipoId, '{}']
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
    await db.query(`CREATE TABLE IF NOT EXISTS jugadores (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      posicion TEXT,
      equipoId INTEGER REFERENCES equipos(id),
      logs TEXT
    )`);
    await db.query(`CREATE TABLE IF NOT EXISTS asistencias (
      id SERIAL PRIMARY KEY,
      jugadorId INTEGER REFERENCES jugadores(id),
      equipoId INTEGER REFERENCES equipos(id),
      fecha TEXT,
      asistio INTEGER,
      motivo TEXT
    )`);
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
