"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ResultadoForm } from "@/components/horarios/resultado-form"
import { horariosService } from "@/lib/api/horarios"
import { Partido } from "@/types/horarios"
import { ArrowLeft, Edit, Trash } from "lucide-react"
import Link from "next/link"

export default function PartidoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [partido, setPartido] = useState<Partido | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResultadoForm, setShowResultadoForm] = useState(false)

  useEffect(() => {
    const fetchPartido = async () => {
      try {
        setLoading(true)
        const response = await horariosService.getPartidoById(params.id as string)
        setPartido(response.data)
      } catch (err) {
        setError("Error al cargar el partido")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPartido()
    }
  }, [params.id])

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este partido?")) {
      return
    }

    try {
      await horariosService.deletePartido(params.id as string)
      router.push("/dashboard/horarios")
    } catch (err) {
      setError("Error al eliminar el partido")
      console.error(err)
    }
  }

  const handleResultadoSubmit = async (data: { golesLocal: number; golesVisitante: number }) => {
    try {
      await horariosService.registrarResultado(params.id as string, data)
      // Actualizar el partido con el nuevo resultado
      const response = await horariosService.getPartidoById(params.id as string)
      setPartido(response.data)
      setShowResultadoForm(false)
    } catch (err) {
      setError("Error al guardar el resultado")
      console.error(err)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>
  }

  if (error || !partido) {
    return (
      <div className="flex flex-col items-center p-8">
        <p className="text-red-500 mb-4">{error || "No se encontró el partido"}</p>
        <Button asChild>
          <Link href="/dashboard/horarios">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a horarios
          </Link>
        </Button>
      </div>
    )
  }

  const esLocal = partido.ubicacion === "casa"
  const fechaFormateada = new Date(partido.fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/horarios">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Detalles del partido</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/horarios/editar/${partido.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {partido.equipo} vs {partido.rival}
            </CardTitle>
            <Badge variant={esLocal ? "default" : "outline"}>
              {esLocal ? "Local" : "Visitante"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Fecha y hora</h3>
              <p>{fechaFormateada} - {partido.hora}</p>
            </div>
            
            {esLocal ? (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Ubicación</h3>
                  <p>Campo local</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Vestuario local</h3>
                  <p>Vestuario {partido.vestuarioLocal}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Vestuario visitante</h3>
                  <p>Vestuario {partido.vestuarioVisitante}</p>
                </div>
              </>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Campo</h3>
                <p>{partido.campo}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Equipación</h3>
              <p className="capitalize">{partido.equipacion.color}</p>
            </div>
          </div>

          <Separator />

          {partido.resultado ? (
            <div className="pt-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Resultado</h3>
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="text-center">
                  <p className="font-medium">{partido.equipo}</p>
                  <p className="text-3xl font-bold">{partido.resultado.golesLocal}</p>
                </div>
                <div className="text-xl font-bold">-</div>
                <div className="text-center">
                  <p className="font-medium">{partido.rival}</p>
                  <p className="text-3xl font-bold">{partido.resultado.golesVisitante}</p>
                </div>
              </div>
            </div>
          ) : (
            showResultadoForm ? (
              <div className="pt-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Registrar resultado</h3>
                <ResultadoForm 
                  partido={partido} 
                  onSubmit={handleResultadoSubmit} 
                  onCancel={() => setShowResultadoForm(false)} 
                />
              </div>
            ) : (
              <div className="flex justify-center pt-2">
                <Button onClick={() => setShowResultadoForm(true)}>
                  Registrar resultado
                </Button>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
