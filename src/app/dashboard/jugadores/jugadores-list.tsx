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

interface Jugador {
  id: number
  nombre: string
  posicion: string
}

export default function JugadoresList({ jugadores, equipoNombre }: { jugadores: Jugador[]; equipoNombre: string }) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filtered = jugadores.filter((jugador) =>
    jugador.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    jugador.posicion.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Jugadores</h1>
          <p className="text-muted-foreground">Plantilla de {equipoNombre}</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Jugador
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
        {filtered.map((jugador, index) => (
          <Link key={jugador.id} href={`/dashboard/jugadores/${jugador.id}`}>
            <Card className="h-full overflow-hidden transition-colors hover:bg-muted/50">
              <CardHeader className="border-b p-4">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-lg">{jugador.nombre}</CardTitle>
                    <CardDescription>{jugador.posicion}</CardDescription>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-primary-foreground">
                    {index + 1}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Ver detalles del jugador
                </p>
              </CardContent>
              <CardFooter className="border-t bg-muted/50 p-4">
                <Button variant="ghost" className="w-full" asChild>
                  <div>Ver ficha completa</div>
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
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
