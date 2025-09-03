import { getMatch, recordEvent, updateLineup } from "@/lib/api/matches";
import { jugadoresService } from "@/lib/api/services";
import MatchDetail from "./match-detail";

export const dynamic = "force-dynamic";

interface MatchPageProps {
  params: { id: string };
}

export default async function MatchPage({ params }: MatchPageProps) {
  const id = Number(params.id);
  const match = await getMatch(id);
  const players = await jugadoresService.getByEquipo(1);
  if (!match) {
    return <div className="p-4">Partido no encontrado</div>;
  }

  async function saveLineup(formData: FormData) {
    "use server";
    const raw = formData.get("lineup") as string;
    const lineup = JSON.parse(raw);
    await updateLineup(id, lineup);
  }

  async function addEvent(formData: FormData) {
    "use server";
    const minute = Number(formData.get("minute"));
    const type = formData.get("type") as string;
    const playerIdRaw = formData.get("playerId");
    const playerId = playerIdRaw ? Number(playerIdRaw) : null;
    await recordEvent({ matchId: id, minute, type, playerId, teamId: null, data: null });
  }

  return (
    <MatchDetail match={match} players={players} saveLineup={saveLineup} addEvent={addEvent} />
  );
}
