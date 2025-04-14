"use client"

import { useState, useEffect } from "react"
import { partidosService } from "@/lib/api/partidos"
import { Partido } from "@/types/horarios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResultadoForm } from "@/components/horarios/resultado-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

interface ResultadosListProps {
  dateRange: {
    from: Date
    to: Date
  } | null
  equipoId?: string
}

export function ResultadosList({ dateRange, equipoId }: ResultadosListProps) {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPartidoId, setEditingPartidoId] = useState<string | null>(null)

  // Si no hay rango de fechas, usar la semana actual
  const effectiveDateRange = dateRange || {
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 7))
  }

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        setLoading(true)
        
        // Construir parámetros de consulta
        const params: any = {
          fechaInicio: effectiveDateRange.from.toISOString(),
          fechaFin: effectiveDateRange.to.toISOString()
        };
        
        if (equipoId) {
          params.equipo = equipoId;
        }
        
        const response = await partidosService.getPartidos(params);
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

  const handleResultadoSubmit = async (partidoId: string, data: { golesLocal: number; golesVisitante: number }) => {
    try {
      await partidosService.registrarResultado(partidoId, data)
      
      // Actualizar la lista de partidos
      const updatedPartidos = partidos.map(partido => {
        if (partido._id === partidoId) {
          return {
            ...partido,
            resultado: {
              golesLocal: data.golesLocal,
              golesVisitante: data.golesVisitante,
              jugado: true
            }
          };
        }
        return partido;
      });
      
      setPartidos(updatedPartidos);
      setEditingPartidoId(null);
    } catch (err) {
      setError("Error al guardar el resultado")
      console.error(err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados de partidos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500 p-4">{error}</div>
        ) : partidos.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No hay partidos programados en el rango de fechas seleccionado
            {equipoId && " para este equipo"}
          </div>
        ) : (
          <div className="space-y-4">
            {partidos
              .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
              .map((partido) => (
                <Card key={partido._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 bg-muted/50">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{new Date(partido.fecha).toLocaleDateString("es-ES")}</span>
                            <span className="text-sm text-muted-foreground">{partido.hora}</span>
                            <Badge variant={partido.ubicacion === "casa" ? "default" : "outline"}>
                              {partido.ubicacion === "casa" ? "Local" : "Visitante"}
                            </Badge>
                          </div>
                          <div className="text-lg font-semibold mt-1">
                            {partido.equipo} vs {partido.rival}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/dashboard/horarios/${partido._id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Detalles
                          </Link>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {editingPartidoId === partido._id ? (
                        <ResultadoForm 
                          partido={partido} 
                          onSubmit={(data) => handleResultadoSubmit(partido._id as string, data)} 
                          onCancel={() => setEditingPartidoId(null)} 
                        />
                      ) : partido.resultado && partido.resultado.jugado ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center gap-4 py-2">
                            <div className="text-center">
                              <p className="font-medium">{partido.equipo}</p>
                              <p className="text-3xl font-bold">{partido.resultado.golesLocal}</p>
                            </div>
                            <div className="text-xl font-bold">-</div>
                            <div className="text-center">
                              <p className="font-medium">{partido.rival}</p>
                              <p className="text-3xl font-bold">{partido.resultado.golesVisitante}</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingPartidoId(partido._id as string)}
                            className="mt-2"
                          >
                            Editar resultado
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <Button onClick={() => setEditingPartidoId(partido._id as string)}>
                            Registrar resultado
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
