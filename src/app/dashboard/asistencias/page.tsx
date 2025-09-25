"use client"

import * as React from "react"
import Link from "next/link"
import { format, isAfter, isBefore, isSameDay, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowRight, CalendarClock, ChevronLeft, ChevronRight, Clock, Loader2, Trash2, PlusCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { resolvePrimaryTeam } from "@/lib/team"

interface Jugador {
  id: string
  nombre: string
  dorsal: number
}

interface RegistroAsistencia {
  id?: number
  jugadorId: string
  asistio: boolean
  motivo?: string
  motivoPersonalizado?: string
}

interface Entrenamiento {
  id: number
  equipoId: number
  inicio: string
  fin?: string | null
}

const motivosAusencia = [
  { value: "lesion", label: "Lesión" },
  { value: "desconvocatoria", label: "Desconvocatoria" },
  { value: "trabajo", label: "Trabajo" },
  { value: "estudios", label: "Estudios" },
  { value: "viaje", label: "Viaje" },
  { value: "no_justificado", label: "No justificado" },
  { value: "otro", label: "Otro" },
]

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function formatDateLong(date: Date) {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
}

function formatTimeRange(entrenamiento: Entrenamiento | null) {
  if (!entrenamiento?.inicio) return "Horario sin definir"
  const inicio = new Date(entrenamiento.inicio)
  const fin = entrenamiento.fin ? new Date(entrenamiento.fin) : null
  const inicioLabel = format(inicio, "HH:mm")
  if (!fin || Number.isNaN(fin.getTime()) || fin <= inicio) {
    return `${inicioLabel}`
  }
  return `${inicioLabel} - ${format(fin, "HH:mm")}`
}

function createDefaultRegistros(jugadores: Jugador[]): RegistroAsistencia[] {
  return jugadores.map((jugador) => ({ jugadorId: jugador.id, asistio: true }))
}

export default function AsistenciasPage() {
  const [fecha, setFecha] = React.useState<Date>(new Date())
  const [temporadaActual, setTemporadaActual] = React.useState<string>("")
  const [equipo, setEquipo] = React.useState<any | null>(null)
  const [jugadores, setJugadores] = React.useState<Jugador[]>([])
  const [registros, setRegistros] = React.useState<RegistroAsistencia[]>([])
  const [entrenamientos, setEntrenamientos] = React.useState<Entrenamiento[]>([])
  const [selectedEntrenamientoId, setSelectedEntrenamientoId] = React.useState<number | null>(null)
  const [isLoadingEntrenamientos, setIsLoadingEntrenamientos] = React.useState<boolean>(false)
  const [deletingTrainingId, setDeletingTrainingId] = React.useState<number | null>(null)
  const [isSavingAsistencias, setIsSavingAsistencias] = React.useState<boolean>(false)
  const [isClearingAsistencias, setIsClearingAsistencias] = React.useState<boolean>(false)

  const sesionesPorFecha = React.useMemo(() => {
    const map = new Map<string, Entrenamiento[]>()
    for (const sesion of entrenamientos) {
      if (!sesion.inicio) continue
      const inicio = new Date(sesion.inicio)
      if (Number.isNaN(inicio.getTime())) continue
      const key = dateKey(inicio)
      const list = map.get(key) ?? []
      list.push(sesion)
      map.set(key, list)
    }
    for (const list of Array.from(map.values())) {
      list.sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
    }
    return map
  }, [entrenamientos])

  const sessionsForSelectedDate = React.useMemo(() => {
    const key = dateKey(fecha)
    return sesionesPorFecha.get(key) ?? []
  }, [fecha, sesionesPorFecha])

  const trainingPlannerHref = React.useMemo(() => {
    return `/dashboard/entrenamientos?plan=${format(fecha, "yyyy-MM-dd")}`
  }, [fecha])

  const selectedDateLabel = React.useMemo(() => formatDateLong(fecha), [fecha])

  const scheduledDates = React.useMemo(() => {
    const unique = new Map<string, Date>()
    for (const sesion of entrenamientos) {
      const inicio = new Date(sesion.inicio)
      if (Number.isNaN(inicio.getTime())) continue
      inicio.setHours(0, 0, 0, 0)
      unique.set(inicio.toISOString(), inicio)
    }
    return Array.from(unique.values())
  }, [entrenamientos])

  const selectedEntrenamiento = React.useMemo(() => {
    return entrenamientos.find((sesion) => sesion.id === selectedEntrenamientoId) ?? null
  }, [entrenamientos, selectedEntrenamientoId])

  const selectedEntrenamientoDate = selectedEntrenamiento?.inicio
    ? new Date(selectedEntrenamiento.inicio)
    : null

  const upcomingEntrenamientos = React.useMemo(() => {
    if (entrenamientos.length === 0) return []
    const now = new Date()
    const futuros = entrenamientos.filter((sesion) => {
      const inicio = new Date(sesion.inicio)
      return !Number.isNaN(inicio.getTime()) && isAfter(inicio, now)
    })
    if (futuros.length > 0) {
      return futuros.slice(0, 10)
    }
    return entrenamientos.slice(-5)
  }, [entrenamientos])

  const sessionIndex = selectedEntrenamientoId
    ? entrenamientos.findIndex((sesion) => sesion.id === selectedEntrenamientoId)
    : -1
  const previousSession = sessionIndex > 0 ? entrenamientos[sessionIndex - 1] : null
  const nextSession =
    sessionIndex >= 0 && sessionIndex < entrenamientos.length - 1
      ? entrenamientos[sessionIndex + 1]
      : null

  const loadEntrenamientos = React.useCallback(async (equipoId: number) => {
    setIsLoadingEntrenamientos(true)
    try {
      const res = await fetch(`/api/entrenamientos?equipoId=${equipoId}`, { cache: "no-store" })
      const data = await res.json()
      if (Array.isArray(data)) {
        const ordered = data
          .map((sesion: any) => ({
            id: Number(sesion.id),
            equipoId: Number(sesion.equipoId),
            inicio: sesion.inicio,
            fin: sesion.fin ?? null,
          }))
          .sort((a: Entrenamiento, b: Entrenamiento) => {
            return new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
          })
        setEntrenamientos(ordered)
      } else {
        setEntrenamientos([])
      }
    } catch (error) {
      console.error("No se pudieron cargar los entrenamientos", error)
      setEntrenamientos([])
    } finally {
      setIsLoadingEntrenamientos(false)
    }
  }, [])

  React.useEffect(() => {
    const cargarDatos = async () => {
      const [temporadaRes, equiposRes] = await Promise.all([
        fetch("/api/temporadas?actual=1", { cache: "no-store" }),
        fetch("/api/equipos", { cache: "no-store" }),
      ])
      const temporada = await temporadaRes.json()
      setTemporadaActual(temporada?.id || "")
      const equipos = await equiposRes.json()
      const eq = resolvePrimaryTeam(equipos || [])
      setEquipo(eq)
      if (eq) {
        const jRes = await fetch(`/api/jugadores?equipoId=${eq.id}`, { cache: "no-store" })
        const jData = await jRes.json()
        setJugadores(
          jData.map((j: any, index: number) => ({
            id: String(j.id),
            nombre: j.nombre,
            dorsal: Number(j.dorsal ?? index + 1),
          }))
        )
        await loadEntrenamientos(eq.id)
      }
    }
    cargarDatos()
  }, [loadEntrenamientos])

  React.useEffect(() => {
    if (entrenamientos.length === 0) {
      setSelectedEntrenamientoId(null)
      return
    }
    if (
      selectedEntrenamientoId &&
      entrenamientos.some((sesion) => sesion.id === selectedEntrenamientoId)
    ) {
      return
    }
    const now = new Date()
    const upcoming = entrenamientos.find((sesion) => {
      const inicio = new Date(sesion.inicio)
      return !Number.isNaN(inicio.getTime()) && !isBefore(inicio, now)
    })
    const fallback = upcoming ?? entrenamientos[entrenamientos.length - 1]
    if (fallback) {
      setSelectedEntrenamientoId(fallback.id)
      const start = new Date(fallback.inicio)
      if (!Number.isNaN(start.getTime())) {
        setFecha(start)
      }
    }
  }, [entrenamientos, selectedEntrenamientoId])

  React.useEffect(() => {
    if (!equipo || jugadores.length === 0) return
    if (!selectedEntrenamientoId) {
      setRegistros(createDefaultRegistros(jugadores))
      return
    }
    const cargar = async () => {
      try {
        const res = await fetch(
          `/api/asistencias?equipoId=${equipo.id}&entrenamientoId=${selectedEntrenamientoId}`,
          { cache: "no-store" }
        )
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setRegistros(
            data.map((registro: any) => ({
              id: registro.id,
              jugadorId: String(registro.jugadorId),
              asistio: Boolean(registro.asistio),
              motivo: registro.motivo || undefined,
            }))
          )
        } else {
          setRegistros(createDefaultRegistros(jugadores))
        }
      } catch (error) {
        console.error("No se pudieron recuperar las asistencias", error)
        setRegistros(createDefaultRegistros(jugadores))
      }
    }
    cargar()
  }, [equipo, jugadores, selectedEntrenamientoId])

  const handleSelectDate = (date?: Date) => {
    if (!date) return
    setFecha(date)
    const sameDay = entrenamientos.filter((sesion) => {
      const inicio = new Date(sesion.inicio)
      return !Number.isNaN(inicio.getTime()) && isSameDay(inicio, date)
    })
    if (sameDay.length === 0) {
      setSelectedEntrenamientoId(null)
      setRegistros(createDefaultRegistros(jugadores))
      return
    }
    setSelectedEntrenamientoId((current) => {
      if (current && sameDay.some((sesion) => sesion.id === current)) {
        return current
      }
      return sameDay[0].id
    })
  }

  const handleSelectEntrenamiento = (sesion: Entrenamiento) => {
    setSelectedEntrenamientoId(sesion.id)
    const inicio = new Date(sesion.inicio)
    if (!Number.isNaN(inicio.getTime())) {
      setFecha(inicio)
    }
  }

  const handleAsistenciaChange = (jugadorId: string, asistio: boolean) => {
    setRegistros((prev) =>
      prev.map((registro) =>
        registro.jugadorId === jugadorId
          ? {
              ...registro,
              asistio,
              motivo: asistio ? undefined : registro.motivo,
              motivoPersonalizado: asistio ? undefined : registro.motivoPersonalizado,
            }
          : registro
      )
    )
  }

  const handleMotivoChange = (jugadorId: string, motivo: string) => {
    setRegistros((prev) =>
      prev.map((registro) =>
        registro.jugadorId === jugadorId
          ? { ...registro, motivo }
          : registro
      )
    )
  }

  const handleMotivoPersonalizadoChange = (jugadorId: string, motivoPersonalizado: string) => {
    setRegistros((prev) =>
      prev.map((registro) =>
        registro.jugadorId === jugadorId
          ? { ...registro, motivoPersonalizado }
          : registro
      )
    )
  }

  const handleDeleteEntrenamiento = async (id: number) => {
    if (!equipo) return
    const sesion = entrenamientos.find((item) => item.id === id)
    const sessionDate = sesion?.inicio ? new Date(sesion.inicio) : null
    const confirmationMessage = sessionDate
      ? `¿Quieres eliminar el entrenamiento del ${formatDateLong(sessionDate)}?`
      : "¿Quieres eliminar este entrenamiento?"
    if (typeof window !== "undefined" && !window.confirm(confirmationMessage)) {
      return
    }
    setDeletingTrainingId(id)
    try {
      await fetch(`/api/entrenamientos?id=${id}`, { method: "DELETE" })
      await loadEntrenamientos(equipo.id)
    } catch (error) {
      console.error("No se pudo eliminar el entrenamiento", error)
      alert("No se pudo eliminar el entrenamiento")
    } finally {
      setDeletingTrainingId(null)
    }
  }

  const handlePreviousSession = () => {
    if (previousSession) {
      handleSelectEntrenamiento(previousSession)
    }
  }

  const handleNextSession = () => {
    if (nextSession) {
      handleSelectEntrenamiento(nextSession)
    }
  }

  const handleGuardarAsistencias = async () => {
    if (!equipo || !selectedEntrenamiento || !selectedEntrenamientoDate) {
      alert("Selecciona un entrenamiento para guardar la asistencia")
      return
    }
    setIsSavingAsistencias(true)
    try {
      const registrosFinales = registros.map((registro) => ({
        jugadorId: Number(registro.jugadorId),
        asistio: registro.asistio,
        motivo:
          registro.motivo === "otro"
            ? registro.motivoPersonalizado
            : registro.motivo,
      }))
      const res = await fetch("/api/asistencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: format(selectedEntrenamientoDate, "yyyy-MM-dd"),
          registros: registrosFinales,
          equipoId: equipo.id,
          entrenamientoId: selectedEntrenamiento.id,
        }),
      })
      if (!res.ok) {
        throw new Error("No se pudieron guardar las asistencias")
      }
      alert("Asistencias guardadas correctamente")
    } catch (error) {
      console.error(error)
      alert("No se pudieron guardar las asistencias")
    } finally {
      setIsSavingAsistencias(false)
    }
  }

  const handleEliminarAsistencias = async () => {
    if (!equipo || !selectedEntrenamiento) return
    setIsClearingAsistencias(true)
    try {
      await fetch(
        `/api/asistencias?equipoId=${equipo.id}&entrenamientoId=${selectedEntrenamiento.id}`,
        { method: "DELETE" }
      )
      setRegistros(createDefaultRegistros(jugadores))
      alert("Registros eliminados")
    } catch (error) {
      console.error("No se pudieron eliminar las asistencias", error)
      alert("No se pudieron eliminar las asistencias")
    } finally {
      setIsClearingAsistencias(false)
    }
  }

  if (!equipo) {
    return <div className="p-4">Cargando...</div>
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 lg:px-6">
      <div className="flex flex-col gap-4 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Control de Asistencias</h1>
          <p className="text-muted-foreground">
            Consulta el calendario programado y registra la asistencia de cada jugador en las sesiones confirmadas.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/dashboard/entrenamientos">
            Abrir calendario de entrenamientos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 rounded-xl border bg-card text-card-foreground shadow-sm lg:grid-cols-[minmax(0,320px),minmax(0,1fr)]">
        <div className="space-y-6 border-b border-muted/40 p-6 lg:border-b-0 lg:border-r">
          <Card>
            <CardHeader className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <CalendarClock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Gestiona el calendario</CardTitle>
                <CardDescription>
                  Programa nuevas sesiones y gestiona reprogramaciones desde la sección de entrenamientos.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Aquí podrás consultar el calendario existente y registrar la asistencia. Para crear, editar o eliminar
                entrenamientos recurre al módulo dedicado y mantén este panel centrado en el seguimiento diario del
                equipo.
              </p>
              <Button asChild className="w-full">
                <Link href="/dashboard/entrenamientos">
                  Abrir calendario de entrenamientos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-none">
            <CardHeader>
              <CardTitle>Calendario de sesiones</CardTitle>
              <CardDescription>Selecciona un entrenamiento para gestionar la asistencia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1.5fr,1fr]">
                <Calendar
                  mode="single"
                  selected={fecha}
                  onSelect={handleSelectDate}
                  modifiers={{ scheduled: scheduledDates }}
                  modifiersClassNames={{ scheduled: "bg-primary/10 text-primary font-semibold" }}
                />
                <div className="flex flex-col gap-4">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Sesiones del día</h4>
                    {sessionsForSelectedDate.length > 0 ? (
                      <div className="space-y-2">
                        {sessionsForSelectedDate.map((sesion) => {
                          const inicio = new Date(sesion.inicio)
                          return (
                            <div
                              key={sesion.id}
                              className={cn(
                                "flex items-center justify-between rounded-lg border p-3",
                                selectedEntrenamientoId === sesion.id && "border-primary bg-primary/5"
                              )}
                            >
                              <div>
                                <div className="font-medium">
                                  {format(inicio, "HH:mm")} {sesion.fin ? `- ${format(new Date(sesion.fin), "HH:mm")}` : ""}
                                </div>
                                <p className="text-sm text-muted-foreground">{formatDateLong(inicio)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant={selectedEntrenamientoId === sesion.id ? "default" : "outline"}
                                  onClick={() => handleSelectEntrenamiento(sesion)}
                                >
                                  Seleccionar
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteEntrenamiento(sesion.id)}
                                  disabled={deletingTrainingId === sesion.id}
                                >
                                  {deletingTrainingId === sesion.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        <p>No hay entrenamientos programados para {selectedDateLabel}.</p>
                        <Button asChild variant="outline" className="gap-2">
                          <Link href={trainingPlannerHref}>
                            <PlusCircle className="h-4 w-4" /> Programar entrenamiento
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-2 flex items-center justify-between text-sm font-medium">
                      Próximos entrenamientos
                      <Badge>{upcomingEntrenamientos.length}</Badge>
                    </h4>
                    <ScrollArea className="relative h-40 overflow-hidden rounded-lg border">
                      <div className="divide-y">
                        {upcomingEntrenamientos.map((sesion) => {
                          const inicio = new Date(sesion.inicio)
                          const isFuture = isAfter(inicio, new Date())
                          return (
                            <button
                              type="button"
                              key={sesion.id}
                              onClick={() => handleSelectEntrenamiento(sesion)}
                              className={cn(
                                "flex w-full items-center justify-between gap-3 p-3 text-left text-sm transition",
                                selectedEntrenamientoId === sesion.id ? "bg-primary/5" : "hover:bg-muted",
                                !isFuture && "text-muted-foreground"
                              )}
                            >
                              <div>
                                <div className="font-medium">{formatDateLong(inicio)}</div>
                                <div className="text-xs text-muted-foreground">{format(inicio, "HH:mm")}</div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleDeleteEntrenamiento(sesion.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </button>
                          )
                        })}
                        {upcomingEntrenamientos.length === 0 && (
                          <p className="p-3 text-sm text-muted-foreground">
                            No hay entrenamientos próximos programados.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card id="asistencias" className="flex flex-col">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold leading-none tracking-tight">Registro de asistencia</div>
              <div className="text-sm text-muted-foreground">
                {selectedEntrenamiento
                  ? `Sesión del ${formatDateLong(new Date(selectedEntrenamiento.inicio))}`
                  : `Sin sesión programada para ${selectedDateLabel}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={!previousSession} onClick={handlePreviousSession}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={!nextSession} onClick={handleNextSession}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 p-6 pt-0">
            {selectedEntrenamiento ? (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {formatTimeRange(selectedEntrenamiento)}
                  </span>
                </div>
                <div className="rounded-md border">
                  <table className="hidden w-full md:table">
                <thead>
                  <tr className="border-b bg-muted/50 text-sm">
                    <th className="p-2 text-left font-medium">Jugador</th>
                    <th className="p-2 text-left font-medium">Dorsal</th>
                    <th className="p-2 text-left font-medium">Asistencia</th>
                    <th className="p-2 text-left font-medium">Motivo Ausencia</th>
                  </tr>
                </thead>
                <tbody>
                  {jugadores.map((jugador) => {
                    const registro = registros.find((r) => r.jugadorId === jugador.id) ?? {
                      jugadorId: jugador.id,
                      asistio: true,
                    }
                    const motivoSeleccionado = registro.motivo || ""
                    const motivoPersonalizado = registro.motivoPersonalizado || ""
                    return (
                      <tr key={jugador.id} className="border-b">
                        <td className="p-2">{jugador.nombre} </td>
                        <td className="p-2">{jugador.dorsal}</td>
                        <td className="p-2">
                          <Switch
                            checked={registro.asistio}
                            onCheckedChange={(checked) => handleAsistenciaChange(jugador.id, checked)}
                          />
                        </td>
                        <td className="p-2">
                          {!registro.asistio ? (
                            <div className="space-y-2">
                              <Select
                                value={motivoSeleccionado}
                                onValueChange={(value) => handleMotivoChange(jugador.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un motivo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {motivosAusencia.map((motivo) => (
                                    <SelectItem key={motivo.value} value={motivo.value}>
                                      {motivo.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {motivoSeleccionado === "otro" && (
                                <Input
                                  value={motivoPersonalizado}
                                  onChange={(event) =>
                                    handleMotivoPersonalizadoChange(jugador.id, event.target.value)
                                  }
                                  placeholder="Describe el motivo"
                                />
                              )}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

                  <div className="divide-y md:hidden">
                    {jugadores.map((jugador) => {
                      const registro = registros.find((r) => r.jugadorId === jugador.id) ?? {
                        jugadorId: jugador.id,
                        asistio: true,
                      }
                  const motivoSeleccionado = registro.motivo || ""
                  const motivoPersonalizado = registro.motivoPersonalizado || ""
                  return (
                    <div key={jugador.id} className="p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{jugador.nombre}</div>
                          <div className="text-sm text-muted-foreground">#{jugador.dorsal}</div>
                        </div>
                        <Switch
                          checked={registro.asistio}
                          onCheckedChange={(checked) => handleAsistenciaChange(jugador.id, checked)}
                        />
                      </div>
                      {!registro.asistio ? (
                        <div className="mt-2 space-y-2">
                          <Select
                            value={motivoSeleccionado}
                            onValueChange={(value) => handleMotivoChange(jugador.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un motivo" />
                            </SelectTrigger>
                            <SelectContent>
                              {motivosAusencia.map((motivo) => (
                                <SelectItem key={motivo.value} value={motivo.value}>
                                  {motivo.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {motivoSeleccionado === "otro" && (
                            <Input
                              value={motivoPersonalizado}
                              onChange={(event) =>
                                handleMotivoPersonalizadoChange(jugador.id, event.target.value)
                              }
                              placeholder="Describe el motivo"
                            />
                          )}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Selecciona un entrenamiento del calendario para registrar asistencia o programa una sesión nueva.
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 p-6 pt-0 sm:flex-row">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleEliminarAsistencias}
              disabled={!selectedEntrenamiento || isClearingAsistencias}
            >
              {isClearingAsistencias ? "Eliminando..." : "Eliminar registros"}
            </Button>
            <Button
              className="w-full"
              onClick={handleGuardarAsistencias}
              disabled={!selectedEntrenamiento || isSavingAsistencias}
            >
              {isSavingAsistencias ? "Guardando..." : "Guardar asistencias"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
