"use client"

import DataTable from "@/components/data-table"
import { columns, Jugador } from "./columns"

export default function JugadoresTable({ jugadores, equipoNombre }: { jugadores: Jugador[]; equipoNombre: string }) {
  return (
    <>
      <div className="mt-8 px-4 lg:px-6">
        <h2 className="text-xl font-semibold">Jugadores</h2>
        <p className="text-muted-foreground">Plantilla de {equipoNombre}</p>
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
