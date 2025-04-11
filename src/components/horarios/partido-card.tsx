"use client"

import Link from "next/link"
import { Partido } from "@/types/horarios"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Edit, ExternalLink } from "lucide-react"

interface PartidoCardProps {
  partido: Partido
}

export function PartidoCard({ partido }: PartidoCardProps) {
  const esLocal = partido.ubicacion === "casa"
  
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{partido.hora}</span>
          <Badge variant={esLocal ? "default" : "outline"}>
            {esLocal ? "Local" : "Visitante"}
          </Badge>
        </div>
        
        <div className="font-medium mb-2">{partido.equipo} vs {partido.rival}</div>
        
        {esLocal ? (
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Vestuario local: {partido.vestuarioLocal}</div>
            <div>Vestuario visitante: {partido.vestuarioVisitante}</div>
            <div>Equipación: <span className="capitalize">{partido.equipacion.color}</span></div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Campo: {partido.campo}</div>
            <div>Equipación: <span className="capitalize">{partido.equipacion.color}</span></div>
          </div>
        )}
        
        {partido.resultado && (
          <div className="mt-3 text-center font-bold">
            {partido.resultado.golesLocal} - {partido.resultado.golesVisitante}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-end gap-2">
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/dashboard/horarios/${partido.id}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Detalles
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
