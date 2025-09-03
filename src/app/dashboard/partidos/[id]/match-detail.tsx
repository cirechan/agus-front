"use client";

import { useState } from "react";
import type { Match, PlayerSlot } from "@/types/match";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

  const starters = lineup.filter((p) => p.role === "field");
  const bench = lineup.filter((p) => p.role === "bench");
  const selectedIds = lineup.map((p) => p.playerId);
  const available = players.filter((p) => !selectedIds.includes(p.id));

  function setRole(playerId: number, role: "field" | "bench") {
    setLineup((prev) => {
      const existing = prev.find((p) => p.playerId === playerId);
      if (existing) {
        return prev.map((p) => (p.playerId === playerId ? { ...p, role } : p));
      }
      return [...prev, { playerId, role, minutes: 0 }];
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

  function handleSave() {
    const fd = new FormData();
    fd.append("lineup", JSON.stringify(lineup));
    fd.append("opponentNotes", notes);
    saveLineup(fd);
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold">Partido</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Titulares</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {starters.map((s) => (
              <div key={s.playerId} className="flex items-center justify-between">
                <span>{players.find((p) => p.id === s.playerId)?.nombre}</span>
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
                      <Button size="sm" variant="outline">Evento</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <form action={addEvent} className="space-y-2">
                        <input type="hidden" name="playerId" value={s.playerId} />
                        <Input name="minute" placeholder="Minuto" type="number" min="0" />
                        <select name="type" className="w-full rounded border p-1">
                          <option value="gol">Gol</option>
                          <option value="tarjeta">Tarjeta</option>
                        </select>
                        <Button type="submit" size="sm">Guardar</Button>
                      </form>
                    </PopoverContent>
                  </Popover>
                  <Button size="sm" variant="ghost" onClick={() => removePlayer(s.playerId)}>
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
                <span>{players.find((p) => p.id === s.playerId)?.nombre}</span>
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
                      <Button size="sm" variant="outline">Evento</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <form action={addEvent} className="space-y-2">
                        <input type="hidden" name="playerId" value={s.playerId} />
                        <Input name="minute" placeholder="Minuto" type="number" min="0" />
                        <select name="type" className="w-full rounded border p-1">
                          <option value="gol">Gol</option>
                          <option value="tarjeta">Tarjeta</option>
                        </select>
                        <Button type="submit" size="sm">Guardar</Button>
                      </form>
                    </PopoverContent>
                  </Popover>
                  <Button size="sm" variant="ghost" onClick={() => removePlayer(s.playerId)}>
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
                <span>{p.nombre}</span>
                <div className="space-x-2">
                  <Button size="sm" onClick={() => setRole(p.id, "field")}>Titular</Button>
                  <Button size="sm" variant="secondary" onClick={() => setRole(p.id, "bench")}>Suplente</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Button onClick={handleSave}>Guardar alineación</Button>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Eventos</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {match.events.map((e) => (
              <li key={e.id}>
                {e.minute}&apos; {e.type}
                {e.playerId ? ` (${players.find((p) => p.id === e.playerId)?.nombre})` : ""}
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
