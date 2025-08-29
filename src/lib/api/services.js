import { promises as fs } from 'fs';
import path from 'path';
import { all, get, run, ready } from '../db';

// Ensure database tables are created and seeded before any service call
await ready;

// During build the JSON lives under src/data, but Vercel's runtime is read-only.
// Write operations fall back to a temporary folder so server actions don't crash.
const projectDataDir = path.join(process.cwd(), 'src', 'data');
const runtimeDataDir = path.join('/tmp', 'data');

function camelize(row) {
  if (!row) return row;
  const res = { ...row };
  if (res.equipoid !== undefined) {
    res.equipoId = res.equipoid;
    delete res.equipoid;
  }
  if (res.jugadorid !== undefined) {
    res.jugadorId = res.jugadorid;
    delete res.jugadorid;
  }
  if (res.temporadaid !== undefined) {
    res.temporadaId = res.temporadaid;
    delete res.temporadaid;
  }
  return res;
}

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
    const rows = await all('SELECT * FROM equipos');
    return rows.map(camelize);
  },

  getById: async (id) => {
    const row = await get('SELECT * FROM equipos WHERE id = $1', [id]);
    return row ? camelize(row) : null;
  },

  getByTemporada: async (temporadaId) => {
    const rows = await all('SELECT * FROM equipos WHERE temporadaId = $1', [temporadaId]);
    return rows.map(camelize);
  },

  create: async (equipoData) => {
    const result = await run(
      'INSERT INTO equipos (nombre, categoria, temporadaId) VALUES ($1, $2, $3) RETURNING id',
      [equipoData.nombre, equipoData.categoria, equipoData.temporadaId]
    );
    return { id: result.id, ...equipoData };
  },

  update: async (id, equipoData) => {
    const existing = await equiposService.getById(id);
    if (!existing) return null;
    const updated = { ...existing, ...equipoData };
    await run(
      'UPDATE equipos SET nombre = $1, categoria = $2, temporadaId = $3 WHERE id = $4',
      [updated.nombre, updated.categoria, updated.temporadaId, id]
    );
    return updated;
  },

  delete: async (id) => {
    await run('DELETE FROM equipos WHERE id = $1', [id]);
    return true;
  }
};

