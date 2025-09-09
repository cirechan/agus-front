import { equiposService, jugadoresService } from "@/lib/api/services";
import { createMatch } from "@/lib/api/matches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlayerSelector from "./player-selector";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PlayerSlot } from "@/types/match";

export default async function NuevoPartidoPage() {
  const equipos = await equiposService.getAll();
  const nuestro = equipos.find((e: any) => e.id === 1);
  const rivales = equipos.filter((e: any) => e.id !== 1);
  const players = await jugadoresService.getByEquipo(1);
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
    const opponentId = Number(formData.get("opponentId"));
    const kickoff = formData.get("kickoff") as string;
    const competition = formData.get("competition") as 'liga' | 'playoff' | 'copa' | 'amistoso';
    const matchdayRaw = formData.get("matchday");
    const matchday = matchdayRaw ? Number(matchdayRaw) : null;
    const starters = formData.getAll("starters").map((v) => Number(v));
    const bench = formData.getAll("bench").map((v) => Number(v));

    const homeTeamId = condicion === "home" ? 1 : opponentId;
    const awayTeamId = condicion === "home" ? opponentId : 1;

    const allPlayers = await jugadoresService.getByEquipo(1);
    const formation = ["GK", "LB", "LCB", "RCB", "RB", "LM", "CM", "RM", "LW", "ST", "RW"];
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
    bench.forEach((id) => {
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

    await createMatch({
      homeTeamId,
      awayTeamId,
      kickoff,
      competition,
      matchday,
      lineup,
      events: [],
    });
    revalidatePath("/dashboard/partidos");
    redirect("/dashboard/partidos");
  }

  async function crearEquipo(formData: FormData) {
    "use server";
    const nombre = formData.get("nombre") as string;
    const color = formData.get("color") as string;
    await equiposService.create({
      nombre,
      categoria: null,
      temporadaId: null,
      color,
    });
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
          <select name="color" className="w-full rounded border p-2" required>
            {TEAM_COLORS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <Button type="submit">Crear equipo</Button>
        </form>
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
          <div className="space-y-1">
            <label className="text-sm font-medium">Rival</label>
            <select
              name="opponentId"
              className="w-full rounded border p-2"
              required
            >
              <option value="">Seleccione rival</option>
              {rivales.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
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
            Continuar
          </Button>
        </div>
      </form>
      <form action={crearEquipo} className="max-w-xs space-y-2 border-t pt-4">
        <p className="text-sm text-muted-foreground">
          ¿No aparece el rival? Añádelo rápidamente:
        </p>
        <Input name="nombre" placeholder="Nombre del equipo" required />
        <select name="color" className="w-full rounded border p-2" required>
          {TEAM_COLORS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" className="w-full">
          Añadir equipo
        </Button>
      </form>
    </div>
  );
}

