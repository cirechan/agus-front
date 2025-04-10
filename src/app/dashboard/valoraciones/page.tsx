"use client"

import * as React from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, FilterIcon, PlusCircle, Star, StarHalf } from "lucide-react"
import { format, addMonths, subMonths, parseISO } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

// Datos de ejemplo - en producción vendrían de la API
const jugadores = [
  { id: "1", nombre: "Juan", apellidos: "García López", dorsal: 9, equipo: "Alevín A", posicion: "Delantero", ultimaValoracion: "2025-03-15" },
  { id: "2", nombre: "Miguel", apellidos: "Fernández Ruiz", dorsal: 8, equipo: "Alevín A", posicion: "Centrocampista", ultimaValoracion: "2025-03-15" },
  { id: "3", nombre: "Carlos", apellidos: "Martínez Sanz", dorsal: 4, equipo: "Alevín A", posicion: "Defensa", ultimaValoracion: "2025-02-20" },
  { id: "4", nombre: "David", apellidos: "López Gómez", dorsal: 1, equipo: "Alevín A", posicion: "Portero", ultimaValoracion: "2025-02-20" },
  { id: "5", nombre: "Javier", apellidos: "Sánchez Pérez", dorsal: 2, equipo: "Alevín A", posicion: "Defensa", ultimaValoracion: null },
  { id: "6", nombre: "Alejandro", apellidos: "González Díaz", dorsal: 6, equipo: "Alevín A", posicion: "Centrocampista", ultimaValoracion: null },
  { id: "7", nombre: "Daniel", apellidos: "Pérez Martín", dorsal: 11, equipo: "Alevín A", posicion: "Delantero", ultimaValoracion: null },
]

// Aptitudes a valorar
const aptitudes = [
  { id: "tecnica", nombre: "Técnica" },
  { id: "tactica", nombre: "Táctica" },
  { id: "fisica", nombre: "Física" },
  { id: "mental", nombre: "Mental" },
]

// Trimestres para valoración
const trimestres = [
  { id: "1T-2025", nombre: "1er Trimestre 2025", fechaInicio: "2025-01-01", fechaFin: "2025-03-31" },
  { id: "4T-2024", nombre: "4º Trimestre 2024", fechaInicio: "2024-10-01", fechaFin: "2024-12-31" },
  { id: "3T-2024", nombre: "3er Trimestre 2024", fechaInicio: "2024-07-01", fechaFin: "2024-09-30" },
  { id: "2T-2024", nombre: "2º Trimestre 2024", fechaInicio: "2024-04-01", fechaFin: "2024-06-30" },
]

// Componente para valoración con estrellas
function StarRating({ value, onChange, readOnly = false }) {
  const stars = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
  
  return (
    <div className="flex items-center">
      {stars.map((star) => {
        const isHalf = star % 1 !== 0
        const isFilled = value >= star
        const isHalfFilled = isHalf && value >= star - 0.5 && value < star
        
        return (
          <button
            key={star}
            type="button"
            className={`text-${isFilled || isHalfFilled ? "primary" : "muted-foreground"} ${readOnly ? "cursor-default" : "cursor-pointer"}`}
            onClick={() => !readOnly && onChange(star)}
          >
            {isHalf ? (
              <StarHalf className="h-5 w-5" />
            ) : (
              <Star className="h-5 w-5" fill={isFilled ? "currentColor" : "none"} />
            )}
          </button>
        )
      })}
      <span className="ml-2 text-sm font-medium">{value}</span>
    </div>
  )
}

