"use client"

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SkillsChart } from "@/components/skills-chart"
import { CalendarIcon, CheckCircle, Clock, Edit, Plus, Target, Trophy, Users } from "lucide-react"
import cadeteB from "@/data/cadete-b.json"

// Definir interfaces para los tipos
interface Objetivo {
  id: string;
  titulo: string;
  descripcion: string;
  progreso: number;
  fechaCreacion: string;
  fechaLimite: string;
  prioridad: string;
  estado: string;
}

interface NuevoObjetivo {
  titulo: string;
  descripcion: string;
  fechaLimite: string;
  prioridad: string;
}

export default function EquipoPage() {
  const params = useParams()
  const equipoId = params.id as string

  // Estado para los objetivos
  const [objetivos, setObjetivos] = useState<Objetivo[]>(cadeteB.objetivos as Objetivo[])
  
  // Estado para el diálogo de nuevo objetivo
  const [dialogOpen, setDialogOpen] = useState(false)
  const [nuevoObjetivo, setNuevoObjetivo] = useState<NuevoObjetivo>({
    titulo: "",
    descripcion: "",
    fechaLimite: "",
    prioridad: "Media"
  })
  
  // Datos del equipo
  const equipo = cadeteB.id === equipoId ? cadeteB : cadeteB
  
  // Función para añadir un nuevo objetivo
  const handleAddObjetivo = () => {
    const newId = (objetivos.length + 1).toString()
    const today = new Date().toISOString().split('T')[0]
    
    const nuevoObj: Objetivo = {
      id: newId,
      titulo: nuevoObjetivo.titulo,
      descripcion: nuevoObjetivo.descripcion,
      progreso: 0,
      fechaCreacion: today,
      fechaLimite: nuevoObjetivo.fechaLimite,
      prioridad: nuevoObjetivo.prioridad,
      estado: "Iniciado"
    }
    
    setObjetivos([...objetivos, nuevoObj])
    setDialogOpen(false)
    setNuevoObjetivo({
      titulo: "",
      descripcion: "",
      fechaLimite: "",
      prioridad: "Media"
    })
  }
  
  // Manejar cambio en el formulario de nuevo objetivo
  const handleObjetivoChange = (field: string, value: string) => {
    setNuevoObjetivo(prev => ({ ...prev, [field]: value }))
  }
  
  // Actualizar progreso de un objetivo
  const handleUpdateProgreso = (id: string, newProgreso: number) => {
    setObjetivos(objetivos.map(obj => 
      obj.id === id ? { ...obj, progreso: newProgreso } : obj
    ))
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{equipo.nombre}</h1>
          <p className="text-muted-foreground">{equipo.categoria} - Temporada {equipo.temporada}</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jugadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipo.jugadores}</div>
            <p className="text-xs text-muted-foreground">
              Plantilla actual
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipo.asistenciaPromedio}</div>
            <p className="text-xs text-muted-foreground">
              Promedio de asistencia
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valoración</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipo.valoracionMedia}</div>
            <p className="text-xs text-muted-foreground">
              Valoración media
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objetivos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipo.objetivosCumplidos}</div>
            <p className="text-xs text-muted-foreground">
              Objetivos cumplidos
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-7 mb-6">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Información del equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Entrenador</h3>
                  <p className="text-sm text-muted-foreground">{equipo.entrenador}</p>
                </div>
                <div>
                  <h3 className="font-medium">Categoría</h3>
                  <p className="text-sm text-muted-foreground">{equipo.categoria}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium">Días de entrenamiento</h3>
                <p className="text-sm text-muted-foreground">{equipo.diasEntrenamiento}</p>
              </div>
              <div>
                <h3 className="font-medium">Horario</h3>
                <p className="text-sm text-muted-foreground">{equipo.horarioEntrenamiento}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Próximo partido</h3>
                  <p className="text-sm text-muted-foreground">{equipo.proximoPartido}</p>
                </div>
                <div>
                  <h3 className="font-medium">Último resultado</h3>
                  <p className="text-sm text-muted-foreground">{equipo.ultimoResultado}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Rendimiento del equipo</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <SkillsChart 
              data={[
                { name: 'Técnica', value: 3.8, fullMark: 5 },
                { name: 'Táctica', value: 3.5, fullMark: 5 },
                { name: 'Física', value: 4.2, fullMark: 5 },
                { name: 'Mental', value: 3.9, fullMark: 5 }
              ]} 
            />
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="jugadores" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="jugadores">Jugadores</TabsTrigger>
          <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
          <TabsTrigger value="valoraciones">Valoraciones</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
        </TabsList>
        <TabsContent value="jugadores">
          <Card>
            <CardHeader>
              <CardTitle>Jugadores del equipo</CardTitle>
              <CardDescription>
                Listado de jugadores que forman parte del equipo {equipo.nombre}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Aquí iría el listado de jugadores del equipo</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="asistencias">
          <Card>
            <CardHeader>
              <CardTitle>Registro de asistencias</CardTitle>
              <CardDescription>
                Historial de asistencias a entrenamientos y partidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Aquí iría el historial de asistencias</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="valoraciones">
          <Card>
            <CardHeader>
              <CardTitle>Valoraciones trimestrales</CardTitle>
              <CardDescription>
                Valoraciones de los jugadores por trimestre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Aquí irían las valoraciones trimestrales</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="objetivos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Objetivos del equipo</CardTitle>
                <CardDescription>
                  Objetivos establecidos para la temporada actual
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo objetivo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Añadir nuevo objetivo</DialogTitle>
                    <DialogDescription>
                      Crea un nuevo objetivo para el equipo
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="titulo">Título</Label>
                      <Input 
                        id="titulo" 
                        value={nuevoObjetivo.titulo} 
                        onChange={(e) => handleObjetivoChange('titulo', e.target.value)} 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea 
                        id="descripcion" 
                        value={nuevoObjetivo.descripcion} 
                        onChange={(e) => handleObjetivoChange('descripcion', e.target.value)} 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fechaLimite">Fecha límite</Label>
                      <Input 
                        id="fechaLimite" 
                        type="date" 
                        value={nuevoObjetivo.fechaLimite} 
                        onChange={(e) => handleObjetivoChange('fechaLimite', e.target.value)} 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="prioridad">Prioridad</Label>
                      <Select 
                        value={nuevoObjetivo.prioridad} 
                        onValueChange={(value) => handleObjetivoChange('prioridad', value)}
                      >
                        <SelectTrigger id="prioridad">
                          <SelectValue placeholder="Selecciona la prioridad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Media">Media</SelectItem>
                          <SelectItem value="Baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAddObjetivo}>Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {objetivos.map((objetivo) => (
                  <div key={objetivo.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{objetivo.titulo}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          objetivo.prioridad === 'Alta' ? 'bg-red-100 text-red-800' :
                          objetivo.prioridad === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {objetivo.prioridad}
                        </span>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{objetivo.descripcion}</p>
                    <div className="flex items-center text-xs text-muted-foreground mb-4">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      <span>Fecha límite: {objetivo.fechaLimite}</span>
                      <Clock className="h-3 w-3 ml-3 mr-1" />
                      <span>Creado: {objetivo.fechaCreacion}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Progreso: {objetivo.progreso}%</span>
                        <Select 
                          value={objetivo.progreso.toString()} 
                          onValueChange={(value) => handleUpdateProgreso(objetivo.id, parseInt(value))}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Progreso" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="25">25%</SelectItem>
                            <SelectItem value="50">50%</SelectItem>
                            <SelectItem value="75">75%</SelectItem>
                            <SelectItem value="100">100%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Progress value={objetivo.progreso} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
