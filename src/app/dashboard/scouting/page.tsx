"use client"

import * as React from "react"
import { Check, ChevronsUpDown, FilterIcon, PlusCircle, Search, Star } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

// Datos obtenidos desde la API

// Opciones para los selectores
const demarcaciones = ["Portero", "Defensa", "Centrocampista", "Delantero"]
const lateralidades = ["Derecha", "Izquierda", "Ambas"]
const alturas = ["Alto", "Altura media", "Bajo"]
const complexiones = ["Fuerte", "Atlético", "Delgado", "Fuera de forma"]
const propuestas = ["FICHAR", "NO FICHAR", "SEGUIMIENTO"]
const dificultades = ["POSIBLE", "COMPLICADO", "IMPOSIBLE"]
const categorias = ["Prebenjamín", "Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil"]
const equiposCDSA = [
  "Prebenjamín A", "Prebenjamín B", 
  "Benjamín A", "Benjamín B", 
  "Alevín A", "Alevín B", 
  "Infantil A", "Infantil B", 
  "Cadete A", "Cadete B", 
  "Juvenil A", "Juvenil B"
]

// Definir interfaces para los tipos
interface Jugador {
  id: string;
  nombre: string;
  apellido: string;
  equipo: string;
  añoNacimiento: number;
  demarcacion: string;
  lateralidad: string;
  altura: string;
  complexion: string;
  capacidadFisica: number;
  capacidadTecnica: number;
  capacidadTactica: number;
  capacidadDefensiva: number;
  mental: number;
  portero: number;
  propuesta: string;
  dificultad: string;
  observaciones: string;
  fechaScouting: string;
  entrenador: string;
  equipoCDSA: string;
  categoria: string;
  historial?: any[];
}

// Componente para valoración con estrellas
interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}