// Servicios para jugadores
export const jugadoresService = {
  getAll: async () => {
    const rows = await all('SELECT * FROM jugadores');
    return rows.map((r) => {
      const row = camelize(r);
      return { ...row, logs: row.logs ? JSON.parse(row.logs) : {} };
    });
  },

  getById: async (id) => {
    const row = await get('SELECT * FROM jugadores WHERE id = $1', [id]);
    if (!row) return null;
    const mapped = camelize(row);
    return { ...mapped, logs: mapped.logs ? JSON.parse(mapped.logs) : {} };
  },

  getByEquipo: async (equipoId) => {
    const rows = await all(
      `SELECT j.*, 
        COALESCE((SELECT COUNT(*) FROM asistencias a WHERE a.jugadorId = j.id AND a.asistio = 1),0) AS asistencias_presentes,
        COALESCE((SELECT COUNT(*) FROM asistencias a WHERE a.jugadorId = j.id),0) AS asistencias_totales,
        COALESCE((
          SELECT AVG(((
            COALESCE((v.aptitudes::json->>'tecnica')::float,0) +
            COALESCE((v.aptitudes::json->>'tactica')::float,0) +
            COALESCE((v.aptitudes::json->>'fisica')::float,0) +
            COALESCE((v.aptitudes::json->>'mental')::float,0)
          ) / 4)) FROM valoraciones v WHERE v.jugadorId = j.id
        ),0) AS valoracion_media
      FROM jugadores j
      WHERE equipoId = $1`,
      [equipoId]
    );
    return rows.map((r) => {
      const row = camelize(r);
      const presentes = Number(r.asistencias_presentes || 0);
      const total = Number(r.asistencias_totales || 0);
      const porcentaje = total > 0 ? (presentes / total) * 100 : 0;
      return {
        ...row,
        logs: row.logs ? JSON.parse(row.logs) : {},
        asistenciasPresentes: presentes,
        asistenciasTotales: total,
        asistenciaPct: porcentaje,
        valoracionMedia: Number(r.valoracion_media || 0),
      };
    });
  },

  create: async (jugadorData) => {
    const result = await run(
      'INSERT INTO jugadores (nombre, posicion, equipoId, logs) VALUES ($1, $2, $3, $4) RETURNING id',
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
    await run(
      'UPDATE jugadores SET nombre = $1, posicion = $2, equipoId = $3, logs = $4 WHERE id = $5',
      [
        updated.nombre,
        updated.posicion,
        updated.equipoId,
        JSON.stringify(updated.logs || {}),
        id,
      ]
    );
    return updated;
  },

  delete: async (id) => {
    await run('DELETE FROM jugadores WHERE id = $1', [id]);
    return true;
  }
};

// Servicios para asistencias
export const asistenciasService = {
  getAll: async () => {
    const rows = await all('SELECT * FROM asistencias');
    return rows.map((r) => {
      const row = camelize(r);
      return { ...row, asistio: !!row.asistio };
    });
  },

  getByEquipo: async (equipoId) => {
    const rows = await all('SELECT * FROM asistencias WHERE equipoId = $1', [equipoId]);
    return rows.map((r) => {
      const row = camelize(r);
      return { ...row, asistio: !!row.asistio };
    });
  },

  getByJugador: async (jugadorId) => {
    const rows = await all('SELECT * FROM asistencias WHERE jugadorId = $1', [jugadorId]);
    return rows.map((r) => {
      const row = camelize(r);
      return { ...row, asistio: !!row.asistio };
    });
  },

  getByFecha: async (equipoId, fecha) => {
    const rows = await all('SELECT * FROM asistencias WHERE equipoId = $1 AND fecha = $2', [equipoId, fecha]);
    return rows.map((r) => {
      const row = camelize(r);
      return { ...row, asistio: !!row.asistio };
    });
  },

  setForFecha: async (equipoId, fecha, registros) => {
    await run('DELETE FROM asistencias WHERE equipoId = $1 AND fecha = $2', [equipoId, fecha]);
    const inserted = [];
    for (const r of registros) {
      const result = await run(
        'INSERT INTO asistencias (jugadorId, equipoId, fecha, asistio, motivo) VALUES ($1, $2, $3, $4, $5)',
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
    await run('DELETE FROM asistencias WHERE equipoId = $1 AND fecha = $2', [equipoId, fecha]);
    return true;
  },

  delete: async (id) => {
    await run('DELETE FROM asistencias WHERE id = $1', [id]);
    return true;
  },

  create: async (data) => {
    const result = await run(
      'INSERT INTO asistencias (jugadorId, equipoId, fecha, asistio, motivo) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [data.jugadorId, data.equipoId, data.fecha, data.asistio ? 1 : 0, data.motivo || null]
    );
    return { id: result.id, ...data };
  },

  update: async (id, data) => {
    const row = await get('SELECT * FROM asistencias WHERE id = $1', [id]);
    if (!row) return null;
    const existing = camelize(row);
    const updated = { ...existing, ...data };
    await run(
      'UPDATE asistencias SET jugadorId = $1, equipoId = $2, fecha = $3, asistio = $4, motivo = $5 WHERE id = $6',
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
    return rows.map((r) => {
      const row = camelize(r);
      return { ...row, aptitudes: row.aptitudes ? JSON.parse(row.aptitudes) : {} };
    });
  },

  getByJugador: async (jugadorId) => {
    const rows = await all('SELECT * FROM valoraciones WHERE jugadorId = $1', [jugadorId]);
    return rows.map((r) => {
      const row = camelize(r);
      return { ...row, aptitudes: row.aptitudes ? JSON.parse(row.aptitudes) : {} };
    });
  },

  create: async (data) => {
    const result = await run(
      'INSERT INTO valoraciones (jugadorId, fecha, aptitudes, comentarios) VALUES ($1, $2, $3, $4) RETURNING id',
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
    const row = await get('SELECT * FROM valoraciones WHERE id = $1', [id]);
    if (!row) return null;
    const existing = camelize(row);
    const updated = { ...existing, ...data };
    await run(
      'UPDATE valoraciones SET jugadorId = $1, fecha = $2, aptitudes = $3, comentarios = $4 WHERE id = $5',
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
    await run('DELETE FROM valoraciones WHERE id = $1', [id]);
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
    const row = await get('SELECT * FROM scouting WHERE id = $1', [id]);
    return row ? { id: row.id, ...JSON.parse(row.data) } : null;
  },

  create: async (data) => {
    const result = await run('INSERT INTO scouting (data) VALUES ($1) RETURNING id', [JSON.stringify(data)]);
    return { id: result.id, ...data };
  },

  update: async (id, data) => {
    await run('UPDATE scouting SET data = $1 WHERE id = $2', [JSON.stringify(data), id]);
    return { id, ...data };
  },

  delete: async (id) => {
    await run('DELETE FROM scouting WHERE id = $1', [id]);
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
