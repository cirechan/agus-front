"use client"

import { useState, useEffect } from "react"
import { partidosService } from "@/lib/api/partidos"
import { EstadisticasEquipo } from "@/types/horarios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

interface EstadisticasViewProps {
  equipoId?: string
}

export function EstadisticasView({ equipoId }: EstadisticasViewProps) {
  const [estadisticas, setEstadisticas] = useState<EstadisticasEquipo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEstadisticas = async () => {
      if (!equipoId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await partidosService.getEstadisticasPorEquipo(equipoId)
        setEstadisticas(response.data)
        setError(null)
      } catch (err) {
        setError("Error al cargar las estadísticas")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchEstadisticas()
  }, [equipoId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  if (!estadisticas) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        {equipoId 
          ? "No hay estadísticas disponibles para este equipo" 
          : "Selecciona un equipo para ver sus estadísticas"}
      </div>
    )
  }

  // Datos para el gráfico de barras
  const golesData = [
    {
      name: "Goles",
      "A favor": estadisticas.golesFavor,
      "En contra": estadisticas.golesContra,
    }
  ]

  // Datos para el gráfico circular
  const resultadosData = [
    { name: "Victorias", value: estadisticas.victorias },
    { name: "Empates", value: estadisticas.empates },
    { name: "Derrotas", value: estadisticas.derrotas }
  ]

  const COLORS = ["#4ade80", "#facc15", "#f87171"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas de {estadisticas.equipo}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="resumen">
          <TabsList className="mb-4">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="goles">Goles</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="resumen" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Partidos jugados</p>
                    <p className="text-3xl font-bold">{estadisticas.partidosJugados}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Victorias</p>
                    <p className="text-3xl font-bold text-green-500">{estadisticas.victorias}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Derrotas</p>
                    <p className="text-3xl font-bold text-red-500">{estadisticas.derrotas}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Goles a favor</p>
                    <p className="text-3xl font-bold">{estadisticas.golesFavor}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Goles en contra</p>
                    <p className="text-3xl font-bold">{estadisticas.golesContra}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="goles">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={golesData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="A favor" fill="#4ade80" />
                  <Bar dataKey="En contra" fill="#f87171" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="resultados">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultadosData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {resultadosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} partidos`, ""]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
