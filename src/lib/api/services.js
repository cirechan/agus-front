import { promises as fs } from 'fs';
import path from 'path';
import { all, get, run } from '../db';

// During build the JSON lives under src/data, but Vercel's runtime is read-only.
// Write operations fall back to a temporary folder so server actions don't crash.
const projectDataDir = path.join(process.cwd(), 'src', 'data');
const runtimeDataDir = path.join('/tmp', 'data');

async function readJson(file) {
  const candidates = [runtimeDataDir, projectDataDir];
  for (const dir of candidates) {
    try {
      const data = await fs.readFile(path.join(dir, file), 'utf8');
      return JSON.parse(data);
    } catch {
      // try next directory
    }
  }
  if (file === 'temporadas.json') {
    return { temporadaActiva: null, temporadas: [] };
  }
  return [];
}

async function writeJson(file, data) {
  try {
    await fs.mkdir(runtimeDataDir, { recursive: true });
    await fs.writeFile(path.join(runtimeDataDir, file), JSON.stringify(data, null, 2));
  } catch {
    await fs.mkdir(projectDataDir, { recursive: true });
    await fs.writeFile(path.join(projectDataDir, file), JSON.stringify(data, null, 2));
  }
}

// Servicios para equipos
export const equiposService = {
  getAll: async () => {
    return await all('SELECT * FROM equipos');
  },

  getById: async (id) => {
    return await get('SELECT * FROM equipos WHERE id = ?', [id]);
  },

  getByTemporada: async (temporadaId) => {
    return await all('SELECT * FROM equipos WHERE temporadaId = ?', [temporadaId]);
  },

  create: async (equipoData) => {
    const result = await run('INSERT INTO equipos (nombre, categoria, temporadaId) VALUES (?, ?, ?)', [
      equipoData.nombre,
      equipoData.categoria,
      equipoData.temporadaId,
    ]);
    return { id: result.id, ...equipoData };
  },

  update: async (id, equipoData) => {
    const existing = await equiposService.getById(id);
    if (!existing) return null;
    const updated = { ...existing, ...equipoData };
    await run('UPDATE equipos SET nombre = ?, categoria = ?, temporadaId = ? WHERE id = ?', [
      updated.nombre,
      updated.categoria,
      updated.temporadaId,
      id,
    ]);
    return updated;
  },

  delete: async (id) => {
    await run('DELETE FROM equipos WHERE id = ?', [id]);
    return true;
  }
};

// Servicios para jugadores
export const jugadoresService = {
  getAll: async () => {
    const rows = await all('SELECT * FROM jugadores');
    return rows.map((r) => ({ ...r, logs: r.logs ? JSON.parse(r.logs) : {} }));
  },

  getById: async (id) => {
    const row = await get('SELECT * FROM jugadores WHERE id = ?', [id]);
    return row ? { ...row, logs: row.logs ? JSON.parse(row.logs) : {} } : null;
    },

  getByEquipo: async (equipoId) => {
    const rows = await all('SELECT * FROM jugadores WHERE equipoId = ?', [equipoId]);
    return rows.map((r) => ({ ...r, logs: r.logs ? JSON.parse(r.logs) : {} }));
  },

  create: async (jugadorData) => {
    const result = await run(
      'INSERT INTO jugadores (nombre, posicion, equipoId, logs) VALUES (?, ?, ?, ?)',
      [
        jugadorData.nombre,
        jugadorData.posicion,
        jugadorData.equipoId,
        JSON.stringify(jugadorData.logs || {}),
      ]
    );
    return { id: result.id, ...jugadorData };
  },

  update: async (id, jugadorData) => {
    const existing = await jugadoresService.getById(id);
    if (!existing) return null;
    const updated = { ...existing, ...jugadorData };
    await run('UPDATE jugadores SET nombre = ?, posicion = ?, equipoId = ?, logs = ? WHERE id = ?', [
      updated.nombre,
      updated.posicion,
      updated.equipoId,
      JSON.stringify(updated.logs || {}),
      id,
    ]);
    return updated;
  },

  delete: async (id) => {
    await run('DELETE FROM jugadores WHERE id = ?', [id]);
    return true;
  }
};

