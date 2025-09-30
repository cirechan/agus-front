import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Match, MatchEvent } from "@/types/match";
import EventManager from "./event-manager";
import MatchAdminPanel from "./match-admin-panel";
import type { LucideIcon } from "lucide-react";
import { Clock3, Goal, Octagon, Sparkles, Square } from "lucide-react";

interface Player {
  id: number;
  nombre: string;
}

interface TeamOption {
  id: number;
  nombre: string;
}

interface Props {
  match: Match;
  players: Player[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeamColor: string;
  awayTeamColor: string;
  addEvent: (formData: FormData) => Promise<MatchEvent>;
  updateEvent: (formData: FormData) => Promise<MatchEvent>;
  deleteEvent: (id: number) => Promise<void>;
  teams: TeamOption[];
  rivals: TeamOption[];
  updateMatch: (formData: FormData) => Promise<void>;
  deleteMatch: () => Promise<void>;
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

const COMPETITION_LABELS: Record<string, string> = {
  liga: "Liga",
  playoff: "Play Off",
  copa: "Copa",
  amistoso: "Amistoso",
};

function getContrastColor(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0f172a" : "#fff";
}

export default function MatchSummary({
  match,
  players,
  homeTeamName,
  awayTeamName,
  homeTeamColor,
  awayTeamColor,
  addEvent,
  updateEvent,
  deleteEvent,
  teams,
  rivals,
  updateMatch,
  deleteMatch,
}: Props) {
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

  const eventBreakdown = match.events.reduce(
    (acc, event) => {
      if (event.teamId === match.teamId) {
        if (event.type === "gol") acc.ours.goals += 1;
        if (event.type === "amarilla") acc.ours.yellow += 1;
        if (event.type === "roja") acc.ours.red += 1;
      }
      if (event.rivalId === match.rivalId) {
        if (event.type === "gol") acc.rival.goals += 1;
        if (event.type === "amarilla") acc.rival.yellow += 1;
        if (event.type === "roja") acc.rival.red += 1;
      }
      return acc;
    },
    {
      ours: { goals: 0, yellow: 0, red: 0 },
      rival: { goals: 0, yellow: 0, red: 0 },
    }
  );

  function renderPlayerList(items: Player[], emptyMessage: string) {
    if (!items.length) {
      return <p className="text-sm text-slate-400">{emptyMessage}</p>;
    }
    const sorted = [...items].sort((a, b) => a.nombre.localeCompare(b.nombre));
    return (
      <ul className="mt-2 grid gap-1 text-sm text-slate-200/90">
        {sorted.map((player) => (
          <li key={player.id} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary/70" aria-hidden />
            <span>{player.nombre}</span>
          </li>
        ))}
      </ul>
    );
  }

  const ourGoals = match.events.filter(
    (event) => event.type === "gol" && event.teamId === match.teamId
  ).length;
  const rivalGoals = match.events.filter(
    (event) => event.type === "gol" && event.rivalId === match.rivalId
  ).length;
  const homeGoals = match.isHome ? ourGoals : rivalGoals;
  const awayGoals = match.isHome ? rivalGoals : ourGoals;
  const homeLabel = match.isHome ? "Nuestro equipo" : "Rival";
  const awayLabel = match.isHome ? "Rival" : "Nuestro equipo";
  const homeContrast = getContrastColor(homeTeamColor);
  const awayContrast = getContrastColor(awayTeamColor);
  const competitionLabel =
    COMPETITION_LABELS[match.competition] ?? match.competition;
  const kickoff = new Date(match.kickoff);
  const formattedKickoff = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(kickoff);
  const opponentName = (match.isHome ? awayTeamName : homeTeamName) ?? "el rival";
  const locationSummary = match.isHome ? "como locales" : "como visitantes";

  const summaryText =
    ourGoals === rivalGoals
      ? `Empatamos ${ourGoals}-${rivalGoals} ${locationSummary} ante ${opponentName}.`
      : ourGoals > rivalGoals
      ? `Ganamos ${ourGoals}-${rivalGoals} ${locationSummary} ante ${opponentName}.`
      : `Perdimos ${ourGoals}-${rivalGoals} ${locationSummary} ante ${opponentName}.`;

  let resultLabel = "Empate";
  let resultClass = "border-slate-500/50 bg-slate-800/70 text-slate-200";
  if (ourGoals > rivalGoals) {
    resultLabel = "Victoria";
    resultClass = "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  } else if (ourGoals < rivalGoals) {
    resultLabel = "Derrota";
    resultClass = "border-rose-500/40 bg-rose-500/10 text-rose-300";
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      <section className="relative px-4 pb-6 pt-8 sm:px-6 lg:px-10">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
          aria-hidden
        />
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-1 flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow-lg"
                  style={{ backgroundColor: homeTeamColor, color: homeContrast }}
                >
                  {homeTeamName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    {homeLabel}
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {homeTeamName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-4xl font-bold tabular-nums text-white sm:text-5xl">
                <span>{homeGoals}</span>
                <span className="text-slate-400">-</span>
                <span>{awayGoals}</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow-lg"
                  style={{ backgroundColor: awayTeamColor, color: awayContrast }}
                >
                  {awayTeamName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    {awayLabel}
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {awayTeamName}
                  </p>
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "border px-3 py-1 text-sm font-semibold uppercase tracking-wide",
                resultClass
              )}
            >
              {resultLabel}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-200/90">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                {competitionLabel}
              </Badge>
              {match.matchday ? <span>Jornada {match.matchday}</span> : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <Clock3 className="h-4 w-4" />
              <span>{formattedKickoff}</span>
            </div>
          </div>
        </div>
      </section>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 sm:px-6 lg:px-10">
        <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
          <CardHeader className="space-y-2 border-b border-slate-800/60 pb-4">
            <CardTitle>Timeline del partido</CardTitle>
            <CardDescription className="text-slate-400">
              Repasa los momentos clave minuto a minuto justo debajo del marcador.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative pr-4">
            {timelineEvents.length === 0 ? (
              <p className="text-sm text-slate-400">
                Aún no se registraron eventos para este partido.
              </p>
            ) : (
              <div className="relative space-y-6 pb-6 pl-5">
                <div
                  className="absolute left-2 top-0 h-full w-px bg-slate-700"
                  aria-hidden
                />
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
                              ? "ring-2 ring-emerald-400/70"
                              : isRivalEvent
                              ? "ring-2 ring-rose-400/70"
                              : "ring-2 ring-slate-500/60"
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
                                <span className="text-sm font-medium text-white">
                                  {playerName}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              {isOurEvent ? (
                                <Badge className="bg-emerald-500/10 text-emerald-300">
                                  Nuestro equipo
                                </Badge>
                              ) : isRivalEvent ? (
                                <Badge className="bg-rose-500/10 text-rose-300">
                                  Rival
                                </Badge>
                              ) : null}
                              {!hasCustomLabel ? (
                                <span className="capitalize">{event.type}</span>
                              ) : null}
                            </div>
                          </div>
                          <Badge variant="outline" className="border-slate-700/70 text-xs font-semibold text-white">
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
              <CardHeader className="space-y-2 border-b border-slate-800/60 pb-4">
                <CardTitle>Resumen del partido</CardTitle>
                <CardDescription className="text-slate-300">
                  {summaryText}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 text-sm text-slate-200/90">
                  <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/80 px-4 py-3">
                    <span className="text-slate-400">Competición</span>
                    <span className="font-semibold text-white">{competitionLabel}</span>
                  </div>
                  {match.matchday ? (
                    <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/80 px-4 py-3">
                      <span className="text-slate-400">Jornada</span>
                      <span className="font-semibold text-white">{match.matchday}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/80 px-4 py-3">
                    <span className="text-slate-400">Condición</span>
                    <span className="font-semibold text-white">
                      {match.isHome ? "Local" : "Visitante"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/80 px-4 py-3">
                    <span className="text-slate-400">Fecha</span>
                    <span className="font-semibold text-white">{formattedKickoff}</span>
                  </div>
                </div>
                <div className="grid gap-3 text-sm text-slate-200/90">
                  <div className="rounded-lg border border-slate-800/60 bg-slate-900/80 p-4">
                    <h4 className="text-xs uppercase tracking-wide text-slate-400">
                      Nuestro equipo
                    </h4>
                    <dl className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <dt>Goles</dt>
                        <dd className="font-semibold text-white">
                          {eventBreakdown.ours.goals}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Tarjetas amarillas</dt>
                        <dd className="font-semibold text-amber-300">
                          {eventBreakdown.ours.yellow}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Tarjetas rojas</dt>
                        <dd className="font-semibold text-rose-300">
                          {eventBreakdown.ours.red}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="rounded-lg border border-slate-800/60 bg-slate-900/80 p-4">
                    <h4 className="text-xs uppercase tracking-wide text-slate-400">
                      Rival
                    </h4>
                    <dl className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <dt>Goles</dt>
                        <dd className="font-semibold text-white">
                          {eventBreakdown.rival.goals}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Tarjetas amarillas</dt>
                        <dd className="font-semibold text-amber-300">
                          {eventBreakdown.rival.yellow}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Tarjetas rojas</dt>
                        <dd className="font-semibold text-rose-300">
                          {eventBreakdown.rival.red}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
              <CardHeader className="space-y-2 border-b border-slate-800/60 pb-4">
                <CardTitle>Convocatoria</CardTitle>
                <CardDescription className="text-slate-400">
                  Distribución de la plantilla entre titulares, suplentes y desconvocados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Titulares</span>
                    <Badge variant="outline" className="border-slate-700/70 text-white">
                      {starters.length}
                    </Badge>
                  </div>
                  {renderPlayerList(starters, "Sin titulares asignados")}
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Suplentes</span>
                    <Badge variant="outline" className="border-slate-700/70 text-white">
                      {bench.length}
                    </Badge>
                  </div>
                  {renderPlayerList(bench, "Sin suplentes seleccionados")}
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Desconvocados</span>
                    <Badge variant="outline" className="border-slate-700/70 text-white">
                      {unavailable.length}
                    </Badge>
                  </div>
                  {renderPlayerList(
                    unavailable,
                    "Todos los jugadores fueron convocados"
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
              <CardHeader className="space-y-2 border-b border-slate-800/60 pb-4">
                <CardTitle>Minutos jugados</CardTitle>
                <CardDescription className="text-slate-400">
                  Seguimiento del tiempo en cancha de los jugadores utilizados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {minutesData.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Todavía no hay minutos registrados en este encuentro.
                  </p>
                ) : (
                  minutesSorted.map((entry) => {
                    const player = playerMap.get(entry.id);
                    if (!player) return null;
                    const percentage = Math.min(
                      100,
                      Math.round((entry.minutes / maxMinutes) * 100)
                    );
                    return (
                      <div key={entry.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span>{player.nombre}</span>
                          <span>{entry.minutes}&apos;</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800">
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
            <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
              <CardHeader className="space-y-2 border-b border-slate-800/60 pb-4">
                <CardTitle>Valoraciones</CardTitle>
                <CardDescription className="text-slate-400">
                  Accede rápidamente a la ficha de valoración de cada jugador con minutos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {minutesData.length === 0 ? (
                  <p className="text-sm text-slate-400">
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
                          className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900 px-3 py-1 text-sm transition-colors hover:border-primary/60 hover:bg-primary/10"
                        >
                          <span className="font-medium">{player.nombre}</span>
                          <Badge className="bg-primary/10 text-primary">
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
          <div className="flex flex-col gap-6">
            <EventManager
              initialEvents={match.events}
              players={players}
              teamId={match.teamId}
              rivalId={match.rivalId}
              addEvent={addEvent}
              updateEvent={updateEvent}
              deleteEvent={deleteEvent}
            />
            <MatchAdminPanel
              match={match}
              teams={teams}
              rivals={rivals}
              onUpdate={updateMatch}
              onDelete={deleteMatch}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
