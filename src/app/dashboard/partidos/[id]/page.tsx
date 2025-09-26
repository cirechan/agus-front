import { getMatch, recordEvent, removeEvent, updateLineup } from "@/lib/api/matches";
import { jugadoresService, equiposService, rivalesService } from "@/lib/api/services";
import MatchDetail from "./match-detail";
import MatchSummary from "./match-summary";
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
    return await recordEvent({
      matchId: id,
      minute,
      type,
      playerId,
      teamId,
      rivalId,
      data: null,
    });
  }

  async function deleteEventById(eventId: number) {
    "use server";
    await removeEvent(eventId);
  }

  async function saveLineupServer(lineup: PlayerSlot[], finished = false) {
    "use server";
    await updateLineup(id, lineup, opponentNotes, finished);
  }

  return match.finished ? (
    <MatchSummary match={match} players={allPlayers} />
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
