import { jugadoresService } from "@/lib/api/services";

interface FinalPageProps {
  params: { id: string };
}

export default async function FinalPage({ params }: FinalPageProps) {
  const players = await jugadoresService.getByEquipo(1);
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Partido finalizado</h1>
      <p>Añade valoración a jugadores destacados.</p>
      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <span className="flex-1">{p.nombre}</span>
            <input
              type="number"
              min={0}
              max={10}
              className="w-16 border rounded p-1 text-black"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
