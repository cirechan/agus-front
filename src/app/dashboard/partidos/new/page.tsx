import { equiposService, jugadoresService, rivalesService } from "@/lib/api/services";
import { createMatch } from "@/lib/api/matches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlayerSelector from "./player-selector";
import OpponentSelect from "./opponent-select";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PlayerSlot } from "@/types/match";
import {
  DEFAULT_FORMATION_KEY,
  FORMATIONS,
  FORMATION_OPTIONS,
} from "@/data/formations";

export default async function NuevoPartidoPage() {
  const equipos = await equiposService.getAll();
  const nuestro = equipos[0] ?? null;
  const rivales = await rivalesService.getAll();
  const teamId = nuestro?.id;
  const players = teamId ? await jugadoresService.getByEquipo(teamId) : [];
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

  const TEAM_COLORS = [
    { value: '#dc2626', label: 'Rojo' },
    { value: '#1d4ed8', label: 'Azul' },
    { value: '#15803d', label: 'Verde' },
    { value: '#f59e0b', label: 'Amarillo' },
    { value: '#000000', label: 'Negro' },
    { value: '#ffffff', label: 'Blanco' },
  ];

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
    const unavailable = formData.getAll("unavailable").map((v) => Number(v));
    const formationKeyRaw = (formData.get("formation") as string) || DEFAULT_FORMATION_KEY;
    const formationPositions =
      FORMATIONS[formationKeyRaw]?.positions ?? FORMATIONS[DEFAULT_FORMATION_KEY].positions;

    const isHome = condicion === "home";

    if (!teamId) {
      throw new Error("No hay equipo principal disponible para crear el partido");
    }

    const allPlayers = await jugadoresService.getByEquipo(teamId);
    const lineup: PlayerSlot[] = [];
    const uniqueStarters = Array.from(new Set(starters));
    const uniqueBench = Array.from(new Set(bench));
    const uniqueUnavailable = Array.from(new Set(unavailable));

    uniqueStarters.slice(0, formationPositions.length).forEach((id, idx) => {
      const pl = allPlayers.find((p: any) => p.id === id);
      lineup.push({
        playerId: id,
        number: pl?.dorsal ?? undefined,
        role: "field",
        position: formationPositions[idx],
        minutes: 0,
      });
    });
    uniqueBench
      .filter((id) => !uniqueStarters.includes(id))
      .forEach((id) => {
      const pl = allPlayers.find((p: any) => p.id === id);
      if (pl) {
        lineup.push({
          playerId: id,
          number: pl.dorsal ?? undefined,
          role: "bench",
          position: undefined,
          minutes: 0,
        });
      }
    });
    uniqueUnavailable
      .filter((id) => !uniqueStarters.includes(id) && !uniqueBench.includes(id))
      .forEach((id) => {
        const pl = allPlayers.find((p: any) => p.id === id);
        if (pl) {
          lineup.push({
            playerId: id,
            number: pl.dorsal ?? undefined,
            role: "unavailable",
            position: undefined,
            minutes: 0,
          });
        }
      });

    await createMatch({
      teamId,
      rivalId: opponentId,
      isHome,
      kickoff,
      competition,
      matchday,
      lineup,
      events: [],
    });
    revalidatePath("/dashboard/partidos");
    redirect("/dashboard/partidos");
  }

  if (!nuestro) {
    return (
      <div className="p-4">
        No se encontró ningún equipo principal. Crea uno antes de generar un
        partido.
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo Partido</h1>
      <form action={crearPartido} className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <PlayerSelector
            players={players}
            teamColor={teamColor}
            goalkeeperColor={GOALKEEPER_COLOR}
            textColor={textColor}
            formations={FORMATION_OPTIONS}
            defaultFormation={DEFAULT_FORMATION_KEY}
          />
        </div>
        <div className="w-full max-w-xs space-y-4">
          <h2 className="font-semibold">Información del partido</h2>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              ¿Dónde se juega el partido?
            </label>
            <select
              name="condicion"
              className="w-full rounded border p-2"
              required
            >
              <option value="home">Local</option>
              <option value="away">Visitante</option>
            </select>
          </div>
          <OpponentSelect teams={rivales} colors={TEAM_COLORS} />
          <div className="space-y-1">
            <label className="text-sm font-medium">Tipo de competición</label>
            <select
              name="competition"
              className="w-full rounded border p-2"
              required
            >
              <option value="liga">Liga</option>
              <option value="playoff">Play Off</option>
              <option value="copa">Copa</option>
              <option value="amistoso">Amistoso</option>
            </select>
          </div>
          <Input type="number" name="matchday" placeholder="Jornada" />
          <Input type="datetime-local" name="kickoff" required />
          <Button type="submit" className="w-full">
            Guardar partido
          </Button>
        </div>
      </form>
    </div>
  );
}

