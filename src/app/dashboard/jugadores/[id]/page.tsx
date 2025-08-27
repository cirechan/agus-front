import Link from "next/link"
import { ArrowLeft, Edit, Trash } from "lucide-react"
import { equiposService, jugadoresService, asistenciasService, valoracionesService } from "@/lib/api/services"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { RatingStars } from "@/components/rating-stars"
import { PlayerRadarChart } from "@/components/player-radar-chart"
import { revalidatePath } from "next/cache"

export default async function JugadorPage({ params }: { params: { id: string } }) {
  const jugadorId = Number(params.id)
  const jugador = await jugadoresService.getById(jugadorId)
  if (!jugador) {
    return <div className="p-4">Jugador no encontrado</div>
  }
  const equipo = await equiposService.getById(jugador.equipoId)
  const asistencias = await asistenciasService.getByJugador(jugadorId)
  const valoraciones = await valoracionesService.getByJugador(jugadorId)

  // resumen de asistencias
  const totalSesiones = asistencias.length
  const presentes = asistencias.filter((a: any) => a.asistio).length
  const porcentajeAsistencia = totalSesiones ? ((presentes / totalSesiones) * 100).toFixed(1) : "0"

  // medias de valoraciones
  const promedios = valoraciones.length
    ? {
        tecnica:
          valoraciones.reduce((sum: number, v: any) => sum + (v.aptitudes.tecnica || 0), 0) /
          valoraciones.length,
        tactica:
          valoraciones.reduce((sum: number, v: any) => sum + (v.aptitudes.tactica || 0), 0) /
          valoraciones.length,
        fisica:
          valoraciones.reduce((sum: number, v: any) => sum + (v.aptitudes.fisica || 0), 0) /
          valoraciones.length,
        mental:
          valoraciones.reduce((sum: number, v: any) => sum + (v.aptitudes.mental || 0), 0) /
          valoraciones.length,
      }
    : null

  // server actions
  async function actualizarJugador(formData: FormData) {
    "use server"
    const nombre = formData.get("nombre") as string
    const posicion = formData.get("posicion") as string
    await jugadoresService.update(jugadorId, { nombre, posicion })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
    revalidatePath('/dashboard/jugadores')
  }

  async function crearValoracion(formData: FormData) {
    "use server"
    const tecnica = Number(formData.get("tecnica")) || 0
    const tactica = Number(formData.get("tactica")) || 0
    const fisica = Number(formData.get("fisica")) || 0
    const mental = Number(formData.get("mental")) || 0
    const comentarios = formData.get("comentarios") as string
    const fecha = new Date().toISOString()
    await valoracionesService.create({ jugadorId, fecha, aptitudes: { tecnica, tactica, fisica, mental }, comentarios })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
    revalidatePath('/dashboard/jugadores')
  }

  async function actualizarValoracion(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    const tecnica = Number(formData.get("tecnica")) || 0
    const tactica = Number(formData.get("tactica")) || 0
    const fisica = Number(formData.get("fisica")) || 0
    const mental = Number(formData.get("mental")) || 0
    const comentarios = formData.get("comentarios") as string
    await valoracionesService.update(id, { aptitudes: { tecnica, tactica, fisica, mental }, comentarios })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
  }

  async function eliminarValoracion(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    await valoracionesService.delete(id)
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
    revalidatePath('/dashboard/jugadores')
  }

  async function crearAsistencia(formData: FormData) {
    "use server"
    const fecha = formData.get("fecha") as string
    const asistio = formData.get("asistio") === "on"
    const motivo = formData.get("motivo") as string
    await asistenciasService.create({ jugadorId, equipoId: jugador.equipoId, fecha, asistio, motivo })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
  }

  async function actualizarAsistencia(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    const fecha = formData.get("fecha") as string
    const asistio = formData.get("asistio") === "on"
    const motivo = formData.get("motivo") as string
    await asistenciasService.update(id, { fecha, asistio, motivo })
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
  }

  async function eliminarAsistencia(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    await asistenciasService.delete(id)
    revalidatePath(`/dashboard/jugadores/${jugadorId}`)
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Información personal</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost"><Edit className="h-4 w-4"/></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Editar jugador</DialogTitle></DialogHeader>
                <form action={actualizarJugador} className="space-y-2">
                  <Input name="nombre" defaultValue={jugador.nombre} placeholder="Nombre" />
                  <Input name="posicion" defaultValue={jugador.posicion} placeholder="Posición" />
                  <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="font-medium">Nombre:</span> {jugador.nombre}</div>
            <div><span className="font-medium">Posición:</span> {jugador.posicion}</div>
            <div><span className="font-medium">Asistencias:</span> {presentes}/{totalSesiones} ({porcentajeAsistencia}%)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aptitudes del jugador</CardTitle>
          </CardHeader>
          <CardContent>
            {promedios ? (
              <PlayerRadarChart data={promedios} />
            ) : (
              <p className="text-sm text-muted-foreground">Sin valoraciones</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="valoraciones" className="w-full">
        <TabsList>
          <TabsTrigger value="valoraciones">Valoraciones</TabsTrigger>
          <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
        </TabsList>

        <TabsContent value="valoraciones" className="space-y-4">
          {valoraciones.map((v: any) => (
            <Card key={v.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{new Date(v.fecha).toLocaleDateString()}</CardTitle>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Editar valoración</DialogTitle></DialogHeader>
                      <form action={actualizarValoracion} className="grid grid-cols-2 gap-2">
                        <input type="hidden" name="id" value={v.id} />
                        <Input type="number" step="0.5" name="tecnica" defaultValue={v.aptitudes.tecnica} placeholder="Técnica" />
                        <Input type="number" step="0.5" name="tactica" defaultValue={v.aptitudes.tactica} placeholder="Táctica" />
                        <Input type="number" step="0.5" name="fisica" defaultValue={v.aptitudes.fisica} placeholder="Física" />
                        <Input type="number" step="0.5" name="mental" defaultValue={v.aptitudes.mental} placeholder="Mental" />
                        <Textarea className="col-span-2" name="comentarios" defaultValue={v.comentarios} />
                        <DialogFooter className="col-span-2"><Button type="submit">Guardar</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <form action={eliminarValoracion}>
                    <input type="hidden" name="id" value={v.id} />
                    <Button variant="ghost" size="icon"><Trash className="h-4 w-4" /></Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Técnica</div>
                <div className="flex items-center gap-1"><RatingStars value={v.aptitudes.tecnica} /></div>
                <div className="font-medium">Táctica</div>
                <div className="flex items-center gap-1"><RatingStars value={v.aptitudes.tactica} /></div>
                <div className="font-medium">Física</div>
                <div className="flex items-center gap-1"><RatingStars value={v.aptitudes.fisica} /></div>
                <div className="font-medium">Mental</div>
                <div className="flex items-center gap-1"><RatingStars value={v.aptitudes.mental} /></div>
              </CardContent>
              {v.comentarios && (
                <CardFooter className="text-sm text-muted-foreground">
                  {v.comentarios}
                </CardFooter>
              )}
            </Card>
          ))}
          {valoraciones.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay valoraciones</p>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button>Nueva valoración</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva valoración</DialogTitle></DialogHeader>
              <form action={crearValoracion} className="grid grid-cols-2 gap-2">
                <Input type="number" step="0.5" name="tecnica" placeholder="Técnica" />
                <Input type="number" step="0.5" name="tactica" placeholder="Táctica" />
                <Input type="number" step="0.5" name="fisica" placeholder="Física" />
                <Input type="number" step="0.5" name="mental" placeholder="Mental" />
                <Textarea className="col-span-2" name="comentarios" placeholder="Comentarios" />
                <DialogFooter className="col-span-2"><Button type="submit">Guardar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="asistencias" className="space-y-4">
          {asistencias.map((a: any) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{a.fecha}</CardTitle>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Editar asistencia</DialogTitle></DialogHeader>
                      <form action={actualizarAsistencia} className="space-y-2">
                        <input type="hidden" name="id" value={a.id} />
                        <Input type="date" name="fecha" defaultValue={a.fecha} />
                        <label className="flex items-center gap-2"><input type="checkbox" name="asistio" defaultChecked={a.asistio} /> Presente</label>
                        <Input name="motivo" defaultValue={a.motivo} placeholder="Motivo" />
                        <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <form action={eliminarAsistencia}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button variant="ghost" size="icon"><Trash className="h-4 w-4"/></Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                {a.asistio ? "Presente" : `Ausente (${a.motivo})`}
              </CardContent>
            </Card>
          ))}
          {asistencias.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay registros</p>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button>Nueva asistencia</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva asistencia</DialogTitle></DialogHeader>
              <form action={crearAsistencia} className="space-y-2">
                <Input type="date" name="fecha" />
                <label className="flex items-center gap-2"><input type="checkbox" name="asistio" defaultChecked /> Presente</label>
                <Input name="motivo" placeholder="Motivo (si falta)" />
                <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {jugador.logs && (
        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(jugador.logs).map(([k, v]) => (
              <div key={k}>
                <span className="font-medium mr-2">{k.replace("_", "/")}</span>
                {v as string}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
