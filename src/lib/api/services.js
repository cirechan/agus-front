import axios from 'axios';

// URL base de la API
const API_URL = 'https://agus-back.onrender.com/api';

// Configuración por defecto para axios
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Servicios para equipos
export const equiposService = {
  // Obtener todos los equipos
  getAll: async () => {
    try {
      const response = await axios.get(`${API_URL}/equipos`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      throw error;
    }
  },

  // Obtener un equipo por ID
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/equipos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener equipo con ID ${id}:`, error);
      throw error;
    }
  },

  // Obtener equipos por temporada
  getByTemporada: async (temporadaId) => {
    try {
      const response = await axios.get(`${API_URL}/equipos/temporada/${temporadaId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener equipos de la temporada ${temporadaId}:`, error);
      throw error;
    }
  },

  // Crear un nuevo equipo
  create: async (equipoData) => {
    try {
      const response = await axios.post(`${API_URL}/equipos`, equipoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear equipo:', error);
      throw error;
    }
  },

  // Actualizar un equipo existente
  update: async (id, equipoData) => {
    try {
      const response = await axios.put(`${API_URL}/equipos/${id}`, equipoData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar equipo con ID ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un equipo
  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/equipos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar equipo con ID ${id}:`, error);
      throw error;
    }
  }
};

// Servicios para jugadores
export const jugadoresService = {
  // Obtener todos los jugadores
  getAll: async () => {
    try {
      const response = await axios.get(`${API_URL}/jugadores`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener jugadores:', error);
      throw error;
    }
  },

  // Obtener un jugador por ID
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/jugadores/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener jugador con ID ${id}:`, error);
      throw error;
    }
  },

  // Obtener jugadores por equipo
  getByEquipo: async (equipoId) => {
    try {
      const response = await axios.get(`${API_URL}/jugadores/equipo/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener jugadores del equipo ${equipoId}:`, error);
      throw error;
    }
  },

  // Crear un nuevo jugador
  create: async (jugadorData) => {
    try {
      const response = await axios.post(`${API_URL}/jugadores`, jugadorData);
      return response.data;
    } catch (error) {
      console.error('Error al crear jugador:', error);
      throw error;
    }
  },

  // Actualizar un jugador existente
  update: async (id, jugadorData) => {
    try {
      const response = await axios.put(`${API_URL}/jugadores/${id}`, jugadorData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar jugador con ID ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un jugador
  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/jugadores/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar jugador con ID ${id}:`, error);
      throw error;
    }
  }
};

// Servicios para asistencias
export const asistenciasService = {
  // Obtener todas las asistencias
  getAll: async () => {
    try {
      const response = await axios.get(`${API_URL}/asistencias`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener asistencias:', error);
      throw error;
    }
  },

  // Obtener asistencias por equipo
  getByEquipo: async (equipoId) => {
    try {
      const response = await axios.get(`${API_URL}/asistencias/equipo/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener asistencias del equipo ${equipoId}:`, error);
      throw error;
    }
  },

  // Obtener asistencias por jugador
  getByJugador: async (jugadorId) => {
    try {
      const response = await axios.get(`${API_URL}/asistencias/jugador/${jugadorId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener asistencias del jugador ${jugadorId}:`, error);
      throw error;
    }
  },

  // Registrar asistencias para un entrenamiento
  registrar: async (asistenciasData) => {
    try {
      const response = await axios.post(`${API_URL}/asistencias`, asistenciasData);
      return response.data;
    } catch (error) {
      console.error('Error al registrar asistencias:', error);
      throw error;
    }
  },

  // Actualizar asistencia
  update: async (id, asistenciaData) => {
    try {
      const response = await axios.put(`${API_URL}/asistencias/${id}`, asistenciaData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar asistencia con ID ${id}:`, error);
      throw error;
    }
  }
};

// Servicios para valoraciones
export const valoracionesService = {
  // Obtener todas las valoraciones
  getAll: async () => {
    try {
      const response = await axios.get(`${API_URL}/valoraciones`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener valoraciones:', error);
      throw error;
    }
  },

  // Obtener valoraciones por jugador
  getByJugador: async (jugadorId) => {
    try {
      const response = await axios.get(`${API_URL}/valoraciones/jugador/${jugadorId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener valoraciones del jugador ${jugadorId}:`, error);
      throw error;
    }
  },

  // Obtener valoraciones por equipo
  getByEquipo: async (equipoId) => {
    try {
      const response = await axios.get(`${API_URL}/valoraciones/equipo/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener valoraciones del equipo ${equipoId}:`, error);
      throw error;
    }
  },

  // Crear una nueva valoración
  create: async (valoracionData) => {
    try {
      const response = await axios.post(`${API_URL}/valoraciones`, valoracionData);
      return response.data;
    } catch (error) {
      console.error('Error al crear valoración:', error);
      throw error;
    }
  },

  // Actualizar una valoración existente
  update: async (id, valoracionData) => {
    try {
      const response = await axios.put(`${API_URL}/valoraciones/${id}`, valoracionData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar valoración con ID ${id}:`, error);
      throw error;
    }
  }
};

// Servicios para scouting
export const scoutingService = {
  // Obtener todos los registros de scouting
  getAll: async () => {
    try {
      const response = await axios.get(`${API_URL}/scouting`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener registros de scouting:', error);
      throw error;
    }
  },

  // Obtener un registro de scouting por ID
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/scouting/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener registro de scouting con ID ${id}:`, error);
      throw error;
    }
  },

  // Buscar jugadores scouteados por nombre
  buscarPorNombre: async (nombre) => {
    try {
      const response = await axios.get(`${API_URL}/scouting/buscar?nombre=${nombre}`);
      return response.data;
    } catch (error) {
      console.error(`Error al buscar jugadores scouteados con nombre ${nombre}:`, error);
      throw error;
    }
  },

  // Crear un nuevo registro de scouting
  create: async (scoutingData) => {
    try {
      const response = await axios.post(`${API_URL}/scouting`, scoutingData);
      return response.data;
    } catch (error) {
      console.error('Error al crear registro de scouting:', error);
      throw error;
    }
  },

  // Actualizar un registro de scouting existente
  update: async (id, scoutingData) => {
    try {
      const response = await axios.put(`${API_URL}/scouting/${id}`, scoutingData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar registro de scouting con ID ${id}:`, error);
      throw error;
    }
  }
};

