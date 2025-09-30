"use client";

import { useEffect, useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
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
}

interface MinutesEditorProps {
  lineup: PlayerSlot[];
  players: PlayerOption[];
  onSave: (lineup: PlayerSlot[]) => Promise<void>;
}

interface EditableRow {
  playerId: number;
  name: string;
  role: PlayerSlot["role"];
  position?: string;
  minutes: string;
  cleanSheet: boolean;
  goalsConceded: string;
  isGoalkeeper: boolean;
}

const ROLE_LABELS: Record<PlayerSlot["role"], string> = {
  field: "Titular",
  bench: "Suplente",
  unavailable: "Desconvocado",
};

function buildRows(
  lineup: PlayerSlot[],
  players: PlayerOption[]
): EditableRow[] {
  const order: Record<PlayerSlot["role"], number> = {
    field: 0,
    bench: 1,
    unavailable: 2,
  };
  const playerMap = new Map(players.map((player) => [player.id, player]));
  return lineup
    .slice()
    .sort((a, b) => {
      const roleDiff = order[a.role] - order[b.role];
      if (roleDiff !== 0) return roleDiff;
      const nameA = playerMap.get(a.playerId)?.nombre ?? "";
      const nameB = playerMap.get(b.playerId)?.nombre ?? "";
      return nameA.localeCompare(nameB);
    })
    .map((slot) => {
      const player = playerMap.get(slot.playerId);
      const position = slot.position;
      const isGoalkeeper = (position ?? "").toUpperCase() === "GK";
      return {
        playerId: slot.playerId,
        name: player?.nombre ?? `Jugador ${slot.playerId}`,
        role: slot.role,
        position,
        minutes: String(slot.minutes ?? 0),
        cleanSheet: Boolean(slot.cleanSheet),
        goalsConceded: String(slot.goalsConceded ?? 0),
        isGoalkeeper,
      };
    });
}

export default function MinutesEditor({
  lineup,
  players,
  onSave,
}: MinutesEditorProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<EditableRow[]>(() =>
    buildRows(lineup, players)
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setRows(buildRows(lineup, players));
    }
  }, [open, lineup, players]);

  function updateRow(playerId: number, patch: Partial<EditableRow>) {
    setRows((current) =>
      current.map((row) =>
        row.playerId === playerId ? { ...row, ...patch } : row
      )
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const updates = lineup.map((slot) => {
          const row = rows.find((item) => item.playerId === slot.playerId);
          if (!row) {
            return slot;
          }
          const minutesValue = Number(row.minutes);
          const goalsConcededValue = Number(row.goalsConceded);
          return {
            ...slot,
            minutes: Number.isFinite(minutesValue)
              ? Math.max(0, Math.round(minutesValue))
              : slot.minutes,
            cleanSheet: row.cleanSheet,
            goalsConceded: Number.isFinite(goalsConcededValue)
              ? Math.max(0, Math.round(goalsConcededValue))
              : slot.goalsConceded ?? 0,
          } satisfies PlayerSlot;
        });
        await onSave(updates);
        toast.success("Minutos actualizados correctamente");
        setOpen(false);
      } catch (error) {
        console.error("No se pudieron guardar los minutos", error);
        toast.error("No se pudieron guardar los cambios");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar minutos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Actualizar minutos y porterías a cero</DialogTitle>
          <DialogDescription>
            Ajusta los minutos jugados, marca porterías a cero y registra los
            goles encajados para tus guardametas.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[60vh] pr-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="w-32 text-center">Minutos</TableHead>
                  <TableHead className="w-40 text-center">
                    Portería a 0
                  </TableHead>
                  <TableHead className="w-36 text-center">
                    Goles encajados
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.playerId}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {row.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ROLE_LABELS[row.role]}
                          {row.position ? ` • ${row.position}` : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Label htmlFor={`minutes-${row.playerId}`} className="sr-only">
                          Minutos jugados
                        </Label>
                        <Input
                          id={`minutes-${row.playerId}`}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={row.minutes}
                          onChange={(event) =>
                            updateRow(row.playerId, {
                              minutes: event.target.value.replace(/[^0-9]/g, ""),
                            })
                          }
                          className="h-9 w-24 text-center"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.isGoalkeeper ? (
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={row.cleanSheet}
                            onCheckedChange={(value) =>
                              updateRow(row.playerId, { cleanSheet: value })
                            }
                            aria-label="Marcar portería a cero"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.isGoalkeeper ? (
                        <div className="flex flex-col items-center gap-1">
                          <Label
                            htmlFor={`goals-${row.playerId}`}
                            className="sr-only"
                          >
                            Goles encajados
                          </Label>
                          <Input
                            id={`goals-${row.playerId}`}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={row.goalsConceded}
                            onChange={(event) =>
                              updateRow(row.playerId, {
                                goalsConceded: event.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                ),
                              })
                            }
                            className="h-9 w-24 text-center"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