export default function ValoracionesPage() {
  const [trimestreActual, setTrimestreActual] = React.useState(trimestres[0].id)
  const [filtroJugadores, setFiltroJugadores] = React.useState("todos")
  const [filtroPosicion, setFiltroPosicion] = React.useState("todas")
  const [jugadorSeleccionado, setJugadorSeleccionado] = React.useState<string | null>(null)
  const [valoraciones, setValoraciones] = React.useState<{
    jugadorId: string;
    trimestreId: string;
    aptitudes: {
      [key: string]: number;
    };
    comentarios: string;
  }[]>([])
  
  // Filtrar jugadores según criterios
  const jugadoresFiltrados = React.useMemo(() => {
    return jugadores.filter(jugador => {
      // Filtro por posición
      if (filtroPosicion !== "todas" && jugador.posicion !== filtroPosicion) {
        return false
      }
      
      // Filtro por estado de valoración
      if (filtroJugadores === "pendientes") {
        return !jugador.ultimaValoracion || new Date(jugador.ultimaValoracion) < new Date(trimestres.find(t => t.id === trimestreActual)?.fechaInicio || "")
      } else if (filtroJugadores === "valorados") {
        return jugador.ultimaValoracion && new Date(jugador.ultimaValoracion) >= new Date(trimestres.find(t => t.id === trimestreActual)?.fechaInicio || "")
      }
      
      return true
    })
  }, [filtroJugadores, filtroPosicion, trimestreActual])
  
  // Obtener valoración actual del jugador seleccionado
  const valoracionActual = React.useMemo(() => {
    if (!jugadorSeleccionado) return null
    
    return valoraciones.find(v => 
      v.jugadorId === jugadorSeleccionado && 
      v.trimestreId === trimestreActual
    ) || {
      jugadorId: jugadorSeleccionado,
      trimestreId: trimestreActual,
      aptitudes: aptitudes.reduce((acc, apt) => ({ ...acc, [apt.id]: 0 }), {}),
      comentarios: ""
    }
  }, [jugadorSeleccionado, trimestreActual, valoraciones])
  
  // Actualizar valoración de aptitud
  const handleValoracionChange = (aptitudId: string, valor: number) => {
    if (!jugadorSeleccionado || !valoracionActual) return
    
    const nuevaValoracion = {
      ...valoracionActual,
      aptitudes: {
        ...valoracionActual.aptitudes,
        [aptitudId]: valor
      }
    }
    
    setValoraciones(prev => {
      const index = prev.findIndex(v => 
        v.jugadorId === jugadorSeleccionado && 
        v.trimestreId === trimestreActual
      )
      
      if (index >= 0) {
        const nuevasValoraciones = [...prev]
        nuevasValoraciones[index] = nuevaValoracion
        return nuevasValoraciones
      } else {
        return [...prev, nuevaValoracion]
      }
    })
  }
  
  // Actualizar comentarios
  const handleComentariosChange = (comentarios: string) => {
    if (!jugadorSeleccionado || !valoracionActual) return
    
    const nuevaValoracion = {
      ...valoracionActual,
      comentarios
    }
    
    setValoraciones(prev => {
      const index = prev.findIndex(v => 
        v.jugadorId === jugadorSeleccionado && 
        v.trimestreId === trimestreActual
      )
      
      if (index >= 0) {
        const nuevasValoraciones = [...prev]
        nuevasValoraciones[index] = nuevaValoracion
        return nuevasValoraciones
      } else {
        return [...prev, nuevaValoracion]
      }
    })
  }
  
  // Guardar valoración
  const handleGuardarValoracion = () => {
    // Aquí se enviarían los datos al backend
    console.log("Guardando valoración:", valoracionActual)
    
    // Mostrar mensaje de éxito (en una implementación real)
    alert("Valoración guardada correctamente")
    
    // Limpiar selección
    setJugadorSeleccionado(null)
  }
  
  // Calcular valoración media
  const calcularMedia = (aptitudes: {[key: string]: number}) => {
    if (!aptitudes || Object.keys(aptitudes).length === 0) return 0
    
    const suma = Object.values(aptitudes).reduce((acc, val) => acc + val, 0)
    return suma / Object.keys(aptitudes).length
  }
  
  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Valoraciones Trimestrales</h1>
          <p className="text-muted-foreground">
            Evalúa el rendimiento y progreso de los jugadores
          </p>
        </div>
      </div>
      
      <div className="px-4 py-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <Select value={trimestreActual} onValueChange={setTrimestreActual}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar trimestre" />
            </SelectTrigger>
            <SelectContent>
              {trimestres.map((trimestre) => (
                <SelectItem key={trimestre.id} value={trimestre.id}>
                  {trimestre.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filtroJugadores} onValueChange={setFiltroJugadores}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar jugadores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los jugadores</SelectItem>
              <SelectItem value="pendientes">Pendientes de valorar</SelectItem>
              <SelectItem value="valorados">Ya valorados</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filtroPosicion} onValueChange={setFiltroPosicion}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por posición" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las posiciones</SelectItem>
              <SelectItem value="Portero">Porteros</SelectItem>
              <SelectItem value="Defensa">Defensas</SelectItem>
              <SelectItem value="Centrocampista">Centrocampistas</SelectItem>
              <SelectItem value="Delantero">Delanteros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 px-4 py-2 md:grid-cols-3 lg:px-6">
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Jugadores</CardTitle>
              <CardDescription>
                {trimestres.find(t => t.id === trimestreActual)?.nombre}
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              <div className="space-y-2">
                {jugadoresFiltrados.length > 0 ? (
                  jugadoresFiltrados.map((jugador) => (
                    <div 
                      key={jugador.id} 
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 ${jugadorSeleccionado === jugador.id ? 'bg-muted' : ''}`}
                      onClick={() => setJugadorSeleccionado(jugador.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          {jugador.dorsal}
                        </div>
                        <div>
                          <p className="font-medium">{jugador.nombre} {jugador.apellidos}</p>
                          <p className="text-sm text-muted-foreground">{jugador.posicion}</p>
                        </div>
                      </div>
                      {jugador.ultimaValoracion && new Date(jugador.ultimaValoracion) >= new Date(trimestres.find(t => t.id === trimestreActual)?.fechaInicio || "") ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Valorado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">
                          Pendiente
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex h-20 items-center justify-center text-muted-foreground">
                    No hay jugadores que coincidan con los filtros
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {jugadorSeleccionado ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {jugadores.find(j => j.id === jugadorSeleccionado)?.nombre} {jugadores.find(j => j.id === jugadorSeleccionado)?.apellidos}
                </CardTitle>
                <CardDescription>
                  {jugadores.find(j => j.id === jugadorSeleccionado)?.posicion} - Dorsal {jugadores.find(j => j.id === jugadorSeleccionado)?.dorsal}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-4 text-sm font-medium">Valoración de Aptitudes</h3>
                    <div className="space-y-4">
                      {aptitudes.map((aptitud) => (
                        <div key={aptitud.id} className="flex items-center justify-between">
                          <span className="font-medium">{aptitud.nombre}</span>
                          <StarRating 
                            value={valoracionActual?.aptitudes[aptitud.id] || 0} 
                            onChange={(valor) => handleValoracionChange(aptitud.id, valor)} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-4 text-sm font-medium">Valoración Media</h3>
                    <div className="flex items-center justify-center">
                      <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <span className="text-xl font-bold">{calcularMedia(valoracionActual?.aptitudes || {}).toFixed(1)}</span>
                        <span className="text-xs">/ 5</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-4 text-sm font-medium">Comentarios</h3>
                    <Textarea 
                      placeholder="Añade comentarios sobre el rendimiento y áreas de mejora..." 
                      className="min-h-[100px]"
                      value={valoracionActual?.comentarios || ""}
                      onChange={(e) => handleComentariosChange(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setJugadorSeleccionado(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleGuardarValoracion}>
                  Guardar Valoración
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Star className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Selecciona un Jugador</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Selecciona un jugador de la lista para valorar sus aptitudes técnicas, tácticas, físicas y mentales.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
