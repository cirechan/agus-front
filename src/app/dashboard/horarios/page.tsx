"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CalendarView } from "@/components/horarios/calendar-view"
import { PartidosList } from "@/components/horarios/partidos-list"
import { ResultadosList } from "@/components/horarios/resultados-list"
import { EstadisticasView } from "@/components/horarios/estadisticas-view"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { PlusIcon, Upload } from "lucide-react"
import Link from "next/link"
import { horariosService } from "@/lib/api/horarios"

export default function HorariosPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 7))
  })
  const [loadingPrueba, setLoadingPrueba] = useState(false)

  const handleCrearPartidosDemo = async () => {
    try {
      setLoadingPrueba(true)

      const partidosDemo = [
        {
          fecha: new Date().toISOString(),
          hora: "11:00",
          equipo: "Alevín A",
          rival: "CD Ebro",
          ubicacion: "casa",
          vestuarioLocal: 1,
          vestuarioVisitante: 2,
          equipacion: { color: "roja", tipo: "principal" },
          resultado: { golesLocal: 3, golesVisitante: 2 },
        },
        {
          fecha: new Date(Date.now() + 86400000).toISOString(), // mañana
          hora: "17:30",
          equipo: "Infantil B",
          rival: "UD Montecarlo",
          ubicacion: "fuera",
          campo: "La Azucarera",
          equipacion: { color: "azul", tipo: "alternativa" },
        },
        {
          fecha: new Date(Date.now() + 2 * 86400000).toISOString(), // pasado mañana
          hora: "10:00",
          equipo: "Cadete A",
          rival: "Stadium Casablanca",
          ubicacion: "casa",
          vestuarioLocal: 3,
          vestuarioVisitante: 4,
          equipacion: { color: "blanca", tipo: "principal" },
          resultado: { golesLocal: 0, golesVisitante: 0 },
        }
      ]

      for (const partido of partidosDemo) {
        await horariosService.createPartido(partido)
      }

      alert("Datos de prueba creados correctamente. Refresca la página si no los ves.")
    } catch (error) {
      console.error(error)
      alert("Error al crear partidos de prueba")
    } finally {
      setLoadingPrueba(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Horarios de partidos</h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <DateRangePicker
            onChange={(range) => {
              if (range?.from && range?.to) {
                setDateRange({ from: range.from, to: range.to })
              }
            }}
            value={dateRange}
          />

          <Link href="/dashboard/horarios/nuevo">
            <Button className="whitespace-nowrap">
              <PlusIcon className="h-4 w-4 mr-2" />
              Añadir partido
            </Button>
          </Link>

          <Button
            variant="secondary"
            onClick={handleCrearPartidosDemo}
            disabled={loadingPrueba}
          >
            <Upload className="h-4 w-4 mr-2" />
            {loadingPrueba ? "Cargando..." : "Cargar datos de prueba"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0">
          <CalendarView dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <PartidosList dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="results" className="mt-0">
          <ResultadosList dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="stats" className="mt-0">
          <EstadisticasView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
