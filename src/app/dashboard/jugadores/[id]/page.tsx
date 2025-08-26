"use client"

import { useParams } from "next/navigation"
import jugadoresData from "@/data/jugadores.json"
import equiposData from "@/data/equipos.json"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function JugadorPage() {
  const params = useParams()
  const jugadorId = params.id as string
  const jugador = (jugadoresData as any[]).find(
    (j) => String(j.id) === jugadorId
  )
  const equipo = jugador
    ? (equiposData as any[]).find((e) => e.id === jugador.equipoId)
    : null

  if (!jugador) return <div className="p-4">Jugador no encontrado</div>

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/jugadores">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{jugador.nombre}</h1>
          {equipo && (
            <p className="text-muted-foreground">{equipo.nombre}</p>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {jugador.logs &&
            Object.entries(jugador.logs).map(([k, v]) => (
              <div key={k}>
                <span className="font-medium mr-2">
                  {k.replace("_", "/")}
                </span>
                {v as string}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
