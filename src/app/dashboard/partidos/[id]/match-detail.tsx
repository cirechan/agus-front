"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
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

const PLAYER_COLOR = "#1d4ed8"; // blue-700
const GOALKEEPER_COLOR = "#16a34a"; // green-600

interface Player {
  id: number;
  nombre: string;
}

interface CanvasPlayer {
  playerId: number;
  name: string;
  x: number; // percentage
  y: number; // percentage
  isGK: boolean;
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
  const [lineup, setLineup] = useState<CanvasPlayer[]>(() =>
    match.lineup.map((slot: PlayerSlot) => {
      const coords =
        slot.position && POSITION_COORDS[slot.position]
          ? POSITION_COORDS[slot.position]
          : { x: 50, y: 50 };
      const name =
        players.find((p) => p.id === slot.playerId)?.nombre || String(slot.playerId);
      return {
        playerId: slot.playerId,
        name,
        x: coords.x,
        y: coords.y,
        isGK: slot.position === "GK",
      };
    })
  );
  const [draggingPlayer, setDraggingPlayer] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
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

    // grass
    for (let i = 0; i < w; i += 80) {
      ctx.fillStyle = i % 160 === 0 ? "#15803d" : "#166534";
      ctx.fillRect(i, 0, 80, h);
    }

    // outer lines
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, w - 80, h - 80);
    // mid line
    ctx.beginPath();
    ctx.moveTo(w / 2, 40);
    ctx.lineTo(w / 2, h - 40);
    ctx.stroke();
    // center circle
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 60, 0, Math.PI * 2);
    ctx.stroke();
    // penalty areas
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

  function handlePlayerPointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    id: number
  ) {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const player = lineup.find((p) => p.playerId === id);
    if (!player) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDraggingPlayer(id);
    setOffset({
      x: x - (player.x / 100) * rect.width,
      y: y - (player.y / 100) * rect.height,
    });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (draggingPlayer == null) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - offset.x;
    const y = e.clientY - rect.top - offset.y;
    setLineup((prev) =>
      prev.map((p) =>
        p.playerId === draggingPlayer
          ? {
              ...p,
              x: (x / rect.width) * 100,
              y: (y / rect.height) * 100,
            }
          : p
      )
    );
  }

  function handlePointerUp() {
    setDraggingPlayer(null);
  }

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

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!draggingEvent) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const target = lineup.find(
      (p) =>
        Math.hypot(x - (p.x / 100) * w, y - (p.y / 100) * h) < 20
    );
    if (target) {
      await quickAddEvent(target.playerId, draggingEvent);
    }
    setDraggingEvent(null);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <canvas ref={canvasRef} className="w-full h-full touch-none" />

      {lineup.map((p) => (
        <div
          key={p.playerId}
          className="absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <Popover>
            <PopoverTrigger asChild>
              <div
                onPointerDown={(e) => handlePlayerPointerDown(e, p.playerId)}
                className="w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center text-white border-2 cursor-pointer select-none"
                style={{
                  backgroundColor: p.isGK ? GOALKEEPER_COLOR : PLAYER_COLOR,
                }}
              >
                {p.name.split(" ")[0]}
              </div>
            </PopoverTrigger>
            <PopoverContent className="flex gap-2" side="top">
              {EVENT_ICONS.map(({ type, icon }) => (
                <Button
                  key={type}
                  size="icon"
                  variant="ghost"
                  onClick={() => quickAddEvent(p.playerId, type)}
                >
                  {icon}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
          <div className="flex justify-center mt-1 space-x-1 text-lg">
            {events
              .filter((e) => e.playerId === p.playerId)
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
        </div>
      ))}

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
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
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
            {players.map((pl) => (
              <div key={pl.id} className="text-sm">
                {pl.nombre}
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Event toolbar */}
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

