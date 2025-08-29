"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"

export type Jugador = {
  id: number
  nombre: string
  posicion: string
  valoracionMedia: number
  asistencias: number
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
    accessorKey: "valoracionMedia",
    header: "Valoración",
    cell: ({ row }) => (
      <div className="text-right">
        {Number(row.getValue("valoracionMedia")).toFixed(1)}
      </div>
    ),
  },
  {
    accessorKey: "asistencias",
    header: "Asistencias",
    cell: ({ row }) => (
      <div className="text-right">{row.getValue("asistencias")}</div>
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
