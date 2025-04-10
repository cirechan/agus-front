"use client"

import { useState, useEffect } from 'react'
import { useApi } from '@/lib/api/context'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function ValoracionesDataWrapper({ children, equipoId = null, jugadorId = null }) {
  const { valoraciones, isLoading, error, apiStatus } = useApi()
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
              jugador: { id: "1", nombre: "Juan", apellidos: "García López" },
              trimestre: "1T 2024-2025",
              fecha: "2024-12-15",
              tecnica: 4,
              tactica: 3.5,
              fisica: 4.5,
              mental: 4,
              valoracionMedia: 4,
              comentarios: "Buen rendimiento general. Destaca en aspectos físicos y técnicos."
            },
            { 
              id: "2", 
              jugador: { id: "2", nombre: "Miguel", apellidos: "Fernández Ruiz" },
              trimestre: "1T 2024-2025",
              fecha: "2024-12-15",
              tecnica: 4.5,
              tactica: 4,
              fisica: 3.5,
              mental: 4,
              valoracionMedia: 4,
              comentarios: "Excelente técnica y visión táctica. Debe mejorar su condición física."
            },
            { 
              id: "3", 
              jugador: { id: "3", nombre: "Carlos", apellidos: "Martínez Sanz" },
              trimestre: "1T 2024-2025",
              fecha: "2024-12-15",
              tecnica: 3.5,
              tactica: 4,
              fisica: 4,
              mental: 3.5,
              valoracionMedia: 3.75,
              comentarios: "Buen posicionamiento táctico. Necesita mejorar técnica individual."
            },
            { 
              id: "4", 
              jugador: { id: "1", nombre: "Juan", apellidos: "García López" },
              trimestre: "2T 2024-2025",
              fecha: "2025-03-15",
              tecnica: 4.5,
              tactica: 4,
              fisica: 4.5,
              mental: 4.5,
              valoracionMedia: 4.38,
              comentarios: "Ha mejorado en todos los aspectos respecto al trimestre anterior."
            },
          ]
          
          // Filtrar según los parámetros
          if (equipoId) {
            // En un caso real, aquí filtrarías por equipo
            // Para el ejemplo, simplemente devolvemos todos los datos
            setData(mockData)
          } else if (jugadorId) {
            // En un caso real, aquí filtrarías por jugador
            const valoracionesJugador = mockData.filter(v => v.jugador.id === jugadorId)
            setData(valoracionesJugador)
          } else {
            setData(mockData)
          }
          
          console.log('Usando datos de ejemplo en modo offline')
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
      } catch (err) {
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
