import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateLineup } from "@/lib/api/matches";
import { cn } from "@/lib/utils";
import type { Match, MatchEvent, PlayerSlot } from "@/types/match";
import { revalidatePath } from "next/cache";
import EventManager from "./event-manager";
import MatchAdminPanel from "./match-admin-panel";
import LineupRosterEditor from "./lineup-roster-editor";
import MinutesEditor from "./minutes-editor";
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

  const goalkeepers = match.lineup
    .filter(
      (slot) =>
        slot.playerId &&
        typeof slot.position === "string" &&
        slot.position.toUpperCase() === "GK"
    )
    .map((slot) => ({
      slot,
      player: playerMap.get(slot.playerId as number),
    }));
  const totalCleanSheets = goalkeepers.filter((item) => item.slot.cleanSheet).length;
  const totalGoalsConceded = goalkeepers.reduce(
    (sum, item) => sum + (item.slot.goalsConceded ?? 0),
    0
  );

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
      return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
    }
    const sorted = [...items].sort((a, b) => a.nombre.localeCompare(b.nombre));
    return (
      <ul className="mt-2 grid gap-1 text-sm text-slate-700">
        {sorted.map((player) => (
          <li key={player.id} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary/60" aria-hidden />
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
  const ourTeamName = match.isHome ? homeTeamName : awayTeamName;
  const rivalTeamName = match.isHome ? awayTeamName : homeTeamName;
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
  const conditionLabel = match.isHome ? "Local" : "Visitante";
  const locationSummary = match.isHome ? "en casa" : "a domicilio";

  const summaryHeadline =
    ourGoals === rivalGoals
      ? `${ourTeamName} empató ${ourGoals}-${rivalGoals} ${locationSummary} frente a ${rivalTeamName}.`
      : ourGoals > rivalGoals
      ? `${ourTeamName} ganó ${ourGoals}-${rivalGoals} ${locationSummary} frente a ${rivalTeamName}.`
      : `${ourTeamName} perdió ${ourGoals}-${rivalGoals} ${locationSummary} frente a ${rivalTeamName}.`;

  let resultLabel = "Empate";
  let resultClass = "border-slate-200 bg-slate-100 text-slate-600";
  if (ourGoals > rivalGoals) {
    resultLabel = "Victoria";
    resultClass = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (ourGoals < rivalGoals) {
    resultLabel = "Derrota";
    resultClass = "border-rose-200 bg-rose-50 text-rose-700";
  }

  const matchId = match.id;
  const opponentNotes = match.opponentNotes ?? null;

  async function handleSaveLineup(lineup: PlayerSlot[]) {
    "use server";
    await updateLineup(matchId, lineup, opponentNotes, true);
    revalidatePath(`/dashboard/partidos/${matchId}`);
    revalidatePath("/dashboard/partidos");
  }

  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      <section className="px-4 pb-6 pt-8 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-5xl">
          <Card className="border border-slate-200 shadow-xl">
            <CardHeader className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex flex-1 flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow"
                      style={{ backgroundColor: homeTeamColor, color: homeContrast }}
                    >
                      {homeTeamName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {homeLabel}
                      </p>
                      <p className="text-lg font-semibold text-slate-900">{homeTeamName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-4xl font-bold tabular-nums text-slate-900 sm:text-5xl">
                    <span>{homeGoals}</span>
                    <span className="text-muted-foreground">-</span>
                    <span>{awayGoals}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow"
                      style={{ backgroundColor: awayTeamColor, color: awayContrast }}
                    >
                      {awayTeamName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {awayLabel}
                      </p>
                      <p className="text-lg font-semibold text-slate-900">{awayTeamName}</p>
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
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="space-y-4">
                  <p className="text-base font-medium text-slate-900">{summaryHeadline}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Badge className="border border-slate-200 bg-slate-100 text-slate-700">
                      {competitionLabel}
                    </Badge>
                    {match.matchday ? (
                      <Badge className="border border-slate-200 bg-slate-100 text-slate-700">
                        Jornada {match.matchday}
                      </Badge>
                    ) : null}
                    <Badge className="border border-slate-200 bg-slate-100 text-slate-700">
                      {conditionLabel}
                    </Badge>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-4 w-4" />
                      {formattedKickoff}
                    </span>
                  </div>
                  {match.opponentNotes ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Notas del partido
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{match.opponentNotes}</p>
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-3 text-sm text-slate-700">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-xs uppercase tracking-wide text-muted-foreground">
                      {ourTeamName}
                    </h4>
                    <dl className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <dt>Goles</dt>
                        <dd className="font-semibold text-slate-900">{eventBreakdown.ours.goals}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Tarjetas amarillas</dt>
                        <dd className="font-semibold text-amber-600">{eventBreakdown.ours.yellow}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Tarjetas rojas</dt>
                        <dd className="font-semibold text-rose-600">{eventBreakdown.ours.red}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-xs uppercase tracking-wide text-muted-foreground">
                      {rivalTeamName}
                    </h4>
                    <dl className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <dt>Goles</dt>
                        <dd className="font-semibold text-slate-900">{eventBreakdown.rival.goals}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Tarjetas amarillas</dt>
                        <dd className="font-semibold text-amber-600">{eventBreakdown.rival.yellow}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Tarjetas rojas</dt>
                        <dd className="font-semibold text-rose-600">{eventBreakdown.rival.red}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 sm:px-6 lg:px-10">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Timeline del partido</CardTitle>
            <CardDescription>
              Repasa los momentos clave minuto a minuto justo debajo del marcador.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            {timelineEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no se registraron eventos para este partido.
              </p>
            ) : (
              <div className="relative space-y-6 pb-6 pl-5">
                <div className="absolute left-2 top-0 h-full w-px bg-slate-200" aria-hidden />
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
                              ? "ring-2 ring-emerald-300/70"
                              : isRivalEvent
                              ? "ring-2 ring-rose-300/70"
                              : "ring-2 ring-slate-300/70"
                          )}
                          aria-hidden
                        />
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                  descriptor.pillClass
                                )}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {descriptor.label}
                              </span>
                              {playerName ? <span>{playerName}</span> : null}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {isOurEvent ? (
                                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                                  Nuestro equipo
                                </Badge>
                              ) : isRivalEvent ? (
                                <Badge className="border border-rose-200 bg-rose-50 text-rose-700">
                                  Rival
                                </Badge>
                              ) : null}
                              {!hasCustomLabel ? (
                                <span className="capitalize">{event.type}</span>
                              ) : null}
                            </div>
                          </div>
                          <Badge className="border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
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
            <Card>
              <CardHeader className="space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
                <div className="space-y-2">
                  <CardTitle>Convocatoria</CardTitle>
                  <CardDescription>
                    Distribución de la plantilla entre titulares, suplentes y desconvocados.
                  </CardDescription>
                </div>
                <LineupRosterEditor
                  lineup={match.lineup}
                  players={players}
                  onSave={handleSaveLineup}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>Titulares</span>
                    <Badge className="border border-slate-200 bg-slate-100 text-slate-700">
                      {starters.length}
                    </Badge>
                  </div>
                  {renderPlayerList(starters, "Sin titulares asignados")}
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>Suplentes</span>
                    <Badge className="border border-slate-200 bg-slate-100 text-slate-700">
                      {bench.length}
                    </Badge>
                  </div>
                  {renderPlayerList(bench, "Sin suplentes seleccionados")}
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>Desconvocados</span>
                    <Badge className="border border-slate-200 bg-slate-100 text-slate-700">
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
            <Card>
              <CardHeader className="space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
                <div className="space-y-2">
                  <CardTitle>Minutos jugados</CardTitle>
                  <CardDescription>
                    Seguimiento del tiempo en cancha de los jugadores utilizados.
                  </CardDescription>
                </div>
                <MinutesEditor
                  lineup={match.lineup}
                  players={players}
                  onSave={handleSaveLineup}
                />
              </CardHeader>
              <CardContent className="space-y-6">
                {minutesSorted.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aún no se han registrado minutos para este partido.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {minutesSorted.map((entry) => {
                      const player = playerMap.get(entry.id);
                      if (!player) return null;
                      const percentage = Math.min(
                        100,
                        Math.round((entry.minutes / maxMinutes) * 100)
                      );
                      return (
                        <div key={entry.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm font-medium text-slate-900">
                            <span>{player.nombre}</span>
                            <span>{entry.minutes}&apos;</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {goalkeepers.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-sm font-medium text-emerald-700">Porterías a cero</p>
                      <p className="text-2xl font-semibold text-emerald-700">{totalCleanSheets}</p>
                      <p className="text-xs text-emerald-700/80">
                        Marca el interruptor correspondiente al editar minutos.
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">Goles encajados</p>
                      <p className="text-2xl font-semibold text-rose-600">{totalGoalsConceded}</p>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {goalkeepers.map((item) => (
                          <li key={item.slot.playerId}>
                            {item.player?.nombre ?? `Jugador ${item.slot.playerId}`} · {item.slot.goalsConceded ?? 0} goles
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
                    Registra al menos un guardameta en la alineación para controlar las porterías a cero y goles encajados.
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-2">
                <CardTitle>Valoraciones</CardTitle>
                <CardDescription>
                  Accede rápidamente a la ficha de valoración de cada jugador con minutos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {match.lineup
                    .filter((slot) => slot.playerId && slot.role !== "unavailable")
                    .map((slot) => {
                      const player = playerMap.get(slot.playerId as number);
                      if (!player) return null;
                      return (
                        <a
                          key={slot.playerId}
                          href={`/dashboard/valoraciones?jugador=${slot.playerId}`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm transition-colors hover:border-primary/60 hover:bg-primary/10"
                        >
                          <span className="font-medium text-slate-900">{player.nombre}</span>
                          <Badge className="border border-primary/40 bg-primary/10 text-xs font-semibold text-primary">
                            {slot.minutes ?? 0}&apos;
                          </Badge>
                        </a>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col gap-4">
            <Accordion type="multiple" className="space-y-4">
              <AccordionItem value="events">
                <AccordionTrigger className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-base font-semibold shadow-sm hover:bg-slate-50">
                  Gestionar eventos
                </AccordionTrigger>
                <AccordionContent className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <EventManager
                    initialEvents={match.events}
                    players={players}
                    teamId={match.teamId}
                    rivalId={match.rivalId}
                    addEvent={addEvent}
                    updateEvent={updateEvent}
                    deleteEvent={deleteEvent}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="admin">
                <AccordionTrigger className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-base font-semibold shadow-sm hover:bg-slate-50">
                  Administrar partido
                </AccordionTrigger>
                <AccordionContent className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <MatchAdminPanel
                    match={match}
                    teams={teams}
                    rivals={rivals}
                    onUpdate={updateMatch}
                    onDelete={deleteMatch}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
}
