"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Match } from "@/types/match";

interface Option {
  id: number;
  nombre: string;
}

interface Props {
  match: Match;
  teams: Option[];
  rivals: Option[];
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: () => Promise<void>;
}

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function MatchAdminPanel({
  match,
  teams,
  rivals,
  onUpdate,
  onDelete,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [teamId, setTeamId] = useState<number>(match.teamId);
  const [rivalId, setRivalId] = useState<number>(match.rivalId);
  const [isHome, setIsHome] = useState<boolean>(match.isHome);
  const [kickoff, setKickoff] = useState<string>(toDateTimeLocal(match.kickoff));
  const [competition, setCompetition] = useState<Match["competition"]>(
    match.competition
  );
  const [matchday, setMatchday] = useState<string>(
    match.matchday != null ? String(match.matchday) : ""
  );
  const [opponentNotes, setOpponentNotes] = useState<string>(
    match.opponentNotes ?? ""
  );

  const teamsOptions = useMemo(
    () => teams.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [teams]
  );
  const rivalsOptions = useMemo(
    () => rivals.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [rivals]
  );

  function handleSwapCondition() {
    setIsHome((prev) => !prev);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("teamId", String(teamId));
    formData.set("rivalId", String(rivalId));
    formData.set("isHome", String(isHome));
    formData.set("competition", competition);
    if (kickoff) {
      formData.set("kickoff", kickoff);
    }
    formData.set("matchday", matchday);
    formData.set("opponentNotes", opponentNotes);

    startTransition(async () => {
      try {
        await onUpdate(formData);
        toast.success("Partido actualizado correctamente");
      } catch (error) {
        console.error("No se pudo actualizar el partido", error);
        toast.error("No se pudieron guardar los cambios del partido");
      }
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar este partido? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;
    startTransition(async () => {
      try {
        await onDelete();
      } catch (error) {
        if (error && typeof error === "object" && "digest" in error) {
          // NEXT_REDIRECT se lanza como excepción, no debemos tratarlo como error.
          return;
        }
        console.error("No se pudo eliminar el partido", error);
        toast.error("No se pudo eliminar el partido");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">Administrar partido</h3>
        <p className="text-sm text-muted-foreground">
          Corrige datos del encuentro o elimínalo en caso de duplicados.
        </p>
      </div>
      <form
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label>Equipo propio</Label>
            <Select
              value={String(teamId)}
              onValueChange={(value) => setTeamId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona equipo" />
              </SelectTrigger>
              <SelectContent>
                {teamsOptions.map((team) => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Rival</Label>
            <Select
              value={String(rivalId)}
              onValueChange={(value) => setRivalId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona rival" />
              </SelectTrigger>
              <SelectContent>
                {rivalsOptions.map((rival) => (
                  <SelectItem key={rival.id} value={String(rival.id)}>
                    {rival.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Condición</p>
              <p className="text-xs text-muted-foreground">
                Marca si jugamos como locales o visitantes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Visitante</span>
              <Switch
                checked={isHome}
                onCheckedChange={setIsHome}
                aria-label="Cambiar condición del partido"
              />
              <span className="text-xs font-medium text-slate-900">Local</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleSwapCondition}
            disabled={isPending}
          >
            Invertir local/visitante
          </Button>
          <div className="grid gap-1">
            <Label htmlFor="match-kickoff">Fecha y hora</Label>
            <Input
              id="match-kickoff"
              type="datetime-local"
              value={kickoff}
              onChange={(event) => setKickoff(event.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label>Competición</Label>
            <Select
              value={competition}
              onValueChange={(value) =>
                setCompetition(value as Match["competition"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona competición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="liga">Liga</SelectItem>
                <SelectItem value="playoff">Play Off</SelectItem>
                <SelectItem value="copa">Copa</SelectItem>
                <SelectItem value="amistoso">Amistoso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="matchday">Jornada</Label>
            <Input
              id="matchday"
              type="number"
              min={1}
              value={matchday}
              onChange={(event) => setMatchday(event.target.value)}
              placeholder="Deja vacío si no aplica"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="opponent-notes">Notas del rival</Label>
            <Textarea
              id="opponent-notes"
              value={opponentNotes}
              onChange={(event) => setOpponentNotes(event.target.value)}
              placeholder="Observaciones sobre el rival o contexto"
              rows={3}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTeamId(match.teamId);
              setRivalId(match.rivalId);
              setIsHome(match.isHome);
              setKickoff(toDateTimeLocal(match.kickoff));
              setCompetition(match.competition);
              setMatchday(match.matchday != null ? String(match.matchday) : "");
              setOpponentNotes(match.opponentNotes ?? "");
            }}
            disabled={isPending}
          >
            Restablecer
          </Button>
        </div>
      </form>
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-rose-700">Eliminar partido</p>
            <p className="text-xs text-rose-600">
              Borra el partido si es un duplicado o se creó por error.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Eliminando..." : "Eliminar partido"}
          </Button>
        </div>
      </div>
    </div>
  );
}
