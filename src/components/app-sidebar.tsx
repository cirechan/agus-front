"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarClock,
  ClipboardCheckIcon,
  HomeIcon,
  LineChartIcon,
  SearchIcon,
  UserIcon,
  CalendarIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "inset"
}

export function AppSidebar({
  className,
  variant = "default",
}: AppSidebarProps) {
  const pathname = usePathname()
  const { open: expanded, setOpen: setExpanded } = useSidebar()

  return (
    <Sidebar collapsible="icon" className={className}>
      <SidebarHeader className="overflow-visible">
        <div className="flex h-16 items-center justify-between px-4">
          {expanded ? (
           <Link href="/" className="flex items-center gap-2">
              <img src="/images/escudo.png" alt="Escudo" className="h-10 w-10" />
              <span className="font-semibold">CD San Agustín</span>
            </Link>

          ) : (
            <Link href="/" className="flex w-full items-center justify-center">
                <img src="/images/escudo.png" alt="Escudo" className="h-10 w-10" />
            </Link>
  
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronIcon expanded={expanded} />
            <span className="sr-only">
              {expanded ? "Colapsar barra lateral" : "Expandir barra lateral"}
            </span>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <nav className="flex-1 overflow-auto py-4">
          <div className="grid gap-1 px-2">
            <NavLink
              href="/dashboard"
              icon={HomeIcon}
              label="Dashboard"
              pathname={pathname}
              expanded={expanded}
            />
            
            <NavLink
              href="/dashboard/jugadores"
              icon={UserIcon}
              label="Jugadores"
              pathname={pathname}
              expanded={expanded}
            />
            <NavLink
              href="/dashboard/entrenamientos"
              icon={CalendarClock}
              label="Entrenamientos"
              pathname={pathname}
              expanded={expanded}
            />
            <NavLink
              href="/dashboard/asistencias"
              icon={ClipboardCheckIcon}
              label="Asistencias"
              pathname={pathname}
              expanded={expanded}
            />
            <NavLink
              href="/dashboard/valoraciones"
              icon={LineChartIcon}
              label="Valoraciones"
              pathname={pathname}
              expanded={expanded}
            />
            <NavLink
              href="/dashboard/partidos"
              icon={CalendarIcon}
              label="Partidos"
              pathname={pathname}
              expanded={expanded}
            />
            <NavLink
              href="/dashboard/scouting"
              icon={SearchIcon}
              label="Scouting"
              pathname={pathname}
              expanded={expanded}
            />

          
          </div>
        </nav>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="mt-auto border-t p-4">
          {expanded ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex flex-col">
                <span className="text-xs font-medium">Cadete B</span>
                <span className="text-xs text-muted-foreground">
                  CD San Agustín
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-full bg-muted" />
            </div>
          )}
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}

interface NavLinkProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  pathname: string
  expanded: boolean
  onClick?: () => void
}

function NavLink({ href, icon: Icon, label, pathname, expanded, onClick }: NavLinkProps) {
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      {expanded && <span>{label}</span>}
    </Link>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 transition-transform"
      style={{
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
