import "@/styles/globals.css"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import { cn } from "@/lib/utils"

const outfit = Outfit({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CD San Agustín - Plataforma Deportiva",
  description: "Plataforma de gestión deportiva para el CD San Agustín",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={cn(outfit.className, "bg-white")}>{children}</body>
    </html>
  )
}
