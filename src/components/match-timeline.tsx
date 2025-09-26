"use client";

import type { MatchEvent } from "@/types/match";
import type { ReactNode } from "react";
import { Goal, Square } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PlayerMap {
  [id: number]: { id: number; nombre: string };
}

const EVENT_CONFIG: Record<string, { icon: ReactNode; label: string }> = {
  gol: {
    icon: <Goal className="h-4 w-4 text-green-600" />,
    label: "Gol",
  },
  amarilla: {
    icon: (
      <Square className="h-4 w-4 fill-yellow-400 stroke-yellow-400" />
    ),
    label: "Amarilla",
  },
  roja: {
    icon: <Square className="h-4 w-4 fill-red-500 stroke-red-500" />,
    label: "Roja",
  },
};

interface MatchTimelineProps {
  events: MatchEvent[];
  players: PlayerMap;
  /** Optional base duration to scale the timeline. Defaults to 90 minutes. */
  duration?: number;
  /** Team ID to determine if an event belongs to our team. */
  teamId?: number;
}

export function MatchTimeline({
  events,
  players,
  duration = 90,
  teamId,
}: MatchTimelineProps) {
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
      <TooltipProvider>
        {events.map((e) => {
          const config = EVENT_CONFIG[e.type] || {
            icon: <Square className="h-3 w-3" />, // fallback dot
            label: e.type,
          };
          const left = (e.minute / maxMinute) * 100;
          const playerName = e.playerId ? players[e.playerId]?.nombre : null;
          const title = `${e.minute}' ${config.label}${
            playerName ? ` - ${playerName}` : ""
          }`;
          const ours = teamId ? e.teamId === teamId : true;
          return (
            <Tooltip key={e.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "absolute",
                    ours ? "-translate-y-full top-1/2" : "top-1/2"
                  )}
                  style={{ left: `${left}%` }}
                >
                  <span className="block -translate-x-1/2">
                    <span
                      className="relative flex flex-col items-center"
                    >
                      {ours && (
                        <span className="mb-1 h-4 w-px bg-border" />
                      )}
                      {config.icon}
                      {!ours && (
                        <span className="mt-1 h-4 w-px bg-border" />
                      )}
                    </span>
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{title}</TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}

