"use client";

import type { MatchEvent } from "@/types/match";

interface PlayerMap {
  [id: number]: { id: number; nombre: string };
}

const EVENT_ICONS: Record<string, { icon: string; label: string }> = {
  gol: { icon: "⚽", label: "Gol" },
  amarilla: { icon: "🟨", label: "Amarilla" },
  roja: { icon: "🟥", label: "Roja" },
};

interface MatchTimelineProps {
  events: MatchEvent[];
  players: PlayerMap;
  /** Optional base duration to scale the timeline. Defaults to 90 minutes. */
  duration?: number;
}

export function MatchTimeline({ events, players, duration = 90 }: MatchTimelineProps) {
  const maxMinute = Math.max(duration, ...events.map((e) => e.minute));

  return (
    <div className="relative h-24 w-full">
      {/* Base line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
      {/* Ticks */}
      {[0, Math.min(45, maxMinute), maxMinute].map((m) => (
        <div
          key={m}
          className="absolute top-1/2 text-xs text-muted-foreground"
          style={{
            left: `${(m / maxMinute) * 100}%`,
            transform: "translate(-50%, 0.5rem)",
          }}
        >
          {m}&apos;
        </div>
      ))}
      {/* Events */}
      {events.map((e) => {
        const config = EVENT_ICONS[e.type] || { icon: "•", label: e.type };
        const left = (e.minute / maxMinute) * 100;
        const playerName = e.playerId ? players[e.playerId]?.nombre : null;
        const title = `${e.minute}' ${config.label}${
          playerName ? ` - ${playerName}` : ""
        }`;
        return (
          <div
            key={e.id}
            className="absolute top-1/2"
            style={{ left: `${left}%` }}
          >
            <span
              title={title}
              className="relative -translate-x-1/2 -translate-y-full text-xl"
            >
              {config.icon}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default MatchTimeline;
