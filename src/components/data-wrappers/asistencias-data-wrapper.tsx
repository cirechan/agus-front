"use client"

import { useState, useEffect } from 'react'
import { useApi } from '@/lib/api/context'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function AsistenciasDataWrapper({ children, equipoId = null, jugadorId = null }) {
  const { asistencias, isLoading, error, apiStatus } = useApi()
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
            { id: "1", fecha: "09/04/2025", tipo: "Entrenamiento regular", asistencia: "90%", jugadores: [
              { id: "1", nombre: "Juan García", asistio: true, motivo: null },
              { id: "2", nombre: "Miguel Fernández", asistio: true, motivo: null },
              { id: "3", nombre: "Carlos Martínez", asistio: false, motivo: "Lesión" },
              { id: "4", nombre: "David López", asistio: true, motivo: null },
            ]},
            { id: "2", fecha: "07/04/2025", tipo: "Entrenamiento regular", asistencia: "85%", jugadores: [
              { id: "1", nombre: "Juan García", asistio: true, motivo: null },
              { id: "2", nombre: "Miguel Fernández", asistio: false, motivo: "Estudios" },
              { id: "3", nombre: "Carlos Martínez", asistio: false, motivo: "Lesión" },
              { id: "4", nombre: "David López", asistio: true, motivo: null },
            ]},
            { id: "3", fecha: "04/04/2025", tipo: "Entrenamiento regular", asistencia: "80%", jugadores: [
              { id: "1", nombre: "Juan García", asistio: true, motivo: null },
              { id: "2", nombre: "Miguel Fernández", asistio: true, motivo: null },
              { id: "3", nombre: "Carlos Martínez", asistio: false, motivo: "Lesión" },
              { id: "4", nombre: "David López", asistio: false, motivo: "Viaje" },
            ]},
            { id: "4", fecha: "02/04/2025", tipo: "Entrenamiento regular", asistencia: "95%", jugadores: [
              { id: "1", nombre: "Juan García", asistio: true, motivo: null },
              { id: "2", nombre: "Miguel Fernández", asistio: true, motivo: null },
              { id: "3", nombre: "Carlos Martínez", asistio: true, motivo: null },
              { id: "4", nombre: "David López", asistio: true, motivo: null },
            ]},
          ]
          
          // Filtrar según los parámetros
          if (equipoId) {
            // En un caso real, aquí filtrarías por equipo
            // Para el ejemplo, simplemente devolvemos todos los datos
            setData(mockData)
          } else if (jugadorId) {
            // En un caso real, aquí filtrarías por jugador
            // Para el ejemplo, filtramos las asistencias para mostrar solo las del jugador 1
            const asistenciasJugador = mockData.map(asistencia => {
              const jugador = asistencia.jugadores.find(j => j.id === jugadorId)
              if (jugador) {
                return {
                  id: asistencia.id,
                  fecha: asistencia.fecha,
                  tipo: asistencia.tipo,
                  asistio: jugador.asistio,
                  motivo: jugador.motivo
                }
              }
              return null
            }).filter(Boolean)
            
            setData(asistenciasJugador)
          } else {
            setData(mockData)
          }
          
          console.log('Usando datos de ejemplo en modo offline')
        } else {
          // Intentar obtener datos reales de la API
          let result
          if (equipoId) {
            result = await asistencias.getByEquipo(equipoId)
          } else if (jugadorId) {
            result = await asistencias.getByJugador(jugadorId)
          } else {
            result = await asistencias.getAll()
          }
          setData(result)
          console.log('Datos obtenidos de la API:', result)
        }
        setErrorMsg(null)
      } catch (err) {
        console.error('Error al cargar asistencias:', err)
        setErrorMsg('No se pudieron cargar las asistencias. ' + err.message)
        // Usar datos de ejemplo en caso de error
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [asistencias, apiStatus.status, equipoId, jugadorId])

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
