"use client";

import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { Match, MatchEvent, PlayerSlot } from "@/types/match";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  GK: { x: 10, y: 50 },
  LB: { x: 30, y: 25 },
  LCB: { x: 30, y: 40 },
  RCB: { x: 30, y: 60 },
  RB: { x: 30, y: 75 },
  LM: { x: 50, y: 30 },
  LCM: { x: 50, y: 40 },
  CM: { x: 50, y: 50 },
  RCM: { x: 50, y: 60 },
  RM: { x: 50, y: 70 },
  LW: { x: 70, y: 25 },
  LS: { x: 70, y: 40 },
  ST: { x: 70, y: 50 },
  RS: { x: 70, y: 60 },
  RW: { x: 70, y: 75 },
};

const EVENT_ICONS = [
  { type: "gol", icon: "⚽" },
  { type: "amarilla", icon: "🟨" },
  { type: "roja", icon: "🟥" },
];

const PLAYER_COLOR = "#dc2626"; // red-600
const GOALKEEPER_COLOR = "#16a34a"; // green-600

const DEFAULT_FORMATION = [
  "GK",
  "LB",
  "LCB",
  "RCB",
  "RB",
  "LM",
  "CM",
  "RM",
  "LW",
  "ST",
  "RW",
];

interface Player {
  id: number;
  nombre: string;
  dorsal?: number | null;
}

interface LineupSlot {
  position: string;
  x: number;
  y: number;
  playerId: number | null;
}

interface MatchDetailProps {
  match: Match;
  players: Player[];
  addEvent: (formData: FormData) => Promise<MatchEvent>;
  deleteEvent: (id: number) => Promise<void>;
  saveLineup: (lineup: PlayerSlot[]) => Promise<void>;
  homeTeamName: string;
  awayTeamName: string;
}

