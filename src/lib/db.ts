import { Pool } from 'pg';

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  '';

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined,
});

const seedPlayers = async (equipoId: number) => {
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
    await pool.query(
      'INSERT INTO jugadores (nombre, posicion, equipoId, logs) VALUES ($1,$2,$3,$4)',
      [nombre, posicion, equipoId, '{}']
    );
  }
};

export const ready = (async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS equipos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    categoria TEXT,
    temporadaId TEXT
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS jugadores (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    posicion TEXT,
    equipoId INTEGER REFERENCES equipos(id),
    logs TEXT
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS asistencias (
    id SERIAL PRIMARY KEY,
    jugadorId INTEGER REFERENCES jugadores(id),
    equipoId INTEGER REFERENCES equipos(id),
    fecha TEXT,
    asistio INTEGER,
    motivo TEXT
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS valoraciones (
    id SERIAL PRIMARY KEY,
    jugadorId INTEGER REFERENCES jugadores(id),
    fecha TEXT,
    aptitudes TEXT,
    comentarios TEXT
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS scouting (
    id SERIAL PRIMARY KEY,
    data TEXT
  )`);

  const eqRes = await pool.query('SELECT COUNT(*)::int AS count FROM equipos');
  if (eqRes.rows[0].count === 0) {
    const insertRes = await pool.query(
      'INSERT INTO equipos (nombre) VALUES ($1) RETURNING id',
      ['Equipo A']
    );
    await seedPlayers(insertRes.rows[0].id);
  } else {
    const jugRes = await pool.query('SELECT COUNT(*)::int AS count FROM jugadores');
    if (jugRes.rows[0].count === 0) {
      const team = await pool.query('SELECT id FROM equipos LIMIT 1');
      if (team.rows.length) {
        await seedPlayers(team.rows[0].id);
      }
    }
  }
})();

export const run = async (sql: string, params: any[] = []) => {
  const result = await pool.query(sql, params);
  return { id: result.rows[0]?.id, changes: result.rowCount };
};

export const get = async (sql: string, params: any[] = []) => {
  const result = await pool.query(sql, params);
  return result.rows[0];
};

export const all = async (sql: string, params: any[] = []) => {
  const result = await pool.query(sql, params);
  return result.rows;
};
