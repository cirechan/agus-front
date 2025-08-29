"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"

export type Jugador = {
  id: number
  nombre: string
  posicion: string
}

export const columns: ColumnDef<Jugador>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "posicion",
    header: "Posición",
    cell: ({ row }) => (
      <span className="capitalize">{row.getValue("posicion")}</span>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <Button variant="ghost" asChild>
        <Link href={`/dashboard/jugadores/${row.original.id}`}>Ver</Link>
      </Button>
    ),
  },
]
