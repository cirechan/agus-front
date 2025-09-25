import { equiposService, jugadoresService, rivalesService } from "@/lib/api/services";
import { createMatch } from "@/lib/api/matches";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PlayerSlot } from "@/types/match";
import { getPrimaryTeamId, resolvePrimaryTeam } from "@/lib/team";
import MatchForm from "../match-form";
import {
  DEFAULT_FORMATION_KEY,
  getFormationPositions,
} from "@/lib/formations";
import type { FormationKey } from "@/lib/formations";

export default async function NuevoPartidoPage() {
  const equipos = await equiposService.getAll();
  const nuestro = resolvePrimaryTeam(equipos);
  if (!nuestro) {
    const primaryTeamId = getPrimaryTeamId();
    return <div className="p-4">No se encuentra el equipo principal (ID {primaryTeamId})</div>;
  }

  const rivales = await rivalesService.getAll();
  const players = await jugadoresService.getByEquipo(nuestro.id);
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
  const teamColor = nuestro?.color || '#dc2626';
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

  async function crearPartido(formData: FormData) {
    "use server";
    const condicion = formData.get("condicion") as string; // home or away
    const opponentIdRaw = formData.get("opponentId") as string;
    let opponentId = Number(opponentIdRaw);

    if (opponentIdRaw === "new") {
      const nombre = formData.get("newTeamName") as string;
      const color = formData.get("newTeamColor") as string;
      const nuevo = await rivalesService.create({ nombre, color });
      opponentId = nuevo.id;
    }

    const kickoff = formData.get("kickoff") as string;
    const competition = formData.get("competition") as 'liga' | 'playoff' | 'copa' | 'amistoso';
    const matchdayRaw = formData.get("matchday");
    const matchday = matchdayRaw ? Number(matchdayRaw) : null;
    const starters = formData.getAll("starters").map((v) => Number(v));
    const bench = formData.getAll("bench").map((v) => Number(v));
    const excluded = formData.getAll("excluded").map((v) => Number(v));
    const formationKey =
      ((formData.get("formation") as string) || DEFAULT_FORMATION_KEY) as FormationKey;

    const isHome = condicion === "home";

    const allPlayers = await jugadoresService.getByEquipo(nuestro.id);
    const dorsalLookup = allPlayers.reduce<Record<number, number | undefined>>(
      (acc, player: any) => {
        acc[player.id] = player.dorsal ?? undefined;
        return acc;
      },
      {}
    );
    const formation = getFormationPositions(formationKey);
    const lineup: PlayerSlot[] = [];
    starters.slice(0, formation.length).forEach((id, idx) => {
      lineup.push({
        playerId: id,
        number: dorsalLookup[id],
        role: "field",
        position: formation[idx],
        minutes: 0,
      });
    });
    bench.forEach((id) => {
      if (id in dorsalLookup) {
        lineup.push({
          playerId: id,
          number: dorsalLookup[id],
          role: "bench",
          position: undefined,
          minutes: 0,
        });
      }
    });

    excluded.forEach((id) => {
      if (id in dorsalLookup) {
        lineup.push({
          playerId: id,
          number: dorsalLookup[id],
          role: "excluded",
          position: undefined,
          minutes: 0,
        });
      }
    });

    const created = await createMatch({
      teamId: nuestro.id,
      rivalId: opponentId,
      isHome,
      kickoff,
      competition,
      matchday,
      lineup,
      events: [],
    });
    revalidatePath("/dashboard/partidos");
    const nextStep = formData.get("next");
    if (nextStep === "start") {
      redirect(`/dashboard/partidos/${created.id}`);
    }
    redirect("/dashboard/partidos");
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo Partido</h1>
      <MatchForm
        players={simplifiedPlayers}
        rivales={simplifiedRivals}
        action={crearPartido}
        teamColor={teamColor}
        goalkeeperColor={GOALKEEPER_COLOR}
        textColor={textColor}
        primaryLabel="Crear partido"
        startLabel="Crear e iniciar"
        showStartButton
      />
    </div>
  );
}

