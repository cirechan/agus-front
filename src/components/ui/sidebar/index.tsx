"use client"

import * as React from "react"
import { createContext, useContext, useState } from "react"

type SidebarContextType = {
  expanded: boolean
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>
  variant: "default" | "inset"
  setVariant: React.Dispatch<React.SetStateAction<"default" | "inset">>
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(true)
  const [variant, setVariant] = useState<"default" | "inset">("default")

  return (
    <SidebarContext.Provider
      value={{
        expanded,
        setExpanded,
        variant,
        setVariant,
      }}
    >
      <div className="flex min-h-screen w-full flex-col bg-background">
        <div className="flex flex-1">
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar debe usarse dentro de SidebarProvider")
  }
  return context
}

export function SidebarInset({ children }: { children: React.ReactNode }) {
  const { expanded, variant } = useSidebar()

  return (
    <div
      className={`flex flex-1 flex-col ${
        variant === "inset" ? "ml-16" : expanded ? "ml-64" : "ml-16"
      } transition-[margin] duration-300 ease-in-out`}
    >
      {children}
    </div>
  )
}
