import { promises as fs } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src', 'data');

async function readJson(file) {
  const filePath = path.join(dataDir, file);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    if (file === 'temporadas.json') {
      return { temporadaActiva: null, temporadas: [] };
    }
    return [];
  }
}

async function writeJson(file, data) {
  const filePath = path.join(dataDir, file);
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Servicios para equipos
export const equiposService = {
  getAll: async () => {
    return await readJson('equipos.json');
  },

  getById: async (id) => {
    const equipos = await equiposService.getAll();
    return equipos.find((e) => e.id === id);
  },

  getByTemporada: async (temporadaId) => {
    const equipos = await equiposService.getAll();
    return equipos.filter((e) => e.temporadaId === temporadaId);
  },

  create: async (equipoData) => {
    const equipos = await equiposService.getAll();
    const nuevo = { id: Date.now(), ...equipoData };
    equipos.push(nuevo);
    await writeJson('equipos.json', equipos);
    return nuevo;
  },

  update: async (id, equipoData) => {
    const equipos = await equiposService.getAll();
    const index = equipos.findIndex((e) => e.id === id);
    if (index === -1) return null;
    equipos[index] = { ...equipos[index], ...equipoData };
    await writeJson('equipos.json', equipos);
    return equipos[index];
  },

  delete: async (id) => {
    const equipos = await equiposService.getAll();
    const filtrados = equipos.filter((e) => e.id !== id);
    await writeJson('equipos.json', filtrados);
    return true;
  }
};

// Servicios para jugadores
export const jugadoresService = {
  getAll: async () => {
    return await readJson('jugadores.json');
  },

  getById: async (id) => {
    const jugadores = await jugadoresService.getAll();
    return jugadores.find((j) => j.id === id);
  },

  getByEquipo: async (equipoId) => {
    const jugadores = await jugadoresService.getAll();
    return jugadores.filter((j) => j.equipoId === equipoId);
  },

  create: async (jugadorData) => {
    const jugadores = await jugadoresService.getAll();
    const nuevo = { id: Date.now(), ...jugadorData };
    jugadores.push(nuevo);
    await writeJson('jugadores.json', jugadores);
    return nuevo;
  },

  update: async (id, jugadorData) => {
    const jugadores = await jugadoresService.getAll();
    const index = jugadores.findIndex((j) => j.id === id);
    if (index === -1) return null;
    jugadores[index] = { ...jugadores[index], ...jugadorData };
    await writeJson('jugadores.json', jugadores);
    return jugadores[index];
  },

  delete: async (id) => {
    const jugadores = await jugadoresService.getAll();
    const filtrados = jugadores.filter((j) => j.id !== id);
    await writeJson('jugadores.json', filtrados);
    return true;
  }
};

// Servicios para asistencias
export const asistenciasService = {
  getAll: async () => {
    return await readJson('asistencias.json');
  },

  getByEquipo: async (equipoId) => {
    const asistencias = await asistenciasService.getAll();
    return asistencias.filter((a) => a.equipoId === equipoId);
  },

  getByJugador: async (jugadorId) => {
    const asistencias = await asistenciasService.getAll();
    return asistencias.filter((a) => a.jugadorId === jugadorId);
  },

  create: async (data) => {
    const asistencias = await asistenciasService.getAll();
    const nuevo = { id: Date.now(), ...data };
    asistencias.push(nuevo);
    await writeJson('asistencias.json', asistencias);
    return nuevo;
  },

  update: async (id, data) => {
    const asistencias = await asistenciasService.getAll();
    const index = asistencias.findIndex((a) => a.id === id);
    if (index === -1) return null;
    asistencias[index] = { ...asistencias[index], ...data };
    await writeJson('asistencias.json', asistencias);
    return asistencias[index];
  },

  delete: async (id) => {
    const asistencias = await asistenciasService.getAll();
    const filtradas = asistencias.filter((a) => a.id !== id);
    await writeJson('asistencias.json', filtradas);
    return true;
  }
};

// Servicios para valoraciones
export const valoracionesService = {
  getAll: async () => {
    return await readJson('valoraciones.json');
  },

  getByJugador: async (jugadorId) => {
    const valoraciones = await valoracionesService.getAll();
    return valoraciones.filter((v) => v.jugadorId === jugadorId);
  },

  create: async (data) => {
    const valoraciones = await valoracionesService.getAll();
    const nuevo = { id: Date.now(), ...data };
    valoraciones.push(nuevo);
    await writeJson('valoraciones.json', valoraciones);
    return nuevo;
  },

  update: async (id, data) => {
    const valoraciones = await valoracionesService.getAll();
    const index = valoraciones.findIndex((v) => v.id === id);
    if (index === -1) return null;
    valoraciones[index] = { ...valoraciones[index], ...data };
    await writeJson('valoraciones.json', valoraciones);
    return valoraciones[index];
  },

  delete: async (id) => {
    const valoraciones = await valoracionesService.getAll();
    const filtradas = valoraciones.filter((v) => v.id !== id);
    await writeJson('valoraciones.json', filtradas);
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
