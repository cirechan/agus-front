"use server"

import { revalidatePath } from "next/cache"
import { jugadoresService } from "@/lib/api/services"

export async function createJugador(data: any) {
  const jugador = await jugadoresService.create(data)
  revalidatePath("/dashboard/jugadores")
  return jugador
}

export async function updateJugador(id: string, data: any) {
  const jugador = await jugadoresService.update(id, data)
  revalidatePath("/dashboard/jugadores")
  return jugador
}

