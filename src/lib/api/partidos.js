import axios from 'axios';

// URL base de la API
const API_URL = 'https://agus-back.onrender.com/api';

// Servicios para partidos
export const partidosService = {
  // Obtener todos los partidos
  getPartidos: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/partidos`, { params });
      return response;
    } catch (error) {
      console.error('Error al obtener partidos:', error);
      throw error;
    }
  },
  
  // Obtener un partido por ID
  getPartidoById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/partidos/${id}`);
      return response;
    } catch (error) {
      console.error(`Error al obtener partido con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Crear un nuevo partido
  createPartido: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/partidos`, data);
      return response;
    } catch (error) {
      console.error('Error al crear partido:', error);
      throw error;
    }
  },
  
  // Actualizar un partido existente
  updatePartido: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/partidos/${id}`, data);
      return response;
    } catch (error) {
      console.error(`Error al actualizar partido con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Registrar resultado de un partido
  registrarResultado: async (id, resultado) => {
    try {
      const response = await axios.patch(`${API_URL}/partidos/${id}/resultado`, resultado);
      return response;
    } catch (error) {
      console.error(`Error al registrar resultado del partido con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Eliminar un partido
  deletePartido: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/partidos/${id}`);
      return response;
    } catch (error) {
      console.error(`Error al eliminar partido con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Obtener estadísticas de partidos por equipo
  getEstadisticasPorEquipo: async (equipoId) => {
    try {
      const response = await axios.get(`${API_URL}/partidos/estadisticas/equipo/${equipoId}`);
      return response;
    } catch (error) {
      console.error(`Error al obtener estadísticas del equipo ${equipoId}:`, error);
      throw error;
    }
  },
  
  // Obtener partidos por rango de fechas
  getPartidosPorFechas: async (fechaInicio, fechaFin) => {
    try {
      const response = await axios.get(`${API_URL}/partidos`, { 
        params: { fechaInicio, fechaFin }
      });
      return response;
    } catch (error) {
      console.error('Error al obtener partidos por fechas:', error);
      throw error;
    }
  },
  
  // Obtener partidos por equipo
  getPartidosPorEquipo: async (equipoId) => {
    try {
      const response = await axios.get(`${API_URL}/partidos`, { 
        params: { equipo: equipoId }
      });
      return response;
    } catch (error) {
      console.error(`Error al obtener partidos del equipo ${equipoId}:`, error);
      throw error;
    }
  },
  
  // Obtener partidos jugados o pendientes
  getPartidosPorEstado: async (jugado) => {
    try {
      const response = await axios.get(`${API_URL}/partidos`, { 
        params: { jugado }
      });
      return response;
    } catch (error) {
      console.error(`Error al obtener partidos por estado jugado=${jugado}:`, error);
      throw error;
    }
  }
};
