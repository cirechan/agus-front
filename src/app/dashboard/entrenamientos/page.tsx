"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  addDays,
  addMinutes,
  endOfMonth,
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  isWithinInterval,
  startOfDay,
  startOfMonth,
} from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowRight,
  CalendarClock,
  CalendarIcon,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Trash2,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { resolvePrimaryTeam } from "@/lib/team"

interface Entrenamiento {
  id: number
  equipoId: number
  inicio: string
  fin?: string | null
}

interface Horario {
  dia?: string | number
  hora?: string
  duracion?: string
}

type Feedback = {
  type: "success" | "error"
  message: string
}

const dayOptions = [
  { value: 1, label: "Lunes", short: "L" },
  { value: 2, label: "Martes", short: "M" },
  { value: 3, label: "Miércoles", short: "X" },
  { value: 4, label: "Jueves", short: "J" },
  { value: 5, label: "Viernes", short: "V" },
  { value: 6, label: "Sábado", short: "S" },
  { value: 0, label: "Domingo", short: "D" },
]

function normalizeText(value?: string | number | null) {
  if (value === null || value === undefined) return ""
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const labelToDay = new Map(dayOptions.map((day) => [normalizeText(day.label), day.value]))

function mapDayNameToValue(name?: string | number | null) {
  if (typeof name === "number") {
    if (name >= 0 && name <= 6) return name
    return null
  }
  const normalized = normalizeText(name)
  if (!normalized) return null
  if (labelToDay.has(normalized)) {
    return labelToDay.get(normalized) ?? null
  }
  const aliases: Record<string, number> = {
    lun: 1,
    mar: 2,
    mie: 3,
    jue: 4,
    vie: 5,
    sab: 6,
    dom: 0,
  }
  const aliasKeys = Object.keys(aliases)
  for (let index = 0; index < aliasKeys.length; index += 1) {
    const alias = aliasKeys[index]
    if (normalized.startsWith(alias)) {
      return aliases[alias]
    }
  }
  return null
}

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
  const inicioLabel = Number.isNaN(inicio.getTime()) ? "--:--" : format(inicio, "HH:mm")
  if (!fin || Number.isNaN(fin.getTime()) || fin <= inicio) {
    return `${inicioLabel}`
  }
  return `${inicioLabel} - ${format(fin, "HH:mm")}`
}

function sortDays(days: number[]) {
  const unique: number[] = []
  for (let index = 0; index < days.length; index += 1) {
    const day = days[index]
    if (!unique.includes(day)) {
      unique.push(day)
    }
  }
  return unique.sort((a, b) => {
    const normalizedA = a === 0 ? 7 : a
    const normalizedB = b === 0 ? 7 : b
    return normalizedA - normalizedB
  })
}

