import { SectionCards } from "@/components/section-cards"
import JugadoresList from "@/app/dashboard/jugadores/jugadores-list"
import { equiposService, jugadoresService } from "@/lib/api/services"
export default async function DashboardPage() {
  const equipos = await equiposService.getAll()
  const equipo = equipos[0]
  const jugadores = equipo
    ? await jugadoresService.getByEquipo(equipo.id)
    : []
  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Hola Míster!</h1>
          <p className="text-muted-foreground">
            Bienvenido a la plataforma del CD San Agustín
          </p>
        </div>
      </div>

      <SectionCards />

      <JugadoresList
        jugadores={jugadores}
        equipoNombre={equipo ? equipo.nombre : ""}
      />
    </>
  )
}
