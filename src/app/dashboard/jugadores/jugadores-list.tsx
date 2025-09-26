"use client"

import * as React from "react"
import Link from "next/link"
import { PlusCircle, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Jugador {
  id: number
  nombre: string
  posicion: string
  dorsal?: number | null
}

export default function JugadoresList({ jugadores, equipoNombre }: { jugadores: Jugador[]; equipoNombre: string }) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filtered = jugadores.filter((jugador) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    const dorsal = jugador.dorsal ? String(jugador.dorsal) : ""
    return (
      jugador.nombre.toLowerCase().includes(query) ||
      jugador.posicion.toLowerCase().includes(query) ||
      dorsal.includes(query)
    )
  })

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Jugadores</h1>
          <p className="text-muted-foreground">Plantilla de {equipoNombre}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jugadores/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Jugador
          </Link>
        </Button>
      </div>

      <div className="px-4 py-4 lg:px-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar jugadores..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:grid-cols-3 lg:px-6">
        {filtered.map((jugador, index) => {
          const normalizedPosition = jugador.posicion?.toLowerCase().trim()
          const isGoalkeeper = normalizedPosition === "portero"
          const dorsal = jugador.dorsal ?? index + 1
          return (
            <Link key={jugador.id} href={`/dashboard/jugadores/${jugador.id}`}>
              <Card
                className={cn(
                  "h-full overflow-hidden transition-colors hover:bg-muted/50",
                  isGoalkeeper ? "border-[hsl(var(--cdsa-green))]/40" : "border-primary/40"
                )}
              >
                <CardHeader className="border-b p-4">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle className="text-lg">{jugador.nombre}</CardTitle>
                      <CardDescription>{jugador.posicion}</CardDescription>
                    </div>
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground",
                        isGoalkeeper
                          ? "bg-[hsl(var(--cdsa-green))]"
                          : "bg-red-600"
                      )}
                    >
                      {dorsal}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Ver detalles del jugador</span>
                    <span className="font-medium text-foreground">#{dorsal}</span>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 p-4">
                  <Button variant="ghost" className="w-full" asChild>
                    <div>Ver ficha completa</div>
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          )
        })}
        {filtered.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              No hay jugadores
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
