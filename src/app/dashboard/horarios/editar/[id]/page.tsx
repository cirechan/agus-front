"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { CustomSelect } from "@/components/ui/custom-select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
// Los equipos y temporadas se obtienen desde la API del proyecto
import { partidosService } from "@/lib/api/partidos"
import { PartidoFormData, Partido } from "@/types/horarios"
import { Skeleton } from "@/components/ui/skeleton"

const partidoSchema = z.object({
  equipo: z.string().min(1, "Selecciona un equipo"),
  rival: z.string().min(1, "Ingresa el nombre del equipo rival"),
  fecha: z.date({
    required_error: "Selecciona una fecha",
  }),
  hora: z.string().min(1, "Selecciona una hora"),
  ubicacion: z.enum(["casa", "fuera"], {
    required_error: "Selecciona la ubicación",
  }),
  temporada: z.string().min(1, "Selecciona una temporada"),
  vestuarioLocal: z.coerce.number().optional(),
  vestuarioVisitante: z.coerce.number().optional(),
  campo: z.string().optional(),
  equipacion: z.object({
    color: z.enum(["roja", "azul", "blanca", "negra"], {
      required_error: "Selecciona un color",
    }),
    tipo: z.enum(["principal", "alternativa"], {
      required_error: "Selecciona un tipo",
    }),
  }),
  observaciones: z.string().optional(),
})

export default function EditarPartidoPage() {
  const router = useRouter()
  const params = useParams()
  const [partido, setPartido] = useState<Partido | null>(null)
  const [equipos, setEquipos] = useState([])
  const [temporadas, setTemporadas] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<PartidoFormData>({
    resolver: zodResolver(partidoSchema),
    defaultValues: {
      ubicacion: "casa",
      equipacion: {
        color: "roja",
        tipo: "principal",
      },
    },
  })

  const ubicacion = form.watch("ubicacion")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Cargar partido
        const partidoResponse = await partidosService.getPartidoById(params.id as string)
        setPartido(partidoResponse.data)

        // Cargar equipos
        const equiposRes = await fetch('/api/equipos')
        if (!equiposRes.ok) throw new Error('Error al obtener equipos')
        const equiposData = await equiposRes.json()
        setEquipos(
          equiposData.map((equipo: { _id: any; nombre: any }) => ({
            value: equipo._id,
            label: equipo.nombre
          }))
        )

        // Cargar temporadas
        const temporadasRes = await fetch('/api/temporadas')
        if (!temporadasRes.ok) throw new Error('Error al obtener temporadas')
        const temporadasData = await temporadasRes.json()
        setTemporadas(
          temporadasData.map((temporada: { _id: any; nombre: any }) => ({
            value: temporada._id,
            label: temporada.nombre
          }))
        )
        
        // Establecer valores del formulario
        const partidoData = partidoResponse.data
        form.reset({
          equipo: partidoData.equipo,
          rival: partidoData.rival,
          fecha: new Date(partidoData.fecha),
          hora: partidoData.hora,
          ubicacion: partidoData.ubicacion,
          temporada: partidoData.temporada,
          vestuarioLocal: partidoData.vestuarioLocal,
          vestuarioVisitante: partidoData.vestuarioVisitante,
          campo: partidoData.campo,
          equipacion: {
            color: partidoData.equipacion.color,
            tipo: partidoData.equipacion.tipo,
          },
          observaciones: partidoData.observaciones,
        })
        
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError("Error al cargar los datos necesarios")
      } finally {
        setLoading(false)
      }
    }
    
    if (params.id) {
      fetchData()
    }
  }, [params.id, form])

  const onSubmit = async (data: PartidoFormData) => {
    try {
      setSubmitting(true)
      setError(null)
      
      // Validar campos condicionales
      if (data.ubicacion === "casa") {
        if (!data.vestuarioLocal) {
          form.setError("vestuarioLocal", { 
            type: "manual", 
            message: "El vestuario local es requerido para partidos en casa" 
          })
          setSubmitting(false)
          return
        }
        if (!data.vestuarioVisitante) {
          form.setError("vestuarioVisitante", { 
            type: "manual", 
            message: "El vestuario visitante es requerido para partidos en casa" 
          })
          setSubmitting(false)
          return
        }
      } else if (data.ubicacion === "fuera") {
        if (!data.campo) {
          form.setError("campo", { 
            type: "manual", 
            message: "El campo es requerido para partidos fuera" 
          })
          setSubmitting(false)
          return
        }
      }
      
      await partidosService.updatePartido(params.id as string, data)
      router.push(`/dashboard/horarios/${params.id}`)
    } catch (err) {
      console.error("Error al actualizar partido:", err)
      setError("Error al actualizar el partido. Verifica los datos e intenta nuevamente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/horarios/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Editar partido</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del partido</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="equipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipo</FormLabel>
                        <CustomSelect
                          options={equipos}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Seleccionar equipo"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="rival"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rival</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del equipo rival" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fecha"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha</FormLabel>
                        <DatePicker
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="hora"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Hora</FormLabel>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ubicacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <CustomSelect
                          options={[
                            { value: "casa", label: "En casa" },
                            { value: "fuera", label: "Fuera" }
                          ]}
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="temporada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temporada</FormLabel>
                        <CustomSelect
                          options={temporadas}
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {ubicacion === "casa" ? (
                    <>
                      <FormField
                        control={form.control}
                        name="vestuarioLocal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vestuario local</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="vestuarioVisitante"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vestuario visitante</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <FormField
                      control={form.control}
                      name="campo"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Campo</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del campo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="equipacion.color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color de equipación</FormLabel>
                        <CustomSelect
                          options={[
                            { value: "roja", label: "Roja" },
                            { value: "azul", label: "Azul" },
                            { value: "blanca", label: "Blanca" },
                            { value: "negra", label: "Negra" }
                          ]}
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="equipacion.tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de equipación</FormLabel>
                        <CustomSelect
                          options={[
                            { value: "principal", label: "Principal" },
                            { value: "alternativa", label: "Alternativa" }
                          ]}
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Información adicional sobre el partido" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    disabled={submitting}
                  >
                    <Link href={`/dashboard/horarios/${params.id}`}>Cancelar</Link>
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
