"use client"

import { useState, useEffect } from "react"
import { partidosService } from "@/lib/api/partidos"
import { Partido } from "@/types/horarios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PartidoCard } from "@/components/horarios/partido-card"
import { Skeleton } from "@/components/ui/skeleton"
import { startOfDay, endOfDay } from "date-fns"
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
  
        const from = startOfDay(effectiveDateRange.from).toISOString()
        const to = endOfDay(effectiveDateRange.to).toISOString()
  
        const params: any = {
          fechaInicio: from,
          fechaFin: to,
        }
  
        if (equipoId) {
          params.equipo = equipoId
        }
  
        const response = await partidosService.getPartidos(params)
        console.log("✅ Partidos recibidos:", response.data)
        setPartidos(response.data)
        setError(null)
      } catch (err) {
        console.error("❌ Error al cargar partidos:", err)
        setError("Error al cargar los partidos")
      } finally {
        setLoading(false)
      }
    }
  
    fetchPartidos()
  }, [effectiveDateRange.from, effectiveDateRange.to, equipoId])
  
  

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
