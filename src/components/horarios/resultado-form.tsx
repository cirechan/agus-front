"use client"

import { useState } from "react"
import { Partido } from "@/types/horarios"
import { Button } from "@/components/ui/button"

interface ResultadoFormProps {
  partido: Partido
  onSubmit: (data: { golesLocal: number; golesVisitante: number }) => void
  onCancel?: () => void
}

export function ResultadoForm({ partido, onSubmit, onCancel }: ResultadoFormProps) {
  const [golesLocal, setGolesLocal] = useState<number>(0)
  const [golesVisitante, setGolesVisitante] = useState<number>(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      golesLocal,
      golesVisitante
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <p className="font-medium mb-2">{partido.equipo}</p>
          <input
            type="number"
            min="0"
            value={golesLocal}
            onChange={(e) => setGolesLocal(parseInt(e.target.value) || 0)}
            className="w-16 h-12 text-center text-xl border rounded-md"
          />
        </div>
        
        <div className="text-xl font-bold">-</div>
        
        <div className="text-center">
          <p className="font-medium mb-2">{partido.rival}</p>
          <input
            type="number"
            min="0"
            value={golesVisitante}
            onChange={(e) => setGolesVisitante(parseInt(e.target.value) || 0)}
            className="w-16 h-12 text-center text-xl border rounded-md"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit">
          Guardar resultado
        </Button>
      </div>
    </form>
  )
}
