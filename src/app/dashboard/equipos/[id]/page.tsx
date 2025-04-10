"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, CalendarIcon, ClipboardCheckIcon, LineChartIcon, PencilIcon, PlusCircle, StarIcon, UsersIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SectionCards } from "@/components/section-cards"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

// Datos de ejemplo - en producción vendrían de la API
const teams = [
  {
    id: "1",
    name: "Alevín A",
    category: "1ª Alevín",
    players: 15,
    coach: "Carlos Martínez",
    image: null,
    asistenciaPromedio: "85%",
    valoracionMedia: 3.8,
    objetivosCumplidos: "65%",
    objetivos: [
      { 
        id: "1", 
        titulo: "Mejorar posesión de balón", 
        descripcion: "Aumentar el tiempo de posesión en partidos al 60%", 
        progreso: 75, 
        fechaCreacion: "2025-01-15",
        fechaLimite: "2025-06-30",
        prioridad: "Alta",
        estado: "En progreso"
      },
      { 
        id: "2", 
        titulo: "Reducir goles encajados", 
        descripcion: "Reducir en un 30% los goles encajados respecto a la temporada anterior", 
        progreso: 60, 
        fechaCreacion: "2025-01-15",
        fechaLimite: "2025-06-30",
        prioridad: "Alta",
        estado: "En progreso"
      },
      { 
        id: "3", 
        titulo: "Aumentar efectividad en ataque", 
        descripcion: "Mejorar la ratio de conversión de ocasiones a goles", 
        progreso: 50, 
        fechaCreacion: "2025-01-15",
        fechaLimite: "2025-06-30",
        prioridad: "Media",
        estado: "En progreso"
      },
      { 
        id: "4", 
        titulo: "Mejorar juego aéreo", 
        descripcion: "Trabajar el juego aéreo tanto defensivo como ofensivo", 
        progreso: 40, 
        fechaCreacion: "2025-01-15",
        fechaLimite: "2025-06-30",
        prioridad: "Media",
        estado: "En progreso"
      }
    ]
  },
  {
    id: "2",
    name: "Benjamín B",
    category: "2ª Benjamín",
    players: 14,
    coach: "Laura Sánchez",
    image: null,
    asistenciaPromedio: "80%",
    valoracionMedia: 3.5,
    objetivosCumplidos: "60%",
    objetivos: [
      { 
        id: "1", 
        titulo: "Mejorar técnica individual", 
        descripcion: "Enfocarse en el control y pase del balón", 
        progreso: 65, 
        fechaCreacion: "2025-01-10",
        fechaLimite: "2025-06-30",
        prioridad: "Alta",
        estado: "En progreso"
      },
      { 
        id: "2", 
        titulo: "Desarrollar juego en equipo", 
        descripcion: "Fomentar la comunicación y el juego colectivo", 
        progreso: 70, 
        fechaCreacion: "2025-01-10",
        fechaLimite: "2025-06-30",
        prioridad: "Alta",
        estado: "En progreso"
      }
    ]
  },
  {
    id: "3",
    name: "Infantil A",
    category: "1ª Infantil",
    players: 18,
    coach: "Miguel López",
    image: null,
    asistenciaPromedio: "90%",
    valoracionMedia: 4.0,
    objetivosCumplidos: "75%",
    objetivos: [
      { 
        id: "1", 
        titulo: "Mejorar condición física", 
        descripcion: "Aumentar resistencia y velocidad", 
        progreso: 80, 
        fechaCreacion: "2025-01-05",
        fechaLimite: "2025-06-30",
        prioridad: "Alta",
        estado: "En progreso"
      },
      { 
        id: "2", 
        titulo: "Perfeccionar sistema táctico", 
        descripcion: "Consolidar el sistema de juego 4-3-3", 
        progreso: 75, 
        fechaCreacion: "2025-01-05",
        fechaLimite: "2025-06-30",
        prioridad: "Alta",
        estado: "En progreso"
      }
    ]
  },
  {
    id: "4",
    name: "Cadete B",
    category: "2ª Cadete",
    players: 16,
    coach: "Ana García",
    image: null,
    asistenciaPromedio: "82%",
    valoracionMedia: 3.7,
    objetivosCumplidos: "70%",
    objetivos: []
  },
  {
    id: "5",
    name: "Juvenil A",
    category: "1ª Juvenil",
    players: 18,
    coach: "Pedro Rodríguez",
    image: null,
    asistenciaPromedio: "88%",
    valoracionMedia: 3.9,
    objetivosCumplidos: "72%",
    objetivos: []
  },
]

