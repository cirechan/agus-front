import { getMatches } from '@/lib/data-service'

export const partidosService = {
  getPartidos: async (params = {}) => getMatches(),
  getPartidoById: async (id) => (await getMatches()).find(p => p.id === id) || null,
  createPartido: async (data) => data,
  updatePartido: async (id, data) => data,
  registrarResultado: async (id, resultado) => ({ id, ...resultado }),
  deletePartido: async (id) => ({ id }),
  getEstadisticasPorEquipo: async (equipoId) => [],
  getPartidosPorFechas: async (fechaInicio, fechaFin) => (await getMatches()).filter(p => {
    const fecha = new Date(p.fecha)
    return fecha >= fechaInicio && fecha <= fechaFin
  }),
  getPartidosPorEquipo: async (equipoId) => (await getMatches()).filter(p => p.equipo === equipoId),
  getPartidosPorEstado: async (jugado) => (await getMatches()).filter(p => p.jugado === jugado)
}
