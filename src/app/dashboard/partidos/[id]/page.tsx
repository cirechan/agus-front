import {
  getMatch,
  recordEvent,
  removeEvent,
  updateEvent as persistEventUpdate,
  updateLineup,
} from "@/lib/api/matches";
import { jugadoresService, equiposService, rivalesService } from "@/lib/api/services";
import MatchDetail from "./match-detail";
import MatchSummary from "./match-summary";
import type { PlayerSlot } from "@/types/match";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

interface MatchPageProps {
  params: { id: string };
}

export default async function MatchPage({ params }: MatchPageProps) {
  const id = Number(params.id);
  const match = await getMatch(id);
  if (!match) {
    return <div className="p-4">Partido no encontrado</div>;
  }
  const allPlayers = match.teamId
    ? await jugadoresService.getByEquipo(match.teamId)
    : [];
  const selectedIds = match.lineup.map((l) => l.playerId);
  const players = match.lineup.length
    ? allPlayers.filter((p) => selectedIds.includes(p.id))
    : allPlayers;
  const ourTeam = await equiposService.getById(match.teamId);
  const rivalTeam = await rivalesService.getById(match.rivalId);
  const homeTeamName = match.isHome ? ourTeam?.nombre : rivalTeam?.nombre;
  const awayTeamName = match.isHome ? rivalTeam?.nombre : ourTeam?.nombre;
  const homeTeamColor = match.isHome ? ourTeam?.color : rivalTeam?.color;
  const awayTeamColor = match.isHome ? rivalTeam?.color : ourTeam?.color;
  const opponentNotes = match.opponentNotes ?? null;

  async function addEvent(formData: FormData) {
    "use server";
    const minute = Number(formData.get("minute"));
    const type = formData.get("type") as string;
    const playerIdRaw = formData.get("playerId");
    const playerId = playerIdRaw ? Number(playerIdRaw) : null;
    const teamIdRaw = formData.get("teamId");
    const teamId = teamIdRaw ? Number(teamIdRaw) : null;
    const rivalIdRaw = formData.get("rivalId");
    const rivalId = rivalIdRaw ? Number(rivalIdRaw) : null;
    const created = await recordEvent({
      matchId: id,
      minute,
      type,
      playerId,
      teamId,
      rivalId,
      data: null,
    });
    revalidatePath(`/dashboard/partidos/${id}`);
    revalidatePath("/dashboard/partidos");
    return created;
  }

  async function deleteEventById(eventId: number) {
    "use server";
    await removeEvent(eventId);
    revalidatePath(`/dashboard/partidos/${id}`);
    revalidatePath("/dashboard/partidos");
  }

  async function updateEvent(formData: FormData) {
    "use server";
    const idRaw = formData.get("id");
    const minuteRaw = formData.get("minute");
    const type = String(formData.get("type") ?? "");
    const playerIdRaw = formData.get("playerId");
    const teamIdRaw = formData.get("teamId");
    const rivalIdRaw = formData.get("rivalId");

    const eventId = idRaw ? Number(idRaw) : NaN;
    if (!Number.isFinite(eventId)) {
      throw new Error("Evento inválido");
    }

    const minuteValue = minuteRaw ? Number(minuteRaw) : 0;
    const minute = Number.isFinite(minuteValue) ? minuteValue : 0;
    const playerValue = playerIdRaw ? Number(playerIdRaw) : null;
    const playerId =
      playerValue != null && Number.isFinite(playerValue) ? playerValue : null;
    const teamValue = teamIdRaw ? Number(teamIdRaw) : null;
    const teamId = teamValue != null && Number.isFinite(teamValue) ? teamValue : null;
    const rivalValue = rivalIdRaw ? Number(rivalIdRaw) : null;
    const rivalId =
      rivalValue != null && Number.isFinite(rivalValue) ? rivalValue : null;

    const updated = await persistEventUpdate(eventId, {
      minute,
      type,
      playerId,
      teamId,
      rivalId,
      data: null,
    });
    revalidatePath(`/dashboard/partidos/${id}`);
    revalidatePath("/dashboard/partidos");
    return updated;
  }

  async function saveLineupServer(lineup: PlayerSlot[], finished = false) {
    "use server";
    await updateLineup(id, lineup, opponentNotes, finished);
    revalidatePath(`/dashboard/partidos/${id}`);
    revalidatePath("/dashboard/partidos");
  }

  return match.finished ? (
    <MatchSummary
      match={match}
      players={allPlayers}
      homeTeamName={homeTeamName ?? "Local"}
      awayTeamName={awayTeamName ?? "Rival"}
      homeTeamColor={homeTeamColor ?? "#dc2626"}
      awayTeamColor={awayTeamColor ?? "#1d4ed8"}
      addEvent={addEvent}
      updateEvent={updateEvent}
      deleteEvent={deleteEventById}
    />
  ) : (
    <MatchDetail
      match={match}
      players={players}
      addEvent={addEvent}
      deleteEvent={deleteEventById}
      saveLineup={saveLineupServer}
      homeTeamName={homeTeamName ?? "Local"}
      awayTeamName={awayTeamName ?? "Rival"}
      homeTeamColor={homeTeamColor ?? '#dc2626'}
      awayTeamColor={awayTeamColor ?? '#1d4ed8'}
    />
  );
}
