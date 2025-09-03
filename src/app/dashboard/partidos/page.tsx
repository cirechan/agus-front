import { listMatches } from "@/lib/api/matches";
import { equiposService } from "@/lib/api/services";
import PartidosList from "./partidos-list";

export const dynamic = "force-dynamic";

export default async function PartidosPage() {
  const [matches, equipos] = await Promise.all([
    listMatches(),
    equiposService.getAll(),
  ]);
  const teamMap: Record<number, string> = {};
  for (const eq of equipos) {
    teamMap[eq.id] = eq.nombre;
  }
  return <PartidosList matches={matches} teamMap={teamMap} />;
}
