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
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  GK: { x: 50, y: 90 },
  LB: { x: 15, y: 70 },
  LCB: { x: 35, y: 70 },
  RCB: { x: 65, y: 70 },
  RB: { x: 85, y: 70 },
  LM: { x: 20, y: 50 },
  LCM: { x: 40, y: 50 },
  CM: { x: 50, y: 50 },
  RCM: { x: 60, y: 50 },
  RM: { x: 80, y: 50 },
  LW: { x: 25, y: 30 },
  LS: { x: 40, y: 30 },
  ST: { x: 50, y: 30 },
  RS: { x: 60, y: 30 },
  RW: { x: 75, y: 30 },
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
  homeTeamName: string;
  awayTeamName: string;
}

export default function MatchDetail({
  match,
  players,
  addEvent,
  deleteEvent,
  homeTeamName,
  awayTeamName,
}: MatchDetailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialLineup: LineupSlot[] = useMemo(() => {
    if (match.lineup.length) {
      return match.lineup.map((slot: PlayerSlot) => {
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

  const [lineup, setLineup] = useState<LineupSlot[]>(initialLineup);
  const [bench, setBench] = useState<Player[]>(() =>
    players.filter((p) => !initialLineup.some((l) => l.playerId === p.id))
  );

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

  const [draggingEvent, setDraggingEvent] = useState<string | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>(match.events);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

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

  async function quickAddEvent(playerId: number, type: string) {
    const fd = new FormData();
    fd.append("playerId", String(playerId));
    fd.append("type", type);
    fd.append("teamId", String(match.homeTeamId));
    fd.append("minute", String(Math.floor(seconds / 60)));
    const created = await addEvent(fd);
    setEvents((prev) => [...prev, created]);
    toast(`Evento ${type} añadido`);
  }

  async function addTeamGoal(side: "home" | "away") {
    const fd = new FormData();
    fd.append("type", "gol");
    fd.append("minute", String(Math.floor(seconds / 60)));
    fd.append(
      "teamId",
      String(side === "home" ? match.homeTeamId : match.awayTeamId)
    );
    const created = await addEvent(fd);
    setEvents((prev) => [...prev, created]);
    toast("Gol añadido");
  }

  async function undoLastEvent() {
    const last = events[events.length - 1];
    if (!last) return;
    await deleteEvent(last.id);
    setEvents((prev) => prev.slice(0, -1));
    toast("Último evento deshecho");
  }

  function handleFieldDrop(e: React.DragEvent) {
    e.preventDefault();
    const fromPos = e.dataTransfer.getData("fromPosition");
    if (fromPos) return; // player drop
    if (!draggingEvent) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const target = lineup.find((p) => {
      const px = (p.x / 100) * w;
      const py = (p.y / 100) * h;
      return Math.hypot(x - px, y - py) < 20 && p.playerId;
    });
    if (target && target.playerId) {
      quickAddEvent(target.playerId, draggingEvent);
    }
    setDraggingEvent(null);
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
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFieldDrop}
    >
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
                      onClick={() => quickAddEvent(player.id, type)}
                    >
                      {icon}
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
            )}
            {player && (
              <>
                <div className="mt-1 text-center text-xs w-20 -ml-10">
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

      <Drawer>
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between bg-gray-900 text-white px-4 py-2 select-none">
          <div className="flex items-center gap-2">
            <DrawerTrigger asChild>
              <Button size="sm" variant="secondary">
                Jugadores
              </Button>
            </DrawerTrigger>
            <span className="font-semibold">{homeTeamName}</span>
            <Button size="sm" onClick={() => addTeamGoal("home")}>
              Gol
            </Button>
            <span className="text-2xl font-bold">{homeGoals}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRunning(!running)}
            >
              {running ? "Pausar" : "Iniciar"}
            </Button>
            <span className="tabular-nums text-xl">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}
              :
              {String(seconds % 60).padStart(2, "0")}
            </span>
            <Button size="sm" variant="destructive" onClick={undoLastEvent}>
              Deshacer
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{awayGoals}</span>
            <Button size="sm" onClick={() => addTeamGoal("away")}>
              Gol
            </Button>
            <span className="font-semibold">{awayTeamName}</span>
          </div>
        </div>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Jugadores</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 grid grid-cols-2 gap-2">
            {bench.map((pl) => (
              <div
                key={pl.id}
                draggable
                onDragStart={(e) => handleBenchDragStart(pl.id, e)}
                className="text-sm cursor-grab rounded-md border p-2"
              >
                {pl.nombre}
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-6 text-3xl">
        {EVENT_ICONS.map(({ type, icon }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setDragImage(new Image(), 0, 0);
              setDraggingEvent(type);
            }}
            onDragEnd={() => setDraggingEvent(null)}
            className="cursor-grab"
          >
            {icon}
          </div>
        ))}
      </div>

      <Toaster />
    </div>
  );
}

