import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Match } from "@/types/match";
import type { LucideIcon } from "lucide-react";
import {
  Clock3,
  Goal,
  Octagon,
  Sparkles,
  Square,
} from "lucide-react";

interface Player {
  id: number;
  nombre: string;
}

interface Props {
  match: Match;
  players: Player[];
}

interface EventDescriptor {
  label: string;
  icon: LucideIcon;
  dotClass: string;
  pillClass: string;
}

const EVENT_CONFIG: Record<string, EventDescriptor> = {
  gol: {
    label: "Gol",
    icon: Goal,
    dotClass: "bg-emerald-500 border-emerald-200",
    pillClass: "bg-emerald-500/10 text-emerald-600",
  },
  amarilla: {
    label: "Tarjeta amarilla",
    icon: Square,
    dotClass: "bg-amber-400 border-amber-200",
    pillClass: "bg-amber-500/10 text-amber-600",
  },
  roja: {
    label: "Tarjeta roja",
    icon: Octagon,
    dotClass: "bg-red-500 border-red-200",
    pillClass: "bg-red-500/10 text-red-600",
  },
  asistencia: {
    label: "Asistencia",
    icon: Sparkles,
    dotClass: "bg-sky-500 border-sky-200",
    pillClass: "bg-sky-500/10 text-sky-600",
  },
};

const DEFAULT_EVENT: EventDescriptor = {
  label: "Evento",
  icon: Clock3,
  dotClass: "bg-muted border-border",
  pillClass: "bg-muted text-muted-foreground",
};

export default function MatchSummary({ match, players }: Props) {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const starters = match.lineup
    .filter((slot) => slot.role === "field" && slot.playerId)
    .map((slot) => playerMap.get(slot.playerId as number))
    .filter(Boolean) as Player[];
  const bench = match.lineup
    .filter((slot) => slot.role === "bench" && slot.playerId)
    .map((slot) => playerMap.get(slot.playerId as number))
    .filter(Boolean) as Player[];
  const unavailable = match.lineup
    .filter((slot) => slot.role === "unavailable" && slot.playerId)
    .map((slot) => playerMap.get(slot.playerId as number))
    .filter(Boolean) as Player[];

  const minutesData = match.lineup
    .filter((slot) => slot.playerId && slot.role !== "unavailable")
    .map((slot) => ({
      id: slot.playerId as number,
      minutes: slot.minutes ?? 0,
    }))
    .filter((item) => item.minutes > 0);

  const minutesSorted = [...minutesData].sort((a, b) => b.minutes - a.minutes);

  const maxMinutes = minutesData.length
    ? Math.max(90, ...minutesData.map((item) => item.minutes))
    : 90;

  const timelineEvents = [...match.events].sort((a, b) => a.minute - b.minute);

  function renderPlayerList(items: Player[], emptyMessage: string) {
    if (!items.length) {
      return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
    }
    const sorted = [...items].sort((a, b) => a.nombre.localeCompare(b.nombre));
    return (
      <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
        {sorted.map((player) => (
          <li key={player.id} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary/60" aria-hidden />
            <span>{player.nombre}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>Timeline del partido</CardTitle>
            <CardDescription>
              Resumen cronológico de los momentos clave del encuentro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timelineEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no se registraron eventos para este partido.
              </p>
            ) : (
              <div className="relative pl-5">
                <div className="absolute left-2 top-0 h-full w-px bg-border" aria-hidden />
                <ul className="space-y-6">
                  {timelineEvents.map((event) => {
                    const descriptor = EVENT_CONFIG[event.type] ?? DEFAULT_EVENT;
                    const hasCustomLabel = Boolean(EVENT_CONFIG[event.type]);
                    const Icon = descriptor.icon;
                    const isOurEvent =
                      event.teamId === match.teamId ||
                      (event.playerId != null &&
                        match.lineup.some((slot) => slot.playerId === event.playerId));
                    const isRivalEvent = event.rivalId === match.rivalId;
                    const playerName =
                      event.playerId != null
                        ? playerMap.get(event.playerId)?.nombre
                        : undefined;

                    return (
                      <li key={event.id} className="relative pl-6">
                        <span
                          className={cn(
                            "absolute left-[-10px] top-2 h-3 w-3 rounded-full border",
                            descriptor.dotClass,
                            isOurEvent
                              ? "ring-2 ring-emerald-300"
                              : isRivalEvent
                              ? "ring-2 ring-red-300"
                              : "ring-2 ring-slate-200"
                          )}
                          aria-hidden
                        />
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                  descriptor.pillClass
                                )}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {descriptor.label}
                              </span>
                              {playerName ? (
                                <span className="text-sm font-medium text-foreground">
                                  {playerName}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {isOurEvent ? (
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700">
                                  Nuestro equipo
                                </Badge>
                              ) : isRivalEvent ? (
                                <Badge variant="secondary" className="bg-red-500/10 text-red-700">
                                  Rival
                                </Badge>
                              ) : null}
                              {!hasCustomLabel ? (
                                <span className="capitalize">{event.type}</span>
                              ) : null}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs font-semibold">
                            {event.minute}&apos;
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Convocatoria</CardTitle>
              <CardDescription>
                Distribución de la plantilla entre titulares, suplentes y desconvocados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Titulares</span>
                  <Badge variant="outline">{starters.length}</Badge>
                </div>
                {renderPlayerList(starters, "Sin titulares asignados")}
              </div>
              <div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Suplentes</span>
                  <Badge variant="outline">{bench.length}</Badge>
                </div>
                {renderPlayerList(bench, "Sin suplentes seleccionados")}
              </div>
              <div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Desconvocados</span>
                  <Badge variant="outline">{unavailable.length}</Badge>
                </div>
                {renderPlayerList(unavailable, "Todos los jugadores fueron convocados")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Minutos jugados</CardTitle>
              <CardDescription>
                Seguimiento del tiempo en cancha de los jugadores utilizados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {minutesData.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay minutos registrados en este encuentro.
                </p>
              ) : (
                minutesSorted.map((entry) => {
                  const player = playerMap.get(entry.id);
                  if (!player) return null;
                  const percentage = Math.min(100, Math.round((entry.minutes / maxMinutes) * 100));
                  return (
                    <div key={entry.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>{player.nombre}</span>
                        <span>{entry.minutes}&apos;</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Valoraciones</CardTitle>
          <CardDescription>
            Accede rápidamente a la ficha de valoración de cada jugador con minutos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {minutesData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Una vez que registres minutos podrás valorar el rendimiento individual.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {minutesSorted.map((entry) => {
                const player = playerMap.get(entry.id);
                if (!player) return null;
                return (
                  <a
                    key={entry.id}
                    href={`/dashboard/valoraciones?jugador=${entry.id}`}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="font-medium">{player.nombre}</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {entry.minutes}&apos;
                    </Badge>
                  </a>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
