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

const OUR_TEAM_ID = 1;

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
              const home = teamMap[match.homeTeamId] || String(match.homeTeamId);
              const away = teamMap[match.awayTeamId] || String(match.awayTeamId);
              const isHome = match.homeTeamId === OUR_TEAM_ID;
              const rival = isHome ? away : home;
              const homeGoals = match.events.filter(
                (e) => e.type === "goal" && e.teamId === match.homeTeamId
              ).length;
              const awayGoals = match.events.filter(
                (e) => e.type === "goal" && e.teamId === match.awayTeamId
              ).length;
              const ourGoals = isHome ? homeGoals : awayGoals;
              const theirGoals = isHome ? awayGoals : homeGoals;
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
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/partidos/${match.id}`}>Ver</Link>
                    </Button>
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

