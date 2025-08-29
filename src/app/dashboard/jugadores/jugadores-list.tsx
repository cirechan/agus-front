"use client"

import Link from "next/link"
import { PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import DataTable from "@/components/data-table"
import { columns, Jugador } from "./columns"

export default function JugadoresList({ jugadores, equipoNombre }: { jugadores: Jugador[]; equipoNombre: string }) {
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
        <DataTable
          columns={columns}
          data={jugadores}
          filterColumn="nombre"
          filterPlaceholder="Buscar jugadores..."
        />
      </div>
    </>
  )
}
