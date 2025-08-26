import { getTeams, getPlayers, getPlayerById, getAttendance } from '@/lib/data-service'

export const equiposService = {
  getAll: async () => getTeams(),
  getById: async (id) => (await getTeams()).find(e => e.id === id),
  getByTemporada: async (temporadaId) => (await getTeams()).filter(e => e.temporadaId === temporadaId)
}

export const jugadoresService = {
  getAll: async () => getPlayers(),
  getById: async (id) => getPlayerById(id),
  getByEquipo: async (equipoId) => getPlayers(equipoId)
}

export const asistenciasService = {
  getAll: async () => getAttendance(),
  getByEquipo: async (equipoId) => getAttendance({ equipoId }),
  getByJugador: async (jugadorId) => getAttendance({ jugadorId }),
  registrar: async (data) => data,
  update: async (id, data) => data
}

export const valoracionesService = {
  getAll: async () => [],
  getByJugador: async () => [],
  getByEquipo: async () => [],
  create: async (data) => data,
  update: async (id, data) => data
}

export const scoutingService = {
  getAll: async () => [],
  getById: async () => null,
  buscarPorNombre: async () => [],
  create: async (data) => data,
  update: async (id, data) => data
}

export const objetivosService = {
  getAll: async () => [],
  getByEquipo: async () => [],
  create: async (data) => data,
  update: async (id, data) => data,
  actualizarProgreso: async (id, progreso) => ({ id, progreso })
}

export const temporadasService = {
  getAll: async () => [],
  getActual: async () => null,
  create: async (data) => data
}
