"use client"

import { useState, useEffect } from 'react'
import { useApi } from '@/lib/api/context'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function ScoutingDataWrapper({ children }) {
  const { scouting, isLoading, error, apiStatus } = useApi()
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
              nombre: "Alejandro", 
              apellido: "Martínez", 
              equipo: "CD Leganés", 
              añoNacimiento: 2012,
              demarcacion: "Centrocampista",
              lateralidad: "Derecha",
              altura: "Alto",
              complexion: "Atlético",
              capacidadFisica: 4,
              capacidadTecnica: 5,
              capacidadTactica: 4,
              capacidadDefensiva: 3,
              mental: 4,
              portero: 0,
              propuesta: "FICHAR",
              dificultad: "POSIBLE",
              observaciones: "Excelente visión de juego y técnica. Destaca por su capacidad de pase y control.",
              fechaScouting: "2025-03-15",
              entrenador: "Carlos Pérez",
              equipoCDSA: "Infantil A",
              categoria: "1ª Infantil",
              historial: [
                {
                  fechaScouting: "2024-05-20",
                  equipo: "EF Alcobendas",
                  capacidadFisica: 3,
                  capacidadTecnica: 4,
                  capacidadTactica: 3,
                  capacidadDefensiva: 3,
                  mental: 3,
                  propuesta: "SEGUIMIENTO",
                  observaciones: "Jugador con potencial pero necesita mejorar físicamente."
                }
              ]
            },
            { 
              id: "2", 
              nombre: "Daniel", 
              apellido: "García", 
              equipo: "Rayo Vallecano", 
              añoNacimiento: 2013,
              demarcacion: "Delantero",
              lateralidad: "Izquierda",
              altura: "Altura media",
              complexion: "Atlético",
              capacidadFisica: 5,
              capacidadTecnica: 4,
              capacidadTactica: 3,
              capacidadDefensiva: 2,
              mental: 5,
              portero: 0,
              propuesta: "FICHAR",
              dificultad: "COMPLICADO",
              observaciones: "Delantero muy rápido y con gran definición. Destaca por su velocidad y capacidad goleadora.",
              fechaScouting: "2025-02-28",
              entrenador: "Miguel López",
              equipoCDSA: "Alevín A",
              categoria: "1ª Alevín"
            },
            { 
              id: "3", 
              nombre: "Pablo", 
              apellido: "Rodríguez", 
              equipo: "Atlético de Madrid", 
              añoNacimiento: 2011,
              demarcacion: "Defensa",
              lateralidad: "Derecha",
              altura: "Alto",
              complexion: "Fuerte",
              capacidadFisica: 4,
              capacidadTecnica: 3,
              capacidadTactica: 4,
              capacidadDefensiva: 5,
              mental: 4,
              portero: 0,
              propuesta: "NO FICHAR",
              dificultad: "IMPOSIBLE",
              observaciones: "Defensa central con gran capacidad física y buen juego aéreo. Pertenece a la cantera del Atlético.",
              fechaScouting: "2025-01-15",
              entrenador: "Laura Sánchez",
              equipoCDSA: "Cadete B",
              categoria: "2ª Cadete"
            }
          ]
          
          setData(mockData)
          console.log('Usando datos de ejemplo en modo offline')
        } else {
          // Intentar obtener datos reales de la API
          const result = await scouting.getAll()
          setData(result)
          console.log('Datos obtenidos de la API:', result)
        }
        setErrorMsg(null)
      } catch (err) {
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
