import { apiClient } from './client';

export const partidosService = {
  // Obtener todos los partidos
  getPartidos: async (params = {}) => {
    return await apiClient.get('/partidos', { params });
  },
  
  // Obtener un partido por ID
  getPartidoById: async (id) => {
    return await apiClient.get(`/partidos/${id}`);
  },
  
  // Crear un nuevo partido
  createPartido: async (data) => {
    return await apiClient.post('/partidos', data);
  },
  
  // Actualizar un partido existente
  updatePartido: async (id, data) => {
    return await apiClient.put(`/partidos/${id}`, data);
  },
  
  // Registrar resultado de un partido
  registrarResultado: async (id, resultado) => {
    return await apiClient.patch(`/partidos/${id}/resultado`, resultado);
  },
  
  // Eliminar un partido
  deletePartido: async (id) => {
    return await apiClient.delete(`/partidos/${id}`);
  },
  
  // Obtener estadísticas de partidos por equipo
  getEstadisticasPorEquipo: async (equipoId) => {
    return await apiClient.get(`/partidos/estadisticas/equipo/${equipoId}`);
  },
  
  // Obtener partidos por rango de fechas
  getPartidosPorFechas: async (fechaInicio, fechaFin) => {
    return await apiClient.get('/partidos', { 
      params: { fechaInicio, fechaFin }
    });
  },
  
  // Obtener partidos por equipo
  getPartidosPorEquipo: async (equipoId) => {
    return await apiClient.get('/partidos', { 
      params: { equipo: equipoId }
    });
  },
  
  // Obtener partidos jugados o pendientes
  getPartidosPorEstado: async (jugado) => {
    return await apiClient.get('/partidos', { 
      params: { jugado }
    });
  }
};
