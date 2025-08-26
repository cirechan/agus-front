"use client"

import * as React from "react"
import { TrendingUpIcon, UsersIcon, ClipboardCheckIcon, StarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import equiposData from "@/data/equipos.json"
import jugadoresData from "@/data/jugadores.json"
import asistenciasData from "@/data/asistencias.json"
import valoracionesData from "@/data/valoraciones.json"
import objetivosData from "@/data/objetivos.json"
import temporadasData from "@/data/temporadas.json"

export function SectionCards() {
  const temporadaActual = (temporadasData as any).temporadaActiva
  const equipos = (equiposData as any[]).filter(
    (e) => e.temporadaId === temporadaActual
  )
  const jugadores = (jugadoresData as any[]).filter((j) =>
    equipos.some((e) => e.id === j.equipoId)
  )
  const asistencias = (asistenciasData as any[]).filter((a) =>
    equipos.some((e) => e.id === a.equipoId)
  )
  const valoraciones = (valoracionesData as any[]).filter((v) =>
    jugadores.some((j) => j.id === v.jugadorId)
  )
  const objetivos = (objetivosData as any[]).filter((o) =>
    equipos.some((e) => e.id === o.equipoId)
  )

  const asistenciaPromedio =
    asistencias.length > 0
      ? `${(
          (asistencias.filter((a) => a.asistio).length / asistencias.length) *
          100
        ).toFixed(0)}%`
      : "0%"

  const valoracionMedia =
    valoraciones.length > 0
      ? (
          valoraciones.reduce((sum, v) => sum + (v.valor || 0), 0) /
          valoraciones.length
        ).toFixed(1)
      : "0"

  const objetivosCompletados =
    objetivos.length > 0
      ? `${(
          (objetivos.filter((o) => o.progreso >= 100).length / objetivos.length) *
          100
        ).toFixed(0)}%`
      : "0%"

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total Jugadores</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {jugadores.length}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <UsersIcon className="size-3" />
              {equipos.length} Equipos
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Plantilla completa <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Temporada {temporadaActual}</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Asistencia Promedio</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {asistenciaPromedio}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <ClipboardCheckIcon className="size-3" />
              {asistencias.length} regs
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Registro de asistencias <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Temporada {temporadaActual}</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Valoración Media</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {valoracionMedia}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <StarIcon className="size-3" />
              {valoraciones.length} regs
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Evaluaciones registradas <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Temporada {temporadaActual}</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Objetivos Cumplidos</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {objetivosCompletados}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              {objetivos.length} regs
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Seguimiento de objetivos <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Temporada {temporadaActual}</div>
        </CardFooter>
      </Card>
    </div>
  )
}
