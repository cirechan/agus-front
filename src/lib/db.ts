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
  db.run(`CREATE TABLE IF NOT EXISTS scouting (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT
  )`);

  // Seed a default team and players if database is empty
  db.get('SELECT COUNT(*) as count FROM equipos', (err, row: any) => {
    if (!err && row.count === 0) {
      db.run('INSERT INTO equipos (nombre) VALUES (?)', ['Equipo A'], function (err) {
        if (err) return;
        const equipoId = this.lastID;
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
          db.run(
            'INSERT INTO jugadores (nombre, posicion, equipoId, logs) VALUES (?, ?, ?, ?)',
            [nombre, posicion, equipoId, '{}']
          );
        }
      });
    }
  });
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
