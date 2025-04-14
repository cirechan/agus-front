"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Partido, ResultadoFormData } from "@/types/horarios"
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

const resultadoSchema = z.object({
  golesLocal: z.coerce.number().min(0, "No puede ser negativo"),
  golesVisitante: z.coerce.number().min(0, "No puede ser negativo"),
})

interface ResultadoFormProps {
  partido: Partido
  onSubmit: (data: ResultadoFormData) => void
  onCancel: () => void
}

export function ResultadoForm({ partido, onSubmit, onCancel }: ResultadoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ResultadoFormData>({
    resolver: zodResolver(resultadoSchema),
    defaultValues: {
      golesLocal: partido.resultado?.golesLocal || 0,
      golesVisitante: partido.resultado?.golesVisitante || 0,
    },
  })

  const handleSubmit = async (data: ResultadoFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="text-center flex-1">
            <p className="font-medium mb-2">{partido.equipo}</p>
            <FormField
              control={form.control}
              name="golesLocal"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      className="w-16 text-center text-xl mx-auto"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="text-xl font-bold">-</div>
          
          <div className="text-center flex-1">
            <p className="font-medium mb-2">{partido.rival}</p>
            <FormField
              control={form.control}
              name="golesVisitante"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      className="w-16 text-center text-xl mx-auto"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar resultado"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
