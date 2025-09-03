import { equiposService } from "@/lib/api/services";
import { createMatch } from "@/lib/api/matches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function NuevoPartidoPage() {
  const equipos = await equiposService.getAll();

  async function crearPartido(formData: FormData) {
    "use server";
    const homeTeamId = Number(formData.get("homeTeamId"));
    const awayTeamId = Number(formData.get("awayTeamId"));
    const kickoff = formData.get("kickoff") as string;
    await createMatch({ homeTeamId, awayTeamId, kickoff, lineup: [], events: [] });
    revalidatePath("/dashboard/partidos");
    redirect("/dashboard/partidos");
  }

  if (equipos.length < 2) {
    return <div className="p-4">No hay suficientes equipos disponibles</div>;
  }

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-md">
      <h1 className="text-2xl font-semibold">Nuevo Partido</h1>
      <form action={crearPartido} className="space-y-4">
        <select name="homeTeamId" className="w-full rounded border p-2" required>
          <option value="">Equipo local</option>
          {equipos.map((e: any) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
        <select name="awayTeamId" className="w-full rounded border p-2" required>
          <option value="">Equipo visitante</option>
          {equipos.map((e: any) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
        <Input type="datetime-local" name="kickoff" required />
        <Button type="submit">Crear</Button>
      </form>
    </div>
  );
}
