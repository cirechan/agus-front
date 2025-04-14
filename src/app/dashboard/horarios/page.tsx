"use client"

import { useState, useEffect } from "react"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Button } from "@/components/ui/button"
import { CalendarView } from "@/components/horarios/calendar-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PartidosList } from "@/components/horarios/partidos-list"
import { ResultadosList } from "@/components/horarios/resultados-list"
import { EstadisticasView } from "@/components/horarios/estadisticas-view"
import { Select } from "@/components/ui/select"
import { equiposService } from "@/lib/api/services"
import { addDays } from "date-fns"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function HorariosPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 7)
  })
  
  const [equipos, setEquipos] = useState([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState("")
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        setLoading(true)
        const response = await equiposService.getEquipos()
        setEquipos(response.data.map(equipo => ({
          value: equipo._id,
          label: equipo.nombre
        })))
      } catch (error) {
        console.error("Error al cargar equipos:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchEquipos()
  }, [])
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Horarios de partidos</h1>
        <Button asChild>
          <Link href="/dashboard/horarios/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Añadir partido
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          className="w-full md:w-auto"
        />
        
        <div className="w-full md:w-64">
          <Select
            options={[
              { value: "", label: "Todos los equipos" },
              ...equipos
            ]}
            value={equipoSeleccionado}
            onValueChange={setEquipoSeleccionado}
            placeholder="Seleccionar equipo"
            disabled={loading}
          />
        </div>
      </div>
      
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-4 md:inline-flex">
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-6">
          <CalendarView dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="list" className="mt-6">
          <PartidosList 
            dateRange={dateRange}
            equipoId={equipoSeleccionado || undefined}
          />
        </TabsContent>
        
        <TabsContent value="results" className="mt-6">
          <ResultadosList 
            dateRange={dateRange}
            equipoId={equipoSeleccionado || undefined}
          />
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <EstadisticasView equipoId={equipoSeleccionado || undefined} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
