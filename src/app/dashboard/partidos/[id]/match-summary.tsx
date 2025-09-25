import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Match, MatchEvent, MatchScore } from "@/types/match";

interface Player {
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
}

function resolveScore(match: Match): MatchScore {
  if (match.score) {
    return match.score;
  }
  const teamGoals = match.events.filter(
    (e) => e.type === "gol" && e.teamId === match.teamId
  ).length;
  const rivalGoals = match.events.filter(
    (e) => e.type === "gol" && e.rivalId === match.rivalId
  ).length;
  return { team: teamGoals, rival: rivalGoals };
}

function formatEvent(
  event: MatchEvent,
  playerMap: Record<number, Player>,
  params: {
    match: Match;
    homeTeamName: string;
    awayTeamName: string;
  }
) {
  const { match, homeTeamName, awayTeamName } = params;
  const ourTeamName = match.isHome ? homeTeamName : awayTeamName;
  const rivalTeamName = match.isHome ? awayTeamName : homeTeamName;
  const playerName =
    event.playerId != null ? playerMap[event.playerId]?.nombre : undefined;
  const isOurTeam = event.teamId === match.teamId;
  const isRivalTeam = event.rivalId === match.rivalId;

  switch (event.type) {
    case "gol": {
      const teamLabel = isOurTeam ? ourTeamName : rivalTeamName;
      const subject = playerName ?? teamLabel ?? "";
      const teamSuffix = playerName && teamLabel ? ` (${teamLabel})` : "";
      return {
        icon: "⚽",
        description: `Gol de ${subject}${teamSuffix}`,
      };
    }
    case "amarilla": {
      const teamLabel = isOurTeam ? ourTeamName : rivalTeamName;
      const subject = playerName ?? teamLabel ?? "";
      const teamSuffix = playerName && teamLabel ? ` (${teamLabel})` : "";
      return {
        icon: "🟨",
        description: `Tarjeta amarilla para ${subject}${teamSuffix}`,
      };
    }
    case "roja": {
      const teamLabel = isOurTeam ? ourTeamName : rivalTeamName;
      const subject = playerName ?? teamLabel ?? "";
      const teamSuffix = playerName && teamLabel ? ` (${teamLabel})` : "";
      return {
        icon: "🟥",
        description: `Tarjeta roja para ${subject}${teamSuffix}`,
      };
    }
    case "cambio": {
      const data = (event.data ?? {}) as {
        in?: number;
        out?: number;
      };
      const playerIn =
        (data.in != null ? playerMap[data.in] : undefined) ??
        (playerName ? { nombre: playerName } : undefined);
      const playerOut = data.out != null ? playerMap[data.out] : undefined;
      const teamLabel = isOurTeam ? ourTeamName : rivalTeamName;
      return {
        icon: "🔁",
        description: `Cambio en ${teamLabel}: entra ${
          playerIn?.nombre ?? "jugador"
        }${playerOut ? `, sale ${playerOut.nombre}` : ""}`,
      };
    }
    default: {
      if (isOurTeam) {
        return {
          icon: "•",
          description: `${event.type} ${playerName ? `- ${playerName}` : ""}`,
        };
      }
      if (isRivalTeam) {
        return {
          icon: "•",
          description: `${event.type} rival ${
            playerName ? `- ${playerName}` : ""
          }`,
        };
      }
      return { icon: "•", description: event.type };
    }
  }
}

function sortLineupByMinutes(match: Match) {
  return [...match.lineup].sort((a, b) => b.minutes - a.minutes);
}

export default function MatchSummary({
  match,
  players,
  homeTeamName,
  awayTeamName,
  homeTeamColor,
  awayTeamColor,
}: Props) {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const score = resolveScore(match);
  const homeGoals = match.isHome ? score.team : score.rival;
  const awayGoals = match.isHome ? score.rival : score.team;
  const sortedLineup = sortLineupByMinutes(match);
  const timelineEvents = [...match.events].sort((a, b) => {
    if (a.minute === b.minute) {
      return a.id - b.id;
    }
    return a.minute - b.minute;
  });

  return (
    <div className="space-y-8 px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/dashboard/partidos">
              ← Volver al listado
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Link href={`/dashboard/partidos/${match.id}/edit`}>
              Editar partido
            </Link>
          </Button>
        </div>
      </div>

      <header className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="grid gap-4 p-4 sm:grid-cols-3 sm:items-center">
          <div
            className="rounded-md p-3 text-center sm:text-left"
            style={{ backgroundColor: homeTeamColor }}
          >
            <p className="text-sm font-medium text-white/80">Local</p>
            <p className="text-lg font-semibold text-white">{homeTeamName}</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-3xl font-bold tabular-nums">
              {homeGoals} - {awayGoals}
            </span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Resultado final
            </span>
          </div>
          <div
            className="rounded-md p-3 text-center sm:text-right"
            style={{ backgroundColor: awayTeamColor }}
          >
            <p className="text-sm font-medium text-white/80">Visitante</p>
            <p className="text-lg font-semibold text-white">{awayTeamName}</p>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cronología del partido</h2>
          <span className="text-xs text-muted-foreground">
            Cambios, tarjetas y goles en orden cronológico
          </span>
        </div>
        {timelineEvents.length === 0 ? (
          <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            No se registraron eventos en este partido.
          </p>
        ) : (
          <ol className="space-y-2">
            {timelineEvents.map((event) => {
              const { icon, description } = formatEvent(event, playerMap, {
                match,
                homeTeamName,
                awayTeamName,
              });
              return (
                <li
                  key={event.id}
                  className="flex items-start gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="mt-0.5 text-base">{icon}</span>
                  <div className="flex-1">
                    <p className="font-medium tabular-nums">
                      {event.minute}
                      <span aria-hidden="true">′</span>
                    </p>
                    <p className="text-muted-foreground">{description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Minutos jugados</h2>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Jugador</th>
                <th className="px-3 py-2">Rol</th>
                <th className="px-3 py-2 text-right">Minutos</th>
              </tr>
            </thead>
            <tbody>
              {sortedLineup.map((slot) => {
                if (!slot.playerId) return null;
                const player = playerMap[slot.playerId];
                if (!player) return null;
                const roleLabel =
                  slot.role === "field"
                    ? "Titular"
                    : slot.role === "bench"
                    ? "Suplente"
                    : "Desconvocado";
                return (
                  <tr key={slot.playerId} className="border-t">
                    <td className="px-3 py-2">{player.nombre}</td>
                    <td className="px-3 py-2 text-muted-foreground">{roleLabel}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {slot.minutes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Acciones posteriores</h2>
        <div className="flex flex-wrap gap-2">
          {match.lineup
            .filter((slot) => slot.playerId && slot.minutes > 0)
            .map((slot) => {
              const player = playerMap[slot.playerId as number];
              if (!player) return null;
              return (
                <Link
                  key={slot.playerId}
                  className="rounded-md border px-3 py-2 text-sm text-blue-600 transition hover:bg-blue-50"
                  href={`/dashboard/valoraciones?jugador=${slot.playerId}`}
                >
                  Valorar a {player.nombre}
                </Link>
              );
            })}
          <Button asChild className="ml-auto">
            <Link href="/dashboard/partidos">Volver al listado</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