// Datos de ejemplo de jugadores
const jugadores = [
  { id: "1", nombre: "Juan", apellidos: "García López", posicion: "Delantero", dorsal: 9, asistencia: "95%" },
  { id: "2", nombre: "Miguel", apellidos: "Fernández Ruiz", posicion: "Centrocampista", dorsal: 8, asistencia: "90%" },
  { id: "3", nombre: "Carlos", apellidos: "Martínez Sanz", posicion: "Defensa", dorsal: 4, asistencia: "85%" },
  { id: "4", nombre: "David", apellidos: "López Gómez", posicion: "Portero", dorsal: 1, asistencia: "100%" },
  { id: "5", nombre: "Javier", apellidos: "Sánchez Pérez", posicion: "Defensa", dorsal: 2, asistencia: "80%" },
  { id: "6", nombre: "Alejandro", apellidos: "González Díaz", posicion: "Centrocampista", dorsal: 6, asistencia: "85%" },
  { id: "7", nombre: "Daniel", apellidos: "Pérez Martín", posicion: "Delantero", dorsal: 11, asistencia: "90%" },
]

// Datos de ejemplo de asistencias
const asistencias = [
  { fecha: "09/04/2025", tipo: "Entrenamiento regular", asistencia: "90%" },
  { fecha: "07/04/2025", tipo: "Entrenamiento regular", asistencia: "85%" },
  { fecha: "04/04/2025", tipo: "Entrenamiento regular", asistencia: "80%" },
  { fecha: "02/04/2025", tipo: "Entrenamiento regular", asistencia: "95%" },
]

