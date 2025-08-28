import { equiposService, jugadoresService } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface EditProps {
  params: { id: string };
}

export default async function EditEquipoPage({ params }: EditProps) {
  const equipoId = Number(params.id);
  const equipo = await equiposService.getById(equipoId);
  const jugadores = await jugadoresService.getByEquipo(equipoId);

  async function actualizarJugador(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    const nombre = formData.get("nombre") as string;
    const posicion = formData.get("posicion") as string;
    await jugadoresService.update(id, { nombre, posicion });
    revalidatePath(`/dashboard/equipos/${equipoId}/edit`);
  }

  async function crearJugador(formData: FormData) {
    "use server";
    const nombre = formData.get("nombre") as string;
    const posicion = formData.get("posicion") as string;
    await jugadoresService.create({ nombre, posicion, equipoId });
    revalidatePath(`/dashboard/equipos/${equipoId}/edit`);
  }

  if (!equipo) {
    redirect("/dashboard/equipos");
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold">Editar {equipo?.nombre}</h1>
      <div className="space-y-2">
        {jugadores.map((j) => (
          <form key={j.id} action={actualizarJugador} className="flex items-center gap-2">
            <input type="hidden" name="id" value={j.id} />
            <Input name="nombre" defaultValue={j.nombre} className="flex-1" />
            <Input name="posicion" defaultValue={j.posicion} className="w-40" />
            <Button type="submit">Guardar</Button>
          </form>
        ))}
      </div>
      <hr className="my-4" />
      <form action={crearJugador} className="flex items-center gap-2">
        <Input name="nombre" placeholder="Nombre" required className="flex-1" />
        <Input name="posicion" placeholder="Posición" required className="w-40" />
        <Button type="submit">Añadir</Button>
      </form>
    </div>
  );
}