function countSessions(range: DateRange | undefined, days: number[]) {
  if (!range?.from) return 0
  const normalizedDays = sortDays(days)
  if (normalizedDays.length === 0) return 0
  const start = startOfDay(range.from)
  const end = startOfDay(range.to ?? range.from)
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

function normalizeTimeString(value?: string | null) {
  if (!value) return ""
  const match = String(value).match(/(\d{1,2})[:h](\d{2})/)
  if (!match) return String(value)
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return String(value)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

function parseDurationMinutes(value?: string | null) {
  if (!value) return null
  const match = String(value).match(/(\d+)/)
  if (!match) return null
  const minutes = Number(match[1])
  return Number.isFinite(minutes) ? minutes : null
}

function addMinutesToTime(time: string, minutes: number) {
  const normalized = normalizeTimeString(time)
  if (!normalized) return time
  const [hours, mins] = normalized.split(":").map((part) => Number(part))
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return normalized
  const base = new Date()
  base.setHours(hours, mins, 0, 0)
  const result = addMinutes(base, minutes)
  return format(result, "HH:mm")
}

function EntrenamientosPageContent() {
  const [temporadaActual, setTemporadaActual] = React.useState<string>("")
  const [equipo, setEquipo] = React.useState<any | null>(null)
  const [entrenamientos, setEntrenamientos] = React.useState<Entrenamiento[]>([])
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date())
  const [selectedEntrenamientoId, setSelectedEntrenamientoId] = React.useState<number | null>(null)
  const [isLoadingEntrenamientos, setIsLoadingEntrenamientos] = React.useState<boolean>(false)
  const [isCreatingTrainings, setIsCreatingTrainings] = React.useState<boolean>(false)
  const [deletingTrainingId, setDeletingTrainingId] = React.useState<number | null>(null)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => ({
    from: new Date(),
    to: addDays(new Date(), 30),
  }))
  const [selectedDays, setSelectedDays] = React.useState<number[]>([1, 3])
  const [startTime, setStartTime] = React.useState<string>("19:30")
  const [endTime, setEndTime] = React.useState<string>("21:00")
  const planDefaultsRef = React.useRef({ selectedDays: [1, 3], startTime: "19:30", endTime: "21:00" })
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const [isPlannerOpen, setIsPlannerOpen] = React.useState<boolean>(false)
  const plannerAutoOpenRef = React.useRef<boolean>(false)
  const queryPlannerDateRef = React.useRef<Date | null>(null)
  const searchParams = useSearchParams()
  const planParam = searchParams.get("plan")

  const sesionesPorFecha = React.useMemo(() => {
    const map = new Map<string, Entrenamiento[]>()
    for (let index = 0; index < entrenamientos.length; index += 1) {
      const sesion = entrenamientos[index]
      if (!sesion.inicio) continue
      const inicio = new Date(sesion.inicio)
      if (Number.isNaN(inicio.getTime())) continue
      const key = dateKey(inicio)
      const list = map.get(key) ?? []
      list.push(sesion)
      map.set(key, list)
    }
    map.forEach((list) => {
      list.sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
    })
    return map
  }, [entrenamientos])

  const sessionsForSelectedDate = React.useMemo(() => {
    const key = dateKey(selectedDate)
    return sesionesPorFecha.get(key) ?? []
  }, [selectedDate, sesionesPorFecha])

  const scheduledDates = React.useMemo(() => {
    const unique = new Map<string, Date>()
    for (let index = 0; index < entrenamientos.length; index += 1) {
      const sesion = entrenamientos[index]
      const inicio = new Date(sesion.inicio)
      if (Number.isNaN(inicio.getTime())) continue
      inicio.setHours(0, 0, 0, 0)
      unique.set(inicio.toISOString(), new Date(inicio))
    }
    return Array.from(unique.values())
  }, [entrenamientos])

  const selectedEntrenamiento = React.useMemo(() => {
    return entrenamientos.find((sesion) => sesion.id === selectedEntrenamientoId) ?? null
  }, [entrenamientos, selectedEntrenamientoId])

  const upcomingEntrenamientos = React.useMemo(() => {
    if (entrenamientos.length === 0) return []
    const now = new Date()
    return entrenamientos
      .filter((sesion) => {
        const inicio = new Date(sesion.inicio)
        return !Number.isNaN(inicio.getTime()) && !isBefore(inicio, now)
      })
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
  }, [entrenamientos])

  const pastEntrenamientos = React.useMemo(() => {
    if (entrenamientos.length === 0) return []
    const now = new Date()
    return entrenamientos
      .filter((sesion) => {
        const inicio = new Date(sesion.inicio)
        return Number.isNaN(inicio.getTime()) || isBefore(inicio, now)
      })
      .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())
  }, [entrenamientos])

  const nextEntrenamiento = upcomingEntrenamientos[0] ?? null

  const nextEntrenamientoDistance = nextEntrenamiento
    ? formatDistanceToNow(new Date(nextEntrenamiento.inicio), { addSuffix: true, locale: es })
    : null

  const sesionesDelMes = React.useMemo(() => {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    return entrenamientos.filter((sesion) => {
      if (!sesion.inicio) return false
      const inicio = new Date(sesion.inicio)
      if (Number.isNaN(inicio.getTime())) return false
      return isWithinInterval(inicio, { start, end })
    })
  }, [entrenamientos])

  const rangeLabel = React.useMemo(() => {
    if (!dateRange?.from) return "Selecciona un rango"
    if (!dateRange.to) return format(dateRange.from, "dd MMM", { locale: es })
    return `${format(dateRange.from, "dd MMM", { locale: es })} - ${format(dateRange.to, "dd MMM", { locale: es })}`
  }, [dateRange])

  const selectedEntrenamientoDate = selectedEntrenamiento?.inicio
    ? new Date(selectedEntrenamiento.inicio)
    : null

  const selectedEntrenamientoDistance = selectedEntrenamientoDate
    ? formatDistanceToNow(selectedEntrenamientoDate, { addSuffix: true, locale: es })
    : null

  const estimatedSessions = React.useMemo(
    () => countSessions(dateRange, selectedDays),
    [dateRange, selectedDays]
  )

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
      setFeedback({ type: "error", message: "No se pudieron cargar los entrenamientos." })
      setEntrenamientos([])
    } finally {
      setIsLoadingEntrenamientos(false)
    }
  }, [])

  const hydratePlanDefaultsFromHorarios = React.useCallback((horarios: Horario[]) => {
    if (!Array.isArray(horarios) || horarios.length === 0) return
    const parsedDays = horarios
      .map((horario) => mapDayNameToValue(horario.dia))
      .filter((value): value is number => value !== null)
    if (parsedDays.length > 0) {
      const normalized = sortDays(parsedDays)
      planDefaultsRef.current.selectedDays = normalized
      setSelectedDays(normalized)
    }
    const firstHorario = horarios.find((horario) => horario.hora)
    if (firstHorario?.hora) {
      const normalized = normalizeTimeString(firstHorario.hora)
      if (normalized) {
        planDefaultsRef.current.startTime = normalized
        setStartTime(normalized)
        const duration = parseDurationMinutes(firstHorario.duracion)
        if (duration) {
          const computedEnd = addMinutesToTime(normalized, duration)
          planDefaultsRef.current.endTime = computedEnd
          setEndTime(computedEnd)
        }
      }
    }
  }, [])

  const resetPlanToDefaults = React.useCallback(() => {
    const now = new Date()
    setDateRange({ from: now, to: addDays(now, 30) })
    setSelectedDays(planDefaultsRef.current.selectedDays)
    setStartTime(planDefaultsRef.current.startTime)
    setEndTime(planDefaultsRef.current.endTime)
  }, [])

  React.useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [temporadaRes, equiposRes] = await Promise.all([
          fetch("/api/temporadas?actual=1", { cache: "no-store" }),
          fetch("/api/equipos", { cache: "no-store" }),
        ])
        const temporada = await temporadaRes.json()
        setTemporadaActual(temporada?.id || "")
        const equipos = await equiposRes.json()
        const eq = resolvePrimaryTeam(equipos || [])
        setEquipo(eq ?? null)
        if (eq?.id) {
          const horariosRes = await fetch(`/api/horarios?equipoId=${eq.id}`, { cache: "no-store" })
          const horariosData = await horariosRes.json()
          if (Array.isArray(horariosData)) {
            hydratePlanDefaultsFromHorarios(horariosData)
          }
          await loadEntrenamientos(eq.id)
        }
      } catch (error) {
        console.error("No se pudieron cargar los datos iniciales", error)
        setFeedback({ type: "error", message: "No se pudieron cargar los datos iniciales." })
      }
    }
    cargarDatos()
  }, [hydratePlanDefaultsFromHorarios, loadEntrenamientos])

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
        setSelectedDate(start)
      }
    }
  }, [entrenamientos, selectedEntrenamientoId])

  const handleSelectDate = (date?: Date) => {
    if (!date) return
    setSelectedDate(date)
    const sameDay = sesionesPorFecha.get(dateKey(date)) ?? []
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
      setSelectedDate(inicio)
    }
  }

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day)
      }
      return sortDays([...prev, day])
    })
  }

  const handleCrearEntrenamientos = async () => {
    if (!equipo || !dateRange?.from || !startTime || selectedDays.length === 0) {
      setFeedback({
        type: "error",
        message: "Configura un rango, la hora de inicio y al menos un día para programar entrenamientos.",
      })
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
          timezoneOffset: new Date().getTimezoneOffset(),
        }),
      })
      if (!res.ok) {
        throw new Error("No se pudieron crear los entrenamientos")
      }
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setFeedback({ type: "success", message: `Se programaron ${data.length} entrenamientos.` })
      } else {
        setFeedback({
          type: "success",
          message: "No se generaron nuevas sesiones porque ya estaban en el calendario.",
        })
      }
      await loadEntrenamientos(equipo.id)
    } catch (error) {
      console.error("Error al crear entrenamientos", error)
      setFeedback({ type: "error", message: "No se pudieron crear los entrenamientos." })
    } finally {
      setIsCreatingTrainings(false)
    }
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
      const res = await fetch(`/api/entrenamientos?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        throw new Error("No se pudo eliminar el entrenamiento")
      }
      setFeedback({ type: "success", message: "Entrenamiento eliminado correctamente." })
      await loadEntrenamientos(equipo.id)
    } catch (error) {
      console.error("No se pudo eliminar el entrenamiento", error)
      setFeedback({ type: "error", message: "No se pudo eliminar el entrenamiento." })
    } finally {
      setDeletingTrainingId(null)
    }
  }

  const prefillPlanForDate = React.useCallback(
    (date: Date, sesion?: Entrenamiento | null) => {
      const normalized = startOfDay(date)
      setDateRange({ from: normalized, to: normalized })
      setSelectedDays([normalized.getDay()])
      if (sesion) {
        const inicio = sesion.inicio ? new Date(sesion.inicio) : null
      const fin = sesion.fin ? new Date(sesion.fin) : null
      if (inicio && !Number.isNaN(inicio.getTime())) {
        setStartTime(format(inicio, "HH:mm"))
      }
      if (fin && !Number.isNaN(fin.getTime())) {
        setEndTime(format(fin, "HH:mm"))
      } else {
        setEndTime(planDefaultsRef.current.endTime)
      }
    }
    setIsPlannerOpen(true)
  }, [setDateRange, setEndTime, setSelectedDays, setStartTime])

  React.useEffect(() => {
    if (plannerAutoOpenRef.current) return
    if (isLoadingEntrenamientos) return
    if (entrenamientos.length > 0) return
    plannerAutoOpenRef.current = true
    setIsPlannerOpen(true)
  }, [entrenamientos.length, isLoadingEntrenamientos])

  React.useEffect(() => {
    if (!planParam) return
    const parsed = new Date(`${planParam}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return
    queryPlannerDateRef.current = parsed
  }, [planParam])

  React.useEffect(() => {
    const targetDate = queryPlannerDateRef.current
    if (!targetDate) return
    if (isLoadingEntrenamientos) return
    const matchingSession = entrenamientos.find((sesion) => {
      const inicio = sesion.inicio ? new Date(sesion.inicio) : null
      return inicio && !Number.isNaN(inicio.getTime()) && isSameDay(inicio, targetDate)
    })
    queryPlannerDateRef.current = null
    plannerAutoOpenRef.current = true
    prefillPlanForDate(targetDate, matchingSession)
  }, [entrenamientos, isLoadingEntrenamientos, prefillPlanForDate])

  if (!equipo) {
    return <div className="p-4">Cargando calendario...</div>
  }

  return (
    <>
      <div className="flex flex-col gap-4 px-4 py-6 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Calendario de entrenamientos</h1>
            <p className="text-muted-foreground">
              Programa, visualiza y gestiona las sesiones de {equipo.nombre} para la temporada {" "}
              {temporadaActual || "--"}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setIsPlannerOpen((prev) => !prev)}
              variant="default"
              className="flex items-center"
            >
              {isPlannerOpen ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" /> Ocultar planificador
                </>
              ) : (
                <>
                  <CalendarRange className="mr-2 h-4 w-4" /> Gestionar entrenamientos
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => loadEntrenamientos(equipo.id)} disabled={isLoadingEntrenamientos}>
              {isLoadingEntrenamientos ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Actualizar
                </>
              )}
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/asistencias">
                Gestionar asistencias
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {feedback && (
          <Alert variant={feedback.type === "error" ? "destructive" : "default"}>
            <AlertTitle>{feedback.type === "error" ? "Acción necesaria" : "Todo listo"}</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Próximo entrenamiento</CardTitle>
              <CalendarClock className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="mt-2 space-y-1">
              {nextEntrenamiento ? (
                <>
                  <div className="text-lg font-semibold">
                    {formatDateLong(new Date(nextEntrenamiento.inicio))}
                  </div>
                  <div className="text-sm text-muted-foreground">{formatTimeRange(nextEntrenamiento)}</div>
                  {nextEntrenamientoDistance && (
                    <div className="text-sm text-muted-foreground">Comienza {nextEntrenamientoDistance}</div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay sesiones programadas. Utiliza el planificador para crear tu calendario.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Sesiones en el mes</CardTitle>
              <History className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="mt-2 space-y-1">
              <div className="text-2xl font-bold">{sesionesDelMes.length}</div>
              <p className="text-sm text-muted-foreground">
                {sesionesDelMes.length === 1
                  ? "Sesión programada en el mes en curso"
                  : "Sesiones programadas en el mes en curso"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Próximas sesiones</CardTitle>
              <CalendarClock className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="mt-2 space-y-1">
              <div className="text-2xl font-bold">{upcomingEntrenamientos.length}</div>
              <p className="text-sm text-muted-foreground">Incluye los entrenamientos ya confirmados a partir de hoy.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Sesiones registradas</CardTitle>
            </CardHeader>
            <CardContent className="mt-2 space-y-1">
              <div className="text-2xl font-bold">{entrenamientos.length}</div>
              <p className="text-sm text-muted-foreground">Histórico total de entrenamientos en el calendario.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6 px-4 pb-6 lg:px-6">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Agenda del equipo</CardTitle>
            <CardDescription>Selecciona un día para ver sus entrenamientos programados.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1.35fr,1fr]">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              modifiers={{ scheduled: scheduledDates }}
              modifiersClassNames={{
                scheduled: "bg-primary/10 text-primary font-semibold",
                today: "border-primary",
              }}
            />
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {formatDateLong(selectedDate)}
                  </h4>
                  <Badge variant="secondary">{sessionsForSelectedDate.length}</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {sessionsForSelectedDate.length > 0 ? (
                    sessionsForSelectedDate.map((sesion) => {
                      const inicio = new Date(sesion.inicio)
                      return (
                        <div
                          key={sesion.id}
                          className={cn(
                            "rounded-lg border p-3 text-sm transition hover:border-primary hover:bg-primary/5",
                            selectedEntrenamientoId === sesion.id && "border-primary bg-primary/10"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold">{format(inicio, "HH:mm")}</div>
                              <p className="text-xs text-muted-foreground">{formatTimeRange(sesion)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleSelectEntrenamiento(sesion)}>
                                Ver detalles
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
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                      No hay entrenamientos programados para este día.
                      <Button
                        variant="link"
                        className="mt-2 h-auto p-0 text-primary"
                        onClick={() => prefillPlanForDate(selectedDate)}
                      >
                        Usar esta fecha en el planificador
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium">Próximos entrenamientos</h4>
                <ScrollArea className="h-48 rounded-md border">
                  <div className="divide-y text-sm">
                    {upcomingEntrenamientos.length === 0 ? (
                      <div className="p-4 text-muted-foreground">
                        No hay entrenamientos futuros programados.
                      </div>
                    ) : (
                      upcomingEntrenamientos.map((sesion) => {
                        const inicio = new Date(sesion.inicio)
                        return (
                          <button
                            key={sesion.id}
                            type="button"
                            onClick={() => handleSelectEntrenamiento(sesion)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-muted",
                              selectedEntrenamientoId === sesion.id && "bg-primary/5"
                            )}
                          >
                            <div>
                              <div className="font-medium">{formatDateLong(inicio)}</div>
                              <div className="text-xs text-muted-foreground">{formatTimeRange(sesion)}</div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)] lg:items-start">
          <Card className="min-w-0">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Detalle del entrenamiento</CardTitle>
                <CardDescription>
                  Consulta la información de la sesión seleccionada y accede al registro de asistencia.
                </CardDescription>
              </div>
              {selectedEntrenamiento && (
                <Button asChild>
                  <Link href="/dashboard/asistencias">
                    Registrar asistencia
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              {selectedEntrenamiento ? (
                <>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {formatTimeRange(selectedEntrenamiento)}
                    </span>
                    {selectedEntrenamientoDate && isToday(selectedEntrenamientoDate) && (
                      <Badge variant="secondary">Hoy</Badge>
                    )}
                    {selectedEntrenamientoDate && isBefore(selectedEntrenamientoDate, new Date()) && (
                      <Badge variant="outline">Ya realizado</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">
                      {selectedEntrenamientoDate ? formatDateLong(selectedEntrenamientoDate) : "--"}
                    </div>
                    {selectedEntrenamientoDistance && (
                      <p className="text-sm text-muted-foreground">
                        {selectedEntrenamientoDate && isBefore(selectedEntrenamientoDate, new Date())
                          ? `Finalizó ${selectedEntrenamientoDistance}`
                          : `Comienza ${selectedEntrenamientoDistance}`}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Las asistencias y observaciones vinculadas a esta sesión se gestionan desde el módulo de asistencias.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => prefillPlanForDate(selectedEntrenamientoDate ?? new Date(), selectedEntrenamiento)}
                    >
                      Duplicar horario en planificador
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteEntrenamiento(selectedEntrenamiento.id)}
                      disabled={deletingTrainingId === selectedEntrenamiento.id}
                    >
                      {deletingTrainingId === selectedEntrenamiento.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar entrenamiento
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Selecciona una sesión en el calendario para ver los detalles y acceder rápidamente a su asistencia.
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Histórico del calendario</CardTitle>
              <CardDescription>
                Consulta todas las sesiones registradas y accede rápidamente a las más recientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upcoming">Próximos</TabsTrigger>
                  <TabsTrigger value="history">Historial</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="mt-4">
                  <div className="space-y-2">
                    {upcomingEntrenamientos.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No hay sesiones futuras. Programa nuevas fechas para verlas aquí.
                      </div>
                    ) : (
                      upcomingEntrenamientos.map((sesion) => {
                        const inicio = new Date(sesion.inicio)
                        return (
                          <div
                            key={sesion.id}
                            className="flex items-center justify-between rounded-lg border p-3 text-sm"
                          >
                            <div>
                              <div className="font-medium">{formatDateLong(inicio)}</div>
                              <p className="text-xs text-muted-foreground">{formatTimeRange(sesion)}</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleSelectEntrenamiento(sesion)}>
                              Ver
                            </Button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-2 text-sm">
                      {pastEntrenamientos.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                          Aún no hay entrenamientos finalizados en el registro.
                        </div>
                      ) : (
                        pastEntrenamientos.map((sesion) => {
                          const inicio = new Date(sesion.inicio)
                          return (
                            <button
                              key={sesion.id}
                              type="button"
                              onClick={() => handleSelectEntrenamiento(sesion)}
                              className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition hover:bg-muted"
                            >
                              <div>
                                <div className="font-medium">{formatDateLong(inicio)}</div>
                                <p className="text-xs text-muted-foreground">{formatTimeRange(sesion)}</p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <Collapsible open={isPlannerOpen} onOpenChange={setIsPlannerOpen}>
          <Card className="min-w-0">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Planificador de entrenamientos</CardTitle>
                <CardDescription>
                  Genera sesiones individuales o recurrentes usando el rango de fechas y los días seleccionados.
                </CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  {isPlannerOpen ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" /> Ocultar planificador
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" /> Gestionar entrenamientos
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
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

                <div className="grid gap-4 md:grid-cols-2">
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
                    <span>Selecciona al menos un día y define un rango para generar entrenamientos.</span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Ajusta el rango, días y horarios antes de programar para evitar duplicados.
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={resetPlanToDefaults}>
                    Restablecer
                  </Button>
                  <Button onClick={handleCrearEntrenamientos} disabled={isCreatingTrainings}>
                    {isCreatingTrainings ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Programando...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" /> Programar entrenamientos
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </>
  )
}

export default function EntrenamientosPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando planificador…</span>
        </div>
      }
    >
      <EntrenamientosPageContent />
    </React.Suspense>
  )
}
