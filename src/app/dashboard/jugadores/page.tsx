"use client"

import * as React from "react"
import Link from "next/link"
import { PlusCircle, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import cadeteB from "@/data/cadete-b.json"

const jugadores = cadeteB.jugadores

export default function JugadoresPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const filteredJugadores = jugadores.filter(jugador => 
    jugador.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    jugador.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
    jugador.equipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    jugador.posicion.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Jugadores</h1>
          <p className="text-muted-foreground">
            Gestiona los jugadores del Club San Agustín
          </p>
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
        {filteredJugadores.map((jugador) => (
          <Link key={jugador.id} href={`/dashboard/jugadores/${jugador.id}`}>
            <Card className="h-full overflow-hidden transition-colors hover:bg-muted/50">
              <CardHeader className="border-b p-4">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-lg">{jugador.nombre} {jugador.apellidos}</CardTitle>
                    <CardDescription>{jugador.equipo} - {jugador.categoria}</CardDescription>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-primary-foreground">
                    {jugador.dorsal}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Posición</p>
                    <Badge variant="outline" className="mt-1">
                      {jugador.posicion}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Edad</p>
                    <p className="text-sm">
                      {new Date().getFullYear() - new Date(jugador.fechaNacimiento).getFullYear()} años
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Asistencia</p>
                    <p className="text-sm">{jugador.asistencia}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Valoración</p>
                    <p className="text-sm">{jugador.valoracionMedia}/5</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/50 p-4">
                <Button variant="ghost" className="w-full" asChild>
                  <div>Ver ficha completa</div>
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}
