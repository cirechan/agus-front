"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { PartidoCard } from "@/components/horarios/partido-card"
import { partidosService } from "@/lib/api/partidos"
import { Partido } from "@/types/horarios"
import { Skeleton } from "@/components/ui/skeleton"
import { addDays } from "date-fns"

interface CalendarViewProps {
  dateRange: {
    from: Date
    to: Date
  } | null
}

export function CalendarView({ dateRange }: CalendarViewProps) {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Si no hay rango de fechas, usar la semana actual
  const effectiveDateRange = dateRange || {
    from: new Date(),
    to: addDays(new Date(), 7)
  }

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        setLoading(true)
        const response = await partidosService.getPartidosPorFechas(
          effectiveDateRange.from.toISOString(),
          effectiveDateRange.to.toISOString()
        )
        setPartidos(response.data)
        setError(null)
      } catch (err) {
        setError("Error al cargar los partidos")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPartidos()
  }, [effectiveDateRange])

  // Agrupar partidos por fecha
  const partidosPorFecha = partidos.reduce((acc, partido) => {
    const fecha = new Date(partido.fecha).toISOString().split('T')[0]
    if (!acc[fecha]) {
      acc[fecha] = []
    }
    acc[fecha].push(partido)
    return acc
  }, {} as Record<string, Partido[]>)

  const renderPartidosDia = (date: Date) => {
    const fechaKey = date.toISOString().split('T')[0]
    const partidosDelDia = partidosPorFecha[fechaKey] || []
    
    if (partidosDelDia.length === 0) return null
    
    return (
      <div className="absolute bottom-0 right-0 left-0">
        <div className="h-2 bg-primary rounded-full mx-2" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-3">
          <Calendar 
            mode="range"
            selected={{
              from: effectiveDateRange.from,
              to: effectiveDateRange.to
            }}
            className="rounded-md border"
            components={{
              DayContent: (props) => (
                <div className="relative h-full w-full p-2">
                  <div>{props.date.getDate()}</div>
                  {renderPartidosDia(props.date)}
                </div>
              )
            }}
          />
        </div>
        
        <div className="lg:col-span-4">
          <div className="rounded-md border p-4">
            <h2 className="font-semibold mb-4">Partidos en el rango seleccionado</h2>
            
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-40 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-red-500 p-4">{error}</div>
            ) : partidos.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No hay partidos programados en el rango de fechas seleccionado
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(partidosPorFecha)
                  .sort(([fechaA], [fechaB]) => fechaA.localeCompare(fechaB))
                  .map(([fecha, partidosDelDia]) => (
                    <div key={fecha} className="space-y-3">
                      <h3 className="font-medium">
                        {new Date(fecha).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {partidosDelDia
                          .sort((a, b) => a.hora.localeCompare(b.hora))
                          .map((partido) => (
                            <PartidoCard key={partido._id} partido={partido} />
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
