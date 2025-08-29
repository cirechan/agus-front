import { TrendingUpIcon, UsersIcon, ClipboardCheckIcon, StarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  equiposService,
  jugadoresService,
  asistenciasService,
  valoracionesService,
  objetivosService,
  temporadasService,
} from "@/lib/api/services"

interface Asistencia {
  asistio: boolean | number
}

export async function SectionCards() {
  const temporada = await temporadasService.getActual()
  let equipos = temporada
    ? await equiposService.getByTemporada(temporada.id)
    : await equiposService.getAll()
  // Fallback to todos los equipos si no hay ninguno vinculado a la temporada
  if (equipos.length === 0) {
    equipos = await equiposService.getAll()
  }
  const jugadores = (
    await Promise.all(equipos.map((e: any) => jugadoresService.getByEquipo(e.id)))
  ).flat()
  const asistencias = (
    await Promise.all(equipos.map((e: any) => asistenciasService.getByEquipo(e.id)))
  ).flat() as Asistencia[]
  const valoraciones = (
    await Promise.all(jugadores.map((j: any) => valoracionesService.getByJugador(j.id)))
  ).flat()
  const objetivos = (
    await Promise.all(equipos.map((e: any) => objetivosService.getByEquipo(e.id)))
  ).flat()

  const asistenciaPromedio =
    asistencias.length > 0
      ? `${(
          (asistencias.filter((a: Asistencia) => a.asistio).length / asistencias.length) *
          100
        ).toFixed(0)}%`
      : "0%"

  const valoracionesPromedio = valoraciones
    .map((v: any) => {
      const values = Object.values(v.aptitudes || {}).map(Number).filter((n) => !isNaN(n))
      if (values.length === 0 || values.every((n) => n === 0)) return null
      return values.reduce((a, b) => a + b, 0) / values.length
    })
    .filter((n) => n !== null) as number[]
  const valoracionMedia =
    valoracionesPromedio.length > 0
      ? (
          valoracionesPromedio.reduce((sum, n) => sum + n, 0) /
          valoracionesPromedio.length
        ).toFixed(1)
      : "0"

  const objetivosCompletados =
    objetivos.length > 0
      ? `${(
          (objetivos.filter((o: any) => o.progreso >= 100).length / objetivos.length) *
          100
        ).toFixed(0)}%`
      : "0%"

  const temporadaLabel = temporada?.id ?? "N/A"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
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
          <div className="text-muted-foreground">Temporada {temporadaLabel}</div>
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
          <div className="text-muted-foreground">Temporada {temporadaLabel}</div>
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
          <div className="text-muted-foreground">Temporada {temporadaLabel}</div>
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
          <div className="text-muted-foreground">Temporada {temporadaLabel}</div>
        </CardFooter>
      </Card>
    </div>
  )
}
