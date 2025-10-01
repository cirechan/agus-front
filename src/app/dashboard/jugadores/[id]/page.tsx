import Link from "next/link"
import { ArrowLeft, Edit, Trash } from "lucide-react"
import {
  equiposService,
  jugadoresService,
  asistenciasService,
  valoracionesService,
  rivalesService,
} from "@/lib/api/services"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DialogFooter } from "@/components/ui/dialog"
import { FormDialog } from "@/components/form-dialog"
import { RatingStars } from "@/components/rating-stars"
import { PlayerRadarChart } from "@/components/player-radar-chart"
import { revalidatePath } from "next/cache"
import { listMatches } from "@/lib/api/matches"
import {
  aggregatePlayerStats,
  buildPlayerMatchSummaries,
  resolveMatchResultLabel,
} from "@/lib/stats"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Match } from "@/types/match"

const POSITIONS = ["Portero", "Defensa", "Centrocampista", "Delantero"]
const COMPETITION_LABELS: Record<string, string> = {
  liga: "Liga",
  copa: "Copa",
  playoff: "Playoff",
  amistoso: "Amistoso",
}

const matchDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

function formatCompetition(value: string) {
  return COMPETITION_LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1)
}

export default async function JugadorPage({ params }: { params: { id: string } }) {
  const jugadorId = Number(params.id)
  const jugador = await jugadoresService.getById(jugadorId)
  if (!jugador) {
    return <div className="p-4">Jugador no encontrado</div>
  }
  const [equipo, asistencias, valoraciones, rivales, matches] = await Promise.all([
    equiposService.getById(jugador.equipoId),
    asistenciasService.getByJugador(jugadorId),
    valoracionesService.getByJugador(jugadorId),
    rivalesService.getAll(),
    listMatches(),
  ])

  // resumen de asistencias
  const totalSesiones = asistencias.length
  const presentes = asistencias.filter((a: any) => a.asistio).length
  const porcentajeAsistencia = totalSesiones ? ((presentes / totalSesiones) * 100).toFixed(1) : "0"

  // medias de valoraciones
  const promedios = valoraciones.length
    ? {
        tecnica:
          valoraciones.reduce((sum: number, v: any) => sum + (v.aptitudes.tecnica || 0), 0) /
          valoraciones.length,
        tactica:
          valoraciones.reduce((sum: number, v: any) => sum + (v.aptitudes.tactica || 0), 0) /
          valoraciones.length,
        fisica:
          valoraciones.reduce((sum: number, v: any) => sum + (v.aptitudes.fisica || 0), 0) /
          valoraciones.length,
        mental:
          valoraciones.reduce((sum: number, v: any) => sum + (v.aptitudes.mental || 0), 0) /
          valoraciones.length,
      }
    : null

  const rivalMap = new Map<number, string>()
  for (const rival of rivales as { id: number; nombre: string }[]) {
    rivalMap.set(rival.id, rival.nombre)
  }

  const teamMatches = (matches as Match[]).filter(
    (match) => match.teamId === jugador.equipoId && match.finished
  )
  const playerStats = aggregatePlayerStats(teamMatches, jugadorId)
  const matchSummaries = buildPlayerMatchSummaries(teamMatches, jugadorId)
  const recentMatches = matchSummaries
    .map((summary) => ({
      ...summary,
      opponentName:
        rivalMap.get(summary.opponentId) ?? `Rival ${summary.opponentId}`,
    }))
    .slice(0, 5)
  const participationPercent = Math.round(playerStats.participationRate * 100)
  const availabilityPercent = Math.round(playerStats.availabilityRate * 100)
  const averageMinutes = playerStats.played
    ? Math.round(playerStats.minutes / playerStats.played)
    : 0
  const isGoalkeeper = jugador.posicion?.toLowerCase() === "portero"
  const summaryBlocks: { label: string; value: string | number }[] = [
    { label: "Partidos del equipo", value: teamMatches.length },
    { label: "Convocatorias", value: playerStats.callUps },
    { label: "Partidos jugados", value: playerStats.played },
    { label: "Titularidades", value: playerStats.starts },
    { label: "Minutos totales", value: `${playerStats.minutes}'` },
    {
      label: "Promedio minutos",
      value: playerStats.played ? `${averageMinutes}'` : "—",
    },
    { label: "Goles", value: playerStats.goals },
    { label: "Asistencias", value: playerStats.assists },
    {
      label: "G+A por 90′",
      value: playerStats.goalInvolvementsPer90.toFixed(2),
    },
    { label: "Participación", value: `${participationPercent}%` },
    { label: "Disponibilidad", value: `${availabilityPercent}%` },
    {
      label: "Balance jugando",
      value: `${playerStats.wins}-${playerStats.draws}-${playerStats.losses}`,
    },
    {
      label: "Tarjetas",
      value: `${playerStats.yellowCards} amarillas · ${playerStats.redCards} rojas`,
    },
  ]

  if (isGoalkeeper) {
    summaryBlocks.push(
      { label: "Porterías a cero", value: playerStats.cleanSheets },
      { label: "Goles encajados", value: playerStats.goalsConceded }
    )
  }

  // server actions
  async function actualizarJugador(formData: FormData) {
    "use server"
    const nombre = formData.get("nombre") as string
    const posicion = formData.get("posicion") as string
    const dorsalRaw = formData.get("dorsal")
    const dorsal = dorsalRaw !== null && dorsalRaw !== "" ? Number(dorsalRaw) : null
    await jugadoresService.update(jugadorId, { nombre, posicion, dorsal })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
    revalidatePath('/dashboard/jugadores')
  }

  async function crearValoracion(formData: FormData) {
    "use server"
    const tecnica = Number(formData.get("tecnica")) || 0
    const tactica = Number(formData.get("tactica")) || 0
    const fisica = Number(formData.get("fisica")) || 0
    const mental = Number(formData.get("mental")) || 0
    const comentarios = formData.get("comentarios") as string
    const fecha = new Date().toISOString()
    await valoracionesService.create({ jugadorId, fecha, aptitudes: { tecnica, tactica, fisica, mental }, comentarios })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
    revalidatePath('/dashboard/jugadores')
  }

  async function actualizarValoracion(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    const tecnica = Number(formData.get("tecnica")) || 0
    const tactica = Number(formData.get("tactica")) || 0
    const fisica = Number(formData.get("fisica")) || 0
    const mental = Number(formData.get("mental")) || 0
    const comentarios = formData.get("comentarios") as string
    await valoracionesService.update(id, { aptitudes: { tecnica, tactica, fisica, mental }, comentarios })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
  }

  async function eliminarValoracion(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    await valoracionesService.delete(id)
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
    revalidatePath('/dashboard/jugadores')
  }

  async function crearAsistencia(formData: FormData) {
    "use server"
    const fecha = formData.get("fecha") as string
    const asistio = formData.get("asistio") === "on"
    const motivo = formData.get("motivo") as string
    await asistenciasService.create({ jugadorId, equipoId: jugador.equipoId, fecha, asistio, motivo })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
  }

  async function actualizarAsistencia(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    const fecha = formData.get("fecha") as string
    const asistio = formData.get("asistio") === "on"
    const motivo = formData.get("motivo") as string
    await asistenciasService.update(id, { fecha, asistio, motivo })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
  }

  async function eliminarAsistencia(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    await asistenciasService.delete(id)
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/jugadores">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{jugador.nombre}</h1>
          {equipo && <p className="text-muted-foreground">{equipo.nombre}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Información personal</CardTitle>
            <FormDialog
              title="Editar jugador"
              trigger={<Button size="icon" variant="ghost"><Edit className="h-4 w-4"/></Button>}
              action={actualizarJugador}
            >
              <Input name="nombre" defaultValue={jugador.nombre} placeholder="Nombre" />
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="player-position">
                    Posición
                  </label>
                  <select
                    id="player-position"
                    name="posicion"
                    defaultValue={jugador.posicion}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {POSITIONS.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="player-number">
                    Dorsal
                  </label>
                  <Input
                    id="player-number"
                    name="dorsal"
                    type="number"
                    min={1}
                    defaultValue={jugador.dorsal ?? ""}
                    placeholder="Número"
                  />
                </div>
              </div>
              <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
            </FormDialog>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="font-medium">Nombre:</span> {jugador.nombre}</div>
            <div><span className="font-medium">Posición:</span> {jugador.posicion}</div>
            <div>
              <span className="font-medium">Dorsal:</span> {jugador.dorsal ?? "Sin asignar"}
            </div>
            <div><span className="font-medium">Asistencias:</span> {presentes}/{totalSesiones} ({porcentajeAsistencia}%)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aptitudes del jugador</CardTitle>
          </CardHeader>
          <CardContent>
            {promedios ? (
              <PlayerRadarChart data={promedios} />
            ) : (
              <p className="text-sm text-muted-foreground">Sin valoraciones</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Estadísticas de partidos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Participación y rendimiento en encuentros registrados.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {teamMatches.length > 0 ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {summaryBlocks.map((block) => (
                    <div
                      key={block.label}
                      className="rounded-lg border bg-muted/40 p-3 text-sm"
                    >
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        {block.label}
                      </p>
                      <p className="text-lg font-semibold">{block.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Últimos partidos
                  </p>
                  {recentMatches.length > 0 ? (
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Partido</TableHead>
                            <TableHead>Resultado</TableHead>
                            <TableHead className="text-right">Minutos</TableHead>
                            <TableHead className="text-right">Aporte</TableHead>
                            <TableHead className="text-right">Tarjetas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentMatches.map((match) => {
                            const kickoff = match.kickoff ? new Date(match.kickoff) : null
                            const kickoffLabel =
                              kickoff && !Number.isNaN(kickoff.getTime())
                                ? matchDateFormatter.format(kickoff)
                                : "Fecha por confirmar"
                            const scoreLabel = `${match.goalsFor}-${match.goalsAgainst}`
                            const resultLabel = resolveMatchResultLabel(match.result)
                            const badgeClassName =
                              match.result === "win"
                                ? "bg-emerald-100 text-emerald-700"
                                : match.result === "loss"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            const opponentLabel = `${match.isHome ? "vs" : "@"} ${match.opponentName}`
                            const roleLabel = match.played
                              ? match.started
                                ? "Titular"
                                : "Suplente"
                              : "Sin minutos"
                            const contributionLabel =
                              match.goals || match.assists
                                ? `${match.goals} G · ${match.assists} A`
                                : "—"
                            const cardsLabel =
                              match.yellowCards || match.redCards
                                ? `${match.yellowCards} A · ${match.redCards} R`
                                : "—"

                            return (
                              <TableRow key={match.matchId}>
                                <TableCell>{kickoffLabel}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{opponentLabel}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatCompetition(match.competition)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <span className="font-semibold">{scoreLabel}</span>
                                    <Badge className={badgeClassName}>{resultLabel}</Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="font-medium">{match.minutes}′</span>
                                    <span className="text-xs text-muted-foreground">{roleLabel}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{contributionLabel}</TableCell>
                                <TableCell className="text-right">{cardsLabel}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay registros de partidos para este jugador.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Todavía no hay partidos finalizados registrados para mostrar estadísticas individuales.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="valoraciones" className="w-full">
        <TabsList>
          <TabsTrigger value="valoraciones">Valoraciones</TabsTrigger>
          <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
        </TabsList>

        <TabsContent value="valoraciones" className="space-y-4">
          {valoraciones.map((v: any) => (
            <Card key={v.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{new Date(v.fecha).toLocaleDateString()}</CardTitle>
                <div className="flex gap-2">
                  <FormDialog
                    title="Editar valoración"
                    trigger={<Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>}
                    action={actualizarValoracion}
                  >
                    <input type="hidden" name="id" value={v.id} />
                    <Input type="number" step="0.5" name="tecnica" defaultValue={v.aptitudes.tecnica} placeholder="Técnica"/>
                    <Input type="number" step="0.5" name="tactica" defaultValue={v.aptitudes.tactica} placeholder="Táctica"/>
                    <Input type="number" step="0.5" name="fisica" defaultValue={v.aptitudes.fisica} placeholder="Física" />
                    <Input type="number" step="0.5" name="mental" defaultValue={v.aptitudes.mental} placeholder="Mental" />
                    <Textarea className="col-span-2" name="comentarios" defaultValue={v.comentarios} />
                    <DialogFooter className="col-span-2"><Button type="submit">Guardar</Button></DialogFooter>
                  </FormDialog>
                  <form action={eliminarValoracion}>
                    <input type="hidden" name="id" value={v.id} />
                    <Button variant="ghost" size="icon"><Trash className="h-4 w-4" /></Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Técnica</div>
                <div className="flex items-center gap-1"><RatingStars value={v.aptitudes.tecnica} /></div>
                <div className="font-medium">Táctica</div>
                <div className="flex items-center gap-1"><RatingStars value={v.aptitudes.tactica} /></div>
                <div className="font-medium">Física</div>
                <div className="flex items-center gap-1"><RatingStars value={v.aptitudes.fisica} /></div>
                <div className="font-medium">Mental</div>
                <div className="flex items-center gap-1"><RatingStars value={v.aptitudes.mental} /></div>
              </CardContent>
              {v.comentarios && (
                <CardFooter className="text-sm text-muted-foreground">
                  {v.comentarios}
                </CardFooter>
              )}
            </Card>
          ))}
          {valoraciones.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay valoraciones</p>
          )}

          <FormDialog
            title="Nueva valoración"
            trigger={<Button>Nueva valoración</Button>}
            action={crearValoracion}
          >
            <Input type="number" step="0.5" name="tecnica" placeholder="Técnica" />
            <Input type="number" step="0.5" name="tactica" placeholder="Táctica" />
            <Input type="number" step="0.5" name="fisica" placeholder="Física" />
            <Input type="number" step="0.5" name="mental" placeholder="Mental" />
            <Textarea className="col-span-2" name="comentarios" placeholder="Comentarios" />
            <DialogFooter className="col-span-2"><Button type="submit">Guardar</Button></DialogFooter>
          </FormDialog>
        </TabsContent>

        <TabsContent value="asistencias" className="space-y-4">
          {asistencias.map((a: any) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{a.fecha}</CardTitle>
                <div className="flex gap-2">
                  <FormDialog
                    title="Editar asistencia"
                    trigger={<Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>}
                    action={actualizarAsistencia}
                  >
                    <input type="hidden" name="id" value={a.id} />
                    <Input type="date" name="fecha" defaultValue={a.fecha} />
                    <label className="flex items-center gap-2"><input type="checkbox" name="asistio" defaultChecked={a.asistio} /> Presente</label>
                    <Input name="motivo" defaultValue={a.motivo} placeholder="Motivo" />
                    <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
                  </FormDialog>
                  <form action={eliminarAsistencia}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button variant="ghost" size="icon"><Trash className="h-4 w-4"/></Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                {a.asistio ? "Presente" : `Ausente (${a.motivo})`}
              </CardContent>
            </Card>
          ))}
          {asistencias.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay registros</p>
          )}

          <FormDialog
            title="Nueva asistencia"
            trigger={<Button>Nueva asistencia</Button>}
            action={crearAsistencia}
          >
            <Input type="date" name="fecha" />
            <label className="flex items-center gap-2"><input type="checkbox" name="asistio" defaultChecked /> Presente</label>
            <Input name="motivo" placeholder="Motivo (si falta)" />
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </FormDialog>
        </TabsContent>
      </Tabs>

      {jugador.logs && (
        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(jugador.logs).map(([k, v]) => (
              <div key={k}>
                <span className="font-medium mr-2">{k.replace("_", "/")}</span>
                {v as string}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
