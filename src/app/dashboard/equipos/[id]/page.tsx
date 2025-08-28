"use client"

import React, { useState } from "react"
import { useParams } from "next/navigation"
// Datos cargados desde la API
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Objetivo {
  id: number
  titulo: string
  equipoId: number
  progreso: number
}

export default function EquipoPage() {
  const params = useParams()
  const equipoId = params.id as string

  const [equipo, setEquipo] = useState<any | null>(null)
  const [plantilla, setPlantilla] = useState<any[]>([])
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [nuevoTitulo, setNuevoTitulo] = useState("")

  React.useEffect(() => {
    fetch(`/api/equipos?id=${equipoId}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setEquipo(data))
    fetch(`/api/jugadores?equipoId=${equipoId}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setPlantilla(data))
    fetch(`/api/objetivos?equipoId=${equipoId}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setObjetivos(data))
  }, [equipoId])

  const addObjetivo = async () => {
    if (!nuevoTitulo.trim()) return
    const nuevo = await fetch('/api/objetivos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: nuevoTitulo, equipoId: Number(equipoId) })
    }).then(res => res.json())
    setObjetivos(prev => [...prev, nuevo])
    setNuevoTitulo("")
  }

  if (!equipo) return <div className="p-4">Cargando...</div>

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{equipo.nombre}</h1>
        <p className="text-muted-foreground">{equipo.categoria}</p>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Plantilla ({plantilla.length})</CardTitle>
          <Link href={`/dashboard/equipos/${equipoId}/edit`} className="text-sm text-primary hover:underline">
            Editar
          </Link>
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
