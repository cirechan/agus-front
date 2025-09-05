import { getMatch, recordEvent, removeEvent, updateLineup } from "@/lib/api/matches";
import { jugadoresService, equiposService } from "@/lib/api/services";
import MatchDetail from "./match-detail";
import type { PlayerSlot } from "@/types/match";

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
  const allPlayers = await jugadoresService.getByEquipo(1);
  const selectedIds = match.lineup.map((l) => l.playerId);
  const players = match.lineup.length
    ? allPlayers.filter((p) => selectedIds.includes(p.id))
    : allPlayers;
  const homeTeam = await equiposService.getById(match.homeTeamId);
  const awayTeam = await equiposService.getById(match.awayTeamId);
  const opponentNotes = match.opponentNotes ?? null;

  async function addEvent(formData: FormData) {
    "use server";
    const minute = Number(formData.get("minute"));
    const type = formData.get("type") as string;
    const playerIdRaw = formData.get("playerId");
    const playerId = playerIdRaw ? Number(playerIdRaw) : null;
    const teamIdRaw = formData.get("teamId");
    const teamId = teamIdRaw ? Number(teamIdRaw) : null;
    return await recordEvent({
      matchId: id,
      minute,
      type,
      playerId,
      teamId,
      data: null,
    });
  }

  async function deleteEventById(eventId: number) {
    "use server";
    await removeEvent(eventId);
  }

  async function saveLineupServer(lineup: PlayerSlot[]) {
    "use server";
    await updateLineup(id, lineup, opponentNotes);
  }

  return (
    <MatchDetail
      match={match}
      players={players}
      addEvent={addEvent}
      deleteEvent={deleteEventById}
      saveLineup={saveLineupServer}
      homeTeamName={homeTeam?.nombre ?? "Local"}
      awayTeamName={awayTeam?.nombre ?? "Rival"}
      homeTeamColor={homeTeam?.color ?? '#dc2626'}
      awayTeamColor={awayTeam?.color ?? '#1d4ed8'}
    />
  );
}
