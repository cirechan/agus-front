"use client"

import Link from "next/link"
import { Partido } from "@/types/horarios"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

interface PartidoCardProps {
  partido: Partido
}

export function PartidoCard({ partido }: PartidoCardProps) {
  const esLocal = partido.ubicacion === "casa"

  return (
    <Card className="h-full">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{partido.hora}</span>
          <Badge variant={esLocal ? "default" : "outline"}>
            {esLocal ? "Local" : "Visitante"}
          </Badge>
        </div>

        <div className="text-base font-semibold">
          {typeof partido.equipo === "string" ? partido.equipo : partido.equipo.nombre} vs {partido.rival}
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          {esLocal ? (
            <>
              <div>Vestuario local: {partido.vestuarioLocal}</div>
              <div>Vestuario visitante: {partido.vestuarioVisitante}</div>
              <div>
                Equipación: <span className="capitalize">{partido.equipacion.color}</span>
              </div>
            </>
          ) : (
            <>
              <div>Campo: {partido.campo}</div>
              <div>
                Equipación: <span className="capitalize">{partido.equipacion.color}</span>
              </div>
            </>
          )}
        </div>

        {partido.resultado?.jugado && (
          <div className="mt-2 text-center text-lg font-bold">
            {partido.resultado.golesLocal} - {partido.resultado.golesVisitante}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/dashboard/horarios/${partido._id}`}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Detalles
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
