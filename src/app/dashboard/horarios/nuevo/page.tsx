"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { horariosService } from "@/lib/api/horarios"
import { equiposOptions, vestuariosOptions, equipacionOptions } from "@/types/horarios"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const partidoSchema = z.object({
  fecha: z.date({
    required_error: "La fecha es obligatoria",
  }),
  hora: z.string({
    required_error: "La hora es obligatoria",
  }),
  equipo: z.string({
    required_error: "El equipo es obligatorio",
  }),
  rival: z.string({
    required_error: "El rival es obligatorio",
  }),
  ubicacion: z.enum(["casa", "fuera"], {
    required_error: "La ubicación es obligatoria",
  }),
  vestuarioLocal: z.number().optional(),
  vestuarioVisitante: z.number().optional(),
  campo: z.string().optional(),
  equipacion: z.object({
    color: z.string({
      required_error: "El color de equipación es obligatorio",
    }),
    tipo: z.string().default("principal"),
  }),
})

type PartidoFormValues = z.infer<typeof partidoSchema>

export default function NuevoPartidoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<PartidoFormValues>({
    resolver: zodResolver(partidoSchema),
    defaultValues: {
      fecha: new Date(),
      hora: "10:00",
      equipo: "",
      rival: "",
      ubicacion: "casa",
      equipacion: {
        color: "roja",
        tipo: "principal",
      },
    },
  })

  const ubicacion = form.watch("ubicacion")

  const onSubmit = async (data: PartidoFormValues) => {
    try {
      setLoading(true)
      setError(null)
      await horariosService.createPartido(data)
      router.push("/dashboard/horarios")
    } catch (err) {
      setError("Error al crear el partido")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/horarios">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuevo partido</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del partido</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <DatePicker
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora</FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="equipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipo</FormLabel>
                      <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona equipo" />
  </SelectTrigger>
  <SelectContent>
    {equiposOptions.map((equipo) => (
      <SelectItem key={equipo.value} value={equipo.value}>
        {equipo.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
                      </FormControl>
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
                        <Input {...field} placeholder="Nombre del equipo rival" />
                      </FormControl>
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
                      <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona ubicación" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="casa">En casa</SelectItem>
    <SelectItem value="fuera">Fuera</SelectItem>
  </SelectContent>
</Select>
                      </FormControl>
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
                          <Select
          value={field.value?.toString()}
          onValueChange={(value) => field.onChange(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona vestuario" />
          </SelectTrigger>
          <SelectContent>
            {vestuariosOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                          <Select
          value={field.value?.toString()}
          onValueChange={(value) => field.onChange(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona vestuario" />
          </SelectTrigger>
          <SelectContent>
            {vestuariosOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                      <FormItem>
                        <FormLabel>Campo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombre del campo" />
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
                      <FormControl>
                      <Select
          value={field.value}
          onValueChange={field.onChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona color" />
          </SelectTrigger>
          <SelectContent>
            {equipacionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/horarios">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar partido"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
