"use client"

import React from 'react'
import { ApiContext } from './api/context'

const noop = async (..._args: any[]) => {
  return []
}

const equiposService = {
  getAll: noop,
  getById: noop,
  getByTemporada: noop,
  create: noop,
  update: noop,
  delete: noop,
}

const jugadoresService = {
  getAll: noop,
  getById: noop,
  getByEquipo: noop,
  create: noop,
  update: noop,
  delete: noop,
}

const asistenciasService = {
  getAll: noop,
  getByEquipo: noop,
  getByJugador: noop,
  registrar: noop,
  update: noop,
}

const valoracionesService = {
  getAll: noop,
  getByJugador: noop,
  getByEquipo: noop,
  create: noop,
  update: noop,
}

const scoutingService = {
  getAll: noop,
  getById: noop,
  buscarPorNombre: noop,
  create: noop,
  update: noop,
}

const objetivosService = {
  getAll: noop,
  getByEquipo: noop,
  create: noop,
  update: noop,
  actualizarProgreso: noop,
}

const temporadasService = {
  getAll: noop,
  getActual: noop,
  create: noop,
}

const value = {
  isLoading: false,
  error: null as any,
  apiStatus: { status: 'online', message: 'Modo local' },
  checkApiStatus: async () => {},
  equipos: equiposService,
  jugadores: jugadoresService,
  asistencias: asistenciasService,
  valoraciones: valoracionesService,
  scouting: scoutingService,
  objetivos: objetivosService,
  temporadas: temporadasService,
}

export function LocalDataProvider({ children }: { children: React.ReactNode }) {
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}

