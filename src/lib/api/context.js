"use client"

import React, { createContext, useContext } from 'react'
import { getTeams, getPlayers, getPlayerById, getAttendance } from '@/lib/data-service'

const ApiContext = createContext(null)

export const useApi = () => {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error('useApi debe ser usado dentro de un ApiProvider')
  }
  return context
}

export function ApiProvider({ children }) {
  const equiposService = {
    getAll: async () => getTeams(),
    getById: async (id) => (await getTeams()).find(e => e.id === id)
  }

  const jugadoresService = {
    getAll: async () => getPlayers(),
    getById: async (id) => getPlayerById(id),
    getByEquipo: async (equipoId) => getPlayers(equipoId)
  }

  const asistenciasService = {
    getAll: async () => getAttendance(),
    getByEquipo: async (equipoId) => getAttendance({ equipoId }),
    getByJugador: async (jugadorId) => getAttendance({ jugadorId })
  }

  const emptyService = {
    getAll: async () => []
  }

  const value = {
    isLoading: false,
    error: null,
    apiStatus: { status: 'online', message: 'Usando datos locales' },
    checkApiStatus: async () => {},
    equipos: equiposService,
    jugadores: jugadoresService,
    asistencias: asistenciasService,
    valoraciones: emptyService,
    scouting: emptyService,
    objetivos: emptyService,
    temporadas: emptyService
  }

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}
