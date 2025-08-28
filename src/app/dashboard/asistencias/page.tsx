"use client"

import * as React from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, X } from "lucide-react"
import { format, addDays, subDays, isToday } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Datos iniciales obtenidos desde la API


// Motivos de ausencia predefinidos
const motivosAusencia = [
  { value: "lesion", label: "Lesión" },
  { value: "desconvocatoria", label: "Desconvocatoria" },
  { value: "trabajo", label: "Trabajo" },
  { value: "estudios", label: "Estudios" },
  { value: "viaje", label: "Viaje" },
  { value: "no_justificado", label: "No justificado" },
  { value: "otro", label: "Otro" },
]

// Horarios de entrenamiento predefinidos
interface Horario {
  id?: number
  dia: string
  hora: string
  duracion: string
}

export default function AsistenciasPage() {
  const [fecha, setFecha] = React.useState<Date>(new Date())
  const [temporadaActual, setTemporadaActual] = React.useState<string>('')
  const [equipo, setEquipo] = React.useState<any | null>(null)
  const [jugadores, setJugadores] = React.useState<any[]>([])
  const [registros, setRegistros] = React.useState<{
    id?: number;
    jugadorId: string;
    asistio: boolean;
    motivo?: string;
    motivoPersonalizado?: string;
  }[]>([])
  const [horarios, setHorarios] = React.useState<Horario[]>([])

  const handleAddHorario = () => {
    setHorarios(prev => [...prev, { dia: "", hora: "", duracion: "" }])
  }

  const handleDeleteHorario = async (id?: number) => {
    if (id) {
      await fetch(`/api/horarios?id=${id}`, { method: 'DELETE' })
    }
    setHorarios(prev => prev.filter(h => h.id !== id))
  }

  const handleHorarioChange = (index: number, field: keyof Horario, value: string) => {
    setHorarios(prev =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    )
  }

  const handleGuardarHorarios = async () => {
    if (!equipo) return
    await fetch('/api/horarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipoId: equipo.id, horarios }),
    })
    alert('Horarios actualizados')
  }

  React.useEffect(() => {
    const cargarDatos = async () => {
      const [temporadaRes, equiposRes] = await Promise.all([
        fetch('/api/temporadas?actual=1', { cache: 'no-store' }),
        fetch('/api/equipos', { cache: 'no-store' }),
      ])
      const temporada = await temporadaRes.json()
      setTemporadaActual(temporada?.id || '')
      const equipos = await equiposRes.json()
      const eq = equipos[0]
      setEquipo(eq)
      if (eq) {
        const jRes = await fetch(`/api/jugadores?equipoId=${eq.id}`, { cache: 'no-store' })
        const jData = await jRes.json()
        setJugadores(jData.map((j: any, index: number) => ({
          id: String(j.id),
          nombre: j.nombre,
          dorsal: index + 1,
        })))
        fetch(`/api/horarios?equipoId=${eq.id}`, { cache: 'no-store' })
          .then(res => res.json())
          .then(data => setHorarios(data))
      }
    }
    cargarDatos()
  }, [])

  // Inicializar registros con todos los jugadores asistiendo por defecto

  React.useEffect(() => {
    if (!equipo) return
    const cargar = async () => {
      const res = await fetch(`/api/asistencias?fecha=${format(fecha, 'yyyy-MM-dd')}&equipoId=${equipo.id}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.length > 0) {
        setRegistros(
          data.map((r: any) => ({
            id: r.id,
            jugadorId: String(r.jugadorId),
            asistio: r.asistio,
            motivo: r.motivo,
          }))
        )
      } else {
        const registrosIniciales = jugadores.map((jugador: any) => ({
          jugadorId: jugador.id,
          asistio: true,
        }))
        setRegistros(registrosIniciales)
      }
    }
    cargar()
  }, [fecha, equipo, jugadores])

  // Manejar cambio de asistencia
  const handleAsistenciaChange = (jugadorId: string, asistio: boolean) => {
    setRegistros(prev => 
      prev.map(registro => 
        registro.jugadorId === jugadorId 
          ? { ...registro, asistio, motivo: asistio ? undefined : registro.motivo, motivoPersonalizado: asistio ? undefined : registro.motivoPersonalizado }
          : registro
      )
    )
  }
  
  // Manejar cambio de motivo de ausencia
  const handleMotivoChange = (jugadorId: string, motivo: string) => {
    setRegistros(prev =>
      prev.map(registro =>
        registro.jugadorId === jugadorId
          ? { ...registro, motivo }
          : registro
      )
    )
  }

  const handleMotivoPersonalizadoChange = (jugadorId: string, motivoPersonalizado: string) => {
    setRegistros(prev =>
      prev.map(registro =>
        registro.jugadorId === jugadorId
          ? { ...registro, motivoPersonalizado }
          : registro
      )
    )
  }
  
  // Cambiar a día anterior
  const handlePrevDay = () => {
    setFecha(prev => subDays(prev, 1))
  }
  
  // Cambiar a día siguiente
  const handleNextDay = () => {
    setFecha(prev => addDays(prev, 1))
  }
  
  // Guardar registros de asistencia
  const handleGuardarAsistencias = async () => {
    const registrosFinales = registros.map(r => ({
      jugadorId: Number(r.jugadorId),
      asistio: r.asistio,
      motivo: r.motivo === 'otro' ? r.motivoPersonalizado : r.motivo
    }))
    await fetch('/api/asistencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fecha: format(fecha, 'yyyy-MM-dd'),
        registros: registrosFinales,
        equipoId: equipo.id,
      })
    })
    alert('Asistencias guardadas correctamente')
  }

  const handleEliminarAsistencias = async () => {
    await fetch(`/api/asistencias?fecha=${format(fecha, 'yyyy-MM-dd')}&equipoId=${equipo.id}`, {
      method: 'DELETE'
    })
    const registrosIniciales = jugadores.map(jugador => ({
      jugadorId: jugador.id,
      asistio: true,
    }))
    setRegistros(registrosIniciales)
    alert('Registros eliminados')
  }

  if (!equipo) {
    return <div className="p-4">Cargando...</div>
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Control de Asistencias</h1>
          <p className="text-muted-foreground">
            Registra la asistencia a los entrenamientos
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 px-4 py-6 md:grid-cols-3 lg:px-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Horarios de Entrenamiento</CardTitle>
              <CardDescription>
                {equipo.nombre} - Temporada {temporadaActual}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {horarios.map((horario, index) => (
                  <div key={horario.id ?? index} className="flex items-center gap-2 rounded-lg border p-3">
                    <Input
                      value={horario.dia}
                      onChange={(e) => handleHorarioChange(index, 'dia', e.target.value)}
                      placeholder="Día"
                    />
                    <Input
                      value={horario.hora}
                      onChange={(e) => handleHorarioChange(index, 'hora', e.target.value)}
                      placeholder="Hora"
                      className="w-[90px]"
                    />
                    <Input
                      value={horario.duracion}
                      onChange={(e) => handleHorarioChange(index, 'duracion', e.target.value)}
                      placeholder="Duración"
                      className="w-[90px]"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteHorario(horario.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button variant="outline" onClick={handleAddHorario}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir horario
              </Button>
              <Button onClick={handleGuardarHorarios}>Guardar horarios</Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Registro de Asistencia</CardTitle>
                <CardDescription>
                  Selecciona la fecha y marca la asistencia
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(fecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                      {isToday(fecha) && (
                        <Badge variant="secondary" className="ml-2">
                          Hoy
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={(date) => date && setFecha(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={handleNextDay}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                      const registro = registros.find(r => r.jugadorId === jugador.id)
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
                                {registro.motivo === 'otro' && (
                                  <Input
                                    value={registro.motivoPersonalizado || ''}
                                    onChange={(e) => handleMotivoPersonalizadoChange(jugador.id, e.target.value)}
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
                    const registro = registros.find(r => r.jugadorId === jugador.id)
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
                            {registro.motivo === 'otro' && (
                              <Input
                                value={registro.motivoPersonalizado || ''}
                                onChange={(e) => handleMotivoPersonalizadoChange(jugador.id, e.target.value)}
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
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="destructive" className="w-full" onClick={handleEliminarAsistencias}>
                Eliminar Registros
              </Button>
              <Button className="w-full" onClick={handleGuardarAsistencias}>
                Guardar Asistencias
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  )
}
