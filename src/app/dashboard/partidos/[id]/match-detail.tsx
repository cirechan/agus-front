"use client";

import { useState, useEffect } from "react";
import type { Match, PlayerSlot } from "@/types/match";
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

interface Player {
  id: number;
  nombre: string;
}

interface MatchDetailProps {
  match: Match;
  players: Player[];
  saveLineup: (formData: FormData) => Promise<void>;
  addEvent: (formData: FormData) => Promise<void>;
}

export default function MatchDetail({ match, players, saveLineup, addEvent }: MatchDetailProps) {
  const [lineup, setLineup] = useState<PlayerSlot[]>(match.lineup);
  const [notes, setNotes] = useState(match.opponentNotes ?? "");
  const [formation, setFormation] = useState<string>("4-4-2");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [added, setAdded] = useState(0);

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
        return prev.map((p) =>
          p.playerId === playerId
            ? {
                ...p,
                role,
                position: role === "field" ? p.position ?? nextPosition(prev) : undefined,
              }
            : p
        );
      }
      const pos = role === "field" ? nextPosition(prev) : undefined;
      return [...prev, { playerId, role, minutes: 0, position: pos }];
    });
  }

  function removePlayer(playerId: number) {
    setLineup((prev) => prev.filter((p) => p.playerId !== playerId));
  }

  function setMinutes(playerId: number, minutes: number) {
    setLineup((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, minutes } : p))
    );
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
    fd.append("lineup", JSON.stringify(lineup));
    fd.append("opponentNotes", notes);
    saveLineup(fd);
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold">Partido</h1>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-lg">
            {formatTime(seconds)} +{added}&apos;
          </span>
          <Button size="sm" onClick={() => setRunning((r) => !r)}>
            {running ? "Pausar" : "Iniciar"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAdded((a) => a + 1)}
          >
            Añadir minuto
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

      <div className="relative mx-auto mt-4 h-[500px] w-full max-w-[600px] rounded-lg bg-green-700">
        {starters.map((s) => {
          if (!s.position) return null;
          const coords = POSITION_COORDS[s.position];
          const player = players.find((p) => p.id === s.playerId);
          return (
            <div
              key={s.playerId}
              className="absolute flex flex-col items-center"
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white text-sm font-bold">
                {s.number ?? ""}
              </div>
              <span className="mt-1 text-xs text-white text-center">
                {player?.nombre}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Titulares</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {starters.map((s) => (
              <div key={s.playerId} className="flex items-center justify-between">
                <span className="w-28 truncate">
                  {players.find((p) => p.id === s.playerId)?.nombre}
                </span>
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
                  <Input
                    type="number"
                    className="w-16"
                    value={s.minutes}
                    min={0}
                    onChange={(e) => setMinutes(s.playerId, Number(e.target.value))}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline">
                        Evento
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <form action={addEvent} className="space-y-2">
                        <input
                          type="hidden"
                          name="playerId"
                          value={s.playerId}
                        />
                        <Input
                          name="minute"
                          placeholder="Minuto"
                          type="number"
                          min="0"
                        />
                        <select
                          name="type"
                          className="w-full rounded border p-1"
                        >
                          <option value="gol">Gol</option>
                          <option value="tarjeta">Tarjeta</option>
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
        <Card>
          <CardHeader>
            <CardTitle>Suplentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bench.map((s) => (
              <div key={s.playerId} className="flex items-center justify-between">
                <span className="w-28 truncate">
                  {players.find((p) => p.id === s.playerId)?.nombre}
                </span>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    className="w-16"
                    value={s.minutes}
                    min={0}
                    onChange={(e) => setMinutes(s.playerId, Number(e.target.value))}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline">
                        Evento
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <form action={addEvent} className="space-y-2">
                        <input
                          type="hidden"
                          name="playerId"
                          value={s.playerId}
                        />
                        <Input
                          name="minute"
                          placeholder="Minuto"
                          type="number"
                          min="0"
                        />
                        <select
                          name="type"
                          className="w-full rounded border p-1"
                        >
                          <option value="gol">Gol</option>
                          <option value="tarjeta">Tarjeta</option>
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
        <Card>
          <CardHeader>
            <CardTitle>Disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {available.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
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
          {match.events.map((e) => (
            <li key={e.id}>
              {e.minute}&apos; {e.type}
              {e.playerId
                ? ` (${players.find((p) => p.id === e.playerId)?.nombre})`
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
