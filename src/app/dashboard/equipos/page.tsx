"use client"

import * as React from "react"
import Link from "next/link"
import { PlusCircle, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SectionCards } from "@/components/section-cards"
import cadeteB from "@/data/cadete-b.json"

const teams = [
  {
    id: cadeteB.id,
    name: cadeteB.nombre,
    category: cadeteB.categoria,
    players: cadeteB.jugadores.length,
    coach: cadeteB.entrenador,
    image: null
  }
]

export default function EquiposPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.coach.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Equipos</h1>
          <p className="text-muted-foreground">
            Gestiona los equipos del Club San Agustín
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Equipo
        </Button>
      </div>
      
      <div className="px-4 py-4 lg:px-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar equipos..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:grid-cols-3 lg:px-6">
        {filteredTeams.map((team) => (
          <Link key={team.id} href={`/dashboard/equipos/${team.id}`}>
            <Card className="h-full overflow-hidden transition-colors hover:bg-muted/50">
              <CardHeader className="border-b p-4">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <CardDescription>{team.category}</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium">Jugadores</p>
                    <p className="text-2xl font-bold">{team.players}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Entrenador</p>
                    <p className="text-sm">{team.coach}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/50 p-4">
                <Button variant="ghost" className="w-full" asChild>
                  <div>Ver detalles</div>
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}
