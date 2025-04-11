"use client"

import { useState, useEffect } from "react"
import { Partido } from "@/types/horarios"
import { horariosService } from "@/lib/api/horarios"
import { PartidoCard } from "@/components/horarios/partido-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { equiposOptions } from "@/types/horarios"
import { Search } from "lucide-react"

interface PartidosListProps {
  dateRange: {
    from: Date
    to: Date
  }
}

export function PartidosList({ dateRange }: PartidosListProps) {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [filteredPartidos, setFilteredPartidos] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [equipoFilter, setEquipoFilter] = useState<string>("")
  const [ubicacionFilter, setUbicacionFilter] = useState<string>("")

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
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        partido => 
          partido.equipo.toLowerCase().includes(term) || 
          partido.rival.toLowerCase().includes(term)
      )
    }
    
    // Filtrar por equipo
    if (equipoFilter) {
      result = result.filter(partido => partido.equipo === equipoFilter)
    }
    
    // Filtrar por ubicación
    if (ubicacionFilter) {
      result = result.filter(partido => partido.ubicacion === ubicacionFilter)
    }
    
    setFilteredPartidos(result)
  }, [searchTerm, equipoFilter, ubicacionFilter, partidos])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por equipo o rival..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={equipoFilter} onValueChange={setEquipoFilter}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Filtrar por equipo" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">Todos los equipos</SelectItem>
    {equiposOptions.map((option) => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

        
<Select value={ubicacionFilter} onValueChange={setUbicacionFilter}>
  <SelectTrigger className="w-full md:w-48">
    <SelectValue placeholder="Filtrar por ubicación" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">Todas las ubicaciones</SelectItem>
    <SelectItem value="casa">Local</SelectItem>
    <SelectItem value="fuera">Visitante</SelectItem>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartidos
            .sort((a, b) => {
              // Ordenar primero por fecha
              const dateA = new Date(a.fecha).getTime()
              const dateB = new Date(b.fecha).getTime()
              if (dateA !== dateB) return dateA - dateB
              
              // Si la fecha es la misma, ordenar por hora
              return a.hora.localeCompare(b.hora)
            })
            .map((partido) => (
              <PartidoCard key={partido.id} partido={partido} />
            ))}
        </div>
      )}
    </div>
  )
}
