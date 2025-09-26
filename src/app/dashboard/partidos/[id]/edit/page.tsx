import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getMatch, updateMatch } from "@/lib/api/matches";
import {
  equiposService,
  jugadoresService,
  rivalesService,
} from "@/lib/api/services";
import { getFormationPositions, detectFormation } from "@/lib/formations";
import MatchForm from "../../match-form";
import type { FormationKey } from "@/lib/formations";
import type { PlayerSlot } from "@/types/match";

function getContrastColor(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
}

export default async function EditMatchPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const match = await getMatch(id);
  if (!match) {
    return <div className="p-4">Partido no encontrado</div>;
  }

  const teamId = match.teamId;

  const [rivales, players, equipo] = await Promise.all([
    rivalesService.getAll(),
    jugadoresService.getByEquipo(teamId),
    equiposService.getById(teamId),
  ]);

  const simplifiedPlayers = players.map((player: any) => ({
    id: Number(player.id),
    nombre: player.nombre as string,
    posicion: player.posicion ?? null,
    dorsal: player.dorsal ?? null,
  }));
  const simplifiedRivals = rivales.map((team: any) => ({
    id: Number(team.id),
    nombre: team.nombre as string,
    color: team.color ?? null,
  }));

  const teamColor = equipo?.color || "#dc2626";
  const GOALKEEPER_COLOR = "#16a34a";
  const textColor = getContrastColor(teamColor);

  const formationKey = detectFormation(match.lineup) as FormationKey;
  const formationPositions = [...getFormationPositions(formationKey)];

  const startersMap = new Map<string, number>();
  match.lineup
    .filter(
      (slot): slot is PlayerSlot & { position: string } =>
        slot.role === "field" && !!slot.position && slot.playerId != null
    )
    .forEach((slot) => {
      startersMap.set(slot.position as string, slot.playerId as number);
    });

  const starters = formationPositions
    .map((pos) => startersMap.get(pos))
    .filter((playerId): playerId is number => typeof playerId === "number");

  const bench = match.lineup
    .filter((slot) => slot.role === "bench" && slot.playerId != null)
    .map((slot) => slot.playerId as number);

  const excluded = match.lineup
    .filter((slot) => slot.role === "excluded" && slot.playerId != null)
    .map((slot) => slot.playerId as number);

  async function actualizarPartido(formData: FormData) {
    "use server";
    const condicion = formData.get("condicion") as string;
    const opponentIdRaw = formData.get("opponentId") as string;
    let opponentId = Number(opponentIdRaw);

    if (opponentIdRaw === "new") {
      const nombre = formData.get("newTeamName") as string;
      const color = formData.get("newTeamColor") as string;
      const nuevo = await rivalesService.create({ nombre, color });
      opponentId = nuevo.id;
    }

    const kickoff = formData.get("kickoff") as string;
    const competition = formData.get("competition") as
      | "liga"
      | "playoff"
      | "copa"
      | "amistoso";
    const matchdayRaw = formData.get("matchday");
    const matchday = matchdayRaw ? Number(matchdayRaw) : null;
    const startersSelected = formData.getAll("starters").map((v) => Number(v));
    const benchSelected = formData.getAll("bench").map((v) => Number(v));
    const excludedSelected = formData.getAll("excluded").map((v) => Number(v));
    const formationKeySelected =
      ((formData.get("formation") as string) || formationKey) as FormationKey;

    const isHome = condicion === "home";

    const playersForAction = await jugadoresService.getByEquipo(teamId);
    const dorsalLookupAction = playersForAction.reduce<
      Record<number, number | undefined>
    >((acc, player: any) => {
      acc[player.id] = player.dorsal ?? undefined;
      return acc;
    }, {});

    const formationSelected = getFormationPositions(formationKeySelected);
    const lineup: PlayerSlot[] = [];
    startersSelected.slice(0, formationSelected.length).forEach((playerId, idx) => {
      lineup.push({
        playerId,
        number: dorsalLookupAction[playerId],
        role: "field",
        position: formationSelected[idx],
        minutes: 0,
      });
    });
    benchSelected.forEach((playerId) => {
      if (playerId in dorsalLookupAction) {
        lineup.push({
          playerId,
          number: dorsalLookupAction[playerId],
          role: "bench",
          position: undefined,
          minutes: 0,
        });
      }
    });

    excludedSelected.forEach((playerId) => {
      if (playerId in dorsalLookupAction) {
        lineup.push({
          playerId,
          number: dorsalLookupAction[playerId],
          role: "excluded",
          position: undefined,
          minutes: 0,
        });
      }
    });

    await updateMatch(id, {
      rivalId: opponentId,
      isHome,
      kickoff,
      competition,
      matchday,
      lineup,
    });

    revalidatePath("/dashboard/partidos");
    revalidatePath(`/dashboard/partidos/${id}`);

    const nextStep = formData.get("next");
    if (nextStep === "start") {
      redirect(`/dashboard/partidos/${id}`);
    }
    redirect("/dashboard/partidos");
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Editar Partido</h1>
      <MatchForm
        players={simplifiedPlayers}
        rivales={simplifiedRivals}
        action={actualizarPartido}
        teamColor={teamColor}
        goalkeeperColor={GOALKEEPER_COLOR}
        textColor={textColor}
        defaults={{
          condicion: match.isHome ? "home" : "away",
          opponentId: match.rivalId,
          competition: match.competition,
          matchday: match.matchday ?? undefined,
          kickoff: match.kickoff,
          formation: formationKey,
          starters,
          bench,
          excluded,
        }}
        primaryLabel="Guardar cambios"
        startLabel="Guardar e iniciar"
        showStartButton
      />
    </div>
  );
}
