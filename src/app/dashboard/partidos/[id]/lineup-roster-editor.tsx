"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlayerSlot } from "@/types/match";

interface PlayerOption {
  id: number;
  nombre: string;
  dorsal?: number | null;
}

interface LineupRosterEditorProps {
  lineup: PlayerSlot[];
  players: PlayerOption[];
  onSave: (lineup: PlayerSlot[]) => Promise<void>;
}

interface EditableEntry {
  playerId: number;
  name: string;
  role: PlayerSlot["role"];
  number?: number;
  minutes: number;
  cleanSheet?: boolean;
  goalsConceded?: number;
  position?: string;
}

const ROLE_LABELS: Record<PlayerSlot["role"], string> = {
  field: "Titular",
  bench: "Suplente",
  unavailable: "Desconvocado",
};

function buildEntries(
  lineup: PlayerSlot[],
  playerMap: Map<number, PlayerOption>
): EditableEntry[] {
  return lineup
    .map((slot) => {
      const player = playerMap.get(slot.playerId);
      return {
        playerId: slot.playerId,
        name: player?.nombre ?? `Jugador ${slot.playerId}`,
        role: slot.role,
        number: slot.number ?? player?.dorsal ?? undefined,
        minutes: slot.minutes ?? 0,
        cleanSheet: slot.cleanSheet,
        goalsConceded: slot.goalsConceded,
        position: slot.position,
      } satisfies EditableEntry;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function LineupRosterEditor({
  lineup,
  players,
  onSave,
}: LineupRosterEditorProps) {
  const playerMap = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players]
  );
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<EditableEntry[]>(() =>
    buildEntries(lineup, playerMap)
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setEntries(buildEntries(lineup, playerMap));
      setSelectedPlayerId("");
    }
  }, [open, lineup, playerMap]);

  const availablePlayers = useMemo(() => {
    const taken = new Set(entries.map((entry) => entry.playerId));
    return players
      .filter((player) => !taken.has(player.id))
      .sort((a, b) => {
        const dorsalA = a.dorsal ?? Number.POSITIVE_INFINITY;
        const dorsalB = b.dorsal ?? Number.POSITIVE_INFINITY;
        if (dorsalA !== dorsalB) return dorsalA - dorsalB;
        return a.nombre.localeCompare(b.nombre);
      });
  }, [entries, players]);

  function updateEntry(playerId: number, patch: Partial<EditableEntry>) {
    setEntries((current) =>
      current.map((entry) =>
        entry.playerId === playerId ? { ...entry, ...patch } : entry
      )
    );
  }

  function removeEntry(playerId: number) {
    setEntries((current) => current.filter((entry) => entry.playerId !== playerId));
  }

  function addEntry() {
    if (!selectedPlayerId) return;
    const id = Number(selectedPlayerId);
    if (!Number.isFinite(id)) return;
    const player = playerMap.get(id);
    if (!player) return;
    const newEntry: EditableEntry = {
      playerId: player.id,
      name: player.nombre,
      role: "bench",
      number: player.dorsal ?? undefined,
      minutes: 0,
      cleanSheet: false,
      goalsConceded: 0,
      position: undefined,
    };
    setEntries((current) =>
      [...current, newEntry].sort((a, b) => a.name.localeCompare(b.name))
    );
    setSelectedPlayerId("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const existingMap = new Map(lineup.map((slot) => [slot.playerId, slot]));
        const payload: PlayerSlot[] = entries.map((entry) => {
          const previous = existingMap.get(entry.playerId);
          const baseMinutes = previous?.minutes ?? entry.minutes ?? 0;
          const minutes = entry.role === "unavailable" ? 0 : Math.max(0, baseMinutes);
          const cleanSheet =
            entry.role === "unavailable"
              ? false
              : previous?.cleanSheet ?? entry.cleanSheet ?? false;
          const goalsConceded =
            entry.role === "unavailable"
              ? 0
              : previous?.goalsConceded ?? entry.goalsConceded ?? 0;
          return {
            playerId: entry.playerId,
            role: entry.role,
            number: previous?.number ?? entry.number,
            position: previous?.position ?? entry.position,
            minutes,
            cleanSheet,
            goalsConceded,
          } satisfies PlayerSlot;
        });

        await onSave(payload);
        toast.success("Convocatoria actualizada correctamente");
        setOpen(false);
      } catch (error) {
        console.error("No se pudo guardar la convocatoria", error);
        toast.error("No se pudieron guardar los cambios");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar convocatoria
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gestionar titulares y suplentes</DialogTitle>
          <DialogDescription>
            Ajusta el rol de cada jugador en la convocatoria o incorpora nuevos miembros de la plantilla.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <Label htmlFor="add-player" className="text-sm font-medium text-slate-700">
              Añadir jugador a la lista
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={selectedPlayerId === "" ? undefined : selectedPlayerId}
                onValueChange={setSelectedPlayerId}
              >
                <SelectTrigger id="add-player" className="sm:w-64">
                  <SelectValue placeholder="Selecciona un jugador" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlayers.length === 0 ? (
                    <SelectItem value="all-assigned" disabled>
                      Todos los jugadores ya están en la lista
                    </SelectItem>
                  ) : (
                    availablePlayers.map((player) => (
                      <SelectItem key={player.id} value={String(player.id)}>
                        {player.nombre}
                        {player.dorsal ? ` · ${player.dorsal}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addEntry} disabled={!selectedPlayerId}>
                Añadir
              </Button>
            </div>
          </div>
          <ScrollArea className="max-h-[55vh] pr-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="w-32 text-center">Rol</TableHead>
                  <TableHead className="w-32 text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      Añade jugadores para construir la convocatoria.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.playerId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{entry.name}</span>
                          {entry.number ? (
                            <span className="text-xs text-muted-foreground">Dorsal {entry.number}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={entry.role}
                          onValueChange={(value) =>
                            updateEntry(entry.playerId, { role: value as PlayerSlot["role"] })
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEntry(entry.playerId)}
                        >
                          Quitar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
