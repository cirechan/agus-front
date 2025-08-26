"use client"

import React, { useState } from "react"
import { useParams } from "next/navigation"
import equiposData from "@/data/equipos.json"
import jugadoresData from "@/data/jugadores.json"
import objetivosData from "@/data/objetivos.json"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Objetivo {
  id: number
  titulo: string
  equipoId: number
  progreso: number
}

export default function EquipoPage() {
  const params = useParams()
  const equipoId = params.id as string

  const equipo = (equiposData as any[]).find(
    (e) => String(e.id) === equipoId
  )
  const plantilla = (jugadoresData as any[]).filter(
    (j) => String(j.equipoId) === equipoId
  )
  const [objetivos, setObjetivos] = useState<Objetivo[]>(
    (objetivosData as any[]).filter((o) => String(o.equipoId) === equipoId)
  )
  const [nuevoTitulo, setNuevoTitulo] = useState("")

  const addObjetivo = () => {
    if (!nuevoTitulo.trim()) return
    const nuevo = {
      id: Date.now(),
      titulo: nuevoTitulo,
      equipoId: Number(equipoId),
      progreso: 0,
    }
    setObjetivos([...objetivos, nuevo])
    setNuevoTitulo("")
  }

  if (!equipo) return <div className="p-4">Equipo no encontrado</div>

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{equipo.nombre}</h1>
        <p className="text-muted-foreground">{equipo.categoria}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plantilla ({plantilla.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {plantilla.map((j) => (
            <div key={j.id} className="text-sm">
              {j.nombre} - {j.posicion}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Objetivos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {objetivos.map((o) => (
            <div key={o.id} className="flex items-center justify-between text-sm">
              <span>{o.titulo}</span>
              <span>{o.progreso}%</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
              placeholder="Nuevo objetivo"
            />
            <Button onClick={addObjetivo}>Añadir</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
