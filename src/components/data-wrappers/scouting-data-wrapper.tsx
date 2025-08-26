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

interface ScoutingDataWrapperProps {
  children: ReactElement;
}

interface HistorialScouting {
  fechaScouting: string;
  equipo: string;
  capacidadFisica: number;
  capacidadTecnica: number;
  capacidadTactica: number;
  capacidadDefensiva: number;
  mental: number;
  propuesta: string;
  observaciones: string;
}

interface JugadorScouting {
  id: string;
  nombre: string;
  apellido: string;
  equipo: string;
  añoNacimiento: number;
  demarcacion: string;
  lateralidad: string;
  altura: string;
  complexion: string;
  capacidadFisica: number;
  capacidadTecnica: number;
  capacidadTactica: number;
  capacidadDefensiva: number;
  mental: number;
  portero: number;
  propuesta: string;
  dificultad: string;
  observaciones: string;
  fechaScouting: string;
  entrenador: string;
  equipoCDSA: string;
  categoria: string;
  historial?: HistorialScouting[];
}

export default function ScoutingDataWrapper({ children }: ScoutingDataWrapperProps) {
  const { scouting, isLoading, error, apiStatus } = useApi() as {
    scouting: any;
    isLoading: boolean;
    error: any;
    apiStatus: ApiStatus;
  }
  const [data, setData] = useState<JugadorScouting[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Si la API está offline, usar datos del JSON
        if (apiStatus.status === 'offline') {
          const mockData: JugadorScouting[] = cadeteB.jugadores.map(j => ({
            id: j.id,
            nombre: j.nombre,
            apellido: j.apellidos,
            equipo: j.equipo,
            añoNacimiento: Number(j.fechaNacimiento.split('-')[0]),
            demarcacion: j.posicion,
            lateralidad: 'Derecha',
            altura: 'Altura media',
            complexion: 'Atlético',
            capacidadFisica: 3,
            capacidadTecnica: 3,
            capacidadTactica: 3,
            capacidadDefensiva: 3,
            mental: 3,
            portero: 0,
            propuesta: 'SEGUIMIENTO',
            dificultad: 'POSIBLE',
            observaciones: '',
            fechaScouting: '2025-01-01',
            entrenador: cadeteB.entrenador,
            equipoCDSA: cadeteB.nombre,
            categoria: cadeteB.categoria
          }))
          setData(mockData)
          console.log('Usando datos de ejemplo en modo offline')
        } else {
          
          setData(mockData)
          console.log('Usando datos de ejemplo en modo offline')
        } else {
          // Intentar obtener datos reales de la API
          const result = await scouting.getAll()
          setData(result)
          console.log('Datos obtenidos de la API:', result)
        }
        setErrorMsg(null)
      } catch (err: any) {
        console.error('Error al cargar datos de scouting:', err)
        setErrorMsg('No se pudieron cargar los datos de scouting. ' + err.message)
        // Usar datos de ejemplo en caso de error
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [scouting, apiStatus.status])

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
