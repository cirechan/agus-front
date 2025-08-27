import sqlite3 from 'sqlite3';
import path from 'path';

sqlite3.verbose();

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data.sqlite');
export const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS equipos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT,
    temporadaId TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS jugadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    posicion TEXT,
    equipoId INTEGER,
    logs TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS asistencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jugadorId INTEGER,
    equipoId INTEGER,
    fecha TEXT,
    asistio INTEGER,
    motivo TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS valoraciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jugadorId INTEGER,
    fecha TEXT,
    aptitudes TEXT,
    comentarios TEXT
  )`);
});

export const run = (sql: string, params: any[] = []): Promise<{ id: number; changes: number }> =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });

export const get = (sql: string, params: any[] = []): Promise<any> =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

export const all = (sql: string, params: any[] = []): Promise<any[]> =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
