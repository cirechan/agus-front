"use client"

import { useState, useEffect } from "react"
import { Partido } from "@/types/horarios"
import { horariosService } from "@/lib/api/horarios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { equiposOptions } from "@/types/horarios"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

export function EstadisticasView() {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [equipoFilter, setEquipoFilter] = useState<string>("")

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        setLoading(true)
        // Obtener todos los partidos con resultados
        const response = await horariosService.getPartidos({
          conResultado: true
        })
        setPartidos(response.data)
      } catch (err) {
        setError("Error al cargar los partidos")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPartidos()
  }, [])

  // Filtrar partidos por equipo
  const filteredPartidos = equipoFilter
    ? partidos.filter(partido => partido.equipo === equipoFilter)
    : partidos

  // Partidos con resultados
  const partidosConResultado = filteredPartidos.filter(partido => partido.resultado)

  // Calcular estadísticas
  const estadisticas = {
    total: partidosConResultado.length,
    victorias: partidosConResultado.filter(
      partido => partido.resultado && partido.resultado.golesLocal > partido.resultado.golesVisitante
    ).length,
    empates: partidosConResultado.filter(
      partido => partido.resultado && partido.resultado.golesLocal === partido.resultado.golesVisitante
    ).length,
    derrotas: partidosConResultado.filter(
      partido => partido.resultado && partido.resultado.golesLocal < partido.resultado.golesVisitante
    ).length,
    golesMarcados: partidosConResultado.reduce(
      (sum, partido) => sum + (partido.resultado ? partido.resultado.golesLocal : 0), 
      0
    ),
    golesRecibidos: partidosConResultado.reduce(
      (sum, partido) => sum + (partido.resultado ? partido.resultado.golesVisitante : 0), 
      0
    ),
  }

  // Datos para el gráfico de resultados
  const resultadosData = [
    { name: 'Victorias', value: estadisticas.victorias, color: '#4ade80' },
    { name: 'Empates', value: estadisticas.empates, color: '#facc15' },
    { name: 'Derrotas', value: estadisticas.derrotas, color: '#f87171' },
  ]

  // Datos para el gráfico de goles
  const golesData = [
    { name: 'Marcados', value: estadisticas.golesMarcados, color: '#60a5fa' },
    { name: 'Recibidos', value: estadisticas.golesRecibidos, color: '#f87171' },
  ]

  // Datos para el gráfico de partidos por ubicación
  const partidosPorUbicacion = [
    { 
      name: 'Local', 
      value: partidosConResultado.filter(partido => partido.ubicacion === 'casa').length,
      color: '#60a5fa'
    },
    { 
      name: 'Visitante', 
      value: partidosConResultado.filter(partido => partido.ubicacion === 'fuera').length,
      color: '#c084fc'
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select
          placeholder="Filtrar por equipo"
          options={[
            { value: "", label: "Todos los equipos" },
            ...equiposOptions
          ]}
          value={equipoFilter}
          onValueChange={setEquipoFilter}
          className="w-full md:w-64"
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">Cargando...</div>
      ) : error ? (
        <div className="text-red-500 p-4">{error}</div>
      ) : partidosConResultado.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No hay datos de resultados disponibles para generar estadísticas
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Partidos jugados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Victorias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{estadisticas.victorias}</div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.total > 0 
                  ? `${Math.round((estadisticas.victorias / estadisticas.total) * 100)}%` 
                  : '0%'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Goles marcados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{estadisticas.golesMarcados}</div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.total > 0 
                  ? `${(estadisticas.golesMarcados / estadisticas.total).toFixed(1)} por partido` 
                  : '0 por partido'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Goles recibidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{estadisticas.golesRecibidos}</div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.total > 0 
                  ? `${(estadisticas.golesRecibidos / estadisticas.total).toFixed(1)} por partido` 
                  : '0 por partido'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resultadosData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {resultadosData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Goles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={golesData}
                    margin={{
                      top: 5,
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
                    <Bar dataKey="value" name="Goles" fill="#8884d8">
                      {golesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
