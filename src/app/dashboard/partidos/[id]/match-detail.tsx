"use client";

import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { FormEvent } from "react";
import type { Match, MatchEvent, PlayerSlot } from "@/types/match";
import {
  DEFAULT_FORMATION_KEY,
  FORMATIONS,
  type FormationKey,
} from "@/data/formations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Menu,
  Undo2,
  ArrowRightCircle,
  Plus,
  Flag,
  List,
  LayoutGrid,
} from "lucide-react";
import { HALF_DURATION_MINUTES } from "@/lib/match-events";

const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  GK: { x: 10, y: 50 },
  LB: { x: 30, y: 25 },
  LCB: { x: 30, y: 40 },
  CB: { x: 30, y: 50 },
  RCB: { x: 30, y: 60 },
  RB: { x: 30, y: 75 },
  LM: { x: 50, y: 30 },
  LCM: { x: 50, y: 40 },
  CM: { x: 50, y: 50 },
  RCM: { x: 50, y: 60 },
  RM: { x: 50, y: 70 },
  LDM: { x: 48, y: 42 },
  RDM: { x: 48, y: 58 },
  CAM: { x: 66, y: 50 },
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
  { type: "asistencia", icon: "🅰️" },
] as const;

const EVENT_LABELS: Record<string, string> = {
  gol: "Gol",
  amarilla: "Tarjeta amarilla",
  roja: "Tarjeta roja",
  asistencia: "Asistencia",
};

const EVENT_ICON_MAP = EVENT_ICONS.reduce<Record<string, string>>((acc, item) => {
  acc[item.type] = item.icon;
  return acc;
}, {});

const GOALKEEPER_COLOR = "#16a34a"; // green-600

function getContrastColor(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
}

const DEFAULT_FORMATION = FORMATIONS[DEFAULT_FORMATION_KEY].positions;

interface Player {
  id: number;
  nombre: string;
  dorsal?: number | null;
}

function sortPlayersByDorsal(players: Player[]) {
  return [...players].sort((a, b) => {
    const dorsalA = a.dorsal ?? Number.POSITIVE_INFINITY;
    const dorsalB = b.dorsal ?? Number.POSITIVE_INFINITY;
    if (dorsalA !== dorsalB) return dorsalA - dorsalB;
    return a.nombre.localeCompare(b.nombre);
  });
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
  saveLineup: (lineup: PlayerSlot[], finished?: boolean) => Promise<void>;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamColor: string;
  awayTeamColor: string;
}

