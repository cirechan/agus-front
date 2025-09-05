import { getMatch, updateLineup } from "@/lib/api/matches";
import { jugadoresService } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PlayerSlot } from "@/types/match";

export default async function ConfigMatchPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const match = await getMatch(id);
  if (!match) {
    return <div className="p-4">Partido no encontrado</div>;
  }
  const players = await jugadoresService.getByEquipo(1);
  const currentStarters = new Set(
    match.lineup.filter((l) => l.role === "field").map((l) => l.playerId)
  );
  const opponentNotes = match.opponentNotes ?? null;

  async function save(formData: FormData) {
    "use server";
    const starters = formData.getAll("starter").map((v) => Number(v));
    const formation = [
      "GK",
      "LB",
      "LCB",
      "RCB",
      "RB",
      "LM",
      "CM",
      "RM",
      "LW",
      "ST",
      "RW",
    ];
    const lineup: PlayerSlot[] = [];
    starters.slice(0, formation.length).forEach((id, idx) => {
      const pl = players.find((p: any) => p.id === id);
      lineup.push({
        playerId: id,
        number: pl?.dorsal ?? undefined,
        role: "field",
        position: formation[idx],
        minutes: 0,
      });
    });
    players
      .filter((p: any) => !starters.includes(p.id))
      .forEach((p: any) => {
        lineup.push({
          playerId: p.id,
          number: p.dorsal ?? undefined,
          role: "bench",
          position: undefined,
          minutes: 0,
        });
      });
    await updateLineup(id, lineup, opponentNotes);
    revalidatePath(`/dashboard/partidos/${id}`);
    redirect(`/dashboard/partidos/${id}`);
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Configurar alineación</h1>
      <form action={save} className="space-y-2">
        {players.map((p: any) => (
          <label key={p.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              name="starter"
              value={p.id}
              defaultChecked={currentStarters.has(p.id)}
            />
            <span>{p.nombre}</span>
          </label>
        ))}
        <Button type="submit" className="mt-4">
          Guardar
        </Button>
      </form>
    </div>
  );
}
