import { getMatch, recordEvent, removeEvent } from "@/lib/api/matches";
import { jugadoresService, equiposService } from "@/lib/api/services";
import MatchDetail from "./match-detail";

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
  const players = await jugadoresService.getByEquipo(1);
  const homeTeam = await equiposService.getById(match.homeTeamId);
  const awayTeam = await equiposService.getById(match.awayTeamId);

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

  return (
    <MatchDetail
      match={match}
      players={players}
      addEvent={addEvent}
      deleteEvent={deleteEventById}
      homeTeamName={homeTeam?.nombre ?? "Local"}
      awayTeamName={awayTeam?.nombre ?? "Rival"}
    />
  );
}
