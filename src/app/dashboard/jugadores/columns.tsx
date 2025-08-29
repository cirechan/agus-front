"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Star } from "lucide-react"
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
    header: () => <div className="text-center">Valoración</div>,
    cell: ({ row }) => {
      const valor = Number(row.getValue("valoracionMedia")).toFixed(1)
      return (
        <div className="flex items-center justify-center gap-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {valor}
        </div>
      )
    },
  },
  {
    accessorKey: "asistencias",
    header: () => <div className="text-right">Asistencias</div>,
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
