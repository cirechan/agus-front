"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { Match } from "@/types/match";

interface PartidosListProps {
  matches: Match[];
  teamMap: Record<number, string>;
}

const COMPETITION_LABELS: Record<string, string> = {
  liga: "Liga",
  playoff: "Play Off",
  copa: "Copa",
  amistoso: "Amistoso",
};


export default function PartidosList({ matches, teamMap }: PartidosListProps) {
  const [competition, setCompetition] = React.useState<string>("all");

  const filtered = matches.filter(
    (m) => competition === "all" || m.competition === competition
  );

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Partidos</h1>
          <p className="text-muted-foreground">Gestión de partidos</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/partidos/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Partido
          </Link>
        </Button>
      </div>

      <div className="px-4 py-4 lg:px-6">
        <select
          value={competition}
          onChange={(e) => setCompetition(e.target.value)}
          className="w-full max-w-xs rounded border p-2 text-sm"
        >
          <option value="all">Todas las competiciones</option>
          <option value="liga">Liga</option>
          <option value="playoff">Play Off</option>
          <option value="copa">Copa</option>
          <option value="amistoso">Amistoso</option>
        </select>
      </div>

      <div className="px-4 lg:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Competición</TableHead>
              <TableHead>Jornada</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Rival</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((match) => {
              const rival = teamMap[match.rivalId] || String(match.rivalId);
              const isHome = match.isHome;
              const teamGoals = match.events.filter(
                (e) => e.type === "gol" && e.teamId === match.teamId
              ).length;
              const rivalGoals = match.events.filter(
                (e) => e.type === "gol" && e.rivalId === match.rivalId
              ).length;
              const ourGoals = teamGoals;
              const theirGoals = rivalGoals;
              const hasLineup = match.lineup.some((slot) => slot.role === "field");
              const detailLabel = match.finished
                ? "Resumen"
                : hasLineup
                ? "Continuar"
                : "Iniciar";
              const homeGoals = isHome ? teamGoals : rivalGoals;
              const awayGoals = isHome ? rivalGoals : teamGoals;
              let result = "-";
              let resultColor = "";
              if (homeGoals || awayGoals) {
                result = `${homeGoals}-${awayGoals}`;
                if (ourGoals > theirGoals) resultColor = "text-green-600";
                else if (ourGoals === theirGoals) resultColor = "text-yellow-500";
                else resultColor = "text-red-600";
              }
              return (
                <TableRow key={match.id}>
                  <TableCell className="capitalize">
                    {COMPETITION_LABELS[match.competition] || match.competition}
                  </TableCell>
                  <TableCell>{match.matchday ?? "-"}</TableCell>
                  <TableCell>
                    {new Date(match.kickoff).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{rival}</TableCell>
                  <TableCell className={resultColor}>{result}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/partidos/${match.id}/edit`}>
                          Editar
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/partidos/${match.id}`}>
                          {detailLabel}
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No hay partidos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