export default function EquipoDetallePage() {
  const params = useParams()
  const equipoId = params.id as string
  
  // Encontrar el equipo por ID
  const equipo = teams.find(team => team.id === equipoId) || teams[0]
  
  // Estado para el diálogo de nuevo objetivo
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [nuevoObjetivo, setNuevoObjetivo] = React.useState({
    titulo: "",
    descripcion: "",
    fechaLimite: "",
    prioridad: "Media"
  })
  
  // Estado para edición de progreso
  const [editandoProgreso, setEditandoProgreso] = React.useState<string | null>(null)
  const [nuevoProgreso, setNuevoProgreso] = React.useState<number>(0)
  
  // Manejar cambio en el formulario de nuevo objetivo
  const handleObjetivoChange = (field, value) => {
    setNuevoObjetivo(prev => ({ ...prev, [field]: value }))
  }
  
  // Guardar nuevo objetivo
  const handleGuardarObjetivo = () => {
    // Aquí se enviarían los datos al backend
    console.log("Guardando objetivo:", nuevoObjetivo)
    
    // Cerrar diálogo y resetear formulario
    setDialogOpen(false)
    setNuevoObjetivo({
      titulo: "",
      descripcion: "",
      fechaLimite: "",
      prioridad: "Media"
    })
  }
  
  // Guardar progreso actualizado
  const handleGuardarProgreso = (objetivoId) => {
    // Aquí se enviarían los datos al backend
    console.log("Actualizando progreso:", { objetivoId, progreso: nuevoProgreso })
    
    // Resetear estado de edición
    setEditandoProgreso(null)
    setNuevoProgreso(0)
  }
  
  return (
    <>
      <div className="flex items-center gap-4 px-4 lg:px-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/equipos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{equipo.name}</h1>
          <p className="text-muted-foreground">
            {equipo.category} - Entrenador: {equipo.coach}
          </p>
        </div>
        <Button className="ml-auto" variant="outline">
          <PencilIcon className="mr-2 h-4 w-4" />
          Editar Equipo
        </Button>
      </div>
      
      <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
        <Card className="@container/card">
          <CardHeader className="relative">
            <CardDescription>Total Jugadores</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {equipo.players}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <div className="rounded-full bg-primary/10 p-2">
                <UsersIcon className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Plantilla completa
            </div>
            <div className="text-muted-foreground">
              Temporada 2024-2025
            </div>
          </CardFooter>
        </Card>
        
        <Card className="@container/card">
          <CardHeader className="relative">
            <CardDescription>Asistencia Promedio</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {equipo.asistenciaPromedio}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <div className="rounded-full bg-primary/10 p-2">
                <ClipboardCheckIcon className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Último mes
            </div>
            <div className="text-muted-foreground">
              Basado en todos los entrenamientos
            </div>
          </CardFooter>
        </Card>
        
        <Card className="@container/card">
          <CardHeader className="relative">
            <CardDescription>Valoración Media</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {equipo.valoracionMedia}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <div className="rounded-full bg-primary/10 p-2">
                <StarIcon className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Evaluación trimestral
            </div>
            <div className="text-muted-foreground">
              Promedio de todos los jugadores
            </div>
          </CardFooter>
        </Card>
        
        <Card className="@container/card">
          <CardHeader className="relative">
            <CardDescription>Objetivos Cumplidos</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {equipo.objetivosCumplidos}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <div className="rounded-full bg-primary/10 p-2">
                <LineChartIcon className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Temporada actual
            </div>
            <div className="text-muted-foreground">
              Progreso de objetivos establecidos
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <div className="px-4 lg:px-6">
        <Tabs defaultValue="jugadores">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="jugadores">Jugadores</TabsTrigger>
              <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
              <TabsTrigger value="valoraciones">Valoraciones</TabsTrigger>
              <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="jugadores" className="pt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Jugadores del Equipo</CardTitle>
                  <CardDescription>
                    Listado de jugadores de {equipo.name}
                  </CardDescription>
                </div>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Jugador
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50 text-sm">
                        <th className="p-2 text-left font-medium">Dorsal</th>
                        <th className="p-2 text-left font-medium">Nombre</th>
                        <th className="p-2 text-left font-medium">Posición</th>
                        <th className="p-2 text-left font-medium">Asistencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jugadores.map((jugador) => (
                        <tr key={jugador.id} className="border-b">
                          <td className="p-2">{jugador.dorsal}</td>
                          <td className="p-2">{jugador.nombre} {jugador.apellidos}</td>
                          <td className="p-2">{jugador.posicion}</td>
                          <td className="p-2">{jugador.asistencia}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="asistencias" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Asistencias Recientes</CardTitle>
                <CardDescription>
                  Registro de asistencias de los últimos entrenamientos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {asistencias.map((asistencia, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <ClipboardCheckIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{asistencia.fecha}</p>
                          <p className="text-xs text-muted-foreground">{asistencia.tipo}</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">{asistencia.asistencia}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Ver todas las asistencias
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="valoraciones" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Valoraciones Trimestrales</CardTitle>
                <CardDescription>
                  Evolución de las valoraciones del equipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs font-medium text-muted-foreground">Técnica</div>
                      <div className="text-xl font-bold">3.8</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs font-medium text-muted-foreground">Táctica</div>
                      <div className="text-xl font-bold">3.5</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs font-medium text-muted-foreground">Física</div>
                      <div className="text-xl font-bold">4.2</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs font-medium text-muted-foreground">Mental</div>
                      <div className="text-xl font-bold">3.9</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Realizar nueva valoración
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="objetivos" className="pt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Objetivos del Equipo</CardTitle>
                  <CardDescription>
                    Progreso en los objetivos de la temporada
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Nuevo Objetivo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Nuevo Objetivo</DialogTitle>
                      <DialogDescription>
                        Define un nuevo objetivo para el equipo {equipo.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="titulo">Título del objetivo</Label>
                        <Input 
                          id="titulo" 
                          placeholder="Ej: Mejorar posesión de balón" 
                          value={nuevoObjetivo.titulo}
                          onChange={(e) => handleObjetivoChange("titulo", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea 
                          id="descripcion" 
                          placeholder="Describe el objetivo y cómo se medirá el éxito" 
                          value={nuevoObjetivo.descripcion}
                          onChange={(e) => handleObjetivoChange("descripcion", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fechaLimite">Fecha límite</Label>
                          <Input 
                            id="fechaLimite" 
                            type="date" 
                            value={nuevoObjetivo.fechaLimite}
                            onChange={(e) => handleObjetivoChange("fechaLimite", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="prioridad">Prioridad</Label>
                          <Select 
                            value={nuevoObjetivo.prioridad}
                            onValueChange={(value) => handleObjetivoChange("prioridad", value)}
                          >
                            <SelectTrigger id="prioridad">
                              <SelectValue placeholder="Seleccionar prioridad" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Baja">Baja</SelectItem>
                              <SelectItem value="Media">Media</SelectItem>
                              <SelectItem value="Alta">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleGuardarObjetivo}>
                        Guardar Objetivo
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {equipo.objetivos && equipo.objetivos.length > 0 ? (
                  <div className="space-y-6">
                    {equipo.objetivos.map((objetivo) => (
                      <div key={objetivo.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium">{objetivo.titulo}</h3>
                              <span className={`rounded-full px-2 py-0.5 text-xs ${
                                objetivo.prioridad === "Alta" 
                                  ? "bg-red-100 text-red-800" 
                                  : objetivo.prioridad === "Media"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-green-100 text-green-800"
                              }`}>
                                {objetivo.prioridad}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{objetivo.descripcion}</p>
                          </div>
                          {editandoProgreso === objetivo.id ? (
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                className="w-20" 
                                value={nuevoProgreso}
                                onChange={(e) => setNuevoProgreso(parseInt(e.target.value))}
                              />
                              <Button 
                                size="sm" 
                                onClick={() => handleGuardarProgreso(objetivo.id)}
                              >
                                Guardar
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditandoProgreso(objetivo.id)
                                setNuevoProgreso(objetivo.progreso)
                              }}
                            >
                              <PencilIcon className="mr-2 h-3 w-3" />
                              Editar
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">{objetivo.progreso}%</div>
                            <div className="text-xs text-muted-foreground">
                              Fecha límite: {new Date(objetivo.fechaLimite).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div 
                              className="h-full rounded-full bg-primary" 
                              style={{ width: `${objetivo.progreso}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                    <div className="text-center">
                      <p className="text-sm font-medium">No hay objetivos definidos</p>
                      <p className="text-xs text-muted-foreground">
                        Añade objetivos para hacer seguimiento del progreso del equipo
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/equipos/${equipoId}/objetivos`}>
                    Ver historial de objetivos
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
