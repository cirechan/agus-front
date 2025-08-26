"use client"

import * as React from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react"
import { format, addDays, subDays, isToday, parseISO } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import cadeteB from "@/data/cadete-b.json"

const jugadores = cadeteB.jugadores.map(j => ({
  id: j.id,
  nombre: j.nombre,
  apellidos: j.apellidos,
  dorsal: j.dorsal,
  equipo: j.equipo
}))

// Motivos de ausencia predefinidos
const motivosAusencia = [
  { value: "lesion", label: "Lesión" },
  { value: "desconvocatoria", label: "Desconvocatoria" },
  { value: "trabajo", label: "Trabajo" },
  { value: "estudios", label: "Estudios" },
  { value: "viaje", label: "Viaje" },
  { value: "no_justificado", label: "No justificado" },
]

// Horarios de entrenamiento predefinidos
const horariosEntrenamiento = [
  { dia: "Lunes", hora: "18:00", duracion: "90 min" },
  { dia: "Miércoles", hora: "18:00", duracion: "90 min" },
  { dia: "Viernes", hora: "17:30", duracion: "90 min" },
]

export default function AsistenciasPage() {
  const [fecha, setFecha] = React.useState<Date>(new Date())
  const [registros, setRegistros] = React.useState<{
    jugadorId: string;
    asistio: boolean;
    motivo?: string;
  }[]>([])
  
  // Inicializar registros con todos los jugadores asistiendo por defecto
  React.useEffect(() => {
    const registrosIniciales = jugadores.map(jugador => ({
      jugadorId: jugador.id,
      asistio: true
    }))
    setRegistros(registrosIniciales)
  }, [])
  
  // Manejar cambio de asistencia
  const handleAsistenciaChange = (jugadorId: string, asistio: boolean) => {
    setRegistros(prev => 
      prev.map(registro => 
        registro.jugadorId === jugadorId 
          ? { ...registro, asistio, motivo: asistio ? undefined : registro.motivo } 
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
  
  // Cambiar a día anterior
  const handlePrevDay = () => {
    setFecha(prev => subDays(prev, 1))
  }
  
  // Cambiar a día siguiente
  const handleNextDay = () => {
    setFecha(prev => addDays(prev, 1))
  }
  
  // Guardar registros de asistencia
  const handleGuardarAsistencias = () => {
    // Aquí se enviarían los datos al backend
    console.log("Guardando asistencias:", {
      fecha: format(fecha, "yyyy-MM-dd"),
      registros
    })
    
    // Mostrar mensaje de éxito (en una implementación real)
    alert("Asistencias guardadas correctamente")
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
                Alevín A - Temporada 2024-2025
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {horariosEntrenamiento.map((horario, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{horario.dia}</p>
                      <p className="text-sm text-muted-foreground">{horario.hora} ({horario.duracion})</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir horario
              </Button>
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
                <table className="w-full">
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
                          <td className="p-2">{jugador.nombre} {jugador.apellidos}</td>
                          <td className="p-2">{jugador.dorsal}</td>
                          <td className="p-2">
                            <Switch
                              checked={registro?.asistio ?? true}
                              onCheckedChange={(checked) => handleAsistenciaChange(jugador.id, checked)}
                            />
                          </td>
                          <td className="p-2">
                            {registro && !registro.asistio && (
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
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
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
