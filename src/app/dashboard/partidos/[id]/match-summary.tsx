"use client";

import type { Match } from "@/types/match";
import { MatchTimeline } from "@/components/match-timeline";
import { Progress } from "@/components/ui/progress";

interface Player {
  id: number;
  nombre: string;
}

interface Props {
  match: Match;
  players: Player[];
}

export default function MatchSummary({ match, players }: Props) {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const maxMinutes = Math.max(90, ...match.lineup.map((l) => l.minutes));
  return (
    <div className="space-y-6 p-4">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <MatchTimeline events={match.events} players={playerMap} />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Minutos jugados</h2>
        <ul className="space-y-3">
          {match.lineup.map((slot) => {
            const player = slot.playerId ? playerMap[slot.playerId] : null;
            if (!player) return null;
            return (
              <li key={slot.playerId}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{player.nombre}</span>
                  <span>{slot.minutes}&apos;</span>
                </div>
                <Progress
                  value={(slot.minutes / maxMinutes) * 100}
                  className="h-2"
                />
              </li>
            );
          })}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Valoraciones</h2>
        <ul className="space-y-1">
          {match.lineup
            .filter((l) => l.playerId && l.minutes > 0)
            .map((l) => {
              const p = playerMap[l.playerId as number];
              return (
                <li key={l.playerId}>
                  <a
                    className="text-blue-600 underline"
                    href={`/dashboard/valoraciones?jugador=${l.playerId}`}
                  >
                    Valorar a {p?.nombre}
                  </a>
                </li>
              );
            })}
        </ul>
      </section>
    </div>
  );
}