// Servicios para asistencias
export const asistenciasService = {
  getAll: async () => {
    const rows = await all('SELECT * FROM asistencias');
    return rows.map((r) => ({ ...r, asistio: !!r.asistio }));
  },

  getByEquipo: async (equipoId) => {
    const rows = await all('SELECT * FROM asistencias WHERE equipoId = ?', [equipoId]);
    return rows.map((r) => ({ ...r, asistio: !!r.asistio }));
  },

  getByJugador: async (jugadorId) => {
    const rows = await all('SELECT * FROM asistencias WHERE jugadorId = ?', [jugadorId]);
    return rows.map((r) => ({ ...r, asistio: !!r.asistio }));
  },

  getByFecha: async (equipoId, fecha) => {
    const rows = await all('SELECT * FROM asistencias WHERE equipoId = ? AND fecha = ?', [equipoId, fecha]);
    return rows.map((r) => ({ ...r, asistio: !!r.asistio }));
  },

  setForFecha: async (equipoId, fecha, registros) => {
    await run('DELETE FROM asistencias WHERE equipoId = ? AND fecha = ?', [equipoId, fecha]);
    const inserted = [];
    for (const r of registros) {
      const result = await run(
        'INSERT INTO asistencias (jugadorId, equipoId, fecha, asistio, motivo) VALUES (?, ?, ?, ?, ?)',
        [r.jugadorId, equipoId, fecha, r.asistio ? 1 : 0, r.motivo || null]
      );
      inserted.push({
        id: result.id,
        jugadorId: r.jugadorId,
        equipoId,
        fecha,
        asistio: r.asistio,
        motivo: r.motivo,
      });
    }
    return inserted;
  },

  deleteByFecha: async (equipoId, fecha) => {
    await run('DELETE FROM asistencias WHERE equipoId = ? AND fecha = ?', [equipoId, fecha]);
    return true;
  },

  delete: async (id) => {
    await run('DELETE FROM asistencias WHERE id = ?', [id]);
    return true;
  },

  create: async (data) => {
    const result = await run(
      'INSERT INTO asistencias (jugadorId, equipoId, fecha, asistio, motivo) VALUES (?, ?, ?, ?, ?)',
      [data.jugadorId, data.equipoId, data.fecha, data.asistio ? 1 : 0, data.motivo || null]
    );
    return { id: result.id, ...data };
  },

  update: async (id, data) => {
    const row = await get('SELECT * FROM asistencias WHERE id = ?', [id]);
    if (!row) return null;
    const updated = { ...row, ...data };
    await run(
      'UPDATE asistencias SET jugadorId = ?, equipoId = ?, fecha = ?, asistio = ?, motivo = ? WHERE id = ?',
      [
        updated.jugadorId,
        updated.equipoId,
        updated.fecha,
        updated.asistio ? 1 : 0,
        updated.motivo,
        id,
      ]
    );
    return { ...updated, asistio: !!updated.asistio };
  }
};

// Servicios para valoraciones
export const valoracionesService = {
  getAll: async () => {
    const rows = await all('SELECT * FROM valoraciones');
    return rows.map((r) => ({ ...r, aptitudes: r.aptitudes ? JSON.parse(r.aptitudes) : {} }));
  },

  getByJugador: async (jugadorId) => {
    const rows = await all('SELECT * FROM valoraciones WHERE jugadorId = ?', [jugadorId]);
    return rows.map((r) => ({ ...r, aptitudes: r.aptitudes ? JSON.parse(r.aptitudes) : {} }));
  },

  create: async (data) => {
    const result = await run(
      'INSERT INTO valoraciones (jugadorId, fecha, aptitudes, comentarios) VALUES (?, ?, ?, ?)',
      [
        data.jugadorId,
        data.fecha,
        JSON.stringify(data.aptitudes || {}),
        data.comentarios || null,
      ]
    );
    return { id: result.id, ...data };
  },

  update: async (id, data) => {
    const row = await get('SELECT * FROM valoraciones WHERE id = ?', [id]);
    if (!row) return null;
    const updated = { ...row, ...data };
    await run(
      'UPDATE valoraciones SET jugadorId = ?, fecha = ?, aptitudes = ?, comentarios = ? WHERE id = ?',
      [
        updated.jugadorId,
        updated.fecha,
        JSON.stringify(updated.aptitudes || {}),
        updated.comentarios,
        id,
      ]
    );
    return { ...updated, aptitudes: updated.aptitudes ? JSON.parse(updated.aptitudes) : {} };
  },

  delete: async (id) => {
    await run('DELETE FROM valoraciones WHERE id = ?', [id]);
    return true;
  }
};

