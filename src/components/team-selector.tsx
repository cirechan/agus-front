"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, PlusCircle, ShieldIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface Team {
  id: string
  name: string
  category: string
  icon?: React.ReactNode
}

export function TeamSelector() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [teams, setTeams] = React.useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null)

  React.useEffect(() => {
    fetch('/api/equipos')
      .then(res => res.json())
      .then((data: any[]) => {
        const mapped: Team[] = data.map((equipo: any) => ({
          id: String(equipo.id),
          name: equipo.nombre,
          category: equipo.categoria,
          icon: <ShieldIcon className="h-4 w-4" />,
        }))
        setTeams(mapped)
        if (!selectedTeam && mapped.length > 0) {
          setSelectedTeam(mapped[0])
        }
      })
  }, [selectedTeam])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex h-auto w-full justify-between p-2 px-3"
        >
          <div className="flex items-center gap-2">
            {selectedTeam?.icon || <ShieldIcon className="h-4 w-4" />}
            <div className="flex flex-col items-start text-sm">
              <span className="font-medium">
                {selectedTeam?.name || "Seleccionar equipo"}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedTeam?.category || ""}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <div className="p-2">
          <div className="text-sm font-medium">Equipos</div>
        </div>
        <div className="max-h-96 overflow-auto">
          {teams.map((team) => (
            <Button
              key={team.id}
              variant="ghost"
              className={cn(
                "flex h-auto w-full justify-start gap-2 p-2 px-4",
                selectedTeam?.id === team.id && "bg-muted"
              )}
              onClick={() => {
                setSelectedTeam(team)
                setOpen(false)
              }}
            >
              {team.icon || <ShieldIcon className="h-4 w-4" />}
              <div className="flex flex-col items-start text-sm">
                <span>{team.name}</span>
                <span className="text-xs text-muted-foreground">
                  {team.category}
                </span>
              </div>
             
            </Button>
          ))}
        </div>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto w-full justify-start px-2 text-sm"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir equipo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
