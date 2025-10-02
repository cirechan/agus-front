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

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );

  const filtered = React.useMemo(
    () =>
      matches.filter(
        (m) => competition === "all" || m.competition === competition
      ),
    [competition, matches]
  );

  const { upcomingMatches, playedMatches } = React.useMemo(() => {
    const upcoming = filtered
      .filter((match) => !match.finished)
      .sort(
        (a, b) =>
          new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      );

    const played = filtered
      .filter((match) => match.finished)
      .sort((a, b) => {
        const aMatchday = a.matchday ?? Number.MAX_SAFE_INTEGER;
        const bMatchday = b.matchday ?? Number.MAX_SAFE_INTEGER;
        if (aMatchday !== bMatchday) {
          return aMatchday - bMatchday;
        }
        return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
      });

    return { upcomingMatches: upcoming, playedMatches: played };
  }, [filtered]);

  function getScore(match: Match) {
    const goalsFor = match.events.filter(
      (event) => event.type === "gol" && event.teamId === match.teamId
    ).length;
    const goalsAgainst = match.events.filter(
      (event) => event.type === "gol" && event.rivalId === match.rivalId
    ).length;
    const homeGoals = match.isHome ? goalsFor : goalsAgainst;
    const awayGoals = match.isHome ? goalsAgainst : goalsFor;
    return { goalsFor, goalsAgainst, homeGoals, awayGoals };
  }

  function renderMatchRow(match: Match, showResult = true) {
    const rival = teamMap[match.rivalId] || String(match.rivalId);
    const score = getScore(match);
    const ourGoals = score.goalsFor;
    const theirGoals = score.goalsAgainst;
    const hasResult = match.finished;
    let resultColor = "";
    if (showResult && hasResult) {
      if (ourGoals > theirGoals) resultColor = "text-green-600";
      else if (ourGoals === theirGoals) resultColor = "text-yellow-500";
      else resultColor = "text-red-600";
    }

    const cellValue = showResult
      ? hasResult
        ? `${score.homeGoals}-${score.awayGoals}`
        : "—"
      : match.finished
      ? `${score.homeGoals}-${score.awayGoals}`
      : "Pendiente";

    const kickoffDate = new Date(match.kickoff);
    const kickoffLabel = Number.isNaN(kickoffDate.getTime())
      ? "Sin programar"
      : dateFormatter.format(kickoffDate);

    return (
      <TableRow key={match.id}>
        <TableCell className="capitalize">
          {COMPETITION_LABELS[match.competition] || match.competition}
        </TableCell>
        <TableCell>{match.matchday ?? "-"}</TableCell>
        <TableCell>{kickoffLabel}</TableCell>
        <TableCell>{rival}</TableCell>
        <TableCell className={resultColor}>{cellValue}</TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            {match.finished ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/partidos/${match.id}`}>
                  Resumen
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/partidos/${match.id}/editar`}>
                    Editar
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/dashboard/partidos/${match.id}`}>
                    {match.events.length > 0 ? "Continuar" : "Iniciar"}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  }

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

      <div className="space-y-8 px-4 pb-10 lg:px-6">
        <section>
          <h2 className="px-1 pb-3 text-sm font-semibold uppercase text-muted-foreground">
            Próximos partidos
          </h2>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competición</TableHead>
                  <TableHead>Jornada</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Rival</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingMatches.map((match) => renderMatchRow(match, false))}
                {upcomingMatches.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-20 text-center text-sm text-muted-foreground"
                    >
                      No hay partidos pendientes en esta competición.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section>
          <h2 className="px-1 pb-3 text-sm font-semibold uppercase text-muted-foreground">
            Partidos jugados
          </h2>
          <div className="overflow-x-auto rounded-md border">
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
                {playedMatches.map((match) => renderMatchRow(match))}
                {playedMatches.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-20 text-center text-sm text-muted-foreground"
                    >
                      Todavía no hay partidos finalizados en esta competición.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </>
  );
}

