"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col min-h-screen md:pl-16">
        <SiteHeader />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