// Servicios para objetivos
export const objetivosService = {
  // Obtener todos los objetivos
  getAll: async () => {
    try {
      const response = await axios.get(`${API_URL}/objetivos`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener objetivos:', error);
      throw error;
    }
  },

  // Obtener objetivos por equipo
  getByEquipo: async (equipoId) => {
    try {
      const response = await axios.get(`${API_URL}/objetivos/equipo/${equipoId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener objetivos del equipo ${equipoId}:`, error);
      throw error;
    }
  },

  // Crear un nuevo objetivo
  create: async (objetivoData) => {
    try {
      const response = await axios.post(`${API_URL}/objetivos`, objetivoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear objetivo:', error);
      throw error;
    }
  },

  // Actualizar un objetivo existente
  update: async (id, objetivoData) => {
    try {
      const response = await axios.put(`${API_URL}/objetivos/${id}`, objetivoData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar objetivo con ID ${id}:`, error);
      throw error;
    }
  },

  // Actualizar el progreso de un objetivo
  actualizarProgreso: async (id, progreso) => {
    try {
      const response = await axios.patch(`${API_URL}/objetivos/${id}/progreso`, { progreso });
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar progreso del objetivo con ID ${id}:`, error);
      throw error;
    }
  }
};

// Servicios para temporadas
export const temporadasService = {
  // Obtener todas las temporadas
  getAll: async () => {
    try {
      const response = await axios.get(`${API_URL}/temporadas`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener temporadas:', error);
      throw error;
    }
  },

  // Obtener temporada actual
  getActual: async () => {
    try {
      const response = await axios.get(`${API_URL}/temporadas/actual`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener temporada actual:', error);
      throw error;
    }
  },

  // Crear una nueva temporada
  create: async (temporadaData) => {
    try {
      const response = await axios.post(`${API_URL}/temporadas`, temporadaData);
      return response.data;
    } catch (error) {
      console.error('Error al crear temporada:', error);
      throw error;
    }
  }
};

// Servicio para verificar el estado de la API
export const apiService = {
  checkStatus: async () => {
    try {
      const response = await axios.get(`${API_URL}/status`);
      return response.data;
    } catch (error) {
      console.error('Error al verificar estado de la API:', error);
      throw error;
    }
  }
};

// Exportar todos los servicios
export default {
  equipos: equiposService,
  jugadores: jugadoresService,
  asistencias: asistenciasService,
  valoraciones: valoracionesService,
  scouting: scoutingService,
  objetivos: objetivosService,
  temporadas: temporadasService,
  api: apiService
};
