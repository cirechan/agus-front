"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

interface Team {
  id: number;
  nombre: string;
}

interface ColorOption {
  value: string;
  label: string;
}

export default function OpponentSelect({ teams, colors }: { teams: Team[]; colors: ColorOption[] }) {
  const [isNew, setIsNew] = useState(false);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">Rival</label>
      <select
        name="opponentId"
        className="w-full rounded border p-2"
        required
        onChange={(e) => setIsNew(e.target.value === "new")}
      >
        <option value="">Seleccione rival</option>
        {teams.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombre}
          </option>
        ))}
        <option value="new">Añadir nuevo…</option>
      </select>
      {isNew && (
        <div className="mt-2 space-y-2">
          <Input name="newTeamName" placeholder="Nombre del equipo" required />
          <select name="newTeamColor" className="w-full rounded border p-2" required>
            {colors.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

