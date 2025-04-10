"use client"

import { SectionCards } from "@/components/section-cards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, ClipboardCheckIcon, StarIcon, UsersIcon } from "lucide-react"

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido a la plataforma del Club San Agustín
          </p>
        </div>
      </div>
      
      <SectionCards />
      
      <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:px-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Próximos Eventos</CardTitle>
            <CardDescription>
              Calendario de entrenamientos y partidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-md bg-primary/10 p-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Entrenamiento
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Martes 18:00 - Campo Municipal
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-md bg-primary/10 p-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Partido vs. CD Ebro
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sábado 10:00 - Campo Visitante
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-md bg-primary/10 p-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Reunión técnica
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Jueves 19:30 - Sala de reuniones
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Jugadores Destacados</CardTitle>
            <CardDescription>
              Mejor rendimiento en el último mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-md bg-primary/10 p-2">
                  <UsersIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Carlos Martínez
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Delantero - 100% asistencia
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <StarIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-md bg-primary/10 p-2">
                  <UsersIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Laura Sánchez
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Centrocampista - 95% asistencia
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <StarIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-md bg-primary/10 p-2">
                  <UsersIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Miguel López
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Portero - 90% asistencia
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <StarIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="px-4 lg:px-6">
        <Tabs defaultValue="asistencias">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
              <TabsTrigger value="valoraciones">Valoraciones</TabsTrigger>
              <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
            </TabsList>
          </div>
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
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <ClipboardCheckIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">09/04/2025</p>
                        <p className="text-xs text-muted-foreground">Entrenamiento regular</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">90% asistencia</div>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <ClipboardCheckIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">07/04/2025</p>
                        <p className="text-xs text-muted-foreground">Entrenamiento regular</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">85% asistencia</div>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <ClipboardCheckIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">04/04/2025</p>
                        <p className="text-xs text-muted-foreground">Entrenamiento regular</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">80% asistencia</div>
                  </div>
                </div>
              </CardContent>
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
            </Card>
          </TabsContent>
          <TabsContent value="objetivos" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Objetivos del Equipo</CardTitle>
                <CardDescription>
                  Progreso en los objetivos de la temporada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Mejorar posesión de balón</div>
                      <div className="text-sm font-medium">75%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[75%] rounded-full bg-primary"></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Reducir goles encajados</div>
                      <div className="text-sm font-medium">60%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[60%] rounded-full bg-primary"></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Aumentar efectividad en ataque</div>
                      <div className="text-sm font-medium">50%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[50%] rounded-full bg-primary"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