function StarRating({ value, onChange, readOnly = false }: StarRatingProps) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-${value >= star ? "primary" : "muted-foreground"} ${readOnly ? "cursor-default" : "cursor-pointer"}`}
          onClick={() => !readOnly && onChange(star)}
        >
          <Star className="h-5 w-5" fill={value >= star ? "currentColor" : "none"} />
        </button>
      ))}
      {value > 0 && <span className="ml-2 text-sm font-medium">{value}</span>}
    </div>
  )
}

export default function ScoutingPage() {
  const [activeTab, setActiveTab] = React.useState("listado")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filtroCategoria, setFiltroCategoria] = React.useState("todas")
  const [filtroPropuesta, setFiltroPropuesta] = React.useState("todas")
  const [filtroDemarcacion, setFiltroDemarcacion] = React.useState("todas")
  const [jugadorSeleccionado, setJugadorSeleccionado] = React.useState<string | null>(null)
  const [jugadoresScouteados, setJugadoresScouteados] = React.useState<Jugador[]>([])

  React.useEffect(() => {
    fetch('/api/scouting')
      .then(res => res.json())
      .then(data => setJugadoresScouteados(data))
  }, [])
  
  // Estado para el formulario de nuevo scouting
  const [formData, setFormData] = React.useState({
    entrenador: "",
    equipoCDSA: "",
    categoria: "",
    nombre: "",
    apellido: "",
    equipo: "",
    añoNacimiento: new Date().getFullYear() - 10,
    demarcacion: "",
    lateralidad: "",
    altura: "",
    complexion: "",
    capacidadFisica: 0,
    capacidadTecnica: 0,
    capacidadTactica: 0,
    capacidadDefensiva: 0,
    mental: 0,
    portero: 0,
    propuesta: "",
    dificultad: "",
    observaciones: "",
    actualizando: false,
    jugadorId: null as string | null
  })
  
  // Estado para sugerencias de jugadores
  const [sugerencias, setSugerencias] = React.useState<Jugador[]>([])
  const [openSugerencias, setOpenSugerencias] = React.useState(false)
  
  // Filtrar jugadores según criterios
  const jugadoresFiltrados = React.useMemo(() => {
    return jugadoresScouteados.filter(jugador => {
      // Filtro por búsqueda
      if (searchQuery && !`${jugador.nombre} ${jugador.apellido} ${jugador.equipo}`.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Filtro por categoría (basado en año de nacimiento)
      if (filtroCategoria !== "todas") {
        const edad = new Date().getFullYear() - jugador.añoNacimiento
        
        if (filtroCategoria === "Prebenjamín" && (edad < 6 || edad > 7)) return false
        if (filtroCategoria === "Benjamín" && (edad < 8 || edad > 9)) return false
        if (filtroCategoria === "Alevín" && (edad < 10 || edad > 11)) return false
        if (filtroCategoria === "Infantil" && (edad < 12 || edad > 13)) return false
        if (filtroCategoria === "Cadete" && (edad < 14 || edad > 15)) return false
        if (filtroCategoria === "Juvenil" && (edad < 16 || edad > 18)) return false
      }
      
      // Filtro por propuesta
      if (filtroPropuesta !== "todas" && jugador.propuesta !== filtroPropuesta) {
        return false
      }
      
      // Filtro por demarcación
      if (filtroDemarcacion !== "todas" && jugador.demarcacion !== filtroDemarcacion) {
        return false
      }
      
      return true
    })
  }, [searchQuery, filtroCategoria, filtroPropuesta, filtroDemarcacion])
  
  // Obtener jugador seleccionado
  const jugadorDetalle = React.useMemo(() => {
    return jugadoresScouteados.find(j => j.id === jugadorSeleccionado) as Jugador | undefined
  }, [jugadorSeleccionado])
  
  // Manejar cambio en el formulario
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Si cambia nombre o apellido, buscar sugerencias
    if (field === "nombre" || field === "apellido") {
      const nombreCompleto = field === "nombre" 
        ? `${value} ${formData.apellido}`.toLowerCase()
        : `${formData.nombre} ${value}`.toLowerCase()
      
      if (nombreCompleto.length > 3) {
        const sugerenciasEncontradas = jugadoresScouteados.filter(j => 
          `${j.nombre} ${j.apellido}`.toLowerCase().includes(nombreCompleto)
        )
        setSugerencias(sugerenciasEncontradas)
        setOpenSugerencias(sugerenciasEncontradas.length > 0)
      } else {
        setSugerencias([])
        setOpenSugerencias(false)
      }
    }
  }
  
  // Seleccionar jugador sugerido
  const handleSeleccionarSugerencia = (jugador: Jugador) => {
    setFormData({
      ...formData,
      nombre: jugador.nombre,
      apellido: jugador.apellido,
      equipo: jugador.equipo,
      añoNacimiento: jugador.añoNacimiento,
      demarcacion: jugador.demarcacion,
      lateralidad: jugador.lateralidad,
      altura: jugador.altura,
      complexion: jugador.complexion,
      actualizando: true,
      jugadorId: jugador.id
    })
    setOpenSugerencias(false)
  }
  
  // Resetear formulario
  const resetForm = () => {
    setFormData({
      entrenador: "",
      equipoCDSA: "",
      categoria: "",
      nombre: "",
      apellido: "",
      equipo: "",
      añoNacimiento: new Date().getFullYear() - 10,
      demarcacion: "",
      lateralidad: "",
      altura: "",
      complexion: "",
      capacidadFisica: 0,
      capacidadTecnica: 0,
      capacidadTactica: 0,
      capacidadDefensiva: 0,
      mental: 0,
      portero: 0,
      propuesta: "",
      dificultad: "",
      observaciones: "",
      actualizando: false,
      jugadorId: null
    })
    setSugerencias([])
    setOpenSugerencias(false)
  }
  
  // Guardar scouting
  const handleGuardarScouting = async () => {
    const { actualizando, jugadorId, ...payload } = formData as any
    const method = actualizando ? 'PUT' : 'POST'
    const body = actualizando ? { id: jugadorId, ...payload } : payload
    const res = await fetch('/api/scouting', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const saved = await res.json()
    setJugadoresScouteados(prev => actualizando
      ? prev.map(j => j.id === saved.id ? saved : j)
      : [...prev, saved]
    )
    alert(actualizando
      ? "Valoración de scouting actualizada correctamente"
      : "Nuevo scouting registrado correctamente"
    )
    resetForm()
    setActiveTab("listado")
  }
  
  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Scouting de Jugadores</h1>
          <p className="text-muted-foreground">
            Gestiona el seguimiento de jugadores externos
          </p>
        </div>
        <Button onClick={() => {
          resetForm()
          setActiveTab("nuevo")
        }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Scouting
        </Button>
      </div>
      
      <div className="px-4 py-4 lg:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="listado">Listado de Scouting</TabsTrigger>
            <TabsTrigger value="nuevo">Nuevo Scouting</TabsTrigger>
          </TabsList>
          
          <TabsContent value="listado" className="pt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Jugadores Scouteados</CardTitle>
                    <CardDescription>
                      Base de datos de jugadores externos evaluados
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        {categorias.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={filtroPropuesta} onValueChange={setFiltroPropuesta}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Propuesta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        {propuestas.map(prop => (
                          <SelectItem key={prop} value={prop}>{prop}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={filtroDemarcacion} onValueChange={setFiltroDemarcacion}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Demarcación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        {demarcaciones.map(dem => (
                          <SelectItem key={dem} value={dem}>{dem}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="relative mt-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar jugadores..."
                    className="w-full pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50 text-sm">
                        <th className="p-2 text-left font-medium">Jugador</th>
                        <th className="p-2 text-left font-medium">Equipo</th>
                        <th className="p-2 text-left font-medium">Año</th>
                        <th className="p-2 text-left font-medium">Demarcación</th>
                        <th className="p-2 text-left font-medium">Valoración</th>
                        <th className="p-2 text-left font-medium">Propuesta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jugadoresFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            No se encontraron jugadores con los criterios seleccionados
                          </td>
                        </tr>
                      ) : (
                        jugadoresFiltrados.map((jugador) => {
                          // Calcular valoración media
                          const valoracionMedia = Math.round(
                            (jugador.capacidadFisica + 
                             jugador.capacidadTecnica + 
                             jugador.capacidadTactica + 
                             jugador.capacidadDefensiva + 
                             jugador.mental) / 5
                          )
                          
                          return (
                            <tr 
                              key={jugador.id} 
                              className="border-b hover:bg-muted/50 cursor-pointer"
                              onClick={() => setJugadorSeleccionado(jugador.id)}
                            >
                              <td className="p-2">
                                <div className="font-medium">{jugador.nombre} {jugador.apellido}</div>
                              </td>
                              <td className="p-2">{jugador.equipo}</td>
                              <td className="p-2">{jugador.añoNacimiento}</td>
                              <td className="p-2">{jugador.demarcacion}</td>
                              <td className="p-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className="h-4 w-4" 
                                      fill={i < valoracionMedia ? "currentColor" : "none"}
                                    />
                                  ))}
                                </div>
                              </td>
                              <td className="p-2">
                                <Badge variant={
                                  jugador.propuesta === "FICHAR" ? "default" :
                                  jugador.propuesta === "NO FICHAR" ? "destructive" :
                                  "outline"
                                }>
                                  {jugador.propuesta}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            {jugadorDetalle && (
              <Card className="mt-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Detalle del Jugador</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setJugadorSeleccionado(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                  <CardDescription>
                    Información completa y valoración del jugador
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {jugadorDetalle.nombre} {jugadorDetalle.apellido}
                      </h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm font-medium">Equipo</p>
                            <p className="text-sm text-muted-foreground">{jugadorDetalle.equipo}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Año de nacimiento</p>
                            <p className="text-sm text-muted-foreground">{jugadorDetalle.añoNacimiento}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm font-medium">Demarcación</p>
                            <p className="text-sm text-muted-foreground">{jugadorDetalle.demarcacion}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Lateralidad</p>
                            <p className="text-sm text-muted-foreground">{jugadorDetalle.lateralidad}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm font-medium">Altura</p>
                            <p className="text-sm text-muted-foreground">{jugadorDetalle.altura}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Complexión</p>
                            <p className="text-sm text-muted-foreground">{jugadorDetalle.complexion}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Fecha de scouting</p>
                          <p className="text-sm text-muted-foreground">{jugadorDetalle.fechaScouting}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Entrenador</p>
                          <p className="text-sm text-muted-foreground">{jugadorDetalle.entrenador}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Equipo CDSA recomendado</p>
                          <p className="text-sm text-muted-foreground">{jugadorDetalle.equipoCDSA}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Observaciones</p>
                          <p className="text-sm text-muted-foreground">{jugadorDetalle.observaciones}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Valoración técnica</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Capacidad física</span>
                            <StarRating value={jugadorDetalle.capacidadFisica} onChange={() => {}} readOnly />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Capacidad técnica</span>
                            <StarRating value={jugadorDetalle.capacidadTecnica} onChange={() => {}} readOnly />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Capacidad táctica</span>
                            <StarRating value={jugadorDetalle.capacidadTactica} onChange={() => {}} readOnly />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Capacidad defensiva</span>
                            <StarRating value={jugadorDetalle.capacidadDefensiva} onChange={() => {}} readOnly />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Mental</span>
                            <StarRating value={jugadorDetalle.mental} onChange={() => {}} readOnly />
                          </div>
                          {jugadorDetalle.demarcacion === "Portero" && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Portero</span>
                              <StarRating value={jugadorDetalle.portero} onChange={() => {}} readOnly />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Propuesta</h4>
                          <Badge variant={
                            jugadorDetalle.propuesta === "FICHAR" ? "default" :
                            jugadorDetalle.propuesta === "NO FICHAR" ? "destructive" :
                            "outline"
                          }>
                            {jugadorDetalle.propuesta}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Dificultad</h4>
                          <Badge variant="outline">
                            {jugadorDetalle.dificultad}
                          </Badge>
                        </div>
                      </div>
                      
                      {jugadorDetalle.historial && jugadorDetalle.historial.length > 0 && (
                        <div className="pt-4">
                          <h4 className="text-sm font-medium mb-2">Historial de scouting</h4>
                          <div className="space-y-2">
                            {jugadorDetalle.historial.map((registro, index) => (
                              <div key={index} className="border rounded-md p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">{registro.fechaScouting}</span>
                                  <span className="text-xs text-muted-foreground">{registro.equipo}</span>
                                </div>
                                <div className="text-xs mb-1">
                                  Valoración: {Math.round((
                                    registro.capacidadFisica + 
                                    registro.capacidadTecnica + 
                                    registro.capacidadTactica + 
                                    registro.capacidadDefensiva + 
                                    registro.mental) / 5
                                  )}/5
                                </div>
                                <div className="text-xs text-muted-foreground">{registro.observaciones}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await fetch(`/api/scouting?id=${jugadorDetalle?.id}`, { method: 'DELETE' })
                      setJugadoresScouteados(prev => prev.filter(j => j.id !== jugadorDetalle?.id))
                      alert('Registro eliminado')
                      setJugadorSeleccionado(null)
                    }}
                  >
                    Eliminar
                  </Button>
                  <Button
                    onClick={() => {
                      // Preparar formulario con datos del jugador
                      setFormData({
                        entrenador: "",
                        equipoCDSA: jugadorDetalle.equipoCDSA,
                        categoria: jugadorDetalle.categoria,
                        nombre: jugadorDetalle.nombre,
                        apellido: jugadorDetalle.apellido,
                        equipo: jugadorDetalle.equipo,
                        añoNacimiento: jugadorDetalle.añoNacimiento,
                        demarcacion: jugadorDetalle.demarcacion,
                        lateralidad: jugadorDetalle.lateralidad,
                        altura: jugadorDetalle.altura,
                        complexion: jugadorDetalle.complexion,
                        capacidadFisica: 0,
                        capacidadTecnica: 0,
                        capacidadTactica: 0,
                        capacidadDefensiva: 0,
                        mental: 0,
                        portero: 0,
                        propuesta: "",
                        dificultad: "",
                        observaciones: "",
                        actualizando: true,
                        jugadorId: jugadorDetalle.id
                      })
                      setActiveTab("nuevo")
                    }}
                  >
                    Nueva valoración
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="nuevo" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {formData.actualizando 
                    ? "Nueva valoración de scouting" 
                    : "Registrar nuevo jugador"
                  }
                </CardTitle>
                <CardDescription>
                  {formData.actualizando 
                    ? `Añadir nueva valoración para ${formData.nombre} ${formData.apellido}` 
                    : "Completa el formulario para registrar un nuevo jugador scouteado"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="entrenador">Entrenador que realiza el scouting</Label>
                      <Input 
                        id="entrenador" 
                        placeholder="Tu nombre" 
                        value={formData.entrenador}
                        onChange={(e) => handleFormChange("entrenador", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="equipoCDSA">Equipo CDSA recomendado</Label>
                      <Select 
                        value={formData.equipoCDSA} 
                        onValueChange={(value) => handleFormChange("equipoCDSA", value)}
                      >
                        <SelectTrigger id="equipoCDSA">
                          <SelectValue placeholder="Selecciona equipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {equiposCDSA.map(equipo => (
                            <SelectItem key={equipo} value={equipo}>{equipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoría</Label>
                      <Input 
                        id="categoria" 
                        placeholder="Ej: 1ª Alevín" 
                        value={formData.categoria}
                        onChange={(e) => handleFormChange("categoria", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <div className="relative">
                        <Input 
                          id="nombre" 
                          placeholder="Nombre del jugador" 
                          value={formData.nombre}
                          onChange={(e) => handleFormChange("nombre", e.target.value)}
                        />
                        {openSugerencias && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md">
                            <div className="p-2 text-xs text-muted-foreground">
                              Jugadores encontrados:
                            </div>
                            {sugerencias.map(jugador => (
                              <div 
                                key={jugador.id}
                                className="p-2 hover:bg-muted cursor-pointer"
                                onClick={() => handleSeleccionarSugerencia(jugador)}
                              >
                                <div className="font-medium">{jugador.nombre} {jugador.apellido}</div>
                                <div className="text-xs text-muted-foreground">{jugador.equipo} ({jugador.añoNacimiento})</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido">Apellido</Label>
                      <Input 
                        id="apellido" 
                        placeholder="Apellido del jugador" 
                        value={formData.apellido}
                        onChange={(e) => handleFormChange("apellido", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="equipo">Equipo actual</Label>
                      <Input 
                        id="equipo" 
                        placeholder="Equipo donde juega" 
                        value={formData.equipo}
                        onChange={(e) => handleFormChange("equipo", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="añoNacimiento">Año de nacimiento</Label>
                      <Input 
                        id="añoNacimiento" 
                        type="number" 
                        min={2000}
                        max={new Date().getFullYear()}
                        value={formData.añoNacimiento}
                        onChange={(e) => handleFormChange("añoNacimiento", parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="demarcacion">Demarcación</Label>
                      <Select 
                        value={formData.demarcacion} 
                        onValueChange={(value) => handleFormChange("demarcacion", value)}
                      >
                        <SelectTrigger id="demarcacion">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {demarcaciones.map(dem => (
                            <SelectItem key={dem} value={dem}>{dem}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lateralidad">Lateralidad</Label>
                      <Select 
                        value={formData.lateralidad} 
                        onValueChange={(value) => handleFormChange("lateralidad", value)}
                      >
                        <SelectTrigger id="lateralidad">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {lateralidades.map(lat => (
                            <SelectItem key={lat} value={lat}>{lat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altura">Altura</Label>
                      <Select 
                        value={formData.altura} 
                        onValueChange={(value) => handleFormChange("altura", value)}
                      >
                        <SelectTrigger id="altura">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {alturas.map(alt => (
                            <SelectItem key={alt} value={alt}>{alt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complexion">Complexión</Label>
                      <Select 
                        value={formData.complexion} 
                        onValueChange={(value) => handleFormChange("complexion", value)}
                      >
                        <SelectTrigger id="complexion">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {complexiones.map(comp => (
                            <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Valoración técnica</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="capacidadFisica">Capacidad física</Label>
                          <StarRating 
                            value={formData.capacidadFisica} 
                            onChange={(value) => handleFormChange("capacidadFisica", value)} 
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="capacidadTecnica">Capacidad técnica</Label>
                          <StarRating 
                            value={formData.capacidadTecnica} 
                            onChange={(value) => handleFormChange("capacidadTecnica", value)} 
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="capacidadTactica">Capacidad táctica</Label>
                          <StarRating 
                            value={formData.capacidadTactica} 
                            onChange={(value) => handleFormChange("capacidadTactica", value)} 
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="capacidadDefensiva">Capacidad defensiva</Label>
                          <StarRating 
                            value={formData.capacidadDefensiva} 
                            onChange={(value) => handleFormChange("capacidadDefensiva", value)} 
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="mental">Mental</Label>
                          <StarRating 
                            value={formData.mental} 
                            onChange={(value) => handleFormChange("mental", value)} 
                          />
                        </div>
                        {formData.demarcacion === "Portero" && (
                          <div className="flex items-center justify-between">
                            <Label htmlFor="portero">Portero</Label>
                            <StarRating 
                              value={formData.portero} 
                              onChange={(value) => handleFormChange("portero", value)} 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="propuesta">Propuesta</Label>
                      <Select 
                        value={formData.propuesta} 
                        onValueChange={(value) => handleFormChange("propuesta", value)}
                      >
                        <SelectTrigger id="propuesta">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {propuestas.map(prop => (
                            <SelectItem key={prop} value={prop}>{prop}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dificultad">Dificultad</Label>
                      <Select 
                        value={formData.dificultad} 
                        onValueChange={(value) => handleFormChange("dificultad", value)}
                      >
                        <SelectTrigger id="dificultad">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {dificultades.map(dif => (
                            <SelectItem key={dif} value={dif}>{dif}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea 
                      id="observaciones" 
                      placeholder="Comentarios sobre el jugador, aspectos destacados, áreas de mejora..." 
                      className="min-h-[100px]"
                      value={formData.observaciones}
                      onChange={(e) => handleFormChange("observaciones", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => {
                  resetForm()
                  setActiveTab("listado")
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleGuardarScouting}>
                  {formData.actualizando ? "Guardar valoración" : "Registrar jugador"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
