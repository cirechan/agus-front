"use client"

import * as React from "react"
import { Star, StarHalf } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

// Datos iniciales cargados desde la API

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
interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}

function StarRating({ value, onChange, readOnly = false }: StarRatingProps) {
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

interface Valoracion {
  id?: number;
  jugadorId: number;
  fecha: string;
  aptitudes: Record<string, number>;
  comentarios: string;
}

export default function ValoracionesPage() {
  const [equipo, setEquipo] = React.useState<any | null>(null)
  const [jugadoresBase, setJugadoresBase] = React.useState<any[]>([])
  const [trimestreActual, setTrimestreActual] = React.useState(trimestres[0].id)
  const [filtroJugadores, setFiltroJugadores] = React.useState("todos")
  const [filtroPosicion, setFiltroPosicion] = React.useState("todas")
  const [jugadorSeleccionado, setJugadorSeleccionado] = React.useState<string | null>(null)
  const [valoraciones, setValoraciones] = React.useState<Valoracion[]>([])

  React.useEffect(() => {
    fetch('/api/valoraciones', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setValoraciones(data))
    const cargarDatos = async () => {
      const equipos = await fetch('/api/equipos', { cache: 'no-store' }).then(res => res.json())
      const eq = equipos[0]
      setEquipo(eq)
      if (eq) {
        const js = await fetch(`/api/jugadores?equipoId=${eq.id}`, { cache: 'no-store' }).then(res => res.json())
        setJugadoresBase(
          js.map((j: any, index: number) => ({
            id: String(j.id),
            nombre: j.nombre,
            dorsal: index + 1,
            equipo: eq.nombre,
            posicion: j.posicion,
          }))
        )
      }
    }
    cargarDatos()
  }, [])

  const jugadores = React.useMemo(() => {
    const t = trimestres.find(t => t.id === trimestreActual)
    return jugadoresBase.map(j => {
      const valorado = valoraciones.some(v =>
        v.jugadorId === Number(j.id) &&
        t && new Date(v.fecha) >= new Date(t.fechaInicio) && new Date(v.fecha) <= new Date(t.fechaFin)
      )
      return { ...j, valorado }
    })
  }, [jugadoresBase, valoraciones, trimestreActual])

  const jugadoresFiltrados = React.useMemo(() => {
    return jugadores.filter(jugador => {
      if (filtroPosicion !== "todas" && jugador.posicion !== filtroPosicion) {
        return false
      }
      if (filtroJugadores === "pendientes") {
        return !jugador.valorado
      } else if (filtroJugadores === "valorados") {
        return jugador.valorado
      }
      return true
    })
  }, [filtroJugadores, filtroPosicion, jugadores])
  
  
  // Obtener valoración actual del jugador seleccionado
  const valoracionActual = React.useMemo(() => {
    if (!jugadorSeleccionado) return null
    const t = trimestres.find(t => t.id === trimestreActual)
    return (
      valoraciones.find(v =>
        v.jugadorId === Number(jugadorSeleccionado) &&
        t && new Date(v.fecha) >= new Date(t.fechaInicio) && new Date(v.fecha) <= new Date(t.fechaFin)
      ) || {
        jugadorId: Number(jugadorSeleccionado),
        fecha: new Date().toISOString(),
        aptitudes: aptitudes.reduce((acc, apt) => ({ ...acc, [apt.id]: 0 }), {} as Record<string, number>),
        comentarios: "",
      }
    )
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
      const index = prev.findIndex(v => v.id === nuevaValoracion.id)
      if (index >= 0) {
        const nuevas = [...prev]
        nuevas[index] = nuevaValoracion as Valoracion
        return nuevas
      }
      return [...prev, nuevaValoracion as Valoracion]
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
      const index = prev.findIndex(v => v.id === nuevaValoracion.id)
      if (index >= 0) {
        const nuevas = [...prev]
        nuevas[index] = nuevaValoracion as Valoracion
        return nuevas
      }
      return [...prev, nuevaValoracion as Valoracion]
    })
    }
  
  
  // Guardar valoración
  const handleGuardarValoracion = async () => {
    if (!valoracionActual) return
    const res = await fetch('/api/valoraciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valoracionActual),
    })
    const saved = await res.json()
    setValoraciones(prev => {
      const index = prev.findIndex(v => v.id === saved.id)
      if (index >= 0) {
        const nuevas = [...prev]
        nuevas[index] = saved
        return nuevas
      }
      return [...prev, saved]
    })
    alert('Valoración guardada correctamente')
    setJugadorSeleccionado(null)
  }

  const handleEliminarValoracion = async () => {
    if (!valoracionActual?.id) return
    await fetch(`/api/valoraciones?id=${valoracionActual.id}`, { method: 'DELETE' })
    setValoraciones(prev => prev.filter(v => v.id !== valoracionActual.id))
    setJugadorSeleccionado(null)
    alert('Valoración eliminada')
  }
  // Calcular valoración media
  const calcularMedia = (aptitudes: Record<string, number>) => {
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
                            <p className="font-medium">{jugador.nombre}</p>
                            <p className="text-sm text-muted-foreground">{jugador.posicion}</p>
                          </div>
                        </div>
                      {jugador.valorado ? (
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
                  {jugadores.find(j => j.id === jugadorSeleccionado)?.nombre}
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
              <CardFooter className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setJugadorSeleccionado(null)}>
                  Cancelar
                </Button>
                {valoracionActual?.id && (
                  <Button variant="destructive" onClick={handleEliminarValoracion}>
                    Eliminar
                  </Button>
                )}
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