// Servicios para scouting
export const scoutingService = {
  getAll: async () => {
    const rows = await all('SELECT * FROM scouting');
    return rows.map((r) => ({ id: r.id, ...JSON.parse(r.data) }));
  },

  getById: async (id) => {
    const row = await get('SELECT * FROM scouting WHERE id = ?', [id]);
    return row ? { id: row.id, ...JSON.parse(row.data) } : null;
  },

  create: async (data) => {
    const result = await run('INSERT INTO scouting (data) VALUES (?)', [JSON.stringify(data)]);
    return { id: result.id, ...data };
  },

  update: async (id, data) => {
    await run('UPDATE scouting SET data = ? WHERE id = ?', [JSON.stringify(data), id]);
    return { id, ...data };
  },

  delete: async (id) => {
    await run('DELETE FROM scouting WHERE id = ?', [id]);
    return true;
  }
};

// Servicios para objetivos
export const objetivosService = {
  getAll: async () => {
    return await readJson('objetivos.json');
  },

  getByEquipo: async (equipoId) => {
    const objetivos = await objetivosService.getAll();
    return objetivos.filter((o) => o.equipoId === equipoId);
  },

  create: async (data) => {
    const objetivos = await objetivosService.getAll();
    const nuevo = { id: Date.now(), progreso: 0, ...data };
    objetivos.push(nuevo);
    await writeJson('objetivos.json', objetivos);
    return nuevo;
  },

  update: async (id, data) => {
    const objetivos = await objetivosService.getAll();
    const index = objetivos.findIndex((o) => o.id === id);
    if (index === -1) return null;
    objetivos[index] = { ...objetivos[index], ...data };
    await writeJson('objetivos.json', objetivos);
    return objetivos[index];
  },

  delete: async (id) => {
    const objetivos = await objetivosService.getAll();
    const filtrados = objetivos.filter((o) => o.id !== id);
    await writeJson('objetivos.json', filtrados);
    return true;
  }
};

// Servicios para horarios de entrenamiento
export const horariosService = {
  getAll: async () => {
    return await readJson('horarios.json');
  },

  getByEquipo: async (equipoId) => {
    const horarios = await horariosService.getAll();
    return horarios.filter((h) => h.equipoId === equipoId);
  },

  setForEquipo: async (equipoId, horarios) => {
    const todos = await horariosService.getAll();
    const restantes = todos.filter((h) => h.equipoId !== equipoId);
    const conIds = horarios.map((h) => ({
      id: h.id || Date.now() + Math.random(),
      equipoId,
      dia: h.dia,
      hora: h.hora,
      duracion: h.duracion,
    }));
    await writeJson('horarios.json', [...restantes, ...conIds]);
    return conIds;
  },

  delete: async (id) => {
    const horarios = await horariosService.getAll();
    const filtrados = horarios.filter((h) => h.id !== id);
    await writeJson('horarios.json', filtrados);
    return true;
  }
};

// Servicios para temporadas
export const temporadasService = {
  getAll: async () => {
    const data = await readJson('temporadas.json');
    return data.temporadas;
  },

  getActual: async () => {
    const data = await readJson('temporadas.json');
    return data.temporadas.find((t) => t.id === data.temporadaActiva);
  },

  setActual: async (id) => {
    const data = await readJson('temporadas.json');
    data.temporadaActiva = id;
    await writeJson('temporadas.json', data);
    return data.temporadas.find((t) => t.id === id);
  },

  create: async (temporada) => {
    const data = await readJson('temporadas.json');
    data.temporadas.push(temporada);
    await writeJson('temporadas.json', data);
    return temporada;
  }
};
