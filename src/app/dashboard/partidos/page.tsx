import { listMatches } from "@/lib/api/matches";
import { equiposService, rivalesService } from "@/lib/api/services";
import PartidosList from "./partidos-list";

export const dynamic = "force-dynamic";

export default async function PartidosPage() {
  const [matches, equipos, rivales] = await Promise.all([
    listMatches(),
    equiposService.getAll(),
    rivalesService.getAll(),
  ]);
  const teamMap: Record<number, string> = {};
  for (const eq of equipos) teamMap[eq.id] = eq.nombre;
  for (const r of rivales) teamMap[r.id] = r.nombre;
  return <PartidosList matches={matches} teamMap={teamMap} />;
}
