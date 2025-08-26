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

interface ValoracionesDataWrapperProps {
  children: ReactElement;
  equipoId?: string | null;
  jugadorId?: string | null;
}

interface Jugador {
  id: string;
  nombre: string;
  apellidos: string;
}

interface Valoracion {
  id: string;
  jugador: Jugador;
  trimestre: string;
  fecha: string;
  tecnica: number;
  tactica: number;
  fisica: number;
  mental: number;
  valoracionMedia: number;
  comentarios: string;
}

export default function ValoracionesDataWrapper({ children, equipoId = null, jugadorId = null }: ValoracionesDataWrapperProps) {
  const { valoraciones, isLoading, error, apiStatus } = useApi() as {
    valoraciones: any;
    isLoading: boolean;
    error: any;
    apiStatus: ApiStatus;
  }
  const [data, setData] = useState<Valoracion[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Si la API está offline, usar datos del JSON
        if (apiStatus.status === 'offline') {
          const mockData: Valoracion[] = cadeteB.jugadores.flatMap(j =>
            (j.historialValoraciones || []).map((h, idx) => ({
              id: `${j.id}-${idx}`,
              jugador: { id: j.id, nombre: j.nombre, apellidos: j.apellidos },
              trimestre: h.trimestre,
              fecha: h.fecha,
              tecnica: h.aptitudes[0].value,
              tactica: h.aptitudes[1].value,
              fisica: h.aptitudes[2].value,
              mental: h.aptitudes[3].value,
              valoracionMedia: h.aptitudes.reduce((s,a)=>s+a.value,0)/h.aptitudes.length,
              comentarios: h.comentarios
            }))
          )

          if (equipoId) {
            setData(mockData)
          } else if (jugadorId) {
            const valoracionesJugador = mockData.filter(v => v.jugador.id === jugadorId)
            setData(valoracionesJugador)
          } else {
            setData(mockData)
          }

          console.log('Usando datos de ejemplo en modo offline')
        } else {
        } else {
          // Intentar obtener datos reales de la API
          let result
          if (equipoId) {
            result = await valoraciones.getByEquipo(equipoId)
          } else if (jugadorId) {
            result = await valoraciones.getByJugador(jugadorId)
          } else {
            result = await valoraciones.getAll()
          }
          setData(result)
          console.log('Datos obtenidos de la API:', result)
        }
        setErrorMsg(null)
      } catch (err: any) {
        console.error('Error al cargar valoraciones:', err)
        setErrorMsg('No se pudieron cargar las valoraciones. ' + err.message)
        // Usar datos de ejemplo en caso de error
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [valoraciones, apiStatus.status, equipoId, jugadorId])

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
