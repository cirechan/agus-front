"use client"

import { useState, useEffect } from 'react'
import { useApi } from '@/lib/api/context'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function JugadoresDataWrapper({ children, equipoId = null }) {
  const { jugadores, isLoading, error, apiStatus } = useApi()
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
            { id: "1", nombre: "Juan", apellidos: "García López", posicion: "Delantero", dorsal: 9, asistencia: "95%" },
            { id: "2", nombre: "Miguel", apellidos: "Fernández Ruiz", posicion: "Centrocampista", dorsal: 8, asistencia: "90%" },
            { id: "3", nombre: "Carlos", apellidos: "Martínez Sanz", posicion: "Defensa", dorsal: 4, asistencia: "85%" },
            { id: "4", nombre: "David", apellidos: "López Gómez", posicion: "Portero", dorsal: 1, asistencia: "100%" },
            { id: "5", nombre: "Javier", apellidos: "Sánchez Pérez", posicion: "Defensa", dorsal: 2, asistencia: "80%" },
            { id: "6", nombre: "Alejandro", apellidos: "González Díaz", posicion: "Centrocampista", dorsal: 6, asistencia: "85%" },
            { id: "7", nombre: "Daniel", apellidos: "Pérez Martín", posicion: "Delantero", dorsal: 11, asistencia: "90%" },
          ]
          
          // Si hay equipoId, filtrar los jugadores
          if (equipoId) {
            // En un caso real, aquí filtrarías por equipo
            // Para el ejemplo, simplemente devolvemos los primeros 4 jugadores
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
      } catch (err) {
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
