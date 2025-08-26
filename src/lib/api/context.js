"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

// URL base de la API
const API_URL = 'https://agus-back.onrender.com/api'

// Crear el contexto
export const ApiContext = createContext(null)

// Hook personalizado para usar el contexto
export const useApi = () => {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error('useApi debe ser usado dentro de un ApiProvider')
  }
  return context
}

// Proveedor del contexto
export function ApiProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [apiStatus, setApiStatus] = useState({ status: 'unknown', message: 'Verificando conexión...' })

  // Verificar el estado de la API al cargar
  useEffect(() => {
    checkApiStatus()
  }, [])

  // Función para verificar el estado de la API
  const checkApiStatus = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`${API_URL}/status`)
      setApiStatus({
        status: response.data.status,
        message: response.data.message,
        environment: response.data.environment,
        timestamp: response.data.timestamp
      })
      setError(null)
    } catch (err) {
      setApiStatus({
        status: 'offline',
        message: 'No se pudo conectar con la API'
      })
      setError('Error al conectar con la API')
      console.error('Error al verificar estado de la API:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Función genérica para realizar peticiones a la API
  const apiRequest = async (method, endpoint, data = null) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const config = {
        method,
        url: `${API_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json'
        }
      }
      
      if (data && (method === 'post' || method === 'put' || method === 'patch')) {
        config.data = data
      }
      
      const response = await axios(config)
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.mensaje || err.message || 'Error desconocido'
      setError(errorMessage)
      console.error(`Error en petición ${method.toUpperCase()} a ${endpoint}:`, err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Servicios para equipos
  const equiposService = {
    getAll: () => apiRequest('get', '/equipos'),
    getById: (id) => apiRequest('get', `/equipos/${id}`),
    getByTemporada: (temporadaId) => apiRequest('get', `/equipos/temporada/${temporadaId}`),
    create: (data) => apiRequest('post', '/equipos', data),
    update: (id, data) => apiRequest('put', `/equipos/${id}`, data),
    delete: (id) => apiRequest('delete', `/equipos/${id}`)
  }

  // Servicios para jugadores
  const jugadoresService = {
    getAll: () => apiRequest('get', '/jugadores'),
    getById: (id) => apiRequest('get', `/jugadores/${id}`),
    getByEquipo: (equipoId) => apiRequest('get', `/jugadores/equipo/${equipoId}`),
    create: (data) => apiRequest('post', '/jugadores', data),
    update: (id, data) => apiRequest('put', `/jugadores/${id}`, data),
    delete: (id) => apiRequest('delete', `/jugadores/${id}`)
  }

  // Servicios para asistencias
  const asistenciasService = {
    getAll: () => apiRequest('get', '/asistencias'),
    getByEquipo: (equipoId) => apiRequest('get', `/asistencias/equipo/${equipoId}`),
    getByJugador: (jugadorId) => apiRequest('get', `/asistencias/jugador/${jugadorId}`),
    registrar: (data) => apiRequest('post', '/asistencias', data),
    update: (id, data) => apiRequest('put', `/asistencias/${id}`, data)
  }

  // Servicios para valoraciones
  const valoracionesService = {
    getAll: () => apiRequest('get', '/valoraciones'),
    getByJugador: (jugadorId) => apiRequest('get', `/valoraciones/jugador/${jugadorId}`),
    getByEquipo: (equipoId) => apiRequest('get', `/valoraciones/equipo/${equipoId}`),
    create: (data) => apiRequest('post', '/valoraciones', data),
    update: (id, data) => apiRequest('put', `/valoraciones/${id}`, data)
  }

  // Servicios para scouting
  const scoutingService = {
    getAll: () => apiRequest('get', '/scouting'),
    getById: (id) => apiRequest('get', `/scouting/${id}`),
    buscarPorNombre: (nombre) => apiRequest('get', `/scouting/buscar?nombre=${nombre}`),
    create: (data) => apiRequest('post', '/scouting', data),
    update: (id, data) => apiRequest('put', `/scouting/${id}`, data)
  }

  // Servicios para objetivos
  const objetivosService = {
    getAll: () => apiRequest('get', '/objetivos'),
    getByEquipo: (equipoId) => apiRequest('get', `/objetivos/equipo/${equipoId}`),
    create: (data) => apiRequest('post', '/objetivos', data),
    update: (id, data) => apiRequest('put', `/objetivos/${id}`, data),
    actualizarProgreso: (id, progreso) => apiRequest('patch', `/objetivos/${id}/progreso`, { progreso })
  }

  // Servicios para temporadas
  const temporadasService = {
    getAll: () => apiRequest('get', '/temporadas'),
    getActual: () => apiRequest('get', '/temporadas/actual'),
    create: (data) => apiRequest('post', '/temporadas', data)
  }

  // Valor del contexto
  const value = {
    isLoading,
    error,
    apiStatus,
    checkApiStatus,
    equipos: equiposService,
    jugadores: jugadoresService,
    asistencias: asistenciasService,
    valoraciones: valoracionesService,
    scouting: scoutingService,
    objetivos: objetivosService,
    temporadas: temporadasService
  }

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}