export default function MatchDetail({
  match,
  players,
  addEvent,
  deleteEvent,
  saveLineup,
  homeTeamName,
  awayTeamName,
  homeTeamColor,
  awayTeamColor,
}: MatchDetailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const OUR_TEAM_COLOR = match.isHome ? homeTeamColor : awayTeamColor;
  const PLAYER_COLOR = OUR_TEAM_COLOR || "#dc2626";
  const playerTextColor = getContrastColor(PLAYER_COLOR);
  const homeTextColor = getContrastColor(homeTeamColor);
  const awayTextColor = getContrastColor(awayTeamColor);

  const formationKeys = Object.keys(FORMATIONS) as FormationKey[];
  const [formationIndex, setFormationIndex] = useState(0);

  function cycleFormation() {
    const next = (formationIndex + 1) % formationKeys.length;
    setFormationIndex(next);
    const formation = FORMATIONS[formationKeys[next]].positions;
    setLineup((prev) =>
      prev.map((slot, idx) => {
        const pos = formation[idx];
        const coords = POSITION_COORDS[pos] || { x: 50, y: 50 };
        return { ...slot, position: pos, x: coords.x, y: coords.y };
      })
    );
  }

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
      return sortPlayersByDorsal(
        match.lineup
          .filter((slot) => slot.role === "bench" && slot.playerId != null)
          .map((slot) => playerMap[slot.playerId as number])
          .filter(Boolean) as Player[]
      );
    }
    const startersIds = new Set(
      initialLineup.map((slot) => slot.playerId).filter((id): id is number => id != null)
    );
    return sortPlayersByDorsal(
      players.filter((player) => !startersIds.has(player.id) && player.dorsal != null)
    );
  }, [match.lineup, players, playerMap, initialLineup]);

  const unavailableSlots = useMemo(
    () => match.lineup.filter((slot) => slot.role === "unavailable"),
    [match.lineup]
  );

  const squadPlayers = useMemo(() => {
    const seen = new Set<number>();
    const entries: { player: Player; role: PlayerSlot["role"] }[] = [];
    if (match.lineup.length) {
      match.lineup.forEach((slot) => {
        if (!slot.playerId || seen.has(slot.playerId)) return;
        const player = playerMap[slot.playerId];
        if (!player) return;
        seen.add(slot.playerId);
        entries.push({ player, role: slot.role });
      });
    } else {
      players.forEach((player) => {
        if (seen.has(player.id)) return;
        seen.add(player.id);
        entries.push({ player, role: "field" });
      });
    }
    return entries.sort((a, b) => {
      const dorsalA = a.player.dorsal ?? Number.POSITIVE_INFINITY;
      const dorsalB = b.player.dorsal ?? Number.POSITIVE_INFINITY;
      if (dorsalA !== dorsalB) return dorsalA - dorsalB;
      return a.player.nombre.localeCompare(b.player.nombre);
    });
  }, [match.lineup, playerMap, players]);

  const initialBenchPositions = useMemo(() => {
    const map: Record<number, string | undefined> = {};
    match.lineup
      .filter((slot) => slot.role === "bench")
      .forEach((slot) => {
        if (slot.playerId != null) map[slot.playerId] = slot.position;
      });
    return map;
  }, [match.lineup]);

  const [lineup, setLineup] = useState<LineupSlot[]>(initialLineup);
  const [bench, setBench] = useState<Player[]>(benchInitial);
  const [benchPositions, setBenchPositions] = useState<
    Record<number, string | undefined>
  >(initialBenchPositions);
  const [subbedOut, setSubbedOut] = useState<number[]>([]);
  const [selectedBenchId, setSelectedBenchId] = useState<number | null>(null);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);

  const initialStats = useMemo(() => {
    const stats: Record<number, { minutes: number; enterSecond?: number }> = {};
    players.forEach((p) => {
      const isStarter = initialLineup.some((l) => l.playerId === p.id);
      stats[p.id] = { minutes: 0, ...(isStarter ? { enterSecond: 0 } : {}) };
    });
    return stats;
  }, [players, initialLineup]);

  const [playerStats, setPlayerStats] = useState(initialStats);

  const [events, setEvents] = useState<MatchEvent[]>(match.events);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [half, setHalf] = useState(1);
  const [subsMade, setSubsMade] = useState(0);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [manualEventOpen, setManualEventOpen] = useState(false);
  const [manualEventType, setManualEventType] = useState<string>("gol");
  const [manualEventMinute, setManualEventMinute] = useState(0);
  const [manualEventTeam, setManualEventTeam] = useState<"ours" | "rival">("ours");
  const [manualEventPlayerId, setManualEventPlayerId] = useState<number | null>(null);
  const [manualEventSaving, setManualEventSaving] = useState(false);
  const [manualEventError, setManualEventError] = useState<string | null>(null);
  const [assistPrompt, setAssistPrompt] = useState<
    | {
        minute: number;
        goalScorerId: number | null;
      }
    | null
  >(null);
  const [assistPlayerId, setAssistPlayerId] = useState<number | null>(null);
  const [assistSaving, setAssistSaving] = useState(false);
  const [assistError, setAssistError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [lateWindowReminderShown, setLateWindowReminderShown] = useState(false);
  const [lateWindowUsed, setLateWindowUsed] = useState(false);

  const elapsedMillisRef = useRef(0);
  const tickStartRef = useRef<number | null>(null);

  const getCurrentSeconds = useCallback(() => {
    if (tickStartRef.current != null) {
      const now = Date.now();
      return Math.floor(
        (elapsedMillisRef.current + (now - tickStartRef.current)) / 1000
      );
    }
    return Math.floor(elapsedMillisRef.current / 1000);
  }, []);

  const pauseClock = useCallback(() => {
    if (tickStartRef.current != null) {
      const now = Date.now();
      elapsedMillisRef.current += now - tickStartRef.current;
      tickStartRef.current = null;
    }
    const totalSeconds = Math.floor(elapsedMillisRef.current / 1000);
    setSeconds(totalSeconds);
    return totalSeconds;
  }, []);

  const resumeClock = useCallback(() => {
    if (tickStartRef.current == null) {
      tickStartRef.current = Date.now();
    }
  }, []);

  const resetClock = useCallback(() => {
    elapsedMillisRef.current = 0;
    tickStartRef.current = running ? Date.now() : null;
    setSeconds(0);
  }, [running]);

  const currentMinute = useMemo(
    () =>
      Math.floor(seconds / 60) + (half - 1) * HALF_DURATION_MINUTES,
    [seconds, half]
  );

  const teamGoals = useMemo(
    () =>
      events.filter((e) => e.type === "gol" && e.teamId === match.teamId)
        .length,
    [events, match.teamId]
  );
  const rivalGoals = useMemo(
    () =>
      events.filter((e) => e.type === "gol" && e.rivalId === match.rivalId)
        .length,
    [events, match.rivalId]
  );
  const homeGoals = match.isHome ? teamGoals : rivalGoals;
  const awayGoals = match.isHome ? rivalGoals : teamGoals;
  const ourTeamLabel = match.isHome ? homeTeamName : awayTeamName;
  const rivalTeamLabel = match.isHome ? awayTeamName : homeTeamName;

  useEffect(() => {
    if (!running) return;
    if (tickStartRef.current == null) {
      tickStartRef.current = Date.now();
    }

    let rafId = 0;
    const updateSeconds = () => {
      const totalSeconds = getCurrentSeconds();
      setSeconds((prev) => (prev === totalSeconds ? prev : totalSeconds));
      rafId = window.requestAnimationFrame(updateSeconds);
    };

    rafId = window.requestAnimationFrame(updateSeconds);

    const handleVisibility = () => {
      if (!document.hidden) {
        const totalSeconds = getCurrentSeconds();
        setSeconds((prev) => (prev === totalSeconds ? prev : totalSeconds));
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [running, getCurrentSeconds]);

  useEffect(() => {
    if (currentMinute >= 70 && !lateWindowReminderShown) {
      toast("Recuerda: a partir del 70' solo hay una ventana de cambios");
      setLateWindowReminderShown(true);
    }
  }, [currentMinute, lateWindowReminderShown]);

  useEffect(() => {
    if (manualEventTeam === "ours") {
      if (!manualEventPlayerId) {
        const fallback = squadPlayers.find((entry) => entry.role !== "unavailable");
        setManualEventPlayerId(fallback ? fallback.player.id : null);
      }
    } else if (manualEventPlayerId != null) {
      setManualEventPlayerId(null);
    }
  }, [manualEventTeam, manualEventPlayerId, squadPlayers]);

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

    // Césped
    for (let i = 0; i < w; i += 80) {
      ctx.fillStyle = i % 160 === 0 ? "#15803d" : "#166534";
      ctx.fillRect(i, 0, 80, h);
    }

    // Líneas
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

  useEffect(() => {
    if (selectedBenchId && !bench.some((player) => player.id === selectedBenchId)) {
      setSelectedBenchId(null);
    }
  }, [bench, selectedBenchId]);

  const promptAssist = useCallback(
    (minute: number, goalScorerId: number | null) => {
      const fallback = squadPlayers.find(
        (entry) =>
          entry.role !== "unavailable" &&
          entry.player.id !== (goalScorerId ?? -1)
      );
      setAssistPlayerId(fallback ? fallback.player.id : null);
      setAssistError(null);
      setAssistSaving(false);
      setAssistPrompt({ minute, goalScorerId });
    },
    [squadPlayers]
  );

  async function quickAddEvent({
    playerId,
    type,
    teamId,
    rivalId,
  }: {
    playerId?: number;
    type: string;
    teamId?: number;
    rivalId?: number;
  }) {
    try {
      const fd = new FormData();
      if (playerId) fd.append("playerId", String(playerId));
      fd.append("type", type);
      if (teamId) fd.append("teamId", String(teamId));
      if (rivalId) fd.append("rivalId", String(rivalId));
      fd.append(
        "minute",
        String(
          Math.floor(seconds / 60) + (half - 1) * HALF_DURATION_MINUTES
        )
      );
      const created = await addEvent(fd);
      setEvents((prev) => [...prev, created]);
      toast(`Evento ${type} añadido`);
      if (type === "gol" && teamId === match.teamId) {
        promptAssist(created.minute, created.playerId ?? null);
      }
    } catch (error) {
      console.error("No se pudo registrar el evento rápido", error);
      toast("No se pudo registrar el evento. Inténtalo de nuevo.", {
        style: {
          background: "#7f1d1d",
          color: "#fff",
        },
      });
    }
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

  async function handleManualEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualEventError(null);
    const minuteNumber = Number.isFinite(manualEventMinute)
      ? manualEventMinute
      : 0;
    const safeMinute = Math.max(0, Math.min(130, Math.round(minuteNumber)));
    if (manualEventTeam === "ours" && !manualEventPlayerId) {
      setManualEventError("Selecciona un jugador para registrar el evento.");
      return;
    }

    try {
      setManualEventSaving(true);
      const fd = new FormData();
      fd.append("minute", String(safeMinute));
      fd.append("type", manualEventType);
      if (manualEventTeam === "ours") {
        if (manualEventPlayerId) {
          fd.append("playerId", String(manualEventPlayerId));
        }
        fd.append("teamId", String(match.teamId));
      } else {
        fd.append("rivalId", String(match.rivalId));
      }
      const created = await addEvent(fd);
      setEvents((prev) => [...prev, created]);
      toast(`Evento ${manualEventType} añadido`);
      if (
        manualEventType === "gol" &&
        manualEventTeam === "ours"
      ) {
        promptAssist(created.minute, created.playerId ?? null);
      }
      setManualEventOpen(false);
    } catch (error) {
      console.error("No se pudo registrar el evento", error);
      setManualEventError("No se pudo registrar el evento, inténtalo de nuevo.");
    } finally {
      setManualEventSaving(false);
    }
  }

  async function handleAssistSave() {
    if (!assistPrompt) return;
    if (!assistPlayerId) {
      setAssistError("Selecciona el jugador que dio la asistencia.");
      return;
    }

    try {
      setAssistSaving(true);
      const fd = new FormData();
      fd.append("minute", String(assistPrompt.minute));
      fd.append("type", "asistencia");
      fd.append("playerId", String(assistPlayerId));
      fd.append("teamId", String(match.teamId));
      const created = await addEvent(fd);
      setEvents((prev) => [...prev, created]);
      toast("Asistencia registrada");
      setAssistPrompt(null);
    } catch (error) {
      console.error("No se pudo registrar la asistencia", error);
      setAssistError("No se pudo registrar la asistencia. Inténtalo nuevamente.");
    } finally {
      setAssistSaving(false);
    }
  }

  function handleAssistSkip() {
    setAssistPrompt(null);
    setAssistError(null);
    setAssistPlayerId(null);
  }

  function toggleRunning() {
    if (running) {
      const currentSeconds = pauseClock();
      setPlayerStats((prev) => {
        const stats = { ...prev };
        lineup.forEach((slot) => {
          const pid = slot.playerId;
          if (pid && stats[pid]?.enterSecond != null) {
            stats[pid].minutes +=
              currentSeconds - (stats[pid].enterSecond as number);
            delete stats[pid].enterSecond;
          }
        });
        return stats;
      });
      setRunning(false);
    } else {
      const currentSeconds = getCurrentSeconds();
      resumeClock();
      setPlayerStats((prev) => {
        const stats = { ...prev };
        lineup.forEach((slot) => {
          const pid = slot.playerId;
          if (pid) {
            stats[pid] = { ...stats[pid], enterSecond: currentSeconds };
          }
        });
        return stats;
      });
      setRunning(true);
    }
  }

  async function handleFinish() {
    setFinishing(true);
    const currentSeconds = pauseClock();
    setRunning(false);
    try {
      const stats = { ...playerStats };
      lineup.forEach((slot) => {
        const pid = slot.playerId;
        if (pid && stats[pid]?.enterSecond != null) {
          stats[pid].minutes +=
            currentSeconds - (stats[pid].enterSecond as number);
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
            minutes: Math.floor((stats[s.playerId as number]?.minutes ?? 0) / 60),
          })),
        ...bench.map((p) => ({
          playerId: p.id,
          number: p.dorsal ?? undefined,
          role: "bench" as const,
          position: benchPositions[p.id],
          minutes: Math.floor((stats[p.id]?.minutes ?? 0) / 60),
        })),
        ...unavailableSlots
          .filter((slot) => slot.playerId != null)
          .map((slot) => ({
            playerId: slot.playerId as number,
            number: playerMap[slot.playerId as number]?.dorsal ?? slot.number,
            role: "unavailable" as const,
            position: slot.position,
            minutes: 0,
          })),
      ];

      await saveLineup(lineupPayload, true);
      toast("Partido finalizado y guardado");
      router.replace(`/dashboard/partidos/${match.id}`);
      router.refresh();
    } catch (error) {
      console.error("No se pudo finalizar el partido", error);
      toast("No se pudo finalizar el partido. Inténtalo otra vez.", {
        style: {
          background: "#7f1d1d",
          color: "#fff",
        },
      });
    } finally {
      setFinishing(false);
    }
  }

  function handlePlayerDragStart(
    position: string,
    playerId: number,
    e: React.DragEvent<HTMLDivElement>
  ) {
    e.dataTransfer.setData("playerId", String(playerId));
    e.dataTransfer.setData("fromPosition", position);
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    e.dataTransfer.setDragImage(target, rect.width / 2, rect.height / 2);
  }

  function handleBenchDragStart(
    playerId: number,
    e: React.DragEvent<HTMLDivElement>
  ) {
    e.dataTransfer.setData("playerId", String(playerId));
    e.dataTransfer.setData("fromPosition", "bench");
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    e.dataTransfer.setDragImage(target, rect.width / 2, rect.height / 2);
  }

  function substitute(playerInId: number, targetPos: string) {
    const outgoingId = lineup.find((s) => s.position === targetPos)?.playerId;
    const liveSeconds = getCurrentSeconds();

    // Cambiar campo
    setLineup((prev) =>
      prev.map((s) =>
        s.position === targetPos ? { ...s, playerId: playerInId } : s
      )
    );

    // Actualizar banquillo
    setBench((prev) => {
      const filtered = prev.filter((p) => p.id !== playerInId);
      const updated =
        outgoingId && playerMap[outgoingId]
          ? [...filtered, playerMap[outgoingId]]
          : filtered;
      return sortPlayersByDorsal(updated);
    });

    // Guardar la posición del que sale
    setBenchPositions((prev) => {
      const map = { ...prev };
      delete map[playerInId];
      if (outgoingId) {
        map[outgoingId] = targetPos;
      }
      return map;
    });

    // Minutos de juego
    setPlayerStats((prev) => {
      const stats = { ...prev };
      if (outgoingId && stats[outgoingId]?.enterSecond != null) {
        stats[outgoingId].minutes +=
          liveSeconds - (stats[outgoingId].enterSecond as number);
        delete stats[outgoingId].enterSecond;
      }
      stats[playerInId] = {
        ...stats[playerInId],
        enterSecond: liveSeconds,
      };
      return stats;
    });

    if (outgoingId) {
      setSubbedOut((prev) => {
        if (liveSeconds >= 70 * 60) {
          return prev.includes(outgoingId) ? prev : [...prev, outgoingId];
        }
        return prev.filter((id) => id !== outgoingId);
      });
    }
    setSubsMade((c) => c + 1);
    setSelectedBenchId(null);
    const minute =
      Math.floor(liveSeconds / 60) + (half - 1) * HALF_DURATION_MINUTES;
    if (minute >= 70 && !lateWindowUsed) {
      setLateWindowUsed(true);
      toast("Has consumido la ventana de cambios permitida tras el 70'.");
    }
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
    <div className="flex flex-col md:flex-row w-full h-full">
      {/* Header marcador/controles */}
      <div className="flex-1 flex flex-col">
        <div className="h-12 text-white select-none flex">
          {/* Local */}
          <div
            className="flex items-center gap-2 px-2 sm:px-4"
            style={{ backgroundColor: homeTeamColor, color: homeTextColor }}
          >
            <span className="font-semibold hidden sm:block">{homeTeamName}</span>
            <span className="text-xl sm:text-2xl font-bold">{homeGoals}</span>
            <Button
              size="icon"
              variant="secondary"
              className="h-6 w-6 p-0"
              onClick={() => quickAddEvent({ type: "gol", teamId: match.teamId })}
              aria-label="Añadir gol local"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Controles centro */}
          <div className="flex items-center gap-2 flex-1 justify-center bg-gray-900 px-2 sm:px-4">
            <Button
              size="icon"
              variant="secondary"
              className="text-gray-900"
              onClick={toggleRunning}
              aria-label={running ? "Pausar" : "Reanudar"}
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <span className="tabular-nums text-sm sm:text-xl">
              {String(
                Math.floor(seconds / 60) +
                  (half - 1) * HALF_DURATION_MINUTES
              ).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </span>
            {half === 1 && !running && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-1"
                onClick={() => {
                  setHalf(2);
                  resetClock();
                }}
              >
                <ArrowRightCircle className="h-4 w-4" />
                <span className="hidden sm:inline">2ª</span>
              </Button>
            )}
            <Button size="icon" variant="secondary" onClick={cycleFormation} aria-label="Cambiar formación">
              <LayoutGrid className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="secondary" aria-label="Menú">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    setManualEventError(null);
                    setManualEventType("gol");
                    setManualEventTeam("ours");
                    setManualEventMinute(currentMinute);
                    const fallback = squadPlayers.find((entry) => entry.role !== "unavailable");
                    setManualEventPlayerId(fallback ? fallback.player.id : null);
                    setManualEventOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Registrar evento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEventsOpen(true)}>
                  <List className="h-4 w-4" /> Eventos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={undoLastEvent}>
                  <Undo2 className="h-4 w-4" /> Deshacer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFinish} disabled={finishing}>
                  <Flag className="h-4 w-4" />
                  {finishing ? " Finalizando..." : " Finalizar"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Visitante */}
          <div
            className="flex items-center gap-2 px-2 sm:px-4"
            style={{ backgroundColor: awayTeamColor, color: awayTextColor }}
          >
            <Button
              size="icon"
              variant="secondary"
              className="h-6 w-6 p-0"
              onClick={() => quickAddEvent({ type: "gol", rivalId: match.rivalId })}
              aria-label="Añadir gol visitante"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-xl sm:text-2xl font-bold">{awayGoals}</span>
            <span className="font-semibold hidden sm:block">{awayTeamName}</span>
          </div>
        </div>

        {/* Campo + jugadores */}
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
                  <div className="relative -ml-5 -mt-5 flex flex-col items-center">
                    {/* Iconos de eventos sobre el jugador */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex space-x-1 text-sm">
                      {events
                        .filter((e) => e.playerId === player.id)
                        .map((e) => (
                          <span key={e.id}>{EVENT_ICON_MAP[e.type] ?? ""}</span>
                        ))}
                    </div>

                    {/* Burbuja con dorsal + popover de eventos */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <div
                          draggable
                          onDragStart={(e) => handlePlayerDragStart(slot.position, player.id, e)}
                          className="w-10 h-10 rounded-full flex items-center justify-center border-2 cursor-grab select-none"
                          style={{
                            backgroundColor:
                              slot.position === "GK" ? GOALKEEPER_COLOR : PLAYER_COLOR,
                            color: slot.position === "GK" ? "#fff" : playerTextColor,
                          }}
                          title={`${player.nombre}`}
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
                                teamId: match.teamId,
                              })
                            }
                            aria-label={`Añadir ${type}`}
                          >
                            {icon}
                          </Button>
                        ))}
                      </PopoverContent>
                    </Popover>

                    <div className="mt-1 text-center text-xs w-20 text-white">
                      {player.nombre}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Banquillo */}
      <div className="md:w-32 w-full bg-black/60 text-white p-2 overflow-x-auto md:overflow-y-auto md:h-auto h-24">
        <div className="flex items-center justify-center mb-2 text-xs">
          <div className="text-center w-full">{subsMade}/5</div>
        </div>
        <div className="flex md:flex-col gap-4 items-center justify-center">
          {bench.map((pl) => {
            const isSelected = selectedBenchId === pl.id;
            const isDisabled = subbedOut.includes(pl.id);
            return (
              <button
                key={pl.id}
                type="button"
                onClick={() => {
                  if (isDisabled) return;
                  setSelectedBenchId((prev) => (prev === pl.id ? null : pl.id));
                }}
                className={`flex flex-col items-center transition-opacity ${
                  isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                } ${isSelected ? "ring-2 ring-white rounded-lg" : ""}`}
              >
                <div
                  draggable={!isDisabled}
                  onDragStart={(e) => {
                    if (isDisabled) return;
                    handleBenchDragStart(pl.id, e);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isDisabled ? "cursor-default" : "cursor-pointer"
                  } ${isSelected ? "border-white" : ""}`}
                  style={{
                    backgroundColor:
                      benchPositions[pl.id] === "GK" ? GOALKEEPER_COLOR : PLAYER_COLOR,
                    color: benchPositions[pl.id] === "GK" ? "#fff" : playerTextColor,
                  }}
                  title={pl.nombre}
                >
                  {pl.dorsal ?? ""}
                </div>
                <span className="mt-1 text-xs text-white text-center w-full px-1">
                  {pl.nombre}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-col items-center gap-2">
          {currentMinute >= 70 && (
            <p className="text-[10px] leading-tight text-amber-200 text-center">
              {lateWindowUsed
                ? "Ventana de cambios tras el 70' ya utilizada."
                : "Recuerda: a partir del 70' solo hay una ventana de cambios."}
            </p>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            disabled={!selectedBenchId}
            onClick={() => {
              if (!selectedBenchId) return;
              if (currentMinute >= 70) {
                toast(
                  lateWindowUsed
                    ? "Ya has usado la ventana permitida tras el 70'."
                    : "Estás dentro de la última ventana de cambios disponible."
                );
              }
              setChangeDialogOpen(true);
            }}
          >
            Hacer cambio
          </Button>
        </div>
      </div>

      <Dialog
        open={manualEventOpen}
        onOpenChange={(open) => {
          setManualEventOpen(open);
          if (!open) {
            setManualEventError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar evento</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleManualEventSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="manual-event-minute">Minuto</Label>
              <Input
                id="manual-event-minute"
                type="number"
                min={0}
                max={130}
                value={Number.isNaN(manualEventMinute) ? "" : manualEventMinute}
                onChange={(e) => setManualEventMinute(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-event-type">Tipo</Label>
              <Select value={manualEventType} onValueChange={setManualEventType}>
                <SelectTrigger id="manual-event-type">
                  <SelectValue placeholder="Tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(EVENT_LABELS).map((key) => (
                    <SelectItem key={key} value={key}>
                      {EVENT_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Equipo</Label>
              <RadioGroup
                value={manualEventTeam}
                onValueChange={(value) => setManualEventTeam(value as "ours" | "rival")}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="ours" id="manual-team-ours" />
                  <Label htmlFor="manual-team-ours" className="font-normal">
                    {ourTeamLabel}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="rival" id="manual-team-rival" />
                  <Label htmlFor="manual-team-rival" className="font-normal">
                    {rivalTeamLabel}
                  </Label>
                </div>
              </RadioGroup>
            </div>
            {manualEventTeam === "ours" && (
              <div className="grid gap-2">
                <Label htmlFor="manual-event-player">Jugador</Label>
                <Select
                  value={manualEventPlayerId ? String(manualEventPlayerId) : ""}
                  onValueChange={(value) =>
                    setManualEventPlayerId(value ? Number(value) : null)
                  }
                >
                  <SelectTrigger id="manual-event-player">
                    <SelectValue placeholder="Selecciona jugador" />
                  </SelectTrigger>
                  <SelectContent>
                    {squadPlayers.map(({ player, role }) => (
                      <SelectItem
                        key={player.id}
                        value={String(player.id)}
                        disabled={role === "unavailable"}
                      >
                        {player.nombre}
                        {role === "bench"
                          ? " (Suplente)"
                          : role === "unavailable"
                          ? " (Desconvocado)"
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {manualEventError ? (
              <p className="text-sm text-destructive">{manualEventError}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setManualEventOpen(false)}
                disabled={manualEventSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  manualEventSaving ||
                  (manualEventTeam === "ours" && !manualEventPlayerId)
                }
              >
                {manualEventSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={assistPrompt != null}
        onOpenChange={(open) => {
          if (!open) {
            handleAssistSkip();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Hubo asistencia?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona al jugador que dio el último pase antes del gol del minuto {assistPrompt?.minute}
              &apos; o indica que no hubo asistencia.
            </p>
            <div className="grid gap-2">
              <Label htmlFor="assist-player">Jugador que asiste</Label>
              <Select
                value={assistPlayerId ? String(assistPlayerId) : ""}
                onValueChange={(value) =>
                  setAssistPlayerId(value ? Number(value) : null)
                }
              >
                <SelectTrigger id="assist-player">
                  <SelectValue placeholder="Selecciona jugador" />
                </SelectTrigger>
                <SelectContent>
                  {squadPlayers.map(({ player, role }) => (
                    <SelectItem
                      key={player.id}
                      value={String(player.id)}
                      disabled={
                        role === "unavailable" ||
                        player.id === assistPrompt?.goalScorerId
                      }
                    >
                      {player.nombre}
                      {player.id === assistPrompt?.goalScorerId
                        ? " (Autor del gol)"
                        : role === "bench"
                        ? " (Suplente)"
                        : role === "unavailable"
                        ? " (Desconvocado)"
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assistError ? (
                <p className="text-sm text-destructive">{assistError}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={handleAssistSkip}>
                No hubo asistencia
              </Button>
              <Button
                type="button"
                onClick={handleAssistSave}
                disabled={assistSaving}
              >
                {assistSaving ? "Guardando..." : "Guardar asistencia"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Listado de eventos */}
      <Dialog open={eventsOpen} onOpenChange={setEventsOpen}>
        <DialogContent className="max-h-80 overflow-y-auto">
          <ul className="space-y-1 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between">
                <span>
                  {e.minute}&apos; {e.playerId ? playerMap[e.playerId]?.nombre + " " : ""}
                  {e.type}
                </span>
                <Button size="icon" variant="ghost" onClick={() => removeEventById(e.id)} aria-label="Eliminar evento">
                  ×
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBenchId
                ? `¿Por quién entra ${playerMap[selectedBenchId]?.nombre || ""}?`
                : "Selecciona un jugador del banquillo"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {lineup
              .filter((slot) => slot.playerId)
              .map((slot) => {
                const player = slot.playerId ? playerMap[slot.playerId] : null;
                if (!player) return null;
                const disabled = slot.playerId === selectedBenchId;
                return (
                  <Button
                    key={slot.position}
                    variant="outline"
                    disabled={!selectedBenchId || disabled}
                    className="justify-between"
                    onClick={() => {
                      if (!selectedBenchId) return;
                      substitute(selectedBenchId, slot.position);
                      setChangeDialogOpen(false);
                    }}
                  >
                    <span className="font-medium">{player.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      {slot.position} · {player.dorsal ?? "-"}
                    </span>
                  </Button>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
