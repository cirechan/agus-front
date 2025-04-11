import { apiClient } from '../client';
import { Partido, PartidoFormData, ResultadoFormData } from '@/types/horarios';

export const horariosService = {
  // Obtener todos los partidos
  getPartidos: async (params = {}) => {
    return await apiClient.get('/partidos', { params });
  },
  
  // Obtener un partido por ID
  getPartidoById: async (id: string) => {
    return await apiClient.get(`/partidos/${id}`);
  },
  
  // Crear un nuevo partido
  createPartido: async (data: PartidoFormData) => {
    return await apiClient.post('/partidos', data);
  },
  
  // Actualizar un partido existente
  updatePartido: async (id: string, data: PartidoFormData) => {
    return await apiClient.put(`/partidos/${id}`, data);
  },
  
  // Registrar resultado de un partido
  registrarResultado: async (id: string, resultado: ResultadoFormData) => {
    return await apiClient.patch(`/partidos/${id}/resultado`, resultado);
  },
  
  // Eliminar un partido
  deletePartido: async (id: string) => {
    return await apiClient.delete(`/partidos/${id}`);
  }
};
