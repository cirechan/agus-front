import { equiposService, jugadoresService } from "@/lib/api/services"
import JugadoresList from "./jugadores-list"

export default async function JugadoresPage() {
  const equipo = (await equiposService.getAll())[0]
  const jugadores = await jugadoresService.getByEquipo(equipo.id)
  return <JugadoresList jugadores={jugadores} equipoNombre={equipo.nombre} />
}
