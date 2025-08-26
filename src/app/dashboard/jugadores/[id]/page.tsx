"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CalendarIcon, ClipboardCheckIcon, LineChartIcon, PencilIcon, TrendingUpIcon, UsersIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { SkillsChart } from "@/components/skills-chart"
import { Separator } from "@/components/ui/separator"
import cadeteB from "@/data/cadete-b.json"

const jugadores = cadeteB.jugadores

export default function JugadorDetallePage() {
  const params = useParams()
  const jugadorId = params.id as string
  
  // Encontrar el jugador por ID
  const jugador = jugadores.find(j => j.id === jugadorId) || jugadores[0]
  
  // Calcular edad
  const edad = new Date().getFullYear() - new Date(jugador.fechaNacimiento).getFullYear()
  
  return (
    <>
      <div className="flex items-center gap-4 px-4 lg:px-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/jugadores">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{jugador.nombre} {jugador.apellidos}</h1>
          <p className="text-muted-foreground">
            {jugador.equipo} - {jugador.categoria}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {jugador.posicion}
          </Badge>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-primary-foreground">
            {jugador.dorsal}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 px-4 py-6 md:grid-cols-3 lg:px-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Edad</p>
                    <p className="text-sm">{edad} años</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha Nacimiento</p>
                    <p className="text-sm">{new Date(jugador.fechaNacimiento).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Posición</p>
                    <p className="text-sm">{jugador.posicion}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dorsal</p>
                    <p className="text-sm">{jugador.dorsal}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Equipo Actual</p>
                  <p className="text-sm">{jugador.equipo} - {jugador.categoria}</p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Historial de Equipos</p>
                  <div className="mt-2 space-y-2">
                    {jugador.historialEquipos.map((historial, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{historial.temporada}</span>
                        <span>{historial.equipo} - {historial.categoria}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <SkillsChart 
            data={jugador.aptitudes}
            title="Aptitudes del Jugador"
            description="Valoración actual en escala de 1 a 5"
            footer={
              <div className="flex items-center gap-2 font-medium leading-none">
                Progresión positiva <TrendingUpIcon className="h-4 w-4" />
              </div>
            }
          />
        </div>
      </div>
      
      <div className="px-4 lg:px-6">
        <Tabs defaultValue="valoraciones">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="valoraciones">Valoraciones</TabsTrigger>
              <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
              <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="valoraciones" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Valoraciones</CardTitle>
                <CardDescription>
                  Evolución de las aptitudes del jugador
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {jugador.historialValoraciones.map((valoracion, index) => (
                    <div key={index} className="border-b pb-6 last:border-0 last:pb-0">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">{valoracion.trimestre}</h3>
                          <p className="text-sm text-muted-foreground">Fecha: {new Date(valoracion.fecha).toLocaleDateString()}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <PencilIcon className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="aspect-square max-h-[200px]">
                          <SkillsChart 
                            data={valoracion.aptitudes}
                            title=""
                            description=""
                          />
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-medium">Comentarios</h4>
                          <p className="text-sm text-muted-foreground">{valoracion.comentarios}</p>
                          
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            {valoracion.aptitudes.map((aptitud, i) => (
                              <div key={i}>
                                <p className="text-xs font-medium text-muted-foreground">{aptitud.name}</p>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-full rounded-full bg-muted">
                                    <div 
                                      className="h-full rounded-full bg-primary" 
                                      style={{ width: `${(aptitud.value / aptitud.fullMark) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium">{aptitud.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Nueva Valoración
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="asistencias" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Asistencias</CardTitle>
                <CardDescription>
                  Asistencia a entrenamientos y partidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50 text-sm">
                        <th className="p-2 text-left font-medium">Fecha</th>
                        <th className="p-2 text-left font-medium">Tipo</th>
                        <th className="p-2 text-left font-medium">Asistencia</th>
                        <th className="p-2 text-left font-medium">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jugador.asistencias.map((asistencia, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{new Date(asistencia.fecha).toLocaleDateString()}</td>
                          <td className="p-2">{asistencia.tipo}</td>
                          <td className="p-2">
                            {asistencia.asistio ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">Presente</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700">Ausente</Badge>
                            )}
                          </td>
                          <td className="p-2">{asistencia.motivo || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex w-full items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">Asistencia total:</span> {jugador.asistencia}
                  </div>
                  <Button variant="outline">
                    Ver historial completo
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="estadisticas" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas del Jugador</CardTitle>
                <CardDescription>
                  Rendimiento y evolución
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Progresión de Aptitudes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {jugador.aptitudes.map((aptitud, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{aptitud.name}</div>
                              <div className="text-sm font-medium">{aptitud.value}/5</div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div 
                                className="h-full rounded-full bg-primary" 
                                style={{ width: `${(aptitud.value / aptitud.fullMark) * 100}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              +{(Math.random() * 0.5).toFixed(1)} desde la última evaluación
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Resumen de Temporada</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="rounded-md bg-primary/10 p-2">
                            <ClipboardCheckIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Asistencia a Entrenamientos
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {jugador.asistencia} de asistencia total
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="rounded-md bg-primary/10 p-2">
                            <LineChartIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Valoración Media
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {jugador.valoracionMedia}/5 en la temporada actual
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="rounded-md bg-primary/10 p-2">
                            <TrendingUpIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Progresión
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Mejora constante en aspectos técnicos y físicos
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
