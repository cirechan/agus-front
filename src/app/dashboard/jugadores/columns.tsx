"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"

export type Jugador = {
  id: number
  nombre: string
  posicion: string
  valoracionMedia: number
  asistenciaPct: number
  asistenciasPresentes: number
  asistenciasTotales: number
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
    meta: { className: "hidden sm:table-cell" },
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
    accessorKey: "asistenciaPct",
    header: () => <div className="text-center">Asistencias</div>,
    cell: ({ row }) => {
      const pct = Number(row.getValue("asistenciaPct")).toFixed(0)
      const { asistenciasPresentes, asistenciasTotales } = row.original
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger className="w-full text-center">{pct}%</TooltipTrigger>
            <TooltipContent className="bg-white text-foreground">
              {`${asistenciasPresentes}/${asistenciasTotales}`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
    meta: { className: "hidden sm:table-cell" },
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
