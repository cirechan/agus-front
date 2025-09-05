"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import type { Match, MatchEvent, PlayerSlot } from "@/types/match";
import { Button } from "@/components/ui/button";

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
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

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

    lineup.forEach((p) => {
      const px = (p.x / 100) * w;
      const py = (p.y / 100) * h;
      ctx.fillStyle = p.isGK ? GOALKEEPER_COLOR : PLAYER_COLOR;
      ctx.beginPath();
      ctx.arc(px, py, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.name.split(" ")[0], px, py - 28);

      let offset = 24;
      events
        .filter((e) => e.playerId === p.playerId)
        .forEach((e) => {
          const icon =
            e.type === "gol" ? "⚽" : e.type === "amarilla" ? "🟨" : "🟥";
          ctx.fillText(icon, px, py + offset);
          offset += 14;
        });
    });
  }, [lineup, events]);

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

  function handlePointerDown(
    e: React.PointerEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = canvas.width;
    const h = canvas.height;
    const found = lineup.find(
      (p) =>
        Math.hypot(x - (p.x / 100) * w, y - (p.y / 100) * h) < 20
    );
    if (found) {
      setDraggingPlayer(found.playerId);
      setOffset({
        x: x - (found.x / 100) * w,
        y: y - (found.y / 100) * h,
      });
    }
  }

  function handlePointerMove(
    e: React.PointerEvent<HTMLCanvasElement>
  ) {
    if (draggingPlayer == null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - offset.x;
    const y = e.clientY - rect.top - offset.y;
    const w = canvas.width;
    const h = canvas.height;
    setLineup((prev) =>
      prev.map((p) =>
        p.playerId === draggingPlayer
          ? { ...p, x: (x / w) * 100, y: (y / h) * 100 }
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
  }

  async function undoLastEvent() {
    const last = events[events.length - 1];
    if (!last) return;
    await deleteEvent(last.id);
    setEvents((prev) => prev.slice(0, -1));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!draggingEvent) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = canvas.width;
    const h = canvas.height;
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
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      {/* Scoreboard */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between bg-gray-900 text-white px-4 py-2 select-none">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">{homeTeamName}</span>
          <Button size="sm" onClick={() => addTeamGoal("home")}>Gol</Button>
          <span className="text-2xl font-bold">{homeGoals}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => setRunning(!running)}>
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
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold">{awayGoals}</span>
          <Button size="sm" onClick={() => addTeamGoal("away")}>Gol</Button>
          <span className="font-semibold">{awayTeamName}</span>
        </div>
      </div>

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
    </div>
  );
}

