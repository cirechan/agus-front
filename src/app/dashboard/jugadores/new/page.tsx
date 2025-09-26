import { equiposService, jugadoresService } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const POSITIONS = ["Portero", "Defensa", "Centrocampista", "Delantero"];

export default async function NuevoJugadorPage() {
  const equipo = (await equiposService.getAll())[0];

  async function crearJugador(formData: FormData) {
    "use server";
    const nombre = formData.get("nombre") as string;
    const posicion = formData.get("posicion") as string;
    const dorsalRaw = formData.get("dorsal");
    const dorsal = dorsalRaw !== null && dorsalRaw !== "" ? Number(dorsalRaw) : null;
    const equipoId = equipo?.id ?? Number(formData.get("equipoId"));
    await jugadoresService.create({ nombre, posicion, equipoId, dorsal });
    revalidatePath("/dashboard/jugadores");
    redirect("/dashboard/jugadores");
  }

  if (!equipo) {
    return <div className="p-4">No hay equipos disponibles</div>;
  }

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-md">
      <h1 className="text-2xl font-semibold">Nuevo Jugador</h1>
      <form action={crearJugador} className="space-y-4">
        <Input name="nombre" placeholder="Nombre" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="new-player-position">
              Posición
            </label>
            <select
              id="new-player-position"
              name="posicion"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={POSITIONS[0]}
            >
              {POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="new-player-number">
              Dorsal
            </label>
            <Input id="new-player-number" name="dorsal" type="number" min={1} placeholder="Número" />
          </div>
        </div>
        <input type="hidden" name="equipoId" value={equipo.id} />
        <Button type="submit">Crear</Button>
      </form>
    </div>
  );
}

