"use client"

import { useState, useEffect } from 'react'
import { useApi } from '@/lib/api/context'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function ObjetivosDataWrapper({ children, equipoId = null }) {
  const { objetivos, isLoading, error, apiStatus } = useApi()
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
              titulo: "Mejorar posesión de balón", 
              descripcion: "Aumentar el tiempo de posesión en partidos al 60%", 
              progreso: 75, 
              fechaCreacion: "2025-01-15",
              fechaLimite: "2025-06-30",
              prioridad: "Alta",
              estado: "En progreso",
              equipo: "1" // ID del equipo Alevín A
            },
            { 
              id: "2", 
              titulo: "Reducir goles encajados", 
              descripcion: "Reducir en un 30% los goles encajados respecto a la temporada anterior", 
              progreso: 60, 
              fechaCreacion: "2025-01-15",
              fechaLimite: "2025-06-30",
              prioridad: "Alta",
              estado: "En progreso",
              equipo: "1" // ID del equipo Alevín A
            },
            { 
              id: "3", 
              titulo: "Mejorar técnica individual", 
              descripcion: "Enfocarse en el control y pase del balón", 
              progreso: 65, 
              fechaCreacion: "2025-01-10",
              fechaLimite: "2025-06-30",
              prioridad: "Alta",
              estado: "En progreso",
              equipo: "2" // ID del equipo Benjamín B
            },
            { 
              id: "4", 
              titulo: "Desarrollar juego en equipo", 
              descripcion: "Fomentar la comunicación y el juego colectivo", 
              progreso: 70, 
              fechaCreacion: "2025-01-10",
              fechaLimite: "2025-06-30",
              prioridad: "Alta",
              estado: "En progreso",
              equipo: "2" // ID del equipo Benjamín B
            }
          ]
          
          // Filtrar por equipo si es necesario
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
      } catch (err) {
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
