"use client"

import * as React from "react"
import Link from "next/link"
import { PlusCircle, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// Datos de ejemplo - en producción vendrían de la API
const jugadores = [
  {
    id: "1",
    nombre: "Juan",
    apellidos: "García López",
    posicion: "Delantero",
    dorsal: 9,
    equipo: "Alevín A",
    categoria: "1ª Alevín",
    fechaNacimiento: "2014-05-12",
    asistencia: "95%",
    valoracionMedia: 4.2
  },
  {
    id: "2",
    nombre: "Miguel",
    apellidos: "Fernández Ruiz",
    posicion: "Centrocampista",
    dorsal: 8,
    equipo: "Alevín A",
    categoria: "1ª Alevín",
    fechaNacimiento: "2014-03-22",
    asistencia: "90%",
    valoracionMedia: 3.8
  },
  {
    id: "3",
    nombre: "Carlos",
    apellidos: "Martínez Sanz",
    posicion: "Defensa",
    dorsal: 4,
    equipo: "Benjamín B",
    categoria: "2ª Benjamín",
    fechaNacimiento: "2015-07-15",
    asistencia: "85%",
    valoracionMedia: 3.5
  },
  {
    id: "4",
    nombre: "David",
    apellidos: "López Gómez",
    posicion: "Portero",
    dorsal: 1,
    equipo: "Infantil A",
    categoria: "1ª Infantil",
    fechaNacimiento: "2012-11-30",
    asistencia: "100%",
    valoracionMedia: 4.5
  },
  {
    id: "5",
    nombre: "Javier",
    apellidos: "Sánchez Pérez",
    posicion: "Defensa",
    dorsal: 2,
    equipo: "Cadete B",
    categoria: "2ª Cadete",
    fechaNacimiento: "2010-02-18",
    asistencia: "80%",
    valoracionMedia: 3.7
  },
  {
    id: "6",
    nombre: "Alejandro",
    apellidos: "González Díaz",
    posicion: "Centrocampista",
    dorsal: 6,
    equipo: "Juvenil A",
    categoria: "1ª Juvenil",
    fechaNacimiento: "2008-09-05",
    asistencia: "85%",
    valoracionMedia: 4.0
  },
  {
    id: "7",
    nombre: "Daniel",
    apellidos: "Pérez Martín",
    posicion: "Delantero",
    dorsal: 11,
    equipo: "Juvenil A",
    categoria: "1ª Juvenil",
    fechaNacimiento: "2008-12-20",
    asistencia: "90%",
    valoracionMedia: 4.3
  },
]

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
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
