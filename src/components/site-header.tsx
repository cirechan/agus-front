"use client"

import * as React from "react"
import { BellIcon, MenuIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSidebar } from "@/components/ui/sidebar"
export function SiteHeader() {
  const [temporadaActual, setTemporadaActual] = React.useState<string>('')
  React.useEffect(() => {
    fetch('/api/temporadas?actual=1')
      .then(res => res.json())
      .then(data => setTemporadaActual(data?.id || ''))
  }, [])
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Button
        variant="outline"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <MenuIcon className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <div className="flex w-full items-center gap-2 md:gap-4">
        <div className="relative flex-1 md:grow-0">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
          />
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
          >
            <BellIcon className="h-4 w-4" />
            <span className="sr-only">Notificaciones</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1 md:flex"
          >
            <span className="hidden md:inline-flex">Temporada</span>
            <span className="font-semibold">{temporadaActual}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
