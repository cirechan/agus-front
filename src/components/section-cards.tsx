import { TrendingUpIcon, UsersIcon, ClipboardCheckIcon, StarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type SectionCardsStats = {
  temporadaLabel: string
  totalTeams: number
  totalPlayers: number
  attendanceAverage: string
  attendanceRecords: number
  ratingAverage: string
  ratingRecords: number
  objectivesCompletion: string
  objectivesCount: number
}

interface SectionCardsProps {
  stats: SectionCardsStats
}

export function SectionCards({ stats }: SectionCardsProps) {
  const {
    temporadaLabel,
    totalTeams,
    totalPlayers,
    attendanceAverage,
    attendanceRecords,
    ratingAverage,
    ratingRecords,
    objectivesCompletion,
    objectivesCount,
  } = stats

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total Jugadores</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {totalPlayers}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <UsersIcon className="size-3" />
              {totalTeams} Equipos
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
            {attendanceAverage}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <ClipboardCheckIcon className="size-3" />
              {attendanceRecords} regs
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
            {ratingAverage}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <StarIcon className="size-3" />
              {ratingRecords} regs
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
            {objectivesCompletion}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              {objectivesCount} regs
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
