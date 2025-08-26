"use client"

import React, { useState, useEffect, ReactElement } from 'react'
import { useApi } from '@/lib/api/context'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import cadeteB from '@/data/cadete-b.json'

interface ApiStatus {
  status: string;
  message: string;
  environment?: string;
  timestamp?: string;
}

interface JugadoresDataWrapperProps {
  children: ReactElement;
  equipoId?: string | null;
}

interface Jugador {
  id: string;
  nombre: string;
  apellidos: string;
  posicion: string;
  dorsal: number;
  asistencia: string;
}

export default function JugadoresDataWrapper({ children, equipoId = null }: JugadoresDataWrapperProps) {
  const { jugadores, isLoading, error, apiStatus } = useApi() as {
    jugadores: any;
    isLoading: boolean;
    error: any;
    apiStatus: ApiStatus;
  }
  const [data, setData] = useState<Jugador[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Si la API está offline, usar datos del JSON
        if (apiStatus.status === 'offline') {
          const mockData: Jugador[] = cadeteB.jugadores.map(j => ({
            id: j.id,
            nombre: j.nombre,
            apellidos: j.apellidos,
            posicion: j.posicion,
            dorsal: j.dorsal,
            asistencia: j.asistencia
          }))

          if (equipoId) {
            setData(mockData.slice(0, 4))
          } else {
            setData(mockData)
          }

          console.log('Usando datos de ejemplo en modo offline')
        } else {
          // Intentar obtener datos reales de la API
          let result
          if (equipoId) {
            result = await jugadores.getByEquipo(equipoId)
          } else {
            result = await jugadores.getAll()
          }
          setData(result)
          console.log('Datos obtenidos de la API:', result)
        }
        setErrorMsg(null)
      } catch (err: any) {
        console.error('Error al cargar jugadores:', err)
        setErrorMsg('No se pudieron cargar los jugadores. ' + err.message)
        // Usar datos de ejemplo en caso de error
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [jugadores, apiStatus.status, equipoId])

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{errorMsg}</AlertDescription>
      </Alert>
    )
  }

  // Clonar el children y pasarle los datos
  return React.cloneElement(children, { data })
}
