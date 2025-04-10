"use client"

import { useState, useEffect } from 'react'
import { useApi } from '@/lib/api/context'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function EquiposDataWrapper({ children }) {
  const { equipos, isLoading, error, apiStatus } = useApi()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Si la API está offline, usar datos de ejemplo
        if (apiStatus.status === 'offline') {
          // Datos de ejemplo para modo offline
          const mockData = [
            {
              id: "1",
              nombre: "Alevín A",
              categoria: "1ª Alevín",
              players: 15,
              coach: "Carlos Martínez",
              image: null,
              asistenciaPromedio: "85%",
              valoracionMedia: 3.8,
              objetivosCumplidos: "65%"
            },
            {
              id: "2",
              nombre: "Benjamín B",
              categoria: "2ª Benjamín",
              players: 14,
              coach: "Laura Sánchez",
              image: null,
              asistenciaPromedio: "80%",
              valoracionMedia: 3.5,
              objetivosCumplidos: "60%"
            },
            // Más datos de ejemplo...
          ]
          setData(mockData)
          console.log('Usando datos de ejemplo en modo offline')
        } else {
          // Intentar obtener datos reales de la API
          const result = await equipos.getAll()
          setData(result)
          console.log('Datos obtenidos de la API:', result)
        }
        setErrorMsg(null)
      } catch (err) {
        console.error('Error al cargar equipos:', err)
        setErrorMsg('No se pudieron cargar los equipos. ' + err.message)
        // Usar datos de ejemplo en caso de error
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [equipos, apiStatus.status])

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
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
