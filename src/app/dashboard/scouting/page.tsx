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

// Datos de ejemplo - en producción vendrían de la API
const jugadoresScouteados = [
  { 
    id: "1", 
    nombre: "Alejandro", 
    apellido: "Martínez", 
    equipo: "CD Leganés", 
    añoNacimiento: 2012,
    demarcacion: "Centrocampista",
    lateralidad: "Derecha",
    altura: "Alto",
    complexion: "Atlético",
    capacidadFisica: 4,
    capacidadTecnica: 5,
    capacidadTactica: 4,
    capacidadDefensiva: 3,
    mental: 4,
    portero: 0,
    propuesta: "FICHAR",
    dificultad: "POSIBLE",
    observaciones: "Excelente visión de juego y técnica. Destaca por su capacidad de pase y control.",
    fechaScouting: "2025-03-15",
    entrenador: "Carlos Pérez",
    equipoCDSA: "Infantil A",
    categoria: "1ª Infantil",
    historial: [
      {
        fechaScouting: "2024-05-20",
        equipo: "EF Alcobendas",
        capacidadFisica: 3,
        capacidadTecnica: 4,
        capacidadTactica: 3,
        capacidadDefensiva: 3,
        mental: 3,
        propuesta: "SEGUIMIENTO",
        observaciones: "Jugador con potencial pero necesita mejorar físicamente."
      }
    ]
  },
  { 
    id: "2", 
    nombre: "Daniel", 
    apellido: "García", 
    equipo: "Rayo Vallecano", 
    añoNacimiento: 2013,
    demarcacion: "Delantero",
    lateralidad: "Izquierda",
    altura: "Altura media",
    complexion: "Atlético",
    capacidadFisica: 5,
    capacidadTecnica: 4,
    capacidadTactica: 3,
    capacidadDefensiva: 2,
    mental: 5,
    portero: 0,
    propuesta: "FICHAR",
    dificultad: "COMPLICADO",
    observaciones: "Delantero muy rápido y con gran definición. Destaca por su velocidad y capacidad goleadora.",
    fechaScouting: "2025-02-28",
    entrenador: "Miguel López",
    equipoCDSA: "Alevín A",
    categoria: "1ª Alevín"
  },
  { 
    id: "3", 
    nombre: "Pablo", 
    apellido: "Rodríguez", 
    equipo: "Atlético de Madrid", 
    añoNacimiento: 2011,
    demarcacion: "Defensa",
    lateralidad: "Derecha",
    altura: "Alto",
    complexion: "Fuerte",
    capacidadFisica: 4,
    capacidadTecnica: 3,
    capacidadTactica: 4,
    capacidadDefensiva: 5,
    mental: 4,
    portero: 0,
    propuesta: "NO FICHAR",
    dificultad: "IMPOSIBLE",
    observaciones: "Defensa central con gran capacidad física y buen juego aéreo. Pertenece a la cantera del Atlético.",
    fechaScouting: "2025-01-15",
    entrenador: "Laura Sánchez",
    equipoCDSA: "Cadete B",
    categoria: "2ª Cadete"
  },
  { 
    id: "4", 
    nombre: "Mario", 
    apellido: "Fernández", 
    equipo: "Getafe CF", 
    añoNacimiento: 2014,
    demarcacion: "Portero",
    lateralidad: "Derecha",
    altura: "Alto",
    complexion: "Atlético",
    capacidadFisica: 3,
    capacidadTecnica: 4,
    capacidadTactica: 4,
    capacidadDefensiva: 3,
    mental: 5,
    portero: 5,
    propuesta: "FICHAR",
    dificultad: "POSIBLE",
    observaciones: "Portero con grandes reflejos y buen juego con los pies. Destaca por su colocación y seguridad.",
    fechaScouting: "2025-03-05",
    entrenador: "Pedro Martín",
    equipoCDSA: "Benjamín A",
    categoria: "1ª Benjamín"
  },
  { 
    id: "5", 
    nombre: "Javier", 
    apellido: "López", 
    equipo: "AD Alcorcón", 
    añoNacimiento: 2012,
    demarcacion: "Centrocampista",
    lateralidad: "Ambas",
    altura: "Altura media",
    complexion: "Delgado",
    capacidadFisica: 3,
    capacidadTecnica: 5,
    capacidadTactica: 5,
    capacidadDefensiva: 3,
    mental: 4,
    portero: 0,
    propuesta: "FICHAR",
    dificultad: "POSIBLE",
    observaciones: "Centrocampista muy técnico y con gran visión de juego. Ambidiestro y con gran capacidad de pase.",
    fechaScouting: "2025-02-10",
    entrenador: "Carlos Pérez",
    equipoCDSA: "Infantil A",
    categoria: "1ª Infantil"
  }
]

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

