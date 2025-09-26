import { equiposService, jugadoresService } from "@/lib/api/services"
import JugadoresList from "./jugadores-list"
import { resolvePrimaryTeam } from "@/lib/team"

export const dynamic = "force-dynamic"

export default async function JugadoresPage() {
  const equipo = resolvePrimaryTeam(await equiposService.getAll())
  const jugadores = equipo ? await jugadoresService.getByEquipo(equipo.id) : []
  return <JugadoresList jugadores={jugadores} equipoNombre={equipo?.nombre || ''} />
}
