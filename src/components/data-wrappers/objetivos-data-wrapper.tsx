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

interface ObjetivosDataWrapperProps {
  children: ReactElement;
  equipoId?: string | null;
}

interface Objetivo {
  id: string;
  titulo: string;
  descripcion: string;
  progreso: number;
  fechaCreacion: string;
  fechaLimite: string;
  prioridad: string;
  estado: string;
  equipo: string;
}

export default function ObjetivosDataWrapper({ children, equipoId = null }: ObjetivosDataWrapperProps) {
  const { objetivos, isLoading, error, apiStatus } = useApi() as {
    objetivos: any;
    isLoading: boolean;
    error: any;
    apiStatus: ApiStatus;
  }
  const [data, setData] = useState<Objetivo[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Si la API está offline, usar datos del JSON
        if (apiStatus.status === 'offline') {
          const mockData: Objetivo[] = cadeteB.objetivos.map(o => ({
            ...o,
            equipo: cadeteB.id
          }))

          if (equipoId) {
            const objetivosEquipo = mockData.filter(obj => obj.equipo === equipoId)
            setData(objetivosEquipo)
          } else {
            setData(mockData)
          }

          console.log('Usando datos de ejemplo en modo offline')
        } else {
          // Intentar obtener datos reales de la API
          let result
          if (equipoId) {
            result = await objetivos.getByEquipo(equipoId)
          } else {
            result = await objetivos.getAll()
          }
          setData(result)
          console.log('Datos obtenidos de la API:', result)
        }
        setErrorMsg(null)
      } catch (err: any) {
        console.error('Error al cargar objetivos:', err)
        setErrorMsg('No se pudieron cargar los objetivos. ' + err.message)
        // Usar datos de ejemplo en caso de error
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [objetivos, apiStatus.status, equipoId])

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
