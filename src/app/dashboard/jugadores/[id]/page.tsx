import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { equiposService, jugadoresService, asistenciasService, valoracionesService } from "@/lib/api/services"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RatingStars } from "@/components/rating-stars"
import { revalidatePath } from "next/cache"

export default async function JugadorPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const jugador = await jugadoresService.getById(id)
  if (!jugador) {
    return <div className="p-4">Jugador no encontrado</div>
  }
  const equipo = await equiposService.getById(jugador.equipoId)
  const asistencias = await asistenciasService.getByJugador(id)
  const valoraciones = await valoracionesService.getByJugador(id)

  // resumen de asistencias
  const totalSesiones = asistencias.length
  const presentes = asistencias.filter((a: any) => a.asistio).length
  const porcentajeAsistencia = totalSesiones
    ? ((presentes / totalSesiones) * 100).toFixed(1)
    : "0"

  // medias de valoraciones
  const promedios = valoraciones.length
    ? {
        tecnica:
          (
            valoraciones.reduce(
              (sum: number, v: any) => sum + (v.aptitudes.tecnica || 0),
              0
            ) / valoraciones.length
          ).toFixed(1),
        tactica:
          (
            valoraciones.reduce(
              (sum: number, v: any) => sum + (v.aptitudes.tactica || 0),
              0
            ) / valoraciones.length
          ).toFixed(1),
        fisica:
          (
            valoraciones.reduce(
              (sum: number, v: any) => sum + (v.aptitudes.fisica || 0),
              0
            ) / valoraciones.length
          ).toFixed(1),
        mental:
          (
            valoraciones.reduce(
              (sum: number, v: any) => sum + (v.aptitudes.mental || 0),
              0
            ) / valoraciones.length
          ).toFixed(1),
      }
    : null

  async function actualizarJugador(formData: FormData) {
    "use server"
    const nombre = formData.get("nombre") as string
    const posicion = formData.get("posicion") as string
    await jugadoresService.update(id, { nombre, posicion })
    revalidatePath(`/dashboard/jugadores/${id}`)
    revalidatePath('/dashboard/jugadores')
  }

  async function registrarAsistencia(formData: FormData) {
    "use server"
    const presente = formData.get("presente") === "on"
    const motivo = formData.get("motivo") as string
    const fecha = new Date().toISOString().slice(0, 10)
    await asistenciasService.create({ jugadorId: id, equipoId: jugador.equipoId, fecha, asistio: presente, motivo })
    revalidatePath(`/dashboard/jugadores/${id}`)
    revalidatePath('/dashboard/jugadores')
  }

  async function registrarValoracion(formData: FormData) {
    "use server"
    const tecnica = Number(formData.get("tecnica")) || 0
    const tactica = Number(formData.get("tactica")) || 0
    const fisica = Number(formData.get("fisica")) || 0
    const mental = Number(formData.get("mental")) || 0
    const comentarios = formData.get("comentarios") as string
    const fecha = new Date().toISOString()
    await valoracionesService.create({ jugadorId: id, fecha, aptitudes: { tecnica, tactica, fisica, mental }, comentarios })
    revalidatePath(`/dashboard/jugadores/${id}`)
    revalidatePath('/dashboard/jugadores')
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/jugadores">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{jugador.nombre}</h1>
          {equipo && <p className="text-muted-foreground">{equipo.nombre}</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar jugador</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actualizarJugador} className="space-y-2">
            <Input name="nombre" defaultValue={jugador.nombre} placeholder="Nombre" />
            <Input name="posicion" defaultValue={jugador.posicion} placeholder="Posición" />
            <Button type="submit">Guardar cambios</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Sesiones registradas:</div>
          <div>{totalSesiones}</div>
          <div className="font-medium">Asistencias:</div>
          <div>
            {presentes} ({porcentajeAsistencia}%)
          </div>
          {promedios && (
            <>
              <div className="font-medium">Prom. Técnica:</div>
              <div className="flex items-center gap-1">
                {promedios.tecnica}
                <RatingStars value={Number(promedios.tecnica)} />
              </div>
              <div className="font-medium">Prom. Táctica:</div>
              <div className="flex items-center gap-1">
                {promedios.tactica}
                <RatingStars value={Number(promedios.tactica)} />
              </div>
              <div className="font-medium">Prom. Física:</div>
              <div className="flex items-center gap-1">
                {promedios.fisica}
                <RatingStars value={Number(promedios.fisica)} />
              </div>
              <div className="font-medium">Prom. Mental:</div>
              <div className="flex items-center gap-1">
                {promedios.mental}
                <RatingStars value={Number(promedios.mental)} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asistencias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-1 text-sm">
            {asistencias.map((a: any) => (
              <li key={a.id}>{a.fecha}: {a.asistio ? "Presente" : `Ausente (${a.motivo})`}</li>
            ))}
            {asistencias.length === 0 && <li>No hay registros</li>}
          </ul>
          <form action={registrarAsistencia} className="space-y-2">
            <label className="flex items-center gap-2"><input type="checkbox" name="presente" defaultChecked /> Presente</label>
            <Input name="motivo" placeholder="Motivo (si falta)" />
            <Button type="submit">Añadir asistencia</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valoraciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-1 text-sm">
            {valoraciones.map((v: any) => (
              <li key={v.id}>
                {new Date(v.fecha).toLocaleDateString()}: Técnica {v.aptitudes.tecnica}, Táctica {v.aptitudes.tactica}, Física {v.aptitudes.fisica}, Mental {v.aptitudes.mental}
                {v.comentarios && (
                  <span> – {v.comentarios}</span>
                )}
              </li>
            ))}
            {valoraciones.length === 0 && <li>No hay valoraciones</li>}
          </ul>
          <form action={registrarValoracion} className="grid grid-cols-2 gap-2 text-sm">
            <Input type="number" step="0.5" name="tecnica" placeholder="Técnica" />
            <Input type="number" step="0.5" name="tactica" placeholder="Táctica" />
            <Input type="number" step="0.5" name="fisica" placeholder="Física" />
            <Input type="number" step="0.5" name="mental" placeholder="Mental" />
            <Textarea className="col-span-2" name="comentarios" placeholder="Comentarios" />
            <Button type="submit" className="col-span-2">Añadir valoración</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {jugador.logs && Object.entries(jugador.logs).map(([k, v]) => (
            <div key={k}>
              <span className="font-medium mr-2">{k.replace("_", "/")}</span>
              {v as string}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

