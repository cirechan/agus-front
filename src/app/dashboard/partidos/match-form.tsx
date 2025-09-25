import PlayerSelector from "./new/player-selector";
import OpponentSelect from "./new/opponent-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FORMATION_OPTIONS,
  DEFAULT_FORMATION_KEY,
} from "@/lib/formations";

interface Player {
  id: number;
  nombre: string;
  posicion: string | null;
  dorsal: number | null;
}

interface Rival {
  id: number;
  nombre: string;
  color?: string | null;
}

interface MatchFormDefaults {
  condicion?: "home" | "away";
  opponentId?: number | null;
  competition?: "liga" | "playoff" | "copa" | "amistoso";
  matchday?: number | null;
  kickoff?: string | null;
  formation?: string;
  starters?: number[];
  bench?: number[];
}

interface MatchFormProps {
  players: Player[];
  rivales: Rival[];
  action: (formData: FormData) => Promise<void>;
  teamColor: string;
  goalkeeperColor: string;
  textColor: string;
  defaults?: MatchFormDefaults;
  primaryLabel?: string;
  startLabel?: string;
  showStartButton?: boolean;
}

const TEAM_COLORS = [
  { value: "#dc2626", label: "Rojo" },
  { value: "#1d4ed8", label: "Azul" },
  { value: "#15803d", label: "Verde" },
  { value: "#f59e0b", label: "Amarillo" },
  { value: "#000000", label: "Negro" },
  { value: "#ffffff", label: "Blanco" },
];

function formatDateTimeLocal(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const offsetMinutes = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offsetMinutes * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export default function MatchForm({
  players,
  rivales,
  action,
  teamColor,
  goalkeeperColor,
  textColor,
  defaults,
  primaryLabel = "Guardar partido",
  startLabel = "Guardar e iniciar",
  showStartButton = true,
}: MatchFormProps) {
  const kickoffValue = formatDateTimeLocal(defaults?.kickoff ?? undefined);
  const formationValue = defaults?.formation ?? DEFAULT_FORMATION_KEY;

  return (
    <form action={action} className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <PlayerSelector
          players={players}
          teamColor={teamColor}
          goalkeeperColor={goalkeeperColor}
          textColor={textColor}
          defaultStarters={defaults?.starters ?? []}
          defaultBench={defaults?.bench ?? []}
          maxStarters={11}
        />
      </div>
      <div className="w-full max-w-xs space-y-4">
        <h2 className="font-semibold">Información del partido</h2>
        <div className="space-y-1">
          <label className="text-sm font-medium">Formación</label>
          <select
            name="formation"
            className="w-full rounded border p-2"
            defaultValue={formationValue}
          >
            {FORMATION_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            La formación muestra solo a los jugadores de campo. El portero se
            añade automáticamente.
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            ¿Dónde se juega el partido?
          </label>
          <select
            name="condicion"
            className="w-full rounded border p-2"
            defaultValue={defaults?.condicion ?? "home"}
            required
          >
            <option value="home">Local</option>
            <option value="away">Visitante</option>
          </select>
        </div>
        <OpponentSelect
          teams={rivales}
          colors={TEAM_COLORS}
          defaultOpponentId={defaults?.opponentId}
        />
        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo de competición</label>
          <select
            name="competition"
            className="w-full rounded border p-2"
            defaultValue={defaults?.competition ?? "liga"}
            required
          >
            <option value="liga">Liga</option>
            <option value="playoff">Play Off</option>
            <option value="copa">Copa</option>
            <option value="amistoso">Amistoso</option>
          </select>
        </div>
        <Input
          type="number"
          name="matchday"
          placeholder="Jornada"
          defaultValue={defaults?.matchday ?? undefined}
        />
        <Input
          type="datetime-local"
          name="kickoff"
          required
          defaultValue={kickoffValue}
        />
        <div className="flex flex-col gap-2">
          <Button type="submit" name="next" value="list" className="w-full">
            {primaryLabel}
          </Button>
          {showStartButton && (
            <Button
              type="submit"
              variant="secondary"
              name="next"
              value="start"
              className="w-full"
            >
              {startLabel}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