export default function MatchDetail({
  match,
  players,
  addEvent,
  deleteEvent,
  saveLineup,
  homeTeamName,
  awayTeamName,
}: MatchDetailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const initialLineup: LineupSlot[] = useMemo(() => {
    if (match.lineup.length) {
      return match.lineup
        .filter((slot) => slot.role === "field")
        .map((slot: PlayerSlot) => {
          const coords =
            slot.position && POSITION_COORDS[slot.position]
              ? POSITION_COORDS[slot.position]
              : { x: 50, y: 50 };
          return {
            position: slot.position || "",
            x: coords.x,
            y: coords.y,
            playerId: slot.playerId,
          };
        });
    }
    return DEFAULT_FORMATION.map((pos, idx) => {
      const coords = POSITION_COORDS[pos];
      return {
        position: pos,
        x: coords.x,
        y: coords.y,
        playerId: players[idx] ? players[idx].id : null,
      };
    });
  }, [match.lineup, players]);

  const playerMap = useMemo(() => {
    const map: Record<number, Player> = {};
    players.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [players]);

  const benchInitial = useMemo(() => {
    if (match.lineup.length) {
      return match.lineup
        .filter((slot) => slot.role === "bench")
        .map((slot) => playerMap[slot.playerId])
        .filter(Boolean) as Player[];
    }
    return players.slice(initialLineup.length);
  }, [match.lineup, players, playerMap, initialLineup.length]);

  const initialBenchPositions = useMemo(() => {
    const map: Record<number, string | undefined> = {};
    match.lineup
      .filter((slot) => slot.role === "bench")
      .forEach((slot) => {
        map[slot.playerId] = slot.position;
      });
    return map;
  }, [match.lineup]);

  const [lineup, setLineup] = useState<LineupSlot[]>(initialLineup);
  const [bench, setBench] = useState<Player[]>(benchInitial);
  const [benchPositions, setBenchPositions] = useState<
    Record<number, string | undefined>
  >(initialBenchPositions);
  const [subbedOut, setSubbedOut] = useState<number[]>([]);

  const initialStats = useMemo(() => {
    const stats: Record<number, { minutes: number; enterSecond?: number }> = {};
    players.forEach((p) => {
      const isStarter = initialLineup.some((l) => l.playerId === p.id);
      stats[p.id] = { minutes: 0, ...(isStarter ? { enterSecond: 0 } : {}) };
    });
    return stats;
  }, [players, initialLineup]);
  const [playerStats, setPlayerStats] = useState(
    initialStats
  );

  const [events, setEvents] = useState<MatchEvent[]>(match.events);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [half, setHalf] = useState(1);
  const [subsMade, setSubsMade] = useState(0);

  const homeGoals = useMemo(
    () =>
      events.filter(
        (e) => e.type === "gol" && e.teamId === match.homeTeamId
      ).length,
    [events, match.homeTeamId]
  );
  const awayGoals = useMemo(
    () =>
      events.filter(
        (e) => e.type === "gol" && e.teamId === match.awayTeamId
      ).length,
    [events, match.awayTeamId]
  );

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const w = canvas.width;
    const h = canvas.height;

    for (let i = 0; i < w; i += 80) {
      ctx.fillStyle = i % 160 === 0 ? "#15803d" : "#166534";
      ctx.fillRect(i, 0, 80, h);
    }

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, w - 80, h - 80);
    ctx.beginPath();
    ctx.moveTo(w / 2, 40);
    ctx.lineTo(w / 2, h - 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(40, h / 2 - 100, 120, 200);
    ctx.strokeRect(w - 160, h / 2 - 100, 120, 200);
  }, []);

  useEffect(() => {
    paint();
  }, [paint]);

  useEffect(() => {
    function onResize() {
      paint();
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, [paint]);

  async function quickAddEvent({
    playerId,
    type,
    teamId,
  }: {
    playerId?: number;
    type: string;
    teamId?: number;
  }) {
    const fd = new FormData();
    if (playerId) fd.append("playerId", String(playerId));
    fd.append("type", type);
    if (teamId) fd.append("teamId", String(teamId));
    fd.append("minute", String(Math.floor(seconds / 60)));
    const created = await addEvent(fd);
    setEvents((prev) => [...prev, created]);
    toast(`Evento ${type} añadido`);
  }

  async function undoLastEvent() {
    const last = events[events.length - 1];
    if (!last) return;
    await deleteEvent(last.id);
    setEvents((prev) => prev.slice(0, -1));
    toast("Último evento deshecho");
  }

  async function removeEventById(id: number) {
    await deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast("Evento eliminado");
  }

  function toggleRunning() {
    if (running) {
      setPlayerStats((prev) => {
        const stats = { ...prev };
        lineup.forEach((slot) => {
          const pid = slot.playerId;
          if (pid && stats[pid]?.enterSecond != null) {
            stats[pid].minutes += seconds - (stats[pid].enterSecond as number);
            delete stats[pid].enterSecond;
          }
        });
        return stats;
      });
      setRunning(false);
    } else {
      setPlayerStats((prev) => {
        const stats = { ...prev };
        lineup.forEach((slot) => {
          const pid = slot.playerId;
          if (pid) {
            stats[pid] = { ...stats[pid], enterSecond: seconds };
          }
        });
        return stats;
      });
      setRunning(true);
    }
  }

  async function handleFinish() {
    const stats = { ...playerStats };
    lineup.forEach((slot) => {
      const pid = slot.playerId;
      if (pid && stats[pid]?.enterSecond != null) {
        stats[pid].minutes += seconds - (stats[pid].enterSecond as number);
        delete stats[pid].enterSecond;
      }
    });
    const lineupPayload: PlayerSlot[] = [
      ...lineup
        .filter((s) => s.playerId)
        .map((s) => ({
          playerId: s.playerId as number,
          number: playerMap[s.playerId as number]?.dorsal ?? undefined,
          role: "field" as const,
          position: s.position,
          minutes: stats[s.playerId as number]?.minutes ?? 0,
        })),
      ...bench.map((p) => ({
        playerId: p.id,
        number: p.dorsal ?? undefined,
        role: "bench" as const,
        position: benchPositions[p.id],
        minutes: stats[p.id]?.minutes ?? 0,
      })),
    ];
    await saveLineup(lineupPayload);
    router.push(`/dashboard/partidos/${match.id}/final`);
  }

  function handlePlayerDragStart(
    position: string,
    playerId: number,
    e: React.DragEvent
  ) {
    e.dataTransfer.setData("playerId", String(playerId));
    e.dataTransfer.setData("fromPosition", position);
    e.dataTransfer.setDragImage(new Image(), 0, 0);
  }

  function handleBenchDragStart(playerId: number, e: React.DragEvent) {
    e.dataTransfer.setData("playerId", String(playerId));
    e.dataTransfer.setData("fromPosition", "bench");
    e.dataTransfer.setDragImage(new Image(), 0, 0);
  }

  function substitute(playerInId: number, targetPos: string) {
    const outgoingId = lineup.find((s) => s.position === targetPos)?.playerId;
    setLineup((prev) =>
      prev.map((s) =>
        s.position === targetPos ? { ...s, playerId: playerInId } : s
      )
    );
    setBench((prev) => {
      const filtered = prev.filter((p) => p.id !== playerInId);
      return outgoingId && playerMap[outgoingId]
        ? [...filtered, playerMap[outgoingId]]
        : filtered;
    });
    setBenchPositions((prev) => {
      const map = { ...prev };
      delete map[playerInId];
      if (outgoingId) {
        map[outgoingId] = targetPos;
      }
      return map;
    });
    setPlayerStats((prev) => {
      const stats = { ...prev };
      if (outgoingId && stats[outgoingId]?.enterSecond != null) {
        stats[outgoingId].minutes +=
          seconds - (stats[outgoingId].enterSecond as number);
        delete stats[outgoingId].enterSecond;
      }
      stats[playerInId] = {
        ...stats[playerInId],
        enterSecond: seconds,
      };
      return stats;
    });
    if (outgoingId) {
      setSubbedOut((prev) => [...prev, outgoingId]);
    }
    setSubsMade((c) => c + 1);
  }

  function swapPlayers(fromPos: string, toPos: string) {
    setLineup((prev) => {
      const arr = [...prev];
      const i1 = arr.findIndex((s) => s.position === fromPos);
      const i2 = arr.findIndex((s) => s.position === toPos);
      if (i1 === -1 || i2 === -1) return prev;
      const temp = arr[i1].playerId;
      arr[i1].playerId = arr[i2].playerId;
      arr[i2].playerId = temp;
      return arr;
    });
  }

  function handleSlotDrop(position: string, e: React.DragEvent) {
    e.preventDefault();
    const fromPos = e.dataTransfer.getData("fromPosition");
    const playerIdStr = e.dataTransfer.getData("playerId");
    if (!playerIdStr) return;
    const playerId = Number(playerIdStr);
    if (fromPos === "bench") {
      substitute(playerId, position);
    } else if (fromPos && fromPos !== position) {
      swapPlayers(fromPos, position);
    }
  }

  return (
    <div className="flex w-full h-full">
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-gray-900 text-white select-none flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{homeTeamName}</span>
            <Button size="sm" onClick={() => quickAddEvent({ type: "gol", teamId: match.homeTeamId })}>
              Gol
            </Button>
            <span className="text-2xl font-bold">{homeGoals}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={toggleRunning}>
              {running ? "Pausar" : "Iniciar"}
            </Button>
            <span className="tabular-nums text-xl">
              {String(Math.floor(seconds / 60) + (half - 1) * 40).padStart(2, "0")}
              :{String(seconds % 60).padStart(2, "0")}
            </span>
            {half === 1 && !running && (
              <Button size="sm" onClick={() => { setHalf(2); setSeconds(0); }}>
                2ª Parte
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="secondary">Eventos</Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 max-h-48 overflow-y-auto" side="bottom">
                <ul className="space-y-1 text-sm">
                  {events.map((e) => (
                    <li key={e.id} className="flex items-center justify-between">
                      <span>
                        {e.minute}&apos; {e.playerId ? playerMap[e.playerId]?.nombre + " " : ""}
                        {e.type}
                      </span>
                      <Button size="icon" variant="ghost" onClick={() => removeEventById(e.id)}>
                        ×
                      </Button>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
            <Button size="sm" variant="destructive" onClick={undoLastEvent}>
              Deshacer
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/dashboard/partidos/${match.id}/config`}>Configurar</Link>
            </Button>
            {half === 2 && !running && (
              <Button size="sm" variant="secondary" onClick={handleFinish}>
                Finalizar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{awayGoals}</span>
            <Button size="sm" onClick={() => quickAddEvent({ type: "gol", teamId: match.awayTeamId })}>
              Gol
            </Button>
            <span className="font-semibold">{awayTeamName}</span>
          </div>
        </div>

        <div ref={containerRef} className="relative flex-1">
          <canvas ref={canvasRef} className="w-full h-full touch-none" />

          {lineup.map((slot) => {
            const player = slot.playerId ? playerMap[slot.playerId] : null;
            return (
              <div
                key={slot.position}
                className="absolute"
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleSlotDrop(slot.position, e)}
              >
                {player && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        draggable
                        onDragStart={(e) =>
                          handlePlayerDragStart(slot.position, player.id, e)
                        }
                        className="w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center text-white border-2 cursor-grab select-none"
                        style={{
                          backgroundColor:
                            slot.position === "GK"
                              ? GOALKEEPER_COLOR
                              : PLAYER_COLOR,
                        }}
                      >
                        {player.dorsal ?? ""}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="flex gap-2" side="top">
                      {EVENT_ICONS.map(({ type, icon }) => (
                        <Button
                          key={type}
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            quickAddEvent({
                              playerId: player.id,
                              type,
                              teamId: match.homeTeamId,
                            })
                          }
                        >
                          {icon}
                        </Button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
                {player && (
                  <>
                    <div className="mt-1 text-center text-xs w-20 -ml-10 text-white">
                      {player.nombre}
                    </div>
                    <div className="flex justify-center mt-1 space-x-1 text-lg -ml-5">
                      {events
                        .filter((e) => e.playerId === player.id)
                        .map((e) => (
                          <span key={e.id}>
                            {e.type === "gol"
                              ? "⚽"
                              : e.type === "amarilla"
                              ? "🟨"
                              : "🟥"}
                          </span>
                        ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-32 bg-black/60 text-white p-2 overflow-y-auto">
        <div className="text-xs text-right mb-2">{subsMade}/5</div>
        <div className="flex flex-col gap-4 items-center">
          {bench.map((pl) => (
            <div
              key={pl.id}
              className={`flex flex-col items-center ${subbedOut.includes(pl.id) ? "opacity-50" : ""}`}
            >
              <div
                draggable
                onDragStart={(e) => handleBenchDragStart(pl.id, e)}
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 cursor-grab"
                style={{
                  backgroundColor:
                    benchPositions[pl.id] === "GK"
                      ? GOALKEEPER_COLOR
                      : PLAYER_COLOR,
                  color: "white",
                }}
              >
                {pl.dorsal ?? ""}
              </div>
              <span className="mt-1 text-xs text-white text-center w-full">
                {pl.nombre}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Toaster />
    </div>
  );
}

