"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Match } from "@/types/match";

interface PartidosListProps {
  matches: Match[];
  teamMap: Record<number, string>;
}

export default function PartidosList({ matches, teamMap }: PartidosListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filtered = matches.filter((match) => {
    const home = teamMap[match.homeTeamId] || String(match.homeTeamId);
    const away = teamMap[match.awayTeamId] || String(match.awayTeamId);
    const kickoff = new Date(match.kickoff).toLocaleString();
    const text = `${home} ${away} ${kickoff}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

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
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar partidos..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:grid-cols-3 lg:px-6">
        {filtered.map((match) => (
          <Card key={match.id} className="h-full overflow-hidden transition-colors hover:bg-muted/50">
            <CardHeader className="border-b p-4">
              <CardTitle className="text-lg">
                {teamMap[match.homeTeamId] || match.homeTeamId} vs {teamMap[match.awayTeamId] || match.awayTeamId}
              </CardTitle>
              <CardDescription>{new Date(match.kickoff).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {match.events.length} eventos
              </p>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 p-4">
              <Button variant="ghost" className="w-full" disabled>
                Ver detalles
              </Button>
            </CardFooter>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              No hay partidos
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
