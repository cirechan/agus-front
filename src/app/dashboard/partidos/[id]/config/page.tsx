import { getMatch, updateLineup } from "@/lib/api/matches";
import { jugadoresService, equiposService, rivalesService } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PlayerSlot } from "@/types/match";
import { format } from "date-fns";

export default async function ConfigMatchPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const match = await getMatch(id);
  if (!match) {
    return <div className="p-4">Partido no encontrado</div>;
  }
  const players = await jugadoresService.getByEquipo(1);
  const ourTeam = await equiposService.getById(match.teamId);
  const rivalTeam = await rivalesService.getById(match.rivalId);
  const teamColor = ourTeam?.color || '#dc2626';
  const GOALKEEPER_COLOR = '#16a34a';

  function getContrastColor(hex: string) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000' : '#fff';
  }
  const textColor = getContrastColor(teamColor);
  const currentStarters = new Set(
    match.lineup.filter((l) => l.role === "field").map((l) => l.playerId)
  );
  const initialNotes = match.opponentNotes ?? "";

  async function save(formData: FormData) {
    "use server";
    const starters = formData.getAll("starter").map((v) => Number(v));
    const notes = (formData.get("opponentNotes") as string) || null;
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
    const allPlayers = await jugadoresService.getByEquipo(1);
    const lineup: PlayerSlot[] = [];
    starters.slice(0, formation.length).forEach((id, idx) => {
      const pl = allPlayers.find((p: any) => p.id === id);
      lineup.push({
        playerId: id,
        number: pl?.dorsal ?? undefined,
        role: "field",
        position: formation[idx],
        minutes: 0,
      });
    });
    allPlayers
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
    await updateLineup(id, lineup, notes);
    revalidatePath(`/dashboard/partidos/${id}`);
    redirect(`/dashboard/partidos/${id}`);
  }

  return (
    <form
      action={save}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4"
    >
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-xl font-semibold flex items-center gap-2">
          Titulares
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {players.map((p: any) => (
            <label key={p.id} className="cursor-pointer">
              <input
                type="checkbox"
                name="starter"
                value={p.id}
                defaultChecked={currentStarters.has(p.id)}
                className="sr-only peer"
              />
              <div className="border rounded-md p-2 flex flex-col items-center gap-2 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
                <div
                  className="w-12 h-12 flex items-center justify-center rounded"
                  style={{
                    backgroundColor:
                      p.posicion === 'Portero' ? GOALKEEPER_COLOR : teamColor,
                    color:
                      p.posicion === 'Portero' ? '#fff' : textColor,
                  }}
                >
                  {p.dorsal ?? "-"}
                </div>
                <span className="text-xs text-center leading-tight">
                  {p.nombre}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Información del partido</h2>
        <div className="space-y-1 text-sm">
          <div>
            <span className="font-medium">Jornada:</span>{" "}
            {match.matchday ?? "-"}
          </div>
          <div>
            <span className="font-medium">Fecha:</span>{" "}
            {format(new Date(match.kickoff), "dd/MM/yyyy")}
          </div>
          <div>
            <span className="font-medium">Local:</span>{" "}
            {match.isHome ? ourTeam?.nombre : rivalTeam?.nombre}
          </div>
          <div>
            <span className="font-medium">Visitante:</span>{" "}
            {match.isHome ? rivalTeam?.nombre : ourTeam?.nombre}
          </div>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="opponentNotes"
            className="text-sm font-medium"
          >
            Notas del rival
          </label>
          <textarea
            id="opponentNotes"
            name="opponentNotes"
            defaultValue={initialNotes}
            className="w-full rounded-md border p-2 text-sm"
            rows={4}
          />
        </div>
        <Button type="submit" className="w-full">
          Continuar
        </Button>
      </div>
    </form>
  );
}
