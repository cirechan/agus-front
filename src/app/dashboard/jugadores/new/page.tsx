import { equiposService, jugadoresService } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function NuevoJugadorPage() {
  const equipo = (await equiposService.getAll())[0];

  async function crearJugador(formData: FormData) {
    "use server";
    const nombre = formData.get("nombre") as string;
    const posicion = formData.get("posicion") as string;
    const equipoId = equipo?.id ?? Number(formData.get("equipoId"));
    await jugadoresService.create({ nombre, posicion, equipoId });
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
        <Input name="posicion" placeholder="Posición" required />
        <input type="hidden" name="equipoId" value={equipo.id} />
        <Button type="submit">Crear</Button>
      </form>
    </div>
  );
}