// Componente para valoración con estrellas
function StarRating({ value, onChange, readOnly = false }) {
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
    jugadorId: null
  })
  
  // Estado para sugerencias de jugadores
  const [sugerencias, setSugerencias] = React.useState<any[]>([])
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
    return jugadoresScouteados.find(j => j.id === jugadorSeleccionado)
  }, [jugadorSeleccionado])
  
  // Manejar cambio en el formulario
  const handleFormChange = (field, value) => {
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
  const handleSeleccionarSugerencia = (jugador) => {
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
  const handleGuardarScouting = () => {
    // Aquí se enviarían los datos al backend
    console.log("Guardando scouting:", formData)
    
    // Mostrar mensaje de éxito (en una implementación real)
    alert(formData.actualizando 
      ? "Valoración de scouting actualizada correctamente" 
      : "Nuevo scouting registrado correctamente"
    )
    
    // Resetear formulario y volver al listado
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
                        <th className="p-2 text-left font-medium">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jugadoresFiltrados.length > 0 ? (
                        jugadoresFiltrados.map((jugador) => (
                          <tr 
                            key={jugador.id} 
                            className="border-b cursor-pointer hover:bg-muted/50"
                            onClick={() => setJugadorSeleccionado(jugador.id)}
                          >
                            <td className="p-2 font-medium">{jugador.nombre} {jugador.apellido}</td>
                            <td className="p-2">{jugador.equipo}</td>
                            <td className="p-2">{jugador.añoNacimiento}</td>
                            <td className="p-2">{jugador.demarcacion}</td>
                            <td className="p-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className="h-4 w-4" 
                                    fill={jugador.capacidadTecnica >= star ? "currentColor" : "none"}
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="p-2">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  jugador.propuesta === "FICHAR" && "bg-green-50 text-green-700",
                                  jugador.propuesta === "NO FICHAR" && "bg-red-50 text-red-700",
                                  jugador.propuesta === "SEGUIMIENTO" && "bg-amber-50 text-amber-700"
                                )}
                              >
                                {jugador.propuesta}
                              </Badge>
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {format(new Date(jugador.fechaScouting), "dd/MM/yyyy")}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-muted-foreground">
                            No se encontraron jugadores que coincidan con los filtros
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            {jugadorSeleccionado && jugadorDetalle && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{jugadorDetalle.nombre} {jugadorDetalle.apellido}</CardTitle>
                      <CardDescription>
                        {jugadorDetalle.equipo} - {jugadorDetalle.añoNacimiento} ({new Date().getFullYear() - jugadorDetalle.añoNacimiento} años)
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        handleSeleccionarSugerencia(jugadorDetalle)
                        setActiveTab("nuevo")
                      }}
                    >
                      Actualizar Scouting
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="mb-4 text-lg font-medium">Información Básica</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Demarcación</p>
                          <p className="text-sm">{jugadorDetalle.demarcacion}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Lateralidad</p>
                          <p className="text-sm">{jugadorDetalle.lateralidad}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Altura</p>
                          <p className="text-sm">{jugadorDetalle.altura}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Complexión</p>
                          <p className="text-sm">{jugadorDetalle.complexion}</p>
                        </div>
                      </div>
                      
                      <h3 className="mb-4 mt-6 text-lg font-medium">Valoración</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Capacidad Física</span>
                          <StarRating value={jugadorDetalle.capacidadFisica} onChange={() => {}} readOnly />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Capacidad Técnica</span>
                          <StarRating value={jugadorDetalle.capacidadTecnica} onChange={() => {}} readOnly />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Capacidad Táctica</span>
                          <StarRating value={jugadorDetalle.capacidadTactica} onChange={() => {}} readOnly />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Capacidad Defensiva</span>
                          <StarRating value={jugadorDetalle.capacidadDefensiva} onChange={() => {}} readOnly />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Mental</span>
                          <StarRating value={jugadorDetalle.mental} onChange={() => {}} readOnly />
                        </div>
                        {jugadorDetalle.demarcacion === "Portero" && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Portero</span>
                            <StarRating value={jugadorDetalle.portero} onChange={() => {}} readOnly />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-6 flex items-center gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Propuesta</p>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              jugadorDetalle.propuesta === "FICHAR" && "bg-green-50 text-green-700",
                              jugadorDetalle.propuesta === "NO FICHAR" && "bg-red-50 text-red-700",
                              jugadorDetalle.propuesta === "SEGUIMIENTO" && "bg-amber-50 text-amber-700"
                            )}
                          >
                            {jugadorDetalle.propuesta}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Dificultad</p>
                          <Badge variant="outline">
                            {jugadorDetalle.dificultad}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="mb-4 text-lg font-medium">Observaciones</h3>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm">{jugadorDetalle.observaciones}</p>
                      </div>
                      
                      <h3 className="mb-4 mt-6 text-lg font-medium">Información del Scouting</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                          <p className="text-sm">{format(new Date(jugadorDetalle.fechaScouting), "dd/MM/yyyy")}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Entrenador</p>
                          <p className="text-sm">{jugadorDetalle.entrenador}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Equipo CDSA</p>
                          <p className="text-sm">{jugadorDetalle.equipoCDSA}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                          <p className="text-sm">{jugadorDetalle.categoria}</p>
                        </div>
                      </div>
                      
                      {jugadorDetalle.historial && jugadorDetalle.historial.length > 0 && (
                        <>
                          <h3 className="mb-4 mt-6 text-lg font-medium">Historial de Scouting</h3>
                          <div className="space-y-4">
                            {jugadorDetalle.historial.map((hist, index) => (
                              <div key={index} className="rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">{format(new Date(hist.fechaScouting), "dd/MM/yyyy")}</p>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      hist.propuesta === "FICHAR" && "bg-green-50 text-green-700",
                                      hist.propuesta === "NO FICHAR" && "bg-red-50 text-red-700",
                                      hist.propuesta === "SEGUIMIENTO" && "bg-amber-50 text-amber-700"
                                    )}
                                  >
                                    {hist.propuesta}
                                  </Badge>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">{hist.equipo}</p>
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                  <div className="text-xs">
                                    <span className="font-medium">Física:</span> {hist.capacidadFisica}
                                  </div>
                                  <div className="text-xs">
                                    <span className="font-medium">Técnica:</span> {hist.capacidadTecnica}
                                  </div>
                                  <div className="text-xs">
                                    <span className="font-medium">Táctica:</span> {hist.capacidadTactica}
                                  </div>
                                </div>
                                <p className="mt-2 text-xs">{hist.observaciones}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setJugadorSeleccionado(null)}
                  >
                    Cerrar
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
                    ? `Actualizar Scouting: ${formData.nombre} ${formData.apellido}`
                    : "Nuevo Scouting de Jugador"
                  }
                </CardTitle>
                <CardDescription>
                  {formData.actualizando 
                    ? "Actualiza la información y valoración del jugador"
                    : "Completa el formulario con la información del jugador ojeado"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-lg font-medium">Información del Entrenador</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="entrenador">Nombre del entrenador</Label>
                        <Input 
                          id="entrenador" 
                          value={formData.entrenador}
                          onChange={(e) => handleFormChange("entrenador", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="equipoCDSA">Equipo CDSA</Label>
                        <Select 
                          value={formData.equipoCDSA}
                          onValueChange={(value) => handleFormChange("equipoCDSA", value)}
                        >
                          <SelectTrigger id="equipoCDSA">
                            <SelectValue placeholder="Seleccionar equipo" />
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
                        <Select 
                          value={formData.categoria}
                          onValueChange={(value) => handleFormChange("categoria", value)}
                        >
                          <SelectTrigger id="categoria">
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="mb-4 text-lg font-medium">Información del Jugador</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre del jugador</Label>
                        <Popover open={openSugerencias} onOpenChange={setOpenSugerencias}>
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input 
                                id="nombre" 
                                value={formData.nombre}
                                onChange={(e) => handleFormChange("nombre", e.target.value)}
                              />
                              {sugerencias.length > 0 && (
                                <ChevronsUpDown className="absolute right-3 top-3 h-4 w-4 opacity-50" />
                              )}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Buscar jugador..." />
                              <CommandEmpty>No se encontraron jugadores</CommandEmpty>
                              <CommandGroup>
                                {sugerencias.map((jugador) => (
                                  <CommandItem
                                    key={jugador.id}
                                    onSelect={() => handleSeleccionarSugerencia(jugador)}
                                    className="flex items-center justify-between"
                                  >
                                    <div>
                                      <span>{jugador.nombre} {jugador.apellido}</span>
                                      <span className="ml-2 text-sm text-muted-foreground">
                                        ({jugador.equipo}, {jugador.añoNacimiento})
                                      </span>
                                    </div>
                                    <Check className="h-4 w-4" />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {formData.actualizando && (
                          <p className="text-xs text-amber-600">
                            Actualizando jugador existente. Se creará un nuevo registro de scouting.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellido">Apellido del jugador</Label>
                        <Input 
                          id="apellido" 
                          value={formData.apellido}
                          onChange={(e) => handleFormChange("apellido", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="equipo">Equipo al que pertenece</Label>
                        <Input 
                          id="equipo" 
                          value={formData.equipo}
                          onChange={(e) => handleFormChange("equipo", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="añoNacimiento">Año de nacimiento</Label>
                        <Select 
                          value={formData.añoNacimiento.toString()}
                          onValueChange={(value) => handleFormChange("añoNacimiento", parseInt(value))}
                        >
                          <SelectTrigger id="añoNacimiento">
                            <SelectValue placeholder="Seleccionar año" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 18 + i).reverse().map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="mb-4 text-lg font-medium">Características Físicas</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor="demarcacion">Demarcación</Label>
                        <Select 
                          value={formData.demarcacion}
                          onValueChange={(value) => handleFormChange("demarcacion", value)}
                        >
                          <SelectTrigger id="demarcacion">
                            <SelectValue placeholder="Seleccionar" />
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
                            <SelectValue placeholder="Seleccionar" />
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
                            <SelectValue placeholder="Seleccionar" />
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
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {complexiones.map(comp => (
                              <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="mb-4 text-lg font-medium">Análisis de Juego</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="capacidadFisica" className="font-medium">Capacidad Física</Label>
                        <StarRating 
                          value={formData.capacidadFisica} 
                          onChange={(valor) => handleFormChange("capacidadFisica", valor)} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="capacidadTecnica" className="font-medium">Capacidad Técnica</Label>
                        <StarRating 
                          value={formData.capacidadTecnica} 
                          onChange={(valor) => handleFormChange("capacidadTecnica", valor)} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="capacidadTactica" className="font-medium">Capacidad Táctica</Label>
                        <StarRating 
                          value={formData.capacidadTactica} 
                          onChange={(valor) => handleFormChange("capacidadTactica", valor)} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="capacidadDefensiva" className="font-medium">Capacidad Defensiva</Label>
                        <StarRating 
                          value={formData.capacidadDefensiva} 
                          onChange={(valor) => handleFormChange("capacidadDefensiva", valor)} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="mental" className="font-medium">Mental</Label>
                        <StarRating 
                          value={formData.mental} 
                          onChange={(valor) => handleFormChange("mental", valor)} 
                        />
                      </div>
                      {formData.demarcacion === "Portero" && (
                        <div className="flex items-center justify-between">
                          <Label htmlFor="portero" className="font-medium">Portero</Label>
                          <StarRating 
                            value={formData.portero} 
                            onChange={(valor) => handleFormChange("portero", valor)} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="mb-4 text-lg font-medium">Propuesta y Dificultad</h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-3">
                        <Label className="font-medium">Propuesta</Label>
                        <RadioGroup 
                          value={formData.propuesta}
                          onValueChange={(value) => handleFormChange("propuesta", value)}
                        >
                          {propuestas.map(prop => (
                            <div key={prop} className="flex items-center space-x-2">
                              <RadioGroupItem value={prop} id={`propuesta-${prop}`} />
                              <Label htmlFor={`propuesta-${prop}`}>{prop}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <div className="space-y-3">
                        <Label className="font-medium">Dificultad del fichaje</Label>
                        <RadioGroup 
                          value={formData.dificultad}
                          onValueChange={(value) => handleFormChange("dificultad", value)}
                        >
                          {dificultades.map(dif => (
                            <div key={dif} className="flex items-center space-x-2">
                              <RadioGroupItem value={dif} id={`dificultad-${dif}`} />
                              <Label htmlFor={`dificultad-${dif}`}>{dif}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones personales</Label>
                    <Textarea 
                      id="observaciones" 
                      placeholder="Añade comentarios sobre el jugador, aspectos destacados, áreas de mejora, etc."
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
                  {formData.actualizando ? "Actualizar Scouting" : "Guardar Scouting"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
