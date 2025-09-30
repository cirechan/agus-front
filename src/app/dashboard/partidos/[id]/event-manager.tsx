"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import type { MatchEvent } from "@/types/match";
import { cn } from "@/lib/utils";

interface PlayerOption {
  id: number;
  nombre: string;
}

interface Props {
  initialEvents: MatchEvent[];
  players: PlayerOption[];
  teamId: number;
  rivalId: number;
  addEvent: (formData: FormData) => Promise<MatchEvent>;
  updateEvent: (formData: FormData) => Promise<MatchEvent>;
  deleteEvent: (id: number) => Promise<void>;
}

const EVENT_LABELS: Record<string, string> = {
  gol: "Gol",
  amarilla: "Tarjeta amarilla",
  roja: "Tarjeta roja",
  asistencia: "Asistencia",
};

type TeamScope = "ours" | "rival";
type FormMode = "create" | "edit";

export default function EventManager({
  initialEvents,
  players,
  teamId,
  rivalId,
  addEvent,
  updateEvent,
  deleteEvent,
}: Props) {
  const router = useRouter();
  const [events, setEvents] = useState<MatchEvent[]>(() =>
    [...initialEvents].sort((a, b) => a.minute - b.minute)
  );
  const [mode, setMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [minute, setMinute] = useState<string>("0");
  const [type, setType] = useState<string>("gol");
  const [teamScope, setTeamScope] = useState<TeamScope>("ours");
  const [playerId, setPlayerId] = useState<string>("none");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.minute - b.minute),
    [events]
  );

  function resetForm(closeForm = false) {
    setMode("create");
    setEditingId(null);
    setMinute("0");
    setType("gol");
    setTeamScope("ours");
    setPlayerId("none");
    setError(null);
    if (closeForm) {
      setFormOpen(false);
    }
  }

  function resolveTeamScope(event: MatchEvent): TeamScope {
    if (event.teamId === teamId) return "ours";
    if (event.rivalId === rivalId) return "rival";
    return "ours";
  }

  function beginEdit(event: MatchEvent) {
    setFormOpen(true);
    setMode("edit");
    setEditingId(event.id);
    setMinute(String(event.minute));
    setType(event.type);
    const scope =
      event.type === "asistencia" ? "ours" : resolveTeamScope(event);
    setTeamScope(scope);
    setPlayerId(event.playerId != null ? String(event.playerId) : "none");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedMinute = Number(minute);
    const minuteNumber = Number.isFinite(parsedMinute)
      ? Math.max(0, Math.min(130, Math.round(parsedMinute)))
      : 0;

    const effectiveTeam = type === "asistencia" ? "ours" : teamScope;
    const requiresPlayer = type === "asistencia" || effectiveTeam === "ours";

    if (type === "asistencia" && playerId === "none") {
      setError("Selecciona quién dio la asistencia.");
      return;
    }

    if (requiresPlayer && effectiveTeam === "ours" && playerId !== "none") {
      const exists = playerMap.has(Number(playerId));
      if (!exists) {
        setError("Selecciona un jugador válido para este evento.");
        return;
      }
    }

    const formData = new FormData();
    formData.set("minute", String(minuteNumber));
    formData.set("type", type);

    if (effectiveTeam === "ours") {
      formData.set("teamId", String(teamId));
      if (playerId !== "none") {
        formData.set("playerId", playerId);
      }
    } else if (effectiveTeam === "rival") {
      formData.set("rivalId", String(rivalId));
    }

    setSaving(true);
    try {
      let updatedEvent: MatchEvent;
      if (mode === "edit" && editingId != null) {
        formData.set("id", String(editingId));
        if (playerId === "none") {
          formData.delete("playerId");
        }
        updatedEvent = await updateEvent(formData);
        setEvents((prev) => {
          const next = prev.map((evt) =>
            evt.id === updatedEvent.id ? updatedEvent : evt
          );
          return next.sort((a, b) => a.minute - b.minute);
        });
        toast("Evento actualizado correctamente");
      } else {
        const created = await addEvent(formData);
        updatedEvent = created;
        setEvents((prev) =>
          [...prev, created].sort((a, b) => a.minute - b.minute)
        );
        toast("Evento añadido correctamente");
      }
      resetForm(true);
      router.refresh();
    } catch (err) {
      console.error("No se pudo guardar el evento", err);
      setError("No se pudo guardar el evento. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("¿Eliminar este evento del partido?");
    if (!confirmed) return;
    setDeletingId(id);
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((evt) => evt.id !== id));
      if (editingId === id) {
        resetForm(true);
      }
      router.refresh();
      toast("Evento eliminado");
    } catch (err) {
      console.error("No se pudo eliminar el evento", err);
      toast("No se pudo eliminar el evento. Inténtalo nuevamente.");
    } finally {
      setDeletingId(null);
    }
  }

  const isEditing = mode === "edit";
  const toggleLabel = formOpen
    ? isEditing
      ? "Cancelar edición"
      : "Ocultar formulario"
    : "Añadir evento";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            {isEditing ? "Editando evento" : "Acta del partido"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isEditing
              ? "Guarda los cambios o cancela para volver al listado."
              : "Despliega el formulario solo cuando vayas a registrar un evento."}
          </p>
        </div>
        <Button
          type="button"
          variant={formOpen ? "secondary" : "outline"}
          onClick={() => {
            if (formOpen) {
              resetForm(true);
            } else {
              resetForm();
              setFormOpen(true);
            }
          }}
          disabled={saving}
        >
          {toggleLabel}
        </Button>
      </div>
      {formOpen ? (
        <form
          className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="event-minute">Minuto</Label>
              <Input
                id="event-minute"
                type="number"
                min={0}
                max={130}
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label>Tipo</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value);
                  if (value === "asistencia") {
                    setTeamScope("ours");
                  }
                  if (value !== "asistencia" && teamScope === "rival") {
                    setPlayerId("none");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Equipo</Label>
              <Select
                value={type === "asistencia" ? "ours" : teamScope}
                onValueChange={(value) => {
                  const scoped = value as TeamScope;
                  setTeamScope(scoped);
                  if (scoped === "rival") {
                    setPlayerId("none");
                  }
                }}
                disabled={type === "asistencia"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ours">Nuestro equipo</SelectItem>
                  <SelectItem value="rival">Rival</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Jugador</Label>
              <Select
                value={playerId}
                onValueChange={(value) => setPlayerId(value)}
                disabled={type !== "asistencia" && teamScope === "rival"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona jugador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {players.map((player) => (
                    <SelectItem key={player.id} value={String(player.id)}>
                      {player.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? mode === "edit"
                  ? "Guardando..."
                  : "Creando..."
                : mode === "edit"
                ? "Guardar cambios"
                : "Añadir evento"}
            </Button>
            {mode === "edit" ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => resetForm(true)}
                disabled={saving}
              >
                Cancelar edición
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-900">Eventos registrados</p>
          <Badge className="border border-slate-200 bg-slate-100 text-slate-700">
            {sortedEvents.length}
          </Badge>
        </div>
        {sortedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay eventos guardados en este partido.
          </p>
        ) : (
          <ul className="space-y-3">
            {sortedEvents.map((event) => {
              const label = EVENT_LABELS[event.type] ?? event.type;
              const scope = resolveTeamScope(event);
              const playerName =
                event.playerId != null
                  ? playerMap.get(event.playerId)?.nombre
                  : null;
              const isDeleting = deletingId === event.id;
              return (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                      <span>{label}</span>
                      <Badge
                        className={cn(
                          "text-xs uppercase tracking-wide",
                          scope === "ours"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        )}
                      >
                        {scope === "ours" ? "Nuestro" : "Rival"}
                      </Badge>
                      <Badge className="border-slate-200 bg-slate-50 text-xs text-slate-700">
                        {event.minute}&apos;
                      </Badge>
                    </div>
                    {playerName ? (
                      <p className="text-xs text-muted-foreground">{playerName}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => beginEdit(event)}
                      disabled={saving || isDeleting}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(event.id)}
                      disabled={saving || isDeleting}
                    >
                      {isDeleting ? "Eliminando..." : "Eliminar"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
