"use client"

import { useState, useEffect } from "react"
import { Partido } from "@/types/horarios"
import { horariosService } from "@/lib/api/horarios"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { equiposOptions } from "@/types/horarios"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface ResultadosListProps {
  dateRange: {
    from: Date
    to: Date
  }
}

export function ResultadosList({ dateRange }: ResultadosListProps) {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [filteredPartidos, setFilteredPartidos] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [equipoFilter, setEquipoFilter] = useState<string>("")

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        setLoading(true)
        const response = await horariosService.getPartidos({
          fechaInicio: dateRange.from.toISOString(),
          fechaFin: dateRange.to.toISOString()
        })
        setPartidos(response.data)
        setFilteredPartidos(response.data)
      } catch (err) {
        setError("Error al cargar los partidos")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPartidos()
  }, [dateRange])

  useEffect(() => {
    let result = [...partidos]
    
    // Filtrar por equipo
    if (equipoFilter) {
      result = result.filter(partido => partido.equipo === equipoFilter)
    }
    
    setFilteredPartidos(result)
  }, [equipoFilter, partidos])

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
      <Select value={equipoFilter || "__todos__"} onValueChange={(val) => setEquipoFilter(val === "__todos__" ? "" : val)}>
  <SelectTrigger className="w-full md:w-48">
    <SelectValue placeholder="Filtrar por equipo" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="__todos__">Todos los equipos</SelectItem>
    {equiposOptions.map((option) => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>


      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">Cargando...</div>
      ) : error ? (
        <div className="text-red-500 p-4">{error}</div>
      ) : filteredPartidos.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No se encontraron partidos con los filtros seleccionados
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Rival</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-center">Resultado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartidos
                .sort((a, b) => {
                  // Ordenar primero por fecha
                  const dateA = new Date(a.fecha).getTime()
                  const dateB = new Date(b.fecha).getTime()
                  if (dateA !== dateB) return dateA - dateB
                  
                  // Si la fecha es la misma, ordenar por hora
                  return a.hora.localeCompare(b.hora)
                })
                .map((partido) => {
                  const fechaFormateada = new Date(partido.fecha).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  })
                  
                  return (
                    <TableRow key={partido.id}>
                      <TableCell>
                        <div>{fechaFormateada}</div>
                        <div className="text-sm text-muted-foreground">{partido.hora}</div>
                      </TableCell>
                      <TableCell>{partido.equipo}</TableCell>
                      <TableCell>{partido.rival}</TableCell>
                      <TableCell>
                        <Badge variant={partido.ubicacion === "casa" ? "default" : "outline"}>
                          {partido.ubicacion === "casa" ? "Local" : "Visitante"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {partido.resultado ? (
                          <span className="font-medium">
                            {partido.resultado.golesLocal} - {partido.resultado.golesVisitante}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Pendiente</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/dashboard/horarios/${partido.id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Detalles
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
