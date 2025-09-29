import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getMatch, updateLineup } from "@/lib/api/matches";
import { jugadoresService, equiposService } from "@/lib/api/services";
import PlayerSelector from "@/app/dashboard/partidos/new/player-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlayerSlot } from "@/types/match";
import {
  DEFAULT_FORMATION_KEY,
  FORMATIONS,
  FORMATION_OPTIONS,
  type FormationKey,
} from "@/data/formations";

interface PageProps {
  params: { id: string };
}

type SelectorPlayer = {
  id: number;
  nombre: string;
  posicion: string | null;
  dorsal: number | null;
};

function inferFormationKey(lineup: PlayerSlot[]): FormationKey {
  const fieldPositions = lineup
    .filter((slot) => slot.role === "field" && slot.position)
    .map((slot) => slot.position as string);

  if (!fieldPositions.length) {
    return DEFAULT_FORMATION_KEY;
  }

  const normalized = [...fieldPositions].sort().join("|");

  for (const key of Object.keys(FORMATIONS) as FormationKey[]) {
    const candidate = [...FORMATIONS[key].positions].sort().join("|");
    if (candidate === normalized) {
      return key;
    }
  }

  return DEFAULT_FORMATION_KEY;
}

export default async function EditarPartidoPage({ params }: PageProps) {
  const matchId = Number(params.id);
  const match = await getMatch(matchId);

  if (!match) {
    notFound();
  }

  if (match.finished) {
    redirect(`/dashboard/partidos/${matchId}`);
  }

  const opponentNotes = match.opponentNotes ?? null;

  const equipo = await equiposService.getById(match.teamId);
  const jugadores = await jugadoresService.getByEquipo(match.teamId);
  const players: SelectorPlayer[] = jugadores.map((player: any) => ({
    id: player.id,
    nombre: player.nombre,
    posicion: player.posicion ?? null,
    dorsal: player.dorsal ?? null,
  }));

  const initialStarters = match.lineup
    .filter((slot) => slot.role === "field" && slot.playerId != null)
    .map((slot) => slot.playerId as number);
  const initialBench = match.lineup
    .filter((slot) => slot.role === "bench" && slot.playerId != null)
    .map((slot) => slot.playerId as number);
  const initialUnavailable = match.lineup
    .filter((slot) => slot.role === "unavailable" && slot.playerId != null)
    .map((slot) => slot.playerId as number);
  const initialAssignments = match.lineup
    .filter((slot) => slot.role === "field" && slot.position && slot.playerId != null)
    .map((slot) => ({ position: slot.position as string, playerId: slot.playerId as number }));

  const initialFormation = inferFormationKey(match.lineup);
  const teamColor = equipo?.color ?? "#dc2626";
  const goalkeeperColor = "#16a34a";

  function getContrastColor(hex: string) {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000" : "#fff";
  }

  const textColor = getContrastColor(teamColor);
  const minutesMap = new Map<number, number>(
    match.lineup
      .filter((slot) => slot.playerId != null)
      .map((slot) => [slot.playerId as number, slot.minutes ?? 0])
  );
  const dorsalMap = new Map<number, number | null>(
    players.map((player) => [player.id, player.dorsal ?? null])
  );

  async function guardarConvocatoria(formData: FormData) {
    "use server";

    const starters = formData.getAll("starters").map((v) => Number(v));
    const bench = formData.getAll("bench").map((v) => Number(v));
    const unavailable = formData.getAll("unavailable").map((v) => Number(v));
    const starterSlotsRaw = formData
      .getAll("starterSlot")
      .map((value) => String(value));
    const formationKey = (formData.get("formation") as string) || initialFormation;
    const formation =
      FORMATIONS[formationKey as FormationKey]?.positions ??
      FORMATIONS[initialFormation].positions;

    const uniqueStarters = Array.from(new Set(starters));
    const uniqueBench = Array.from(new Set(bench));
    const uniqueUnavailable = Array.from(new Set(unavailable));

    const lineup: PlayerSlot[] = [];

    const assignmentMap = new Map<string, number>();
    starterSlotsRaw.forEach((entry) => {
      const [position, playerRaw] = entry.split(":");
      if (!position) return;
      const trimmed = (playerRaw ?? "").trim();
      if (!trimmed) return;
      const playerId = Number(trimmed);
      if (!Number.isFinite(playerId)) return;
      if (!uniqueStarters.includes(playerId)) return;
      if (assignmentMap.has(position)) return;
      assignmentMap.set(position, playerId);
    });

    const usedStarters = new Set<number>();
    const actualStarters: number[] = [];
    formation.forEach((position) => {
      const assigned = assignmentMap.get(position);
      let playerId: number | null = null;
      if (assigned != null && !usedStarters.has(assigned)) {
        playerId = assigned;
      } else {
        playerId = uniqueStarters.find((id) => !usedStarters.has(id)) ?? null;
      }
      if (playerId == null) return;
      usedStarters.add(playerId);
      actualStarters.push(playerId);
      lineup.push({
        playerId,
        number: dorsalMap.get(playerId) ?? undefined,
        role: "field",
        position,
        minutes: minutesMap.get(playerId) ?? 0,
      });
    });

    const startersSet = new Set(actualStarters);

    uniqueBench
      .filter((id) => id && !startersSet.has(id))
      .forEach((id) => {
        lineup.push({
          playerId: id,
          number: dorsalMap.get(id) ?? undefined,
          role: "bench",
          position: undefined,
          minutes: minutesMap.get(id) ?? 0,
        });
      });

    uniqueUnavailable
      .filter((id) => id && !startersSet.has(id) && !uniqueBench.includes(id))
      .forEach((id) => {
        lineup.push({
          playerId: id,
          number: dorsalMap.get(id) ?? undefined,
          role: "unavailable",
          position: undefined,
          minutes: 0,
        });
      });

    await updateLineup(matchId, lineup, opponentNotes, false);
    revalidatePath(`/dashboard/partidos/${matchId}`);
    revalidatePath("/dashboard/partidos");
    redirect("/dashboard/partidos");
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar convocatoria</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={guardarConvocatoria} className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1">
              <PlayerSelector
                players={players}
                teamColor={teamColor}
                goalkeeperColor={goalkeeperColor}
                textColor={textColor}
                formations={FORMATION_OPTIONS}
                defaultFormation={DEFAULT_FORMATION_KEY}
                initialStarters={initialStarters as number[]}
                initialBench={initialBench as number[]}
                initialUnavailable={initialUnavailable as number[]}
                initialFormation={initialFormation}
                initialAssignments={initialAssignments}
              />
            </div>
            <div className="w-full max-w-xs space-y-4">
              <p className="text-sm text-muted-foreground">
                Ajusta la lista de titulares, suplentes y desconvocados antes de iniciar el partido.
              </p>
              <Button type="submit" className="w-full">
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
