import { equiposService } from "@/lib/api/services";
import { createMatch } from "@/lib/api/matches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function NuevoPartidoPage() {
  const equipos = await equiposService.getAll();
  const nuestro = equipos.find((e: any) => e.id === 1);
  const rivales = equipos.filter((e: any) => e.id !== 1);

  async function crearPartido(formData: FormData) {
    "use server";
    const condicion = formData.get("condicion") as string; // home or away
    const opponentId = Number(formData.get("opponentId"));
    const kickoff = formData.get("kickoff") as string;
    const competition = formData.get("competition") as 'liga' | 'playoff' | 'copa' | 'amistoso';
    const matchdayRaw = formData.get("matchday");
    const matchday = matchdayRaw ? Number(matchdayRaw) : null;

    const homeTeamId = condicion === "home" ? 1 : opponentId;
    const awayTeamId = condicion === "home" ? opponentId : 1;

    await createMatch({
      homeTeamId,
      awayTeamId,
      kickoff,
      competition,
      matchday,
      lineup: [],
      events: [],
    });
    revalidatePath("/dashboard/partidos");
    redirect("/dashboard/partidos");
  }

  async function crearEquipo(formData: FormData) {
    "use server";
    const nombre = formData.get("nombre") as string;
    await equiposService.create({ nombre, categoria: null, temporadaId: null });
    revalidatePath("/dashboard/partidos/new");
  }

  if (!nuestro) {
    return <div className="p-4">No se encuentra el equipo principal (ID 1)</div>;
  }

  if (rivales.length === 0) {
    return (
      <div className="space-y-4 p-4 lg:p-6 max-w-md">
        <h1 className="text-2xl font-semibold">Nuevo Partido</h1>
        <p className="text-sm text-muted-foreground">
          No hay equipos rivales disponibles. Crea uno para continuar.
        </p>
        <form action={crearEquipo} className="space-y-4">
          <Input name="nombre" placeholder="Nombre del equipo" required />
          <Button type="submit">Crear equipo</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-md">
      <h1 className="text-2xl font-semibold">Nuevo Partido</h1>
      <form action={crearPartido} className="space-y-4">
        <div className="space-y-1">
          <label className="font-medium">Condición</label>
          <select name="condicion" className="w-full rounded border p-2" required>
            <option value="home">Local</option>
            <option value="away">Visitante</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="font-medium">Rival</label>
          <select name="opponentId" className="w-full rounded border p-2" required>
            <option value="">Seleccione rival</option>
            {rivales.map((e: any) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="font-medium">Tipo de competición</label>
          <select name="competition" className="w-full rounded border p-2" required>
            <option value="liga">Liga</option>
            <option value="playoff">Play Off</option>
            <option value="copa">Copa</option>
            <option value="amistoso">Amistoso</option>
          </select>
        </div>
        <Input type="number" name="matchday" placeholder="Jornada" />
        <Input type="datetime-local" name="kickoff" required />
        <Button type="submit">Crear</Button>
      </form>
      <form action={crearEquipo} className="mt-4 space-y-2 border-t pt-4">
        <p className="text-sm text-muted-foreground">
          ¿No aparece el rival? Añádelo rápidamente:
        </p>
        <Input name="nombre" placeholder="Nombre del equipo" required />
        <Button type="submit" variant="secondary">
          Añadir equipo
        </Button>
      </form>
    </div>
  );
}

