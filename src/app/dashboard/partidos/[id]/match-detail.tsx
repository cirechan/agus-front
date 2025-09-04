"use client";

import { useState, useEffect, useMemo } from "react";
import type { Match, PlayerSlot, MatchEvent } from "@/types/match";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  saveLineup: (formData: FormData) => Promise<void>;
  addEvent: (formData: FormData) => Promise<MatchEvent>;
  deleteEvent: (id: number) => Promise<void>;
  homeTeamName: string;
  awayTeamName: string;
}

export default function MatchDetail({
  match,
  players,
  saveLineup,
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
  const [notes, setNotes] = useState(match.opponentNotes ?? "");
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

  const starters = lineup.filter((p) => p.role === "field");
  const bench = lineup.filter((p) => p.role === "bench");
  const selectedIds = lineup.map((p) => p.playerId);
  const available = players.filter((p) => !selectedIds.includes(p.id));
  const usedPositions = starters.map((s) => s.position).filter(Boolean) as string[];

  function nextPosition(current: PlayerSlot[] = lineup): string | undefined {
    const used = current
      .filter((p) => p.role === "field" && p.position)
      .map((p) => p.position as string);
    return FORMATIONS[formation].find((pos) => !used.includes(pos));
  }

  function setRole(playerId: number, role: "field" | "bench") {
    setLineup((prev) => {
      const existing = prev.find((p) => p.playerId === playerId);
      if (existing) {
        if (role === "field") {
          const pos = existing.position ?? nextPosition(prev);
          const enterSecond = existing.enterSecond ?? seconds;
          return prev.map((p) =>
            p.playerId === playerId
              ? { ...p, role: "field", position: pos, enterSecond }
              : p
          );
        } else {
          const played =
            existing.role === "field"
              ? existing.minutes +
                Math.floor((seconds - (existing.enterSecond ?? 0)) / 60)
              : existing.minutes;
          return prev.map((p) =>
            p.playerId === playerId
              ? {
                  ...p,
                  role: "bench",
                  position: undefined,
                  minutes: played,
                  enterSecond: undefined,
                }
              : p
          );
        }
      }
      const pos = role === "field" ? nextPosition(prev) : undefined;
      return [
        ...prev,
        {
          playerId,
          role,
          minutes: 0,
          position: pos,
          enterSecond: role === "field" ? seconds : undefined,
        },
      ];
    });
  }

  function removePlayer(playerId: number) {
    setLineup((prev) => prev.filter((p) => p.playerId !== playerId));
  }

  function handleDragStart(id: number) {
    setDragging(id);
  }
  function handleDropField() {
    if (dragging != null) {
      setRole(dragging, "field");
      setDragging(null);
    }
  }
  function handleDropBench() {
    if (dragging != null) {
      setRole(dragging, "bench");
      setDragging(null);
    }
  }
  function handleDropAvailable() {
    if (dragging != null) {
      removePlayer(dragging);
      setDragging(null);
    }
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
        let next = prev.map((p): PlayerSlot => {
          if (p.position === position && p.role === "field") {
            const played =
              p.minutes + Math.floor((seconds - (p.enterSecond ?? 0)) / 60);
            return {
              ...p,
              role: "bench",
              position: undefined,
              minutes: played,
              enterSecond: undefined,
            };
          }
          return p;
        });
        const existing = next.find((p) => p.playerId === dragging);
        if (existing) {
          next = next.map((p): PlayerSlot =>
            p.playerId === dragging
              ? {
                  ...p,
                  role: "field",
                  position,
                  enterSecond: existing.enterSecond ?? seconds,
                }
              : p
          );
        } else {
          next.push({
            playerId: dragging,
            role: "field",
            position,
            minutes: 0,
            enterSecond: seconds,
          });
        }
        return next;
      });
      setDragging(null);
    }
  }

  function displayMinutes(p: PlayerSlot) {
    return p.role === "field"
      ? p.minutes + Math.floor((seconds - (p.enterSecond ?? 0)) / 60)
      : p.minutes;
  }

  function setPosition(playerId: number, position: string) {
    setLineup((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, position } : p))
    );
  }

  function changeFormation(f: string) {
    setFormation(f);
    setLineup((prev) => {
      const starters = prev.filter((p) => p.role === "field");
      const bench = prev.filter((p) => p.role === "bench");
      const positions = FORMATIONS[f];
      const reassigned = starters.map((p, idx) => ({ ...p, position: positions[idx] }));
      return [...reassigned, ...bench];
    });
  }

  function formatTime(total: number) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function handleSave() {
    const fd = new FormData();
    const sanitized = lineup.map(({ enterSecond, ...rest }) => ({
      ...rest,
      minutes:
        rest.role === "field"
          ? rest.minutes + Math.floor((seconds - (enterSecond ?? 0)) / 60)
          : rest.minutes,
    }));
    fd.append("lineup", JSON.stringify(sanitized));
    fd.append("opponentNotes", notes);
    saveLineup(fd);
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
    <div className="space-y-4 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold">Partido</h1>
      <div className="flex flex-wrap items-center justify-between gap-4">
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
      </div>
      <div className="w-32">
        <Select value={formation} onValueChange={changeFormation}>
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

      <div className="mx-auto flex w-full max-w-[600px] justify-center space-x-4">
        {EVENT_ICONS.map((e) => (
          <div
            key={e.type}
            draggable
            onDragStart={() => setDraggingEvent(e.type)}
            onDragEnd={() => setDraggingEvent(null)}
            className={`flex h-8 w-8 items-center justify-center rounded-full border bg-white cursor-grab ${draggingEvent === e.type ? "opacity-50 cursor-grabbing" : ""}`}
            title={EVENT_LABELS[e.type]}
          >
            {e.icon}
          </div>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-xs items-center justify-between rounded-md bg-gray-900 px-4 py-2 text-white md:max-w-md">
        <div className="flex flex-col items-center">
          <span className="text-xs md:text-sm">{homeTeamName}</span>
          <Button size="sm" variant="secondary" onClick={() => addTeamGoal("home")}>Gol</Button>
        </div>
        <div className="text-2xl font-bold md:text-3xl">
          {homeGoals} - {awayGoals}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs md:text-sm">{awayTeamName}</span>
          <Button size="sm" variant="secondary" onClick={() => addTeamGoal("away")}>Gol</Button>
        </div>
      </div>
      <div className="flex justify-center">
        <Button size="sm" variant="outline" onClick={undoLastEvent}>
          Deshacer último
        </Button>
      </div>

      <div className="relative mx-auto mt-4 h-[500px] w-full max-w-[600px] overflow-hidden rounded-lg bg-green-600">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_right,#15803d,#15803d_20px,#16a34a_20px,#16a34a_40px)]" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 rounded-lg border-2 border-white" />
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
                  onDragStart={() => handleDragStart(slot.playerId)}
                  onDragEnd={() => setDragging(null)}
                  className={`flex flex-col items-center cursor-grab ${dragging === slot.playerId ? "opacity-50 cursor-grabbing" : ""}`}
                >
                  <div className="relative">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-black text-sm font-bold text-white ${slot.position === "GK" ? GOALKEEPER_COLOR : PLAYER_COLOR}`}
                    >
                      {slot.number ?? ""}
                    </div>
                    <div className="absolute -top-1 -right-1">
                      {renderEventIcons(slot.playerId)}
                    </div>
                  </div>
                  <span className="mt-1 text-center text-xs text-white">
                    {player?.nombre}
                  </span>
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-white" />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card onDragOver={(e) => e.preventDefault()} onDrop={handleDropField}>
          <CardHeader>
            <CardTitle>Titulares</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {starters.map((s) => (
              <div
                key={s.playerId}
                className={`flex items-center justify-between cursor-grab ${dragging === s.playerId ? "opacity-50 cursor-grabbing" : ""}`}
                draggable
                onDragStart={() => handleDragStart(s.playerId)}
                onDragEnd={() => setDragging(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggingEvent) {
                    void quickAddEvent(s.playerId, draggingEvent);
                    setDraggingEvent(null);
                  }
                }}
              >
                <div className="flex w-28 items-center space-x-1 truncate">
                  <span className="truncate">
                    {players.find((p) => p.id === s.playerId)?.nombre}
                  </span>
                  {renderEventIcons(s.playerId)}
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={s.position}
                    onValueChange={(val) => setPosition(s.playerId, val)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Pos" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATIONS[formation].map((pos) => (
                        <SelectItem
                          key={pos}
                          value={pos}
                          disabled={
                            usedPositions.includes(pos) && pos !== s.position
                          }
                        >
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="w-16 text-center">{displayMinutes(s)}&apos;</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline">
                        Evento
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <form action={handleAddEvent} className="space-y-2">
                        <input
                          type="hidden"
                          name="playerId"
                          value={s.playerId}
                        />
                        <input type="hidden" name="teamId" value={match.homeTeamId} />
                        <Input
                          name="minute"
                          placeholder="Minuto"
                          type="number"
                          min="0"
                          defaultValue={Math.floor(seconds / 60)}
                        />
                        <select
                          name="type"
                          className="w-full rounded border p-1"
                        >
                          <option value="gol">Gol</option>
                          <option value="amarilla">Tarjeta amarilla</option>
                          <option value="roja">Tarjeta roja</option>
                          <option value="falta">Falta</option>
                          <option value="penalti">Penalti</option>
                        </select>
                        <Button type="submit" size="sm">
                          Guardar
                        </Button>
                      </form>
                    </PopoverContent>
                  </Popover>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removePlayer(s.playerId)}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card onDragOver={(e) => e.preventDefault()} onDrop={handleDropBench}>
          <CardHeader>
            <CardTitle>Suplentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bench.map((s) => (
              <div
                key={s.playerId}
                className={`flex items-center justify-between cursor-grab ${dragging === s.playerId ? "opacity-50 cursor-grabbing" : ""}`}
                draggable
                onDragStart={() => handleDragStart(s.playerId)}
                onDragEnd={() => setDragging(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggingEvent) {
                    void quickAddEvent(s.playerId, draggingEvent);
                    setDraggingEvent(null);
                  }
                }}
              >
                <div className="flex w-28 items-center space-x-1 truncate">
                  <span className="truncate">
                    {players.find((p) => p.id === s.playerId)?.nombre}
                  </span>
                  {renderEventIcons(s.playerId)}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-16 text-center">{displayMinutes(s)}&apos;</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline">
                        Evento
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <form action={handleAddEvent} className="space-y-2">
                        <input
                          type="hidden"
                          name="playerId"
                          value={s.playerId}
                        />
                        <input type="hidden" name="teamId" value={match.homeTeamId} />
                        <Input
                          name="minute"
                          placeholder="Minuto"
                          type="number"
                          min="0"
                          defaultValue={Math.floor(seconds / 60)}
                        />
                        <select
                          name="type"
                          className="w-full rounded border p-1"
                        >
                          <option value="gol">Gol</option>
                          <option value="amarilla">Tarjeta amarilla</option>
                          <option value="roja">Tarjeta roja</option>
                          <option value="falta">Falta</option>
                          <option value="penalti">Penalti</option>
                        </select>
                        <Button type="submit" size="sm">
                          Guardar
                        </Button>
                      </form>
                    </PopoverContent>
                  </Popover>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removePlayer(s.playerId)}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card onDragOver={(e) => e.preventDefault()} onDrop={handleDropAvailable}>
          <CardHeader>
            <CardTitle>Disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {available.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between cursor-grab ${dragging === p.id ? "opacity-50 cursor-grabbing" : ""}`}
                draggable
                onDragStart={() => handleDragStart(p.id)}
                onDragEnd={() => setDragging(null)}
              >
                <span className="w-28 truncate">{p.nombre}</span>
                <div className="space-x-2">
                  <Button size="sm" onClick={() => setRole(p.id, "field")}>
                    Titular
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setRole(p.id, "bench")}
                  >
                    Suplente
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave}>Guardar alineación</Button>

      <div className="mt-4">
        <h2 className="text-xl font-semibold">Eventos</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {events.map((e) => (
            <li key={e.id}>
              {e.minute}&apos; {EVENT_LABELS[e.type] ?? e.type}
              {e.playerId
                ? ` (${players.find((p) => p.id === e.playerId)?.nombre})`
                : e.teamId === match.awayTeamId
                ? " (rival)"
                : ""}
            </li>
          ))}
        </ul>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notas del rival</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones sobre el rival"
          />
        </CardContent>
      </Card>
    </div>
  );
}
