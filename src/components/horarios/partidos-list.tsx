"use client"

import { useState, useEffect } from "react"
import { partidosService } from "@/lib/api/partidos"
import { Partido } from "@/types/horarios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PartidoCard } from "@/components/horarios/partido-card"
import { Skeleton } from "@/components/ui/skeleton"

interface PartidosListProps {
  dateRange: {
    from: Date
    to: Date
  } | null
  equipoId?: string
}

export function PartidosList({ dateRange, equipoId }: PartidosListProps) {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const effectiveDateRange = dateRange || {
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 7))
  }

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        setLoading(true)
        let response

        if (equipoId) {
          response = await partidosService.getPartidos({
            equipo: equipoId,
            fechaInicio: effectiveDateRange.from.toISOString(),
            fechaFin: effectiveDateRange.to.toISOString()
          })
        } else {
          response = await partidosService.getPartidosPorFechas(
            effectiveDateRange.from.toISOString(),
            effectiveDateRange.to.toISOString()
          )
        }

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
  }, [effectiveDateRange, equipoId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de partidos</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500 p-4">{error}</div>
        ) : partidos.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No hay partidos programados en el rango de fechas seleccionado
            {equipoId && " para este equipo"}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {partidos
              .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
              .map((partido) => (
                <PartidoCard key={partido._id} partido={partido} />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
