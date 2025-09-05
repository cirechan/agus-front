"use client";

import { useState, useEffect, useMemo } from "react";
import type { Match, PlayerSlot, MatchEvent } from "@/types/match";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const FORMATIONS: Record<string, string[]> = {
  "4-4-2": [
    "GK",
    "LB",
    "LCB",
    "RCB",
    "RB",
    "LM",
    "LCM",
    "RCM",
    "RM",
    "LS",
    "RS",
  ],
  "4-3-3": [
    "GK",
    "LB",
    "LCB",
    "RCB",
    "RB",
    "LCM",
    "CM",
    "RCM",
    "LW",
    "ST",
    "RW",
  ],
};

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

const EVENT_LABELS: Record<string, string> = {
  gol: "Gol",
  amarilla: "Tarjeta amarilla",
  roja: "Tarjeta roja",
  falta: "Falta",
  penalti: "Penalti",
};

const EVENT_ICONS = [
  { type: "gol", icon: "⚽" },
  { type: "amarilla", icon: "🟨" },
  { type: "roja", icon: "🟥" },
];

const PLAYER_COLOR = "bg-blue-700";
const GOALKEEPER_COLOR = "bg-green-600";

interface Player {
  id: number;
  nombre: string;
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
  const [lineup, setLineup] = useState<PlayerSlot[]>(() =>
    match.lineup.map((p) => ({
      ...p,
      enterSecond: p.role === "field" ? 0 : undefined,
    }))
  );
  const [formation, setFormation] = useState<string>("4-4-2");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [added, setAdded] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>(match.events);
  const [draggingEvent, setDraggingEvent] = useState<string | null>(null);

  const eventsByPlayer = useMemo(() => {
    const map: Record<number, string[]> = {};
    events.forEach((e) => {
      if (e.playerId != null) {
        map[e.playerId] = map[e.playerId] || [];
        map[e.playerId].push(e.type);
      }
    });
    return map;
  }, [events]);

  async function handleAddEvent(formData: FormData) {
    const created = await addEvent(formData);
    setEvents((prev) => [...prev, created]);
  }

  async function quickAddEvent(playerId: number, type: string) {
    const fd = new FormData();
    fd.append("playerId", String(playerId));
    fd.append("type", type);
    fd.append("teamId", String(match.homeTeamId));
    fd.append("minute", String(Math.floor(seconds / 60)));
    await handleAddEvent(fd);
  }

  async function addTeamGoal(side: "home" | "away") {
    const fd = new FormData();
    fd.append("type", "gol");
    fd.append("minute", String(Math.floor(seconds / 60)));
    fd.append(
      "teamId",
      String(side === "home" ? match.homeTeamId : match.awayTeamId)
    );
    await handleAddEvent(fd);
  }

  async function undoLastEvent() {
    const last = events[events.length - 1];
    if (!last) return;
    await deleteEvent(last.id);
    setEvents((prev) => prev.slice(0, -1));
  }

