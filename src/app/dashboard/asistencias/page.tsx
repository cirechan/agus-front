"use client"

import * as React from "react"
import { addDays, format, isAfter, isBefore, isSameDay, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, Loader2, PlusCircle, Trash2 } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

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

const dayOptions = [
  { value: 1, label: "Lunes", short: "L" },
  { value: 2, label: "Martes", short: "M" },
  { value: 3, label: "Miércoles", short: "X" },
  { value: 4, label: "Jueves", short: "J" },
  { value: 5, label: "Viernes", short: "V" },
  { value: 6, label: "Sábado", short: "S" },
  { value: 0, label: "Domingo", short: "D" },
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

function countSessions(range: DateRange | undefined, days: number[]) {
  if (!range?.from) return 0
  const normalizedDays = Array.from(new Set(days))
  if (normalizedDays.length === 0) return 0
  const start = new Date(range.from)
  start.setHours(0, 0, 0, 0)
  const end = new Date(range.to ?? range.from)
  end.setHours(0, 0, 0, 0)
  let count = 0
  const cursor = new Date(start)
  while (cursor.getTime() <= end.getTime()) {
    if (normalizedDays.includes(cursor.getDay())) {
      count += 1
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
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
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 30),
  })
  const [startTime, setStartTime] = React.useState<string>("19:30")
  const [endTime, setEndTime] = React.useState<string>("21:00")
  const [selectedDays, setSelectedDays] = React.useState<number[]>([1, 3])
  const [isLoadingEntrenamientos, setIsLoadingEntrenamientos] = React.useState<boolean>(false)
  const [isCreatingTrainings, setIsCreatingTrainings] = React.useState<boolean>(false)
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

  const estimatedSessions = React.useMemo(() => countSessions(dateRange, selectedDays), [dateRange, selectedDays])

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
      const eq = equipos[0]
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

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day)
      }
      const updated = [...prev, day]
      updated.sort((a, b) => {
        const normalizedA = a === 0 ? 7 : a
        const normalizedB = b === 0 ? 7 : b
        return normalizedA - normalizedB
      })
      return updated
    })
  }

  const handleSelectDate = (date?: Date) => {
    if (!date) return
    setFecha(date)
    const sameDay = entrenamientos.filter((sesion) => {
      const inicio = new Date(sesion.inicio)
      return !Number.isNaN(inicio.getTime()) && isSameDay(inicio, date)
    })
    if (sameDay.length === 0) {
      setSelectedEntrenamientoId(null)
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

  const handleCrearEntrenamientos = async () => {
    if (!equipo || !dateRange?.from || selectedDays.length === 0) {
      alert("Configura un rango de fechas y los días de entrenamiento")
      return
    }
    setIsCreatingTrainings(true)
    try {
      const res = await fetch("/api/entrenamientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipoId: equipo.id,
          startDate: format(dateRange.from, "yyyy-MM-dd"),
          endDate: format(dateRange.to ?? dateRange.from, "yyyy-MM-dd"),
          daysOfWeek: selectedDays,
          startTime,
          endTime: endTime || undefined,
        }),
      })
      if (!res.ok) {
        alert("No se pudieron crear los entrenamientos")
        return
      }
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        alert(`Se programaron ${data.length} entrenamientos`)
      } else {
        alert("No se generaron nuevos entrenamientos")
      }
      await loadEntrenamientos(equipo.id)
    } catch (error) {
      console.error("Error al crear entrenamientos", error)
      alert("No se pudieron crear los entrenamientos")
    } finally {
      setIsCreatingTrainings(false)
    }
  }

  const handleDeleteEntrenamiento = async (id: number) => {
    if (!equipo) return
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

  const handlePrevSession = () => {
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

  const rangeLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "dd MMM", { locale: es })} - ${format(dateRange.to, "dd MMM", { locale: es })}`
      : format(dateRange.from, "dd MMM", { locale: es })
    : "Selecciona un rango"

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Control de Asistencias</h1>
          <p className="text-muted-foreground">
            Organiza el calendario de entrenamientos y registra quién asiste a cada sesión.
          </p>
        </div>
      </div>

      <div className="grid gap-6 px-4 py-6 lg:grid-cols-[360px,1fr] lg:px-6">
        <div className="space-y-6">
          <Card id="planificador">
            <CardHeader>
              <CardTitle>Planificador de entrenamientos</CardTitle>
              <CardDescription>
                Programa sesiones recurrentes para {equipo.nombre} · Temporada {temporadaActual || "--"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Rango de fechas</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {rangeLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Días de la semana</label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((day) => {
                    const active = selectedDays.includes(day.value)
                    return (
                      <Button
                        key={day.value}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.short}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="hora-inicio">
                    Hora de inicio
                  </label>
                  <Input
                    id="hora-inicio"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="hora-fin">
                    Hora de fin (opcional)
                  </label>
                  <Input
                    id="hora-fin"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                {estimatedSessions > 0 ? (
                  <span>
                    Se crearán <span className="font-semibold text-primary">{estimatedSessions}</span> entrenamientos.
                  </span>
                ) : (
                  <span>Selecciona un rango de fechas y al menos un día para generar entrenamientos.</span>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleCrearEntrenamientos} disabled={isCreatingTrainings}>
                {isCreatingTrainings ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando entrenamientos...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Programar entrenamientos
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
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
                                <p className="text-sm text-muted-foreground">
                                  {formatDateLong(inicio)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant={selectedEntrenamientoId === sesion.id ? "default" : "outline"} onClick={() => handleSelectEntrenamiento(sesion)}>
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
                      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                        No hay entrenamientos programados para este día.
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-2 flex items-center justify-between text-sm font-medium">
                      Próximos entrenamientos
                      <Badge variant="secondary">{entrenamientos.length}</Badge>
                    </h4>
                    <ScrollArea className="h-40 rounded-lg border">
                      <div className="divide-y">
                        {entrenamientos.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground">
                            Aún no hay entrenamientos en el calendario.
                          </div>
                        ) : (
                          upcomingEntrenamientos.map((sesion) => {
                            const inicio = new Date(sesion.inicio)
                            return (
                              <div
                                key={sesion.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleSelectEntrenamiento(sesion)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    handleSelectEntrenamiento(sesion)
                                  }
                                }}
                                className={cn(
                                  "flex w-full items-center justify-between gap-3 p-3 text-sm transition hover:bg-muted",
                                  selectedEntrenamientoId === sesion.id && "bg-primary/5"
                                )}
                              >
                                <div>
                                  <div className="font-medium">{formatDateLong(inicio)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(inicio, "HH:mm")}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleDeleteEntrenamiento(sesion.id)
                                  }}
                                  disabled={deletingTrainingId === sesion.id}
                                >
                                  {deletingTrainingId === sesion.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            )
                          })
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
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Registro de asistencia</CardTitle>
              <CardDescription>
                {selectedEntrenamiento
                  ? `Sesión del ${selectedEntrenamientoDate ? formatDateLong(selectedEntrenamientoDate) : "--"}`
                  : "Selecciona un entrenamiento programado para registrar la asistencia."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevSession} disabled={!previousSession}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextSession} disabled={!nextSession}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {selectedEntrenamiento ? (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {formatTimeRange(selectedEntrenamiento)}
                  </span>
                  {selectedEntrenamientoDate && isToday(selectedEntrenamientoDate) && (
                    <Badge variant="secondary">Hoy</Badge>
                  )}
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
                        const registro = registros.find((r) => r.jugadorId === jugador.id)
                        return (
                          <tr key={jugador.id} className="border-b">
                            <td className="p-2">{jugador.nombre}</td>
                            <td className="p-2">{jugador.dorsal}</td>
                            <td className="p-2">
                              <Switch
                                checked={registro?.asistio ?? true}
                                onCheckedChange={(checked) => handleAsistenciaChange(jugador.id, checked)}
                              />
                            </td>
                            <td className="p-2">
                              {registro && !registro.asistio && (
                                <div className="space-y-2">
                                  <Select
                                    value={registro.motivo}
                                    onValueChange={(value) => handleMotivoChange(jugador.id, value)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Seleccionar motivo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {motivosAusencia.map((motivo) => (
                                        <SelectItem key={motivo.value} value={motivo.value}>
                                          {motivo.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {registro.motivo === "otro" && (
                                    <Input
                                      value={registro.motivoPersonalizado || ""}
                                      onChange={(event) =>
                                        handleMotivoPersonalizadoChange(jugador.id, event.target.value)
                                      }
                                      placeholder="Motivo"
                                    />
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="divide-y md:hidden">
                    {jugadores.map((jugador) => {
                      const registro = registros.find((r) => r.jugadorId === jugador.id)
                      return (
                        <div key={jugador.id} className="p-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{jugador.nombre}</div>
                              <div className="text-sm text-muted-foreground">#{jugador.dorsal}</div>
                            </div>
                            <Switch
                              checked={registro?.asistio ?? true}
                              onCheckedChange={(checked) => handleAsistenciaChange(jugador.id, checked)}
                            />
                          </div>
                          {registro && !registro.asistio && (
                            <div className="mt-2 space-y-2">
                              <Select
                                value={registro.motivo}
                                onValueChange={(value) => handleMotivoChange(jugador.id, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Seleccionar motivo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {motivosAusencia.map((motivo) => (
                                    <SelectItem key={motivo.value} value={motivo.value}>
                                      {motivo.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {registro.motivo === "otro" && (
                                <Input
                                  value={registro.motivoPersonalizado || ""}
                                  onChange={(event) =>
                                    handleMotivoPersonalizadoChange(jugador.id, event.target.value)
                                  }
                                  placeholder="Motivo"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Selecciona un entrenamiento en el calendario para habilitar el registro de asistencia.
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleEliminarAsistencias}
              disabled={!selectedEntrenamiento || isClearingAsistencias}
            >
              {isClearingAsistencias ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar registros"}
            </Button>
            <Button
              className="w-full"
              onClick={handleGuardarAsistencias}
              disabled={!selectedEntrenamiento || isSavingAsistencias}
            >
              {isSavingAsistencias ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar asistencias"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
