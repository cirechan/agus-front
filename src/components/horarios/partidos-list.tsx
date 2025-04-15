"use client"

import { useState, useEffect } from "react"
import { startOfDay, endOfDay } from "date-fns"
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

  useEffect(() => {
    const fetchPartidos = async () => {
      if (!dateRange?.from || !dateRange?.to) return

      const from = startOfDay(dateRange.from).toISOString()
      const to = endOfDay(dateRange.to).toISOString()

      try {
        setLoading(true)
        const response = await partidosService.getPartidos({
          fechaInicio: from,
          fechaFin: to,
          ...(equipoId && { equipo: equipoId })
        })
        setPartidos(response.data)
        setError(null)
      } catch (err) {
        console.error("Error al cargar los partidos:", err)
        setError("Error al cargar los partidos")
      } finally {
        setLoading(false)
      }
    }

    fetchPartidos()
  }, [dateRange, equipoId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de partidos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
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
            {partidos.map((partido) => (
              <PartidoCard key={partido._id} partido={partido} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