  function renderEventIcons(playerId: number) {
    const playerEvents = eventsByPlayer[playerId];
    if (!playerEvents) return null;
    const icons: JSX.Element[] = [];
    const yellows = playerEvents.filter((e) => e === "amarilla").length;
    const reds = playerEvents.filter((e) => e === "roja").length;
    const goals = playerEvents.filter((e) => e === "gol").length;
    for (let i = 0; i < yellows; i++)
      icons.push(<span key={`y${i}`} className="text-yellow-500">🟨</span>);
    for (let i = 0; i < reds; i++)
      icons.push(<span key={`r${i}`} className="text-red-600">🟥</span>);
    for (let i = 0; i < goals; i++) icons.push(<span key={`g${i}`}>⚽</span>);
    return <div className="flex space-x-0.5">{icons}</div>;
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  function handleDragStart(e: React.DragEvent, id: number) {
    e.dataTransfer.setDragImage(new Image(), 0, 0);
    setDragging(id);
  }

  function handleDropPosition(position: string, playerAtPos?: number) {
    if (draggingEvent) {
      if (playerAtPos != null) {
        void quickAddEvent(playerAtPos, draggingEvent);
      }
      setDraggingEvent(null);
      return;
    }
    if (dragging != null) {
      setLineup((prev) => {
        const currentPos = prev.find((p) => p.playerId === dragging)?.position;
        return prev.map((p) => {
          if (p.playerId === dragging) return { ...p, position };
          if (p.playerId === playerAtPos) return { ...p, position: currentPos };
          return p;
        });
      });
      setDragging(null);
    }
  }

  function formatTime(total: number) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

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

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex flex-none flex-col items-center space-y-4 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-3xl">{formatTime(seconds)}</span>
            {added > 0 && (
              <span className="font-mono text-xl text-red-600">+{added}&apos;</span>
            )}
          </div>
          <Button size="sm" onClick={() => setRunning((r) => !r)}>
            {running ? "Pausar" : "Iniciar"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAdded((a) => a + 1)}
          >
            +1&apos;
          </Button>
          <div className="w-32">
            <Select value={formation} onValueChange={setFormation}>
              <SelectTrigger>
                <SelectValue placeholder="Formación" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(FORMATIONS).map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          {EVENT_ICONS.map((e) => (
            <div
              key={e.type}
              draggable
              onDragStart={(ev) => {
                ev.dataTransfer.setDragImage(new Image(), 0, 0);
                setDraggingEvent(e.type);
              }}
              onDragEnd={() => setDraggingEvent(null)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border bg-white text-xl cursor-grab ${
                draggingEvent === e.type ? "opacity-50 cursor-grabbing" : ""
              }`}
              title={EVENT_LABELS[e.type]}
            >
              {e.icon}
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-4 rounded-md bg-gray-900 px-4 py-2 text-white">
          <div className="flex flex-col items-center">
            <span className="text-xs md:text-sm">{homeTeamName}</span>
            <Button size="sm" variant="secondary" onClick={() => addTeamGoal("home")}>
              Gol
            </Button>
          </div>
          <div className="text-2xl font-bold md:text-3xl">
            {homeGoals} - {awayGoals}
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs md:text-sm">{awayTeamName}</span>
            <Button size="sm" variant="secondary" onClick={() => addTeamGoal("away")}>
              Gol
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={undoLastEvent}
            className="ml-4"
          >
            Deshacer
          </Button>
        </div>
      </div>

      <div className="relative flex-grow overflow-hidden bg-green-600">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_right,#15803d,#15803d_20px,#16a34a_20px,#16a34a_40px)]" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 border-2 border-white" />
          <div className="absolute left-1/2 top-0 h-full w-px -ml-px bg-white" />
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -ml-12 -mt-12 rounded-full border-2 border-white" />
          <div className="absolute left-1/2 -ml-32 top-0 h-20 w-64 border-2 border-white border-t-0" />
          <div className="absolute left-1/2 -ml-32 bottom-0 h-20 w-64 border-2 border-white border-b-0" />
        </div>
        {FORMATIONS[formation].map((pos) => {
          const slot = lineup.find(
            (p) => p.role === "field" && p.position === pos
          );
          const coords = POSITION_COORDS[pos];
          const player = slot
            ? players.find((p) => p.id === slot.playerId)
            : null;
          return (
            <div
              key={pos}
              className="absolute z-10 flex flex-col items-center"
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropPosition(pos, slot?.playerId)}
            >
              {slot ? (
                <div
                  draggable
                  onDragStart={(ev) => handleDragStart(ev, slot.playerId)}
                  onDragEnd={() => setDragging(null)}
                  className={`flex flex-col items-center cursor-grab ${
                    dragging === slot.playerId ? "opacity-50 cursor-grabbing" : ""
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-black text-sm font-bold text-white ${
                        slot.position === "GK" ? GOALKEEPER_COLOR : PLAYER_COLOR
                      }`}
                    >
                      {slot.number ?? ""}
                    </div>
                    <div className="absolute -top-1 -right-1">
                      {renderEventIcons(slot.playerId)}
                    </div>
                  </div>
                  <span className="mt-1 w-20 text-center text-xs text-white">
                    {player?.nombre}
                  </span>
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
